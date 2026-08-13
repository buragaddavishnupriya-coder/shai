/* ============================================================
   SHAI Agent AI — VoiceButton.tsx
   React component wrapping the exact mic-button behaviour
   from booking.html + booking.js.

   Original source:
     templates/booking.html lines 47–53  (HTML)
     static/js/booking.js  lines 310–371 (JS logic)
   ============================================================ */

import React from 'react';
import { useVoiceContext } from '../context/VoiceContext';

interface VoiceButtonProps {
  /** Extra class name(s) for the container */
  className?: string;
}

/**
 * VoiceButton
 *
 * Renders the mic toggle button with the exact visual state
 * transitions from booking.js:
 *
 * • Idle     → microphone icon, neutral background
 * • Listening → stop icon, red tinted background + border
 * • Unsupported → button hidden (booking.js line 355)
 */
export function VoiceButton({ className = '' }: VoiceButtonProps) {
  const { isListening, isSupported, toggleMic } = useVoiceContext();

  // booking.js line 355: if not supported, hide the button
  if (!isSupported) return null;

  // Inline styles applied by booking.js lines 312–314 when listening
  const listeningStyle: React.CSSProperties = isListening
    ? {
        background: 'rgba(239,68,68,0.2)',          // booking.js line 313
        border: '1px solid var(--va-danger)',        // booking.js line 314
      }
    : {};

  return (
    <button
      id="micBtn"
      className={`va-mic-btn ${isListening ? 'listening' : ''} ${className}`}
      style={{
        borderRadius: '50%',   // booking.html: style="border-radius: 50%"
        width:  '44px',        // booking.html: style="width: 44px"
        height: '44px',        // booking.html: style="height: 44px"
        ...listeningStyle,
      }}
      onClick={toggleMic}
      title={isListening ? 'Stop listening' : 'Start voice input'}
      aria-label={isListening ? 'Stop voice input' : 'Start voice input'}
    >
      {isListening ? (
        // booking.js line 312: '<i class="fa-solid fa-stop" style="color:var(--accent-danger);">'
        <i className="fa-solid fa-stop" style={{ color: 'var(--va-danger)' }} />
      ) : (
        // booking.html line 48: '<i class="fa-solid fa-microphone"></i>'
        <i className="fa-solid fa-microphone" />
      )}
    </button>
  );
}

export default VoiceButton;
