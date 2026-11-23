# CMD — mostrador para Amazfit T-Rex 3
[🇺🇸 Read in English](#cmd--watch-face-for-amazfit-t-rex-3)

Mostrador estilo prompt de comando (Zepp OS, 480x480): hora, data, passos, batimentos, kcal e distância.

![Preview do mostrador](docs/preview.png)

Tem `appId` próprio, então pode ficar instalado junto com os outros mostradores.

## Estrutura

```
cmd-face/
├── app.json                         # manifesto (appType: watchface, permissões dos sensores)
├── watchface/index.js               # layout + sensores
└── assets/default.w480-r/
    ├── icon.png                     # preview 324x324 (lista de mostradores)
    └── fonts/JetBrainsMono-Subset.ttf
```

## Instalar no relógio

1. Node.js 18+ e o Zeus CLI:
   ```bash
   npm i -g @zeppos/zeus-cli
   zeus login
   ```
2. No app Zepp no celular: **Perfil → Configurações → Sobre**, toque 7 vezes no logo do Zepp para liberar o **Modo desenvolvedor**.
3. Na pasta do projeto:
   ```bash
   cd cmd-face
   zeus preview
   ```
   Escolha o **Amazfit T-Rex 3** quando pedir o dispositivo. Vai aparecer um QR code.
4. No app Zepp: **Perfil → Modo desenvolvedor → Scan**, e escaneie o QR code. O mostrador é instalado e aplicado.

Para testar no simulador antes: `zeus dev` (precisa do Zepp OS Simulator instalado).

## Se o `zeus preview` reclamar do app.json ou dos assets

O formato do `app.json` (v3) e o nome da pasta de assets variam entre versões do Zeus. O jeito mais seguro:

```bash
zeus create teste-wf      # escolha: Watchface → T-Rex 3
```

Compare o `app.json` e a pasta `assets/` gerados com os deste projeto. Copie de lá o bloco `targets` e o nome da pasta de assets, mantenha as `permissions` deste projeto e mova `icon.png` + `fonts/` para a pasta que o template criou. O `appId` gerado pelo template também pode ser usado no lugar do daqui.

## Personalizar

Tudo fica no topo de `watchface/index.js`:

- **Cores:** objeto `C` (hex `0xRRGGBB`)
- **Prompt:** `PROMPT`
- **Velocidade do cursor:** `CURSOR_MS` (padrão 500 ms)
- **Posições:** `X`, `SIZE`, `LINE_H` e o objeto `Y` com o topo de cada linha

## Comportamento

- O cursor `_` pisca só com a tela acesa; quando a tela apaga, o timer para.
- Batimento sem medição recente aparece como `--`.
- Distância vem em metros do sensor e é exibida em km com 2 casas.
- Não tem versão AOD (tela sempre ligada) ainda.

Fonte: JetBrains Mono (SIL OFL 1.1), reduzida aos caracteres usados.

---

# CMD — watch face for Amazfit T-Rex 3
[🇧🇷 Leia em Português](#cmd--mostrador-para-amazfit-t-rex-3)

Command prompt style watch face (Zepp OS, 480x480): time, date, steps, heart rate, calories and distance.

![Watch face preview](docs/preview.png)

It has its own `appId`, so it can be installed alongside the other watch faces.

## Structure

```
cmd-face/
├── app.json                         # manifest (appType: watchface, sensor permissions)
├── watchface/index.js               # layout + sensors
└── assets/default.w480-r/
    ├── icon.png                     # 324x324 preview (watch face list)
    └── fonts/JetBrainsMono-Subset.ttf
```

## Install on the watch

1. Node.js 18+ and the Zeus CLI:
   ```bash
   npm i -g @zeppos/zeus-cli
   zeus login
   ```
2. In the Zepp app on your phone: **Profile → Settings → About**, tap the Zepp logo 7 times to enable **Developer mode**.
3. In the project folder:
   ```bash
   cd cmd-face
   zeus preview
   ```
   Pick **Amazfit T-Rex 3** when asked for the device. A QR code will show up.
4. In the Zepp app: **Profile → Developer mode → Scan**, and scan the QR code. The watch face is installed and applied.

To try it in the simulator first: `zeus dev` (requires the Zepp OS Simulator).

## If `zeus preview` complains about app.json or the assets

The `app.json` format (v3) and the assets folder name change between Zeus versions. The safest fix:

```bash
zeus create test-wf      # choose: Watchface → T-Rex 3
```

Compare the generated `app.json` and `assets/` folder with the ones in this project. Copy the `targets` block and the assets folder name from there, keep this project's `permissions`, and move `icon.png` + `fonts/` into the folder the template created.

## Customize

Everything is at the top of `watchface/index.js`:

- **Colors:** the `C` object (hex `0xRRGGBB`)
- **Prompt:** `PROMPT`
- **Cursor speed:** `CURSOR_MS` (default 500 ms)
- **Positions:** `X`, `SIZE`, `LINE_H` and the `Y` object with the top of each line

## Behavior

- The `_` cursor only blinks while the screen is on; the timer stops when the screen turns off.
- Heart rate with no recent reading shows as `--`.
- Distance comes from the sensor in meters and is shown in km with 2 decimals.
- No AOD (always-on display) version yet.

Font: JetBrains Mono (SIL OFL 1.1), subset to the characters used.
