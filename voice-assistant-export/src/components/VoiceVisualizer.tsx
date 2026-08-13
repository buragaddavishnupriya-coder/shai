/* ============================================================
   SHAI Agent AI — VoiceVisualizer.tsx

   The project does NOT render a real-time audio waveform.
   The agent-dot animation (CSS pulse) is the ONLY visual
   indicator of voice activity in the source.

   This component faithfully reproduces the agent status dot
   from base.html (lines 92–99) and booking.js (lines 251–252)
   as a React component.

   Original HTML (base.html line 92–95):
     <div class="agent-status" id="statusAgentA">
       <span class="agent-dot active"></span>
       <span>Agent A: Decision</span>
     </div>
   ============================================================ */

import React from 'react';
import { useVoiceContext } from '../context/VoiceContext';

type DotState = 'active' | 'busy' | 'processing' | 'error' | 'idle';

interface VoiceVisualizerProps {
  label?: string;
}

/**
 * VoiceVisualizer
 *
 * Shows the agent status dot with the CSS pulse animation.
 * Dot state reflects whether the voice assistant is listening.
 *
 * CSS keyframe: va-pulse-dot (in voice.css)
 * Original CSS: .agent-dot.active in style.css (line 631)
 */
export function VoiceVisualizer({ label = 'Agent A: Decision' }: VoiceVisualizerProps) {
  const { isListening } = useVoiceContext();

  // Map voice state to agent-dot class names (booking.js line 251–252)
  const dotState: DotState = isListening ? 'processing' : 'active';

  return (
    <div
      className="va-agent-status"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '7px 14px',
        background: 'var(--va-muted)',
        border: '1px solid var(--va-border)',
        borderRadius: '9999px',
        fontSize: '0.8rem',
        fontWeight: 500,
      }}
    >
      <span className={`va-agent-dot ${dotState}`} />
      <span>{label}</span>
    </div>
  );
}

export default VoiceVisualizer;
