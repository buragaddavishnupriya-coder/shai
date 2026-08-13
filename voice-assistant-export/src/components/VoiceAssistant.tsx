/* ============================================================
   SHAI Agent AI — VoiceAssistant.tsx
   
   The top-level React component that assembles all voice
   assistant parts extracted from the project.

   Original source map:
     templates/booking.html  → chat UI layout
     static/js/booking.js    → all logic (lines 1–465)
     static/js/main.js       → showToast utility
     static/css/style.css    → all styles

   This component renders the full chat + mic input panel
   from booking.html in a self-contained React component.
   ============================================================ */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { VoiceProvider }      from '../context/VoiceContext';
import { VoiceButton }        from './VoiceButton';
import { VoiceVisualizer }    from './VoiceVisualizer';
import { ListeningAnimation } from './ListeningAnimation';
import { AIService }          from '../services/ai.service';
import {
  getServiceIcon,
  getPreferencesForService,
  formatOptionDetails,
  type OptionDetails,
} from '../utils/commandParser';
import '../styles/voice.css';

// ── Types ─────────────────────────────────────────────────────────────────────
interface ChatMessage {
  sender:   'user' | 'agent';
  text:     string;
  metaText?: string;
}

interface Toast {
  id:      number;
  message: string;
  type:    'info' | 'success' | 'error' | 'warning';
}

// ── Toast icons (main.js lines 13–16) ────────────────────────────────────────
const TOAST_ICONS: Record<string, string> = {
  success: 'fa-circle-check',
  error:   'fa-circle-exclamation',
  warning: 'fa-triangle-exclamation',
  info:    'fa-circle-info',
};

// ── Props ─────────────────────────────────────────────────────────────────────
interface VoiceAssistantProps {
  /** Base URL of the SHAI Flask backend (default: '' for same origin) */
  backendUrl?: string;
}

