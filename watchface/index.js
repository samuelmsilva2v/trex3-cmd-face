/**
 * CMD — mostrador estilo prompt de comando para Amazfit T-Rex 3 (480x480, Zepp OS)
 *
 *   C:\>time /t
 *   ██ ██  ██ ██    (hora em dígitos bitmap 5x7 com sombra, feitos de FILL_RECT)
 *   C:\>date /t
 *   qua 18/11/2026
 *   C:\>status
 *     steps ...... 3432
 *     heart_rate . 64
 *     kcal ....... 150
 *     distance ... 2.52 km
 *     sleep ...... 7h32m      (-- sem registro de sono)
 *   C:\>_          (cursor piscando)
 */
import { createWidget, deleteWidget, widget, align, prop, text_style } from '@zos/ui'
import { Time, Step, HeartRate, Calorie, Distance, Sleep } from '@zos/sensor'

// ---------- tema ----------
const C = {
  text: 0xc0c0c0, // saída e prompt
  cmd: 0xffffff, // comandos digitados
  dot: 0x5f5e5a, // pontinhos de alinhamento
  shadow: 0x3a3a38, // sombra dos dígitos da hora
  bg: 0x000000
}

// ---------- tipografia / grade ----------
const FONT = 'fonts/JetBrainsMono-Subset.ttf'
const ADV = 0.6 // JetBrains Mono: 600/1000 em por caractere

const X = 88
const SIZE = 24
const LINE_H = 29
const PROMPT = 'C:\\>'
const CURSOR_MS = 500

// y de cada linha (topo)
const Y = {
  timeCmd: 52,
  time: 86,
  dateCmd: 162,
  date: 191,
  statusCmd: 223,
  steps: 252,
  hr: 281,
  kcal: 310,
  dist: 339,
  sleep: 368,
  prompt: 400
}

// ---------- hora em bitmap 5x7 (estilo fonte de BIOS) ----------
const PX = 9.6 // tamanho de cada "pixel" do bitmap (2/3 de uma coluna do console)
const SHADOW = 4
const GLYPHS = {
  0: ['.###.', '#...#', '#..##', '#.#.#', '##..#', '#...#', '.###.'],
  1: ['..#..', '.##..', '..#..', '..#..', '..#..', '..#..', '.###.'],
  2: ['.###.', '#...#', '....#', '...#.', '..#..', '.#...', '#####'],
  3: ['#####', '...#.', '..#..', '...#.', '....#', '#...#', '.###.'],
  4: ['...#.', '..##.', '.#.#.', '#..#.', '#####', '...#.', '...#.'],
  5: ['#####', '#....', '####.', '....#', '....#', '#...#', '.###.'],
  6: ['..##.', '.#...', '#....', '####.', '#...#', '#...#', '.###.'],
  7: ['#####', '....#', '...#.', '..#..', '.#...', '.#...', '.#...'],
  8: ['.###.', '#...#', '#...#', '.###.', '#...#', '#...#', '.###.'],
  9: ['.###.', '#...#', '#...#', '.####', '....#', '...#.', '.##..'],
  ':': ['.', '.', '#', '.', '#', '.', '.']
}

const DAYS = ['seg', 'ter', 'qua', 'qui', 'sex', 'sáb', 'dom'] // Time.getDay(): 1 = segunda ... 7 = domingo
const pad = (n) => String(n).padStart(2, '0')
// minutos de sono → "7h32m"; null quando o relógio não registrou sono
const sleepText = (min) => (min > 0 ? `${Math.floor(min / 60)}h${pad(min % 60)}m` : null)
const sleepMinutes = (s) => {
  try {
    return (s.getInfo() || {}).totalTime || 0
  } catch (e) {
    return 0 // sem permissão ou sem dado
  }
}

function text(props) {
  return createWidget(widget.TEXT, {
    font: FONT,
    align_h: align.LEFT,
    align_v: align.CENTER_V,
    text_style: text_style.NONE,
    text_size: SIZE,
    ...props
  })
}

/** Linha de tokens {text, color} em colunas monoespaçadas, a partir de X. */
class Row {
  constructor(y, tokens) {
    this.y = y
    this.tokens = tokens
    this.widgets = tokens.map((t) => text({ x: X, y, w: 10, h: LINE_H, text: t.text, color: t.color }))
    this.layout()
  }

  set(i, value) {
    if (this.tokens[i].text === value) return
    this.tokens[i].text = value
    this.layout()
  }

  layout() {
    const cw = SIZE * ADV
    let col = 0
    this.tokens.forEach((t, i) => {
      this.widgets[i].setProperty(prop.MORE, {
        x: Math.round(X + col * cw),
        y: this.y,
        w: Math.ceil(t.text.length * cw) + SIZE, // folga pra nunca entrar em modo de rolagem
        h: LINE_H,
        text: t.text,
        color: t.color
      })
      col += t.text.length
    })
  }
}

/**
 * Desenha um glifo em retângulos: cada sequência de '#' numa linha vira um FILL_RECT
 * (primeiro a sombra deslocada, depois a cor por cima). Devolve os widgets pra poder apagar.
 */
function drawGlyph(ch, x, y) {
  const out = []
  for (const [d, color] of [[SHADOW, C.shadow], [0, C.text]]) {
    GLYPHS[ch].forEach((row, j) => {
      for (let i = 0; i < row.length; i++) {
        if (row[i] !== '#') continue
        let k = i
        while (row[k + 1] === '#') k++
        const x0 = Math.round(x + i * PX)
        out.push(
          createWidget(widget.FILL_RECT, {
            x: x0 + d,
            y: Math.round(y + j * PX) + d,
            w: Math.round(x + (k + 1) * PX) - x0,
            h: Math.ceil(PX),
            color
          })
        )
        i = k
      }
    })
  }
  return out
}

