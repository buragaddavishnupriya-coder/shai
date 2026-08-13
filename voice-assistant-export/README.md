# SHAI Agent AI — Voice Assistant Module

Exact extraction of the voice assistant feature from the **SHAI Agent AI** project.

> **Source project stack**: Python Flask backend · Jinja2 HTML templates · Vanilla JavaScript · MySQL

---

## ⚠️ Critical Accuracy Notes

Before integrating this module, you must understand what the project actually uses:

| Feature | Used in project? | Technology |
|---|---|---|
| Speech-to-Text | ✅ Yes | **Native Web Speech API** (`webkitSpeechRecognition`) |
| Text-to-Speech | ❌ No | Agent replies are text bubbles only |
| AudioContext / Waveform | ❌ No | CSS pulse animation only |
| Wake-word detection | ❌ No | Manual mic button toggle only |
| Third-party STT library | ❌ No | Browser API only |
| Framer Motion | ❌ No | CSS keyframes only |
| AI SDK (OpenAI/Gemini) | ❌ No | Server-side Python NLP |
| MediaRecorder | ❌ No | Not used anywhere |

---

## Folder Structure

```
voice-assistant-export/
├── src/
│   ├── components/
│   │   ├── VoiceAssistant.tsx          ← Top-level chat panel (booking.html + booking.js)
│   │   ├── VoiceButton.tsx             ← Mic toggle button (booking.html lines 47-53, booking.js 310-371)
│   │   ├── VoiceVisualizer.tsx         ← Agent status dot (base.html lines 92-99)
│   │   ├── WaveAnimation.tsx           ← CSS-only pulse (NOT AudioContext)
│   │   ├── ListeningAnimation.tsx      ← Spinner (style.css .spinner)
│   │   └── VoiceButton.html.txt        ← Raw HTML template from booking.html
│   │
│   ├── hooks/
│   │   ├── useSpeechRecognition.ts     ← Web Speech API hook (booking.js lines 299-356)
│   │   ├── useTextToSpeech.ts          ← TTS stub (NOT used in project)
│   │   ├── useVoiceAssistant.ts        ← Composite hook (mic toggle loop)
│   │   └── useMicrophone.ts            ← Mic state management
│   │
│   ├── services/
│   │   ├── speech.service.ts           ← SpeechRecognition class wrapper
│   │   ├── voice.service.ts            ← Full orchestration (booking.js 299-371)
│   │   ├── ai.service.ts               ← All Flask API fetch() calls
│   │   └── audio.service.ts            ← STUB: documents zero audio usage
│   │
│   ├── context/
│   │   └── VoiceContext.tsx            ← React context wrapper (NOT in original project)
│   │
│   ├── utils/
│   │   ├── speechUtils.ts              ← Speech utility functions (booking.js 341-353)
│   │   ├── microphone.ts               ← Permission helpers
│   │   ├── audioUtils.ts               ← STUB: documents zero audio usage
│   │   └── commandParser.ts            ← Service icons + preference map (booking.js 149-201)
│   │
│   └── styles/
│       └── voice.css                   ← All voice UI styles (extracted from style.css)
│
├── package.json
├── tsconfig.json
└── README.md
```

---

## Source File Map

Every file is traced back to its exact origin:

| Export file | Original source | Lines |
|---|---|---|
| `useSpeechRecognition.ts` | `static/js/booking.js` | 299–356 |
| `useVoiceAssistant.ts` | `static/js/booking.js` | 299–371 |
| `useMicrophone.ts` | `static/js/booking.js` | 300–301, 310–338 |
| `speech.service.ts` | `static/js/booking.js` | 303–356 |
| `voice.service.ts` | `static/js/booking.js` | 303–371 |
| `ai.service.ts` | `static/js/booking.js` | 88–92, 212–216, 255–263, 419–423 |
| `commandParser.ts` | `static/js/booking.js` | 149–201 |
| `speechUtils.ts` | `static/js/booking.js` | 341–353 |
| `VoiceButton.tsx` | `templates/booking.html` + `booking.js` | html:47-53, js:310-371 |
| `VoiceVisualizer.tsx` | `templates/base.html` | 92–99 |
| `ListeningAnimation.tsx` | `static/css/style.css` | 823–830 |
| `voice.css` | `static/css/style.css` | (all voice-related rules) |

