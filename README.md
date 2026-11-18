# T-Rex CMD — mostrador para Amazfit T-Rex 3

Mostrador estilo prompt de comando (Zepp OS, 480x480): hora, data, passos, batimentos, kcal e distância.

```
            18:30
 C:\T-Rex>date /t
 qua 18/11/2026
 C:\T-Rex>status
   steps ...... 3432
   heart_rate . 64
   kcal ....... 150
   distance ... 2.52 km
 C:\T-Rex>_
```

Tem `appId` próprio, então pode ficar instalado junto com os outros mostradores.

## Estrutura

```
cmd-face/
├── app.json                         # manifesto (appType: watchface, permissões dos sensores)
├── watchface/index.js               # layout + sensores
└── assets/default.r/
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
