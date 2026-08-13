// ============================================================
//  SHAI Agent AI — Voice Assistant (useSpeechRecognition)
//  Exact extraction from: static/js/booking.js (lines 299–371)
//
//  The project uses the native Web Speech API (webkitSpeechRecognition /
//  SpeechRecognition). There is NO third-party STT library.
//  Language: 'en-IN'  |  continuous: false  |  interimResults: false
// ============================================================

import { useState, useRef, useEffect } from 'react';

export type RecognitionState = 'idle' | 'listening' | 'processing' | 'error';

export interface SpeechResult {
  transcript: string;
  confidence: number;          // 0–100 (percentage)
}

export interface SpeechRecognitionHook {
  state: RecognitionState;
  isSupported: boolean;
  startListening: () => void;
  stopListening: () => void;
}

/**
 * useSpeechRecognition
 *
 * Wraps the native Web Speech API exactly as used in SHAI Agent AI.
 * Calls `onResult` when speech is captured, `onError` for errors.
 *
 * Usage (React-style wrapper — mirrors the vanilla JS source 1-to-1):
 *
 *   const { state, isSupported, startListening, stopListening } =
 *     useSpeechRecognition({ onResult, onError });
 */
export function useSpeechRecognition({
  onResult,
  onError,
  onStart,
  onEnd,
  lang = 'en-IN',
}: {
  onResult: (result: SpeechResult) => void;
  onError?: (errorType: string) => void;
  onStart?: () => void;
  onEnd?: () => void;
  lang?: string;
}): SpeechRecognitionHook {
  // ── Feature detection (mirrors line 303 in booking.js) ──────────────────
  const isSupported =
    typeof window !== 'undefined' &&
    ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window);

  const [state, setState] = useState<RecognitionState>('idle');
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // Keep latest callbacks in a mutable ref to prevent recreating/restarting
  // the SpeechRecognition engine when callbacks change reference on render
  const callbacksRef = useRef({ onResult, onError, onStart, onEnd });
  useEffect(() => {
    callbacksRef.current = { onResult, onError, onStart, onEnd };
  }, [onResult, onError, onStart, onEnd]);

  useEffect(() => {
    if (isSupported && !recognitionRef.current) {
      // Exact instantiation from booking.js line 304–308
      const SpeechObj = window.SpeechRecognition || window.webkitSpeechRecognition;
      const rec = new SpeechObj();
      rec.continuous = false;       // line 306
      rec.interimResults = false;   // line 307
      rec.lang = lang;             // line 308 — 'en-IN'

      // ── onstart (line 310–317) ─────────────────────────────────────────────
      rec.onstart = () => {
        setState('listening');
        callbacksRef.current.onStart?.();
      };

      // ── onerror (line 319–332) ─────────────────────────────────────────────
      rec.onerror = (e: SpeechRecognitionErrorEvent) => {
        console.error('Speech error:', e.error);
        setState('error');
        callbacksRef.current.onError?.(e.error);
      };

      // ── onend (line 334–339) ───────────────────────────────────────────────
      rec.onend = () => {
        setState('idle');
        callbacksRef.current.onEnd?.();
      };

      // ── onresult (line 341–353) ────────────────────────────────────────────
      rec.onresult = (event: SpeechRecognitionEvent) => {
        const speechToText = event.results[0][0].transcript;
        const confidence = Math.round(event.results[0][0].confidence * 100);
        setState('processing');
        callbacksRef.current.onResult({ transcript: speechToText, confidence });
      };

      recognitionRef.current = rec;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
        recognitionRef.current = null;
      }
    };
  }, [isSupported, lang]);

  // ── startListening (mirrors micBtn click handler, line 358–371) ──────────
  function startListening(): void {
    if (!recognitionRef.current) return;
    try {
      recognitionRef.current.start();
    } catch (e) {
      console.error(e);
      callbacksRef.current.onError?.('start-failed');
    }
  }

  // ── stopListening (mirrors micBtn click handler, line 360–361) ───────────
  function stopListening(): void {
    if (!recognitionRef.current) return;
    try {
      recognitionRef.current.stop();
    } catch (e) {
      console.error(e);
    }
  }

  return {
    state,
    isSupported,
    startListening,
    stopListening,
  };
}
