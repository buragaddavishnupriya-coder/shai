// ============================================================
//  SHAI Agent AI — audio.service.ts
//
//  The project does NOT use the Web Audio API, AudioContext,
//  MediaRecorder, or any audio recording/processing library.
//  The microphone is accessed ONLY through SpeechRecognition.
//
//  This service is a documented stub that matches the actual
//  audio behaviour of the project:
//    • No raw audio recording
//    • No waveform processing
//    • No audio playback (TTS not enabled)
//    • No audio file upload
//
//  If you need audio recording in your adaptation, see the
//  MDN docs for MediaRecorder:
//  https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder
// ============================================================

/**
 * AudioService
 *
 * STUB — the SHAI Agent AI project does not use AudioContext
 * or MediaRecorder. Microphone access is delegated entirely
 * to the Web Speech API (SpeechRecognition). No audio data
 * is captured, buffered, or replayed.
 */
export class AudioService {
  /** Audio recording is NOT implemented in the project. */
  static isAudioRecordingUsed = false as const;

  /** Waveform visualisation is NOT implemented in the project. */
  static isWaveformVisualisationUsed = false as const;

  /** TTS audio playback is NOT implemented in the project. */
  static isTTSPlaybackUsed = false as const;
}