/** Hora HH:MM em bitmap; só redesenha os dígitos que mudaram. */
class BlockClock {
  constructor(x, y) {
    // colunas: dígito = 5 + 1 de espaço; ':' = 1 + 1
    this.xs = [0, 6, 14, 20].map((c) => x + c * PX)
    this.y = y
    this.digits = ['', '', '', '']
    this.widgets = [[], [], [], []]
    drawGlyph(':', x + 12 * PX, y)
  }

  set(hhmm) {
    const d = hhmm.replace(':', '')
    for (let i = 0; i < 4; i++) {
      if (d[i] === this.digits[i]) continue
      this.widgets[i].forEach((w) => deleteWidget(w))
      this.widgets[i] = drawGlyph(d[i], this.xs[i], this.y)
      this.digits[i] = d[i]
    }
  }
}

/** `C:\>comando` */
function commandLine(y, cmd) {
  return new Row(y, [
    { text: PROMPT, color: C.text },
    { text: cmd, color: C.cmd }
  ])
}

/** `  nome ..... valor` — os pontinhos alinham todos os valores na mesma coluna */
function statLine(y, name) {
  const dots = '.'.repeat(Math.max(1, 11 - name.length))
  return new Row(y, [
    { text: `  ${name} `, color: C.text },
    { text: dots, color: C.dot },
    { text: ' --', color: C.text }
  ])
}

WatchFace({
  build() {
    // ---------- sensores ----------
    this.time = new Time()
    this.step = new Step()
    this.hr = new HeartRate()
    this.cal = new Calorie()
    this.dist = new Distance()
    this.sleep = new Sleep()

    // ---------- console ----------
    commandLine(Y.timeCmd, 'time /t')
    this.clock = new BlockClock(X, Y.time)
    commandLine(Y.dateCmd, 'date /t')
    this.lDate = new Row(Y.date, [{ text: '', color: C.text }])
    commandLine(Y.statusCmd, 'status')
    this.lSteps = statLine(Y.steps, 'steps')
    this.lHr = statLine(Y.hr, 'heart_rate')
    this.lKcal = statLine(Y.kcal, 'kcal')
    this.lDist = statLine(Y.dist, 'distance')
    this.lSleep = statLine(Y.sleep, 'sleep')

    new Row(Y.prompt, [{ text: PROMPT, color: C.text }])
    this.cursor = text({
      x: Math.round(X + PROMPT.length * SIZE * ADV),
      y: Y.prompt,
      w: SIZE,
      h: LINE_H,
      text: '_',
      color: C.text
    })

    // ---------- cursor piscando ----------
    this.cursorOn = true
    this.blinkTimer = null
    this.startBlink = () => {
      if (this.blinkTimer !== null) return
      this.blinkTimer = setInterval(() => {
        this.cursorOn = !this.cursorOn
        this.cursor.setProperty(prop.MORE, { color: this.cursorOn ? C.text : C.bg })
      }, CURSOR_MS)
    }
    this.stopBlink = () => {
      if (this.blinkTimer !== null) {
        clearInterval(this.blinkTimer)
        this.blinkTimer = null
      }
      this.cursorOn = true
      this.cursor.setProperty(prop.MORE, { color: C.text })
    }

    // ---------- atualização ----------
    this.updateTime = () => {
      const t = this.time
      let year
      try {
        year = t.getFullYear ? t.getFullYear() : new Date().getFullYear()
      } catch (e) {
        year = new Date().getFullYear()
      }
      this.clock.set(`${pad(t.getHours())}:${pad(t.getMinutes())}`)
      this.lDate.set(0, `${DAYS[t.getDay() - 1] || ''} ${pad(t.getDate())}/${pad(t.getMonth())}/${year}`)
    }
    this.updateSteps = () => this.lSteps.set(2, ` ${this.step.getCurrent()}`)
    this.updateHr = () => {
      const v = this.hr.getLast()
      this.lHr.set(2, v > 0 ? ` ${v}` : ' --')
    }
    this.updateKcal = () => this.lKcal.set(2, ` ${Math.round(this.cal.getCurrent())}`)
    this.updateDist = () => {
      const meters = this.dist.getCurrent() // em metros
      this.lDist.set(2, ` ${(meters / 1000).toFixed(2)} km`)
    }
    this.updateSleep = () => this.lSleep.set(2, ` ${sleepText(sleepMinutes(this.sleep)) || '--'}`)
    this.updateAll = () => {
      this.updateTime()
      this.updateSteps()
      this.updateHr()
      this.updateKcal()
      this.updateDist()
      this.updateSleep()
    }

    // sono não tem evento de mudança (o sistema recalcula a cada ~30 min): lê a cada minuto
    this.time.onPerMinute(() => {
      this.updateTime()
      this.updateSleep()
    })
    this.step.onChange(this.updateSteps)
    this.hr.onLastChange(this.updateHr)
    this.cal.onChange(this.updateKcal)
    this.dist.onChange(this.updateDist)

    // tela acende: atualiza tudo e volta a piscar; tela apaga: para o timer
    createWidget(widget.WIDGET_DELEGATE, {
      resume_call: () => {
        this.updateAll()
        this.startBlink()
      },
      pause_call: () => this.stopBlink()
    })

    this.updateAll()
    this.startBlink()
  },

  onDestroy() {
    this.stopBlink && this.stopBlink()
    this.step && this.step.offChange(this.updateSteps)
    this.hr && this.hr.offLastChange(this.updateHr)
    this.cal && this.cal.offChange(this.updateKcal)
    this.dist && this.dist.offChange(this.updateDist)
  }
})
