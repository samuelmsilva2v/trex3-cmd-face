/**
 * T-Rex CMD — mostrador estilo prompt de comando para Amazfit T-Rex 3 (480x480, Zepp OS)
 *
 *              18:30
 *   C:\T-Rex>date /t
 *   qua 18/11/2026
 *   C:\T-Rex>status
 *     steps ...... 3432
 *     heart_rate . 64
 *     kcal ....... 150
 *     distance ... 2.52 km
 *   C:\T-Rex>_          (cursor piscando)
 */
import { createWidget, widget, align, prop, text_style } from '@zos/ui'
import { Time, Step, HeartRate, Calorie, Distance } from '@zos/sensor'

// ---------- tema ----------
const C = {
  text: 0xc0c0c0, // saída e prompt
  cmd: 0xffffff, // comandos digitados
  dot: 0x5f5e5a, // pontinhos de alinhamento
  bg: 0x000000
}

// ---------- tipografia / grade ----------
const FONT = 'fonts/JetBrainsMono-Subset.ttf'
const ADV = 0.6 // JetBrains Mono: 600/1000 em por caractere

const X = 88
const SIZE = 24
const LINE_H = 33
const PROMPT = 'C:\\T-Rex>'
const CURSOR_MS = 500

// y de cada linha (topo)
const Y = {
  dateCmd: 157,
  date: 190,
  statusCmd: 229,
  steps: 262,
  hr: 296,
  kcal: 329,
  dist: 362,
  prompt: 402
}

const DAYS = ['seg', 'ter', 'qua', 'qui', 'sex', 'sáb', 'dom'] // Time.getDay(): 1 = segunda ... 7 = domingo
const pad = (n) => String(n).padStart(2, '0')

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

/** `C:\T-Rex>comando` */
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

    // ---------- hora ----------
    this.tTime = text({
      x: 40,
      y: 56,
      w: 400,
      h: 88,
      text: '00:00',
      color: C.text,
      text_size: 77,
      align_h: align.CENTER_H
    })

    // ---------- console ----------
    commandLine(Y.dateCmd, 'date /t')
    this.lDate = new Row(Y.date, [{ text: '', color: C.text }])
    commandLine(Y.statusCmd, 'status')
    this.lSteps = statLine(Y.steps, 'steps')
    this.lHr = statLine(Y.hr, 'heart_rate')
    this.lKcal = statLine(Y.kcal, 'kcal')
    this.lDist = statLine(Y.dist, 'distance')

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
      this.tTime.setProperty(prop.MORE, { text: `${pad(t.getHours())}:${pad(t.getMinutes())}` })
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
    this.updateAll = () => {
      this.updateTime()
      this.updateSteps()
      this.updateHr()
      this.updateKcal()
      this.updateDist()
    }

    this.time.onPerMinute(this.updateTime)
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
