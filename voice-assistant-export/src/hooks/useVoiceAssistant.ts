// ============================================================
//  SHAI Agent AI — useVoiceAssistant (composite hook)
//
//  Composes useSpeechRecognition + useMicrophone into one
//  object that mirrors the full mic-button interaction loop
//  from booking.js lines 299–371.
//
//  Flow (exact match to booking.js):
//    1. User clicks mic button
//    2. If not listening → recognition.start()
//    3. onstart  → isListening=true, show toast "Listening..."
//    4. onresult → capture transcript + confidence, auto-submit
//    5. onerror  → show error toast per error type
//    6. onend    → reset mic button state
// ============================================================

import { useSpeechRecognition, SpeechResult } from './useSpeechRecognition';
import { useMicrophone } from './useMicrophone';

export interface VoiceAssistantConfig {
  /** Called when voice transcript is ready. Mirrors submitBookingRequest(text) */
  onTranscript: (text: string, confidence: number) => void;
  /** Called to display a toast notification */
  onToast: (message: string, type: 'info' | 'success' | 'error' | 'warning') => void;
  /** Called to append a line to the audit log */
  onAuditLog?: (actor: string, message: string) => void;
  /** Language — defaults to 'en-IN' (same as project) */
  lang?: string;
}

export interface VoiceAssistantHook {
  isListening: boolean;
  isSupported: boolean;
  toggleMic: () => void;
}

/**
 * useVoiceAssistant
 *
 * Drop-in equivalent of the mic button + SpeechRecognition block
 * in booking.js (lines 299–371).
 *
 * Attach `toggleMic` to your mic button's onClick.
 */
export function useVoiceAssistant({
  onTranscript,
  onToast,
  onAuditLog,
  lang = 'en-IN',
}: VoiceAssistantConfig): VoiceAssistantHook {
  const mic = useMicrophone();

  const { isSupported, startListening, stopListening } = useSpeechRecognition({
    lang,

    // ── onstart → booking.js line 310–317 ─────────────────────────────────
    onStart() {
      mic.setListening(true);
      onToast('🎤 Listening... Speak your booking request', 'info');
      onAuditLog?.('AgentA', 'Voice input activated. Waiting for speech...');
    },

    // ── onerror → booking.js line 319–332 ─────────────────────────────────
    onError(errorType: string) {
      mic.setError();
      if (errorType === 'not-allowed') {
        onToast('Microphone access denied. Please allow microphone permission.', 'error');
      } else if (errorType === 'no-speech') {
        onToast('No speech detected. Try again.', 'warning');
      } else {
        onToast('Voice capture failed: ' + errorType, 'error');
      }
    },

    // ── onend → booking.js line 334–339 ───────────────────────────────────
    onEnd() {
      mic.setIdle();
    },

    // ── onresult → booking.js line 341–353 ────────────────────────────────
    onResult({ transcript, confidence }: SpeechResult) {
      onToast(`✅ Voice captured (${confidence}% confidence). Processing...`, 'success');
      onAuditLog?.(
        'AgentA',
        `Voice command received: "${transcript}" (confidence: ${confidence}%)`
      );
      // Auto-submit after 600 ms — exact delay from booking.js line 348
      setTimeout(() => {
        if (transcript.trim()) {
          onTranscript(transcript.trim(), confidence);
        }
      }, 600);
    },
  });

  // ── toggleMic → booking.js micBtn click handler (lines 358–371) ──────────
  function toggleMic(): void {
    if (!isSupported) return;
    if (mic.micState === 'listening') {
      stopListening();
    } else {
      startListening();
    }
  }

  return {
    get isListening() { return mic.micState === 'listening'; },
    isSupported,
    toggleMic,
  };
}
