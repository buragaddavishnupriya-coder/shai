// ============================================================
//  SHAI Agent AI — speechUtils.ts
//
//  Utility functions related to speech processing.
//  Derived from booking.js recognition.onresult handler
//  (lines 341–353) and the mic-button state logic.
// ============================================================

/**
 * isWebSpeechAPISupported
 *
 * Feature detection — mirrors the `if` check in booking.js line 303.
 * Returns true if the browser supports SpeechRecognition.
 */
export function isWebSpeechAPISupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)
  );
}

/**
 * normaliseConfidence
 *
 * Converts the raw SpeechRecognitionResult confidence (0.0–1.0) to
 * a 0–100 integer percentage.
 * Mirrors: booking.js line 343.
 *   `Math.round(event.results[0][0].confidence * 100)`
 */
export function normaliseConfidence(raw: number): number {
  return Math.round(raw * 100);
}

/**
 * buildConfidenceToast
 *
 * Builds the success toast message shown after voice capture.
 * Exact template from booking.js line 345.
 */
export function buildConfidenceToast(confidence: number): string {
  return `✅ Voice captured (${confidence}% confidence). Processing...`;
}

/**
 * buildAuditLogMessage
 *
 * Builds the audit log line for a captured voice command.
 * Exact template from booking.js line 346.
 */
export function buildAuditLogMessage(transcript: string, confidence: number): string {
  return `Voice command received: "${transcript}" (confidence: ${confidence}%)`;
}

/**
 * VOICE_SUBMIT_DELAY_MS
 *
 * The debounce delay before auto-submitting a voice transcript.
 * Exact value from booking.js line 348: `setTimeout(..., 600)`.
 */
export const VOICE_SUBMIT_DELAY_MS = 600 as const;
