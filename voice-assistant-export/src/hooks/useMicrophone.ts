// ============================================================
//  SHAI Agent AI — useMicrophone
//
//  Extracted from: booking.js (mic button state logic)
//
//  The project controls the microphone exclusively through the
//  Web Speech API (SpeechRecognition). It does NOT directly
//  access MediaDevices / getUserMedia / AudioContext.
//  Microphone permission is triggered implicitly by calling
//  recognition.start().
//
//  This hook exposes the exact mic-button state behaviour seen
//  in the project (idle ↔ listening toggle).
// ============================================================

import { useState } from 'react';

export type MicState = 'idle' | 'listening' | 'error';

export interface MicrophoneHook {
  micState: MicState;
  /** Reflected from SpeechRecognition.onstart */
  setListening: (v: boolean) => void;
  /** Reflected from SpeechRecognition.onerror */
  setError: () => void;
  /** Reflected from SpeechRecognition.onend */
  setIdle: () => void;
}

/**
 * useMicrophone
 *
 * Manages the mic button visual state that mirrors the
 * isListening flag in booking.js (line 301).
 *
 * The project does NOT call getUserMedia directly.
 * Permission is handled by the browser when recognition.start()
 * is invoked; denied access surfaces as error type 'not-allowed'
 * through SpeechRecognition.onerror (booking.js line 325).
 */
export function useMicrophone(): MicrophoneHook {
  const [micState, setMicState] = useState<MicState>('idle');

  return {
    micState,
    setListening: (v: boolean) => setMicState(v ? 'listening' : 'idle'),
    setError:     ()           => setMicState('error'),
    setIdle:      ()           => setMicState('idle'),
  };
}
