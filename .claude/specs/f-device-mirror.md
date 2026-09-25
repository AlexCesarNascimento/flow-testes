# Spec — Feature: Espelhamento de Tela Android via USB

**Data:** 2026-09-24
**Escopo:** `src/main/`, `src/preload/`, `src/renderer/src/entities/device/`, `src/renderer/src/features/device-mirror/`, `src/renderer/src/widgets/recorder-device-frame/`

---

## Propósito

Ao plugar um dispositivo Android com Depuração USB ativada, o FlowTest detecta automaticamente o device e substitui o mock da tela pela transmissão real da tela do aparelho dentro do `DeviceFrame`.

Quando nenhum device está conectado, o comportamento atual (mock) é preservado.

---

## Pré-requisitos do usuário final

- Android com **Depuração USB** ativada (Configurações → Sobre → toque 7x no número da versão → Opções do desenvolvedor → Depuração USB)
- Autorizar o computador na caixa de diálogo que aparece no device na primeira conexão
- **Nenhuma instalação adicional** — ADB e scrcpy são gerenciados internamente pelo app

---

## Stack técnica

| Pacote                               | Responsabilidade                              |
| ------------------------------------ | --------------------------------------------- |
| `@yume-chan/adb`                     | Protocolo ADB em TypeScript puro              |
| `@yume-chan/adb-backend-webusb`      | Transporte USB via WebUSB (Chromium/Electron) |
| `@yume-chan/scrcpy`                  | Protocolo de streaming scrcpy em TypeScript   |
| `@yume-chan/scrcpy-decoder-tinyh264` | Decodificador H264 leve para canvas           |

O `scrcpy-server.jar` é empacotado como recurso estático em `resources/scrcpy-server.jar` e empurrado para o device via ADB durante a conexão.

---

## Arquitetura

```
[Android Device]
      │  USB
      ▼
[WebUSB — Chromium/Electron renderer]
      │
      ▼
[features/device-mirror/model/DeviceMirrorService.ts]
  - AdbDaemonWebUsbDeviceManager.trackDevices()
  - Detecta plug/unplug
  - Empurra scrcpy-server.jar via ADB
  - Inicia stream H264
  - Decodifica frames via TinyH264
  - Escreve frames em <canvas ref>
      │
      ▼
[entities/device/model/store.ts]
  - status: 'idle' | 'connecting' | 'streaming' | 'error'
  - deviceName: string | null
  - errorMessage: string | null
      │
      ▼
[widgets/recorder-device-frame/ui/DeviceFrame.tsx]
  - Se status === 'streaming': exibe <canvas> com stream real
  - Se status === 'connecting': exibe spinner sobre mock
  - Se status === 'idle' ou 'error': exibe mock atual
```

**Importante:** WebUSB roda no renderer process. Não há IPC para stream de vídeo — o serviço de mirror vive inteiramente no renderer, evitando serialização de frames via IPC (que seria lento). A exceção é a permissão USB, que no Electron requer handler no main (`ses.on('select-usb-device')`).

---

## Fluxo de conexão

```
1. App inicia → DeviceMirrorService.init()
   → AdbDaemonWebUsbDeviceManager.trackDevices()

2. Usuário pluga Android → evento 'add' no tracker
   → store.status = 'connecting'
   → DeviceFrame mostra spinner

3. Service empurra scrcpy-server.jar para /data/local/tmp/
   → Inicia servidor no device: adb shell CLASSPATH=... app_process ...

4. Conecta socket de vídeo
   → store.status = 'streaming'
   → DeviceFrame exibe <canvas> em lugar do mock

5. Usuário despluga → evento 'remove' no tracker
   → store.status = 'idle'
   → DeviceFrame volta ao mock
```

---

## Permissão USB no Electron (main process)

O Electron bloqueia WebUSB por padrão. O main process precisa:

```ts
// src/main/index.ts — dentro do createWindow()
session.defaultSession.on('select-usb-device', (event, details, callback) => {
  event.preventDefault();
  // Autoriza o primeiro device Android (vendor IDs comuns)
  const android = details.deviceList.find((d) =>
    ANDROID_VENDOR_IDS.includes(d.vendorId),
  );
  callback(android?.deviceId ?? '');
});

session.defaultSession.setPermissionCheckHandler((wc, permission) => {
  if (permission === 'usb') return true;
  return null;
});

session.defaultSession.setDevicePermissionHandler((details) => {
  if (details.deviceType === 'usb') return true;
  return false;
});
```

`ANDROID_VENDOR_IDS` = lista dos fabricantes mais comuns (Google, Samsung, Xiaomi, etc.) definida em `shared/config/android-vendors.ts`.

---

## FSD — onde cada arquivo fica

```
src/renderer/src/
  entities/device/
    model/
      store.ts          ← DeviceStore (status, deviceName, errorMessage)
      types.ts          ← DeviceStatus type
    index.ts

  features/device-mirror/
    model/
      DeviceMirrorService.ts  ← lógica de ADB + scrcpy + canvas
      scrcpy-options.ts       ← configurações do stream (resolução, FPS, bitrate)
    index.ts

  shared/
    config/
      android-vendors.ts      ← lista de vendor IDs Android
    api/
      ipc.ts                  ← channels USB (se necessário no futuro)

  widgets/recorder-device-frame/
    ui/
      DeviceFrame.tsx         ← condicional: canvas (stream) ou mock
      DeviceFrame.scss        ← estilos BEM existentes + .device-frame__canvas
```

---

## Configurações do stream (padrão)

| Parâmetro        | Valor padrão | Motivo                                      |
| ---------------- | ------------ | ------------------------------------------- |
| Resolução máxima | 720p         | Balanço qualidade × CPU                     |
| Bitrate          | 2 Mbps       | Suficiente para 720p fluido                 |
| FPS máximo       | 30           | Padrão scrcpy                               |
| Codec            | H264         | Único suportado pelo TinyH264 sem WebCodecs |

---

## Estados visuais do DeviceFrame

| Status da store | O que aparece no DeviceFrame                                |
| --------------- | ----------------------------------------------------------- |
| `idle`          | Mock atual (tela de login animada) + badge "SIMULADO"       |
| `connecting`    | Mock com overlay semitransparente + spinner + "Conectando…" |
| `streaming`     | `<canvas>` com stream real + badge "AO VIVO" (verde)        |
| `error`         | Mock + badge vermelho "ERRO" + mensagem curta               |

O badge no header do DevicePanel (`DeviceFrame`) já existe — apenas o texto e cor mudam.

---

## Critérios de aceitação

- [ ] Plugar Android com USB Debug ativado → DeviceFrame muda para stream real em < 5s
- [ ] Desplugar → DeviceFrame volta ao mock sem erro
- [ ] Plugar sem USB Debug → status 'error' com mensagem orientando o usuário
- [ ] Nenhum binário nativo externo requerido — app funciona out-of-the-box
- [ ] `npm run typecheck:app` sem erros após implementação
- [ ] Stream visível em macOS; Windows é melhor esforço nesta iteração

---

## Fora de escopo

- Controle de toque via USB (será parte do Recorder real)
- Múltiplos devices simultâneos
- Dispositivos iOS
- Streaming por Wi-Fi (ADB wireless)
- Gravação / screenshot da tela espelhada
