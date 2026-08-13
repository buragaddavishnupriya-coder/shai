// ============================================================
//  SHAI Agent AI — useTextToSpeech
//
//  The project does NOT use a Text-to-Speech engine in the
//  current implementation. Agent responses are rendered as
//  HTML chat bubbles in the DOM (see appendMessage() in
//  booking.js lines 50–62). No TTS audio is played.
//
//  This stub is provided for completeness and forward
//  compatibility. It uses the browser's native speechSynthesis
//  API — the standard choice if TTS were to be added.
// ============================================================

export interface TextToSpeechOptions {
  lang?: string;       // default 'en-IN'
  rate?: number;       // 0.1–10, default 1
  pitch?: number;      // 0–2,   default 1
  volume?: number;     // 0–1,   default 1
}

export interface TextToSpeechHook {
  isSupported: boolean;
  isSpeaking: boolean;
  speak: (text: string, options?: TextToSpeechOptions) => void;
  stop: () => void;
}

/**
 * useTextToSpeech
 *
 * Thin wrapper around window.speechSynthesis.
 * The SHAI Agent AI project does NOT invoke TTS — agent replies are
 * displayed as text bubbles only. This hook is scaffolded so the
 * exported module is self-contained should TTS be enabled.
 */
export function useTextToSpeech(): TextToSpeechHook {
  const isSupported =
    typeof window !== 'undefined' && 'speechSynthesis' in window;

  let _isSpeaking = false;

  function speak(text: string, options: TextToSpeechOptions = {}): void {
    if (!isSupported) return;
    stop(); // cancel any ongoing utterance

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang   = options.lang   ?? 'en-IN';
    utterance.rate   = options.rate   ?? 1;
    utterance.pitch  = options.pitch  ?? 1;
    utterance.volume = options.volume ?? 1;

    utterance.onstart = () => { _isSpeaking = true; };
    utterance.onend   = () => { _isSpeaking = false; };
    utterance.onerror = () => { _isSpeaking = false; };

    window.speechSynthesis.speak(utterance);
  }

  function stop(): void {
    if (!isSupported) return;
    window.speechSynthesis.cancel();
    _isSpeaking = false;
  }

  return {
    isSupported,
    get isSpeaking() { return _isSpeaking; },
    speak,
    stop,
  };
}
