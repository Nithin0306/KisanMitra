// constants.ts — App-wide constants. One place to change, everywhere updated.
//
// IMPORTANT for physical device testing:
//   Android physical device  → set EXPO_PUBLIC_API_BASE_URL=http://<YOUR_MACHINE_IP>:8000
//   Android emulator         → set EXPO_PUBLIC_API_BASE_URL=http://10.0.2.2:8000
//   iOS simulator            → http://localhost:8000 works fine
//   Your current machine IP  → 10.99.12.124

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://10.99.12.124:8000';

// AsyncStorage key for persisted language preference
export const STORAGE_KEY_LANGUAGE = '@kisanmitra:language';

export const LANGUAGES = [
  { code: 'hi-IN', label: 'हिंदी', short: 'HI' },
  { code: 'ta-IN', label: 'தமிழ்', short: 'TA' },
  { code: 'te-IN', label: 'తెలుగు', short: 'TE' },
  { code: 'kn-IN', label: 'ಕನ್ನಡ', short: 'KN' },
  { code: 'mr-IN', label: 'मराठी', short: 'MR' },
  { code: 'en-IN', label: 'English', short: 'EN' },
] as const;

export type LanguageCode = typeof LANGUAGES[number]['code'];

export const DEFAULT_LANGUAGE: LanguageCode = 'hi-IN';

// STT confidence threshold — below this, ask user to repeat
export const STT_CONFIDENCE_THRESHOLD = 0.65;

// Response card colours — high contrast for daylight visibility
export const RISK_COLORS = {
  low:    { bg: '#E8F5E9', text: '#2E7D32', border: '#A5D6A7' },
  medium: { bg: '#FFF8E1', text: '#F57F17', border: '#FFD54F' },
  high:   { bg: '#FFEBEE', text: '#C62828', border: '#EF9A9A' },
} as const;

export const DECISION_COLORS = {
  SELL:    { bg: '#E8F5E9', text: '#2E7D32' },
  WAIT:    { bg: '#FFF8E1', text: '#E65100' },
  UNKNOWN: { bg: '#F5F5F5', text: '#616161' },
} as const;