---

## Installation

```bash
# npm
npm install

# yarn
yarn install

# pnpm
pnpm install
```

---

## Running the Demo

```bash
npm run dev
```

Then open http://localhost:5173 in a **Chromium-based browser** (Chrome, Edge, Brave).

> **Firefox note**: `webkitSpeechRecognition` is only available in Chromium-based browsers. Firefox does not support it.

---

## Required External Resources

Add these to your `index.html` `<head>`:

```html
<!-- Font Awesome 6 (icons used by the project) -->
<link rel="stylesheet"
      href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">

<!-- Poppins font (brand font used by the project) -->
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800;900&display=swap"
      rel="stylesheet">
```

---

## Environment Variables

The project uses **no client-side environment variables** for the voice feature.

The Flask backend uses:
```
# config.py (not needed client-side)
SECRET_KEY=<flask secret>
DB_HOST=localhost
DB_NAME=shai_agent_db
DB_USER=root
DB_PASS=<password>
```

The only client-side configuration needed is the backend URL passed to `<VoiceAssistant>`:

```tsx
<VoiceAssistant backendUrl="http://localhost:5000" />
```

---

## Integrating into Another React Project

### 1. Copy the `src/` folder

```bash
cp -r voice-assistant-export/src/  your-react-project/src/voice-assistant/
```

### 2. Install dependencies (already in your React project's node_modules)

```bash
npm install react react-dom
```

### 3. Import and use

```tsx
// App.tsx
import { VoiceAssistant } from './voice-assistant/components/VoiceAssistant';
import './voice-assistant/styles/voice.css';

function App() {
  return (
    <div style={{ height: '600px', width: '800px' }}>
      <VoiceAssistant backendUrl="http://localhost:5000" />
    </div>
  );
}
```

### 4. Add to index.html

```html
<link rel="stylesheet"
      href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap"
      rel="stylesheet">
```

---

## How the Voice Feature Works (Exact Flow)

```
User clicks mic button
        │
        ▼
recognition.start()          [booking.js line 365]
        │
        ▼
recognition.onstart          [booking.js line 310]
  → mic button turns red (stop icon)
  → toast: "🎤 Listening..."
  → audit log: "Voice input activated"
        │
        ▼
recognition.onresult         [booking.js line 341]
  → transcript + confidence extracted
  → toast: "✅ Voice captured (XX% confidence)"
  → audit log: voice command logged
  → setTimeout 600ms          [booking.js line 348]
        │
        ▼
submitBookingRequest(text)   [booking.js line 78]
  → POST /api/booking/request
  → Agent A NLP parse (Python server)
  → display booking options
        │
        ▼
User selects option          [booking.js line 169]
  → comfort preference shown
        │
        ▼
User picks preference        [booking.js line 203]
  → POST /api/booking/evaluate
  → policy + risk check
        │
        ▼
if require_pin → PIN modal   [booking.js line 374]
else → POST /api/booking/confirm  [booking.js line 246]
  → Agent B settlement
  → wallet debited
  → success message
```

---

## Browser Compatibility

| Browser | Voice Input | Notes |
|---|---|---|
| Chrome 25+ | ✅ | Full support |
| Edge 79+ | ✅ | Full support |
| Brave | ✅ | Full support |
| Safari 14.1+ | ⚠️ | Partial — may require HTTPS |
| Firefox | ❌ | `webkitSpeechRecognition` not supported |
| Samsung Internet | ✅ | Full support |

The project checks `if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)` and hides the mic button if unsupported (booking.js line 354–355).

---

## What This Module Does NOT Include

The following were **not** in the voice assistant feature and are therefore not exported:

- Wake-word / always-on detection (not implemented)
- Audio recording / playback (not implemented)
- Real-time waveform visualisation with AudioContext (not implemented)
- TTS (agent replies are text-only)
- Third-party AI/NLP SDK (all NLP is Python server-side)
- Framer Motion (CSS animations only)
- Sound effects (none in project)
- WebSocket / real-time channel (HTTP fetch only)

---

*Module extracted from SHAI Agent AI. Stack: Python Flask · MySQL · HTML/CSS/Vanilla JS.*
