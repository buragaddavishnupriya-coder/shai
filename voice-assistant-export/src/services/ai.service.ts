// ============================================================
//  SHAI Agent AI — ai.service.ts
//
//  Extracted from: booking.js
//
//  The project communicates with the Flask backend via fetch().
//  There is NO direct integration with an external AI API
//  (OpenAI, Gemini, etc.). All NLP/intent parsing is done
//  server-side in Python (agents/agent_a.py).
//
//  Client-side API calls (exact endpoints used by the project):
//
//    POST /api/booking/request   → NLP parse + option generation
//    POST /api/booking/evaluate  → Policy + risk evaluation
//    POST /api/booking/confirm   → Agent B settlement
//    POST /api/booking/verify-pin → PIN verification
// ============================================================

// ── Types matching Flask API response shapes ─────────────────────────────────

export interface BookingOption {
  merchant:    string;
  price:       number | string;
  preference?: string;
  // Train / Bus
  origin?:     string;
  destination?:string;
  departs?:    string;
  arrives?:    string;
  // Movie
  cinema?:     string;
  showtime?:   string;
  format?:     string;
  // Food
  item?:       string;
  restaurant?: string;
  eta?:        string;
  // Cab
  car?:        string;
  distance_km?:number;
  // Shopping
  delivery?:   string;
  store?:      string;
}

export interface BookingRequestResponse {
  success:  boolean;
  service:  string;
  parsed:   Record<string, unknown>;
  options:  BookingOption[];
  error?:   string;
}

export interface PolicyResult {
  decision: 'allow' | 'reject' | 'pin_required';
  reason:   string;
}

export interface RiskResult {
  score:   number;
  level:   string;
  factors: string[];
}

export interface EvaluateResponse {
  success:     boolean;
  policy:      PolicyResult;
  risk:        RiskResult;
  require_pin: boolean;
  error?:      string;
}

export interface ConfirmResponse {
  success:      boolean;
  merchant:     string;
  amount:       number;
  balance_after:number;
  tx_id:        string;
  booking_ref?: string;
  error?:       string;
}

export interface PinVerifyResponse {
  success: boolean;
  error?:  string;
}

/**
 * AIService
 *
 * Wraps every fetch() call made by booking.js to the Flask backend.
 * Base URL defaults to '' (same origin) — adjust for cross-origin use.
 */
export class AIService {
  constructor(private baseUrl: string = '') {}

  /**
   * Step 1 — NLP request.
   * booking.js lines 88–111 (submitBookingRequest)
   */
  async sendBookingRequest(message: string): Promise<BookingRequestResponse> {
    const res = await fetch(`${this.baseUrl}/api/booking/request`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ message }),
    });
    return res.json();
  }

  /**
   * Step 2 — Policy + risk evaluation.
   * booking.js lines 212–243 (applyPreferenceAndEvaluate)
   */
  async evaluateBooking(
    option: BookingOption,
    bookingType: string
  ): Promise<EvaluateResponse> {
    const res = await fetch(`${this.baseUrl}/api/booking/evaluate`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ option, booking_type: bookingType }),
    });
    return res.json();
  }

  /**
   * Step 3 — Agent B settlement.
   * booking.js lines 255–264 (executeSettlement)
   */
  async confirmBooking(
    option: BookingOption,
    bookingType: string
  ): Promise<ConfirmResponse> {
    const res = await fetch(`${this.baseUrl}/api/booking/confirm`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ option, booking_type: bookingType }),
    });
    return res.json();
  }

  /**
   * PIN verification.
   * booking.js lines 419–437 (submitPin)
   */
  async verifyPin(pin: string): Promise<PinVerifyResponse> {
    const res = await fetch(`${this.baseUrl}/api/booking/verify-pin`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ pin }),
    });
    return res.json();
  }
}
