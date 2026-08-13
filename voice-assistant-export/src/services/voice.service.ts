// ============================================================
//  SHAI Agent AI — voice.service.ts
//
//  Orchestration service that wires together:
//    • SpeechService  (STT)
//    • Toast notifications (showToast)
//    • Audit log      (logAudit)
//    • Auto-submit    (submitBookingRequest)
//
//  This mirrors the full mic-button interaction block in
//  booking.js (lines 299–371) as an injectable service.
// ============================================================

import { SpeechService, SpeechErrorType } from './speech.service';

export interface VoiceServiceConfig {
  /** Called when a transcript is captured and ready for processing */
  onTranscript: (text: string) => void;
  /** Show a toast notification */
  showToast: (message: string, type: 'info' | 'success' | 'error' | 'warning') => void;
  /** Append to the audit log panel */
  logAudit?: (actor: string, message: string) => void;
  /** Update mic button UI when listening starts */
  onListeningStart?: () => void;
  /** Update mic button UI when listening ends */
  onListeningEnd?: () => void;
  /** Language — matches project: 'en-IN' */
  lang?: string;
  /** Auto-submit delay in ms — matches project: 600 */
  submitDelay?: number;
}

/**
 * VoiceService
 *
 * Full voice input orchestration extracted from booking.js.
 * All behaviours (error messages, audit log strings, submit delay)
 * are identical to the production source code.
 */
export class VoiceService {
  private speech: SpeechService;
  private submitDelay: number;

  constructor(private config: VoiceServiceConfig) {
    this.submitDelay = config.submitDelay ?? 600; // booking.js line 348

    this.speech = new SpeechService({
      lang:           config.lang ?? 'en-IN',
      continuous:     false,
      interimResults: false,

      // ── onStart → booking.js lines 310–317 ──────────────────────────────
      onStart: () => {
        config.showToast('🎤 Listening... Speak your booking request', 'info');
        config.logAudit?.('AgentA', 'Voice input activated. Waiting for speech...');
        config.onListeningStart?.();
      },

      // ── onerror → booking.js lines 319–332 ──────────────────────────────
      onError: (type: SpeechErrorType) => {
        config.onListeningEnd?.();
        if (type === 'not-allowed') {
          config.showToast(
            'Microphone access denied. Please allow microphone permission.',
            'error'
          );
        } else if (type === 'no-speech') {
          config.showToast('No speech detected. Try again.', 'warning');
        } else {
          config.showToast('Voice capture failed: ' + type, 'error');
        }
      },

      // ── onend → booking.js lines 334–339 ────────────────────────────────
      onEnd: () => {
        config.onListeningEnd?.();
      },

      // ── onresult → booking.js lines 341–353 ─────────────────────────────
      onResult: (transcript: string, confidence: number) => {
        config.showToast(
          `✅ Voice captured (${confidence}% confidence). Processing...`,
          'success'
        );
        config.logAudit?.(
          'AgentA',
          `Voice command received: "${transcript}" (confidence: ${confidence}%)`
        );
        // Auto-submit — exact 600 ms delay from booking.js line 348
        setTimeout(() => {
          if (transcript.trim()) {
            config.onTranscript(transcript.trim());
          }
        }, this.submitDelay);
      },
    });
  }

  get isListening(): boolean {
    return this.speech.isListening;
  }

  get isSupported(): boolean {
    return this.speech.isSupported;
  }

  /** Toggle mic — maps to micBtn.addEventListener('click') in booking.js */
  toggle(): void {
    this.speech.toggle();
  }
}
