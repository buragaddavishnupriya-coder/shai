// ============================================================
//  SHAI Agent AI — speech.service.ts
//
//  Thin service wrapper around the Web Speech API.
//  The project (booking.js) initialises SpeechRecognition at
//  module level (not inside a class/service). This file
//  provides an equivalent class-based export for portability.
// ============================================================

export type SpeechErrorType =
  | 'not-allowed'
  | 'no-speech'
  | 'audio-capture'
  | 'network'
  | 'aborted'
  | 'service-not-allowed'
  | 'start-failed'
  | string;

export interface SpeechServiceConfig {
  lang?: string;           // booking.js: 'en-IN'
  continuous?: boolean;    // booking.js: false
  interimResults?: boolean;// booking.js: false
  onResult: (transcript: string, confidence: number) => void;
  onError:  (type: SpeechErrorType) => void;
  onStart?: () => void;
  onEnd?:   () => void;
}

/**
 * SpeechService
 *
 * Class version of the SpeechRecognition block in booking.js (299–356).
 * All property values are identical to the project source.
 */
export class SpeechService {
  private recognition: SpeechRecognition | null = null;
  public  isListening = false;
  public  isSupported: boolean;

  constructor(private config: SpeechServiceConfig) {
    this.isSupported =
      typeof window !== 'undefined' &&
      ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window);

    if (this.isSupported) {
      const SpeechObj = window.SpeechRecognition || window.webkitSpeechRecognition;
      this.recognition = new SpeechObj();

      // ── Exact property values from booking.js lines 306–308 ─────────────
      this.recognition.continuous     = config.continuous    ?? false;
      this.recognition.interimResults = config.interimResults ?? false;
      this.recognition.lang           = config.lang           ?? 'en-IN';

      this.recognition.onstart = () => {
        this.isListening = true;
        config.onStart?.();
      };

      this.recognition.onerror = (e: SpeechRecognitionErrorEvent) => {
        this.isListening = false;
        config.onError(e.error);
      };

      this.recognition.onend = () => {
        this.isListening = false;
        config.onEnd?.();
      };

      this.recognition.onresult = (event: SpeechRecognitionEvent) => {
        const transcript = event.results[0][0].transcript;
        const confidence = Math.round(event.results[0][0].confidence * 100);
        config.onResult(transcript, confidence);
      };
    }
  }

  start(): void {
    if (!this.recognition) return;
    try {
      this.recognition.start();
    } catch (e) {
      console.error(e);
      this.config.onError('start-failed');
    }
  }

  stop(): void {
    this.recognition?.stop();
  }

  /** Toggle start/stop — mirrors the micBtn click handler in booking.js */
  toggle(): void {
    if (this.isListening) {
      this.stop();
    } else {
      this.start();
    }
  }
}