// ── Component ─────────────────────────────────────────────────────────────────
export function VoiceAssistant({ backendUrl = '' }: VoiceAssistantProps) {
  const ai = useRef(new AIService(backendUrl));

  // ── State ─────────────────────────────────────────────────────────────────
  const [messages,   setMessages]   = useState<ChatMessage[]>([
    // System greeting — booking.html lines 27–33
    {
      sender: 'agent',
      text: 'Hello! I am <strong>Agent A</strong>, your Booking &amp; Decision assistant. 🤖<br>' +
            'Tell me what you\'d like to book using natural language (e.g. Train, Movie, Bus, Food, Cab, Shopping). ' +
            'I will parse it, evaluate limits, evaluate risk factors, and coordinate with <strong>Agent B</strong> for payment.',
      metaText: 'Agent A • System Greeting',
    },
  ]);
  const [inputText,  setInputText]  = useState('');
  const [options,    setOptions]    = useState<OptionDetails[]>([]);
  const [serviceType,setServiceType]= useState('');
  const [selectedOpt,setSelectedOpt]= useState<OptionDetails | null>(null);
  const [preferences,setPreferences]= useState<string[]>([]);
  const [toasts,     setToasts]     = useState<Toast[]>([]);
  const [auditLog,   setAuditLog]   = useState<string[]>([]);
  const toastCounter = useRef(0);
  const chatEndRef   = useRef<HTMLDivElement>(null);

  // ── Scroll chat to bottom ─────────────────────────────────────────────────
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, preferences]);

  // ── Toast (mirrors showToast in main.js lines 6–29) ──────────────────────
  const showToast = useCallback(
    (message: string, type: 'info' | 'success' | 'error' | 'warning') => {
      const id = ++toastCounter.current;
      setToasts(prev => [...prev, { id, message, type }]);
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
    },
    []
  );

  // ── Audit log (mirrors logAudit in booking.js lines 65–75) ───────────────
  const logAudit = useCallback((actor: string, message: string) => {
    setAuditLog(prev => [...prev, `[${actor}] ${message}`]);
  }, []);

  // ── Append message (mirrors appendMessage booking.js lines 50–62) ─────────
  const appendMessage = useCallback((
    sender: 'user' | 'agent',
    text:    string,
    metaText?: string
  ) => {
    setMessages(prev => [...prev, { sender, text, metaText }]);
  }, []);

  // ── Submit booking request (booking.js lines 78–111) ─────────────────────
  const submitBookingRequest = useCallback(async (text: string) => {
    appendMessage('user', text);
    setInputText('');
    setOptions([]);
    logAudit('AgentA', `Received NLP Input: "${text}"`);
    logAudit('AgentA', 'Initiating regex-based semantic analysis...');

    try {
      const data = await ai.current.sendBookingRequest(text);
      if (!data.success) {
        appendMessage('agent', data.error || "Sorry, I couldn't identify a matching category. Could you rephrase your booking request?");
        logAudit('AgentA', 'NLP analysis failed. No service node identified.');
        return;
      }
      setServiceType(data.service);
      logAudit('AgentA', `Parsed variables successfully. Type: ${data.service.toUpperCase()}`);
      appendMessage('agent', 'I found some available options for your request. Please select a booking option below.');
      setOptions(data.options as OptionDetails[]);
    } catch {
      appendMessage('agent', 'Sorry, I encountered an internal error checking booking routes.');
    }
  }, [appendMessage, logAudit]);

  // ── Select option (booking.js lines 169–200) ─────────────────────────────
  const handleSelectOption = useCallback((opt: OptionDetails) => {
    setSelectedOpt(opt);
    setOptions([]);
    logAudit('AgentA', `Selected option: ${opt.merchant} for ₹${opt.price}`);
    appendMessage('agent', `🛋️ <strong>Agent A</strong>: Excellent choice! To ensure your comfort, please select your comfort preference:`);
    setPreferences(getPreferencesForService(serviceType));
  }, [serviceType, appendMessage, logAudit]);

  // ── Apply preference and evaluate (booking.js lines 203–243) ─────────────
  const handleSelectPreference = useCallback(async (pref: string) => {
    if (!selectedOpt) return;
    const opt = { ...selectedOpt, preference: pref };
    setSelectedOpt(opt);
    setPreferences([]);
    appendMessage('user', `Comfort preference: ${pref}`);
    logAudit('AgentA', `Comfort preference applied: "${pref}"`);
    appendMessage('agent', `Analyzing safety policies and transaction risk for option with **${pref}** at <strong>₹${opt.price}</strong>...`);
    logAudit('AgentA', 'Retrieving risk engine metrics...');

    try {
      const data = await ai.current.evaluateBooking(opt, serviceType);
      logAudit('AgentA', `Transaction Policy decision: ${data.policy.decision.toUpperCase()}`);
      logAudit('AgentA', `Calculated Risk Score: ${data.risk.score} / 100 (${data.risk.level})`);

      if (data.policy.decision === 'reject') {
        appendMessage('agent', `❌ Booking Rejected: ${data.policy.reason}`);
        return;
      }

      if (data.require_pin) {
        appendMessage('agent', '⚠️ <strong>Verification Check Challenge</strong>: Auto-Pay threshold limit exceeded or high risk scoring. Enter PIN to finalize payment.');
        // PIN modal would open here — see booking.js openPinModal()
      } else {
        appendMessage('agent', '✅ Within safety policy parameters. Initializing secure Agent B settlement...');
        const confirm = await ai.current.confirmBooking(opt, serviceType);
        if (confirm.success) {
          appendMessage(
            'agent',
            `🎉 <strong>Agent B — Settlement Complete!</strong><br>` +
            `✅ Booking confirmed with <strong>${confirm.merchant}</strong><br>` +
            `💸 ₹${parseFloat(String(confirm.amount)).toFixed(2)} debited &nbsp;|&nbsp; ` +
            `💰 New balance: ₹${parseFloat(String(confirm.balance_after)).toFixed(2)}<br>` +
            `🔖 Transaction ID: <strong>${String(confirm.tx_id).substring(0, 8).toUpperCase()}</strong>`,
            'Agent B • Settlement'
          );
          logAudit('AgentB', '✔ Signature verified. HMAC SHA-256 valid.');
        } else {
          appendMessage('agent', `❌ <strong>Agent B — Settlement Rejected</strong><br>${confirm.error}`);
        }
      }
    } catch {
      appendMessage('agent', 'Failed validation tests.');
    }
  }, [selectedOpt, serviceType, appendMessage, logAudit]);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <VoiceProvider
      config={{
        onTranscript: submitBookingRequest,
        showToast,
        logAudit,
      }}
    >
      {/* Toast container (main.js lines 6–29 / style.css lines 800–820) */}
      <div className="va-toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`va-toast ${t.type}`}>
            <span className="va-toast-icon">
              <i className={`fa-solid ${TOAST_ICONS[t.type]}`} />
            </span>
            <span className="va-toast-msg">{t.message}</span>
          </div>
        ))}
      </div>

      {/* Main panel (booking.html lines 12–55) */}
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--va-card)', borderRadius: '18px', border: '1px solid var(--va-border)', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', borderBottom: '1px solid var(--va-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <i className="fa-solid fa-comments" style={{ fontSize: '1.2rem', color: 'var(--va-primary)' }} />
            <strong>Collaborative Agent Workspace</strong>
          </div>
          <VoiceVisualizer label="Agent A: Decision" />
        </div>

        {/* Chat messages */}
        <div className="va-chat-messages" style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', minHeight: 0 }}>
          {messages.map((msg, i) => (
            <div key={i} className={`va-chat-msg ${msg.sender}`}>
              <div
                className="va-chat-bubble"
                dangerouslySetInnerHTML={{ __html: msg.text }}
              />
              <div className="va-chat-meta">
                {msg.sender === 'user' ? 'You' : (msg.metaText || 'Agent A')}
              </div>
            </div>
          ))}

          {/* Option cards (booking.js lines 114–147) */}
          {options.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {options.map((opt, i) => (
                <div
                  key={i}
                  className="va-option-card"
                  onClick={() => handleSelectOption(opt)}
                >
                  <div className="va-option-icon">
                    <i className={`fa-solid ${getServiceIcon(serviceType)}`} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div className="va-option-title">{opt.merchant}</div>
                    <div className="va-option-sub">{formatOptionDetails(serviceType, opt)}</div>
                  </div>
                  <div className="va-option-price">
                    ₹{parseFloat(String(opt.price)).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Comfort preference pills (booking.js lines 182–201) */}
          {preferences.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', padding: '0 12px' }}>
              {preferences.map(pref => (
                <button
                  key={pref}
                  className="va-service-pill"
                  onClick={() => handleSelectPreference(pref)}
                >
                  {pref}
                </button>
              ))}
            </div>
          )}

          <ListeningAnimation />
          <div ref={chatEndRef} />
        </div>

        {/* Input area (booking.html lines 44–54) */}
        <div className="va-chat-input-area">
          <textarea
            id="chatInput"
            className="va-chat-input"
            rows={1}
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            placeholder="Type your booking request here... (e.g. Order pizza from Domino's)"
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (inputText.trim()) submitBookingRequest(inputText.trim());
              }
            }}
            style={{ flex: 1 }}
          />
          <VoiceButton />
          <button
            id="sendBtn"
            className="va-send-btn"
            onClick={() => { if (inputText.trim()) submitBookingRequest(inputText.trim()); }}
          >
            <i className="fa-solid fa-paper-plane" />
          </button>
        </div>
      </div>
    </VoiceProvider>
  );
}

export default VoiceAssistant;
