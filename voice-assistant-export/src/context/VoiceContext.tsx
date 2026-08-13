// ============================================================
//  SHAI Agent AI — VoiceContext.tsx
//
//  Context provider that wraps the VoiceService for use
//  in a React component tree.
//
//  The original project is a Flask/Jinja2 + Vanilla JS app.
//  There is NO React context in the source. This file provides
//  a portable React wrapper around the extracted VoiceService
//  so the module can be dropped into a React project.
// ============================================================

import React, {
  createContext,
  useContext,
  useRef,
  useCallback,
  type ReactNode,
} from 'react';
import { VoiceService, type VoiceServiceConfig } from '../services/voice.service';

// ── Context shape ─────────────────────────────────────────────────────────────
interface VoiceContextValue {
  isListening:  boolean;
  isSupported:  boolean;
  toggleMic:    () => void;
}

const VoiceContext = createContext<VoiceContextValue | null>(null);

// ── Provider ──────────────────────────────────────────────────────────────────
interface VoiceProviderProps {
  children: ReactNode;
  config: Omit<VoiceServiceConfig, 'onListeningStart' | 'onListeningEnd'>;
}

export function VoiceProvider({ children, config }: VoiceProviderProps) {
  const [isListening, setIsListening] = React.useState(false);

  const serviceRef = useRef<VoiceService | null>(null);

  if (!serviceRef.current) {
    serviceRef.current = new VoiceService({
      ...config,
      onListeningStart: () => setIsListening(true),
      onListeningEnd:   () => setIsListening(false),
    });
  }

  const toggleMic = useCallback(() => {
    serviceRef.current?.toggle();
  }, []);

  return (
    <VoiceContext.Provider
      value={{
        isListening,
        isSupported: serviceRef.current.isSupported,
        toggleMic,
      }}
    >
      {children}
    </VoiceContext.Provider>
  );
}

// ── Consumer hook ─────────────────────────────────────────────────────────────
export function useVoiceContext(): VoiceContextValue {
  const ctx = useContext(VoiceContext);
  if (!ctx) {
    throw new Error('useVoiceContext must be used inside <VoiceProvider>');
  }
  return ctx;
}
