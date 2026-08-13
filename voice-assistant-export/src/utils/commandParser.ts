// ============================================================
//  SHAI Agent AI — commandParser.ts
//
//  Extracted from: agents/agent_a.py (server-side NLP)
//  and: booking.js displayOptions() / getServiceIcon() (client)
//
//  The project performs intent/entity extraction SERVER-SIDE in
//  Python (regex-based NLP in agent_a.py). The client-side role
//  is limited to:
//    1. Mapping a service type string to an icon class name
//    2. Formatting option details for rendering
//
//  This file exports the exact client-side parsing utilities.
// ============================================================

// ── Service type definitions (booking.js line 149–156) ───────────────────────
export type ServiceType =
  | 'train'
  | 'bus'
  | 'movie'
  | 'food'
  | 'cab'
  | 'shopping';

/**
 * getServiceIcon
 *
 * Returns the FontAwesome icon class for a service type.
 * Exact copy of booking.js lines 149–156.
 */
export function getServiceIcon(service: ServiceType | string): string {
  if (service === 'train')    return 'fa-train';
  if (service === 'bus')      return 'fa-bus';
  if (service === 'movie')    return 'fa-film';
  if (service === 'food')     return 'fa-pizza-slice';
  if (service === 'cab')      return 'fa-car';
  return 'fa-bag-shopping';   // shopping (default)
}

// ── Comfort preferences map (booking.js lines 159–166) ───────────────────────
/**
 * PREFERENCES_MAP
 *
 * Exact copy of the comfort preferences object from booking.js.
 * Keys are ServiceType values.
 */
export const PREFERENCES_MAP: Record<ServiceType, string[]> = {
  train:    ['Lower Berth 💤', 'Upper Berth 🛌', 'Window Seat 🪟', 'Aisle Seat 💺'],
  bus:      ['Window Seat 🪟', 'Aisle Seat 💺', 'AC Sleeper ❄️', 'Non-AC Semi-Sleeper 🍃'],
  movie:    ['Recliner Seat 🛋️', 'Middle Row 🎬', 'Executive Seat ⭐', 'Balcony Seat 🍿'],
  food:     ['Extra Spicy 🌶️', 'Medium Spicy 🍛', 'Mild / Non-Spicy 🥚', 'Extra Cheese 🧀', 'Pure Veg Mode 🥦'],
  cab:      ['AC Enabled ❄️', 'Silent Ride 🔇', 'Prime Sedan 🚗', 'Regular Mini 🚙'],
  shopping: ['Standard Packaging 📦', 'Gift Wrapped 🎁 (+₹30)', 'Eco-Friendly Box ♻️'],
};

/**
 * getPreferencesForService
 *
 * Returns comfort preference options for a service type.
 * Falls back to a default option if service is unknown.
 * Mirrors: booking.js displayPreferenceOptions() line 183.
 */
export function getPreferencesForService(service: string): string[] {
  return PREFERENCES_MAP[service as ServiceType] ?? ['Standard Preferences ⚙️'];
}

// ── Option detail formatter (booking.js lines 120–130) ───────────────────────
export interface OptionDetails {
  merchant:    string;
  price:       number | string;
  preference?: string;
  [key: string]: unknown;
}

/**
 * formatOptionDetails
 *
 * Formats the sub-line text for a booking option card.
 * Exact logic from booking.js displayOptions() lines 120–130.
 */
export function formatOptionDetails(service: string, opt: OptionDetails): string {
  if (service === 'train' || service === 'bus') {
    return `${opt.origin} to ${opt.destination} (${opt.departs} - ${opt.arrives})`;
  }
  if (service === 'movie') {
    return `${opt.cinema} | ${opt.showtime} (${opt.format})`;
  }
  if (service === 'food') {
    return `${opt.item} from ${opt.restaurant} (ETA: ${opt.eta})`;
  }
  if (service === 'cab') {
    return `${opt.car} (Distance: ${opt.distance_km} km)`;
  }
  if (service === 'shopping') {
    return `Delivery: ${opt.delivery} | Seller: ${opt.store}`;
  }
  return '';
}
