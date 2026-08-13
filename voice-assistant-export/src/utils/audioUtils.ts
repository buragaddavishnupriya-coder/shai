// ============================================================
//  SHAI Agent AI — audioUtils.ts
//
//  The project contains NO audio utility functions.
//  There is no AudioContext, AnalyserNode, or audio buffer
//  manipulation in any file in the codebase.
//
//  See audio.service.ts for full documentation of what the
//  project does and does NOT use with regard to audio.
// ============================================================

/**
 * AUDIO_UTILS_STATUS
 *
 * Documented non-existence flag. The SHAI Agent AI project
 * does not process audio at the client level beyond what the
 * native SpeechRecognition API does internally.
 */
export const AUDIO_UTILS_STATUS = {
  audioContextUsed:    false,
  analyserNodeUsed:    false,
  mediaRecorderUsed:   false,
  waveformDataUsed:    false,
} as const;
