/* ============================================================
   SHAI Agent AI — ListeningAnimation.tsx

   Reproduces the exact spinner/loading state used in the
   project during voice processing.

   From main.js (line 87) and booking.js implicit loading:
     submitBtn.innerHTML = `<span class="spinner"></span>
                            <span>Securing Session...</span>`

   The spinner CSS class from style.css (lines 823–830):
     .spinner {
       width: 20px; height: 20px;
       border: 2px solid var(--border-subtle);
       border-top-color: var(--accent-primary);
       border-radius: 50%;
       animation: spin 0.7s linear infinite;
     }
   ============================================================ */

import React from 'react';
import { useVoiceContext } from '../context/VoiceContext';

interface ListeningAnimationProps {
  processingText?: string;
  listeningText?:  string;
}

/**
 * ListeningAnimation
 *
 * Shows a CSS spinner during voice processing.
 * Exact spinner CSS from style.css (class .spinner).
 */
export function ListeningAnimation({
  listeningText  = '🎤 Listening...',
  processingText = 'Processing...',
}: ListeningAnimationProps) {
  const { isListening } = useVoiceContext();

  if (!isListening) return null;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        fontSize: '0.875rem',
        color: 'var(--va-text-muted)',
        padding: '8px 16px',
      }}
    >
      {/* .spinner from style.css lines 823–830 */}
      <span
        className="va-spinner"
        style={{
          width:  '18px',
          height: '18px',
          border: '2px solid var(--va-border)',
          borderTopColor: 'var(--va-primary)',
          borderRadius: '50%',
          display: 'inline-block',
          animation: 'va-spin 0.7s linear infinite',
          flexShrink: 0,
        }}
      />
      <span>{listeningText}</span>
    </div>
  );
}

export default ListeningAnimation;
