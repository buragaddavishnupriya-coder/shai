// ============================================================
//  SHAI Agent AI — microphone.ts (utility)
//
//  The project does NOT call navigator.mediaDevices.getUserMedia()
//  directly. Microphone access is obtained implicitly by the
//  Web Speech API when recognition.start() is called.
//
//  This utility provides a helper to check/query mic permission
//  using the Permissions API (where supported), which is useful
//  for pre-flight checks before calling recognition.start().
// ============================================================

export type MicPermissionState = 'granted' | 'denied' | 'prompt' | 'unsupported';

/**
 * queryMicrophonePermission
 *
 * Queries the browser Permissions API for the current microphone
 * permission state. Returns 'unsupported' if the API is unavailable.
 *
 * Note: The project does NOT call this — permission is implicitly
 * requested by recognition.start(). The 'not-allowed' onerror
 * callback (booking.js line 325) handles denied access.
 */
export async function queryMicrophonePermission(): Promise<MicPermissionState> {
  if (!navigator?.permissions) return 'unsupported';
  try {
    const result = await navigator.permissions.query({ name: 'microphone' as PermissionName });
    return result.state as MicPermissionState;
  } catch {
    return 'unsupported';
  }
}

/**
 * MIC_DENIED_ERROR
 *
 * The error type string produced by SpeechRecognition.onerror
 * when the user denies microphone access.
 * booking.js line 325: `if (e.error === 'not-allowed')`
 */
export const MIC_DENIED_ERROR = 'not-allowed' as const;

/**
 * MIC_NO_SPEECH_ERROR
 *
 * The error type string when no speech is detected.
 * booking.js line 327: `else if (e.error === 'no-speech')`
 */
export const MIC_NO_SPEECH_ERROR = 'no-speech' as const;
