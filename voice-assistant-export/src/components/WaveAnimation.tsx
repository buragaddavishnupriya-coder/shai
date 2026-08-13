/* ============================================================
   SHAI Agent AI — WaveAnimation.tsx

   IMPORTANT: The project does NOT implement a real-time
   audio waveform animation using AudioContext or AnalyserNode.

   The ONLY animation used while the mic is active is:
     • The CSS pulse on the agent-dot  (.agent-dot.processing)
     • The mic button background flashes red

   This component reproduces the exact visual: a CSS-only
   animated pulse that signals "listening" state.
   It uses the same va-pulse-mic keyframe from voice.css.
   ============================================================ */

import React from 'react';
import { useVoiceContext } from '../context/VoiceContext';

interface WaveAnimationProps {
  size?: number;        // outer circle diameter in px, default 44
  barCount?: number;    // not used (CSS-only implementation)
}

/**
 * WaveAnimation
 *
 * CSS-only pulsing ring that appears when the mic is active.
 * Visually equivalent to the red-ring animation on the mic
 * button in the project (booking.js lines 312–314).
 *
 * No AudioContext. No AnalyserNode. No real waveform data.
 */
export function WaveAnimation({ size = 44 }: WaveAnimationProps) {
  const { isListening } = useVoiceContext();

  if (!isListening) return null;

  return (
    <div
      style={{
        position: 'relative',
        width:  size,
        height: size,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Pulsing ring — CSS only, no AudioContext */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          border: '2px solid var(--va-danger)',
          opacity: 0.6,
          animation: 'va-pulse-mic 1s ease-in-out infinite',
        }}
      />
      {/* Inner dot */}
      <div
        style={{
          width:  12,
          height: 12,
          borderRadius: '50%',
          background: 'var(--va-danger)',
        }}
      />
    </div>
  );
}

export default WaveAnimation;
