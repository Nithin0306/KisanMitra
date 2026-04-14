// AppContext.tsx — Global state: language, query, response, loading.
//
// Language pref is persisted to AsyncStorage (phone disk) so the farmer never
// has to re-select their language each time they open the app.
//
// Flow:
//   1. App opens → AppProvider mounts → reads language from AsyncStorage
//   2. isLanguageLoaded=false → _layout.tsx shows a loading splash instead of main UI
//   3. Language loaded (or defaulted) → isLanguageLoaded=true → main UI renders
//   4. Any language change → saved to AsyncStorage immediately

import React, {
  createContext, useContext, useReducer,
  useEffect, ReactNode, useRef,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_LANGUAGE, LanguageCode, STORAGE_KEY_LANGUAGE } from '../utils/constants';

// Response Types (mirror backend Pydantic schemas exactly)

export type CropResult = {
  crop_name: string;
  score: number;
  soil_match: boolean;
  season_match: boolean;
  climate_fit: 'optimal' | 'marginal' | 'unsuitable' | 'unknown';
};

export type CropResponse = {
  top_3_crops: CropResult[];
  risk_level: 'low' | 'medium' | 'high';
  reasoning_factors: string[];
  voice_explanation: string;
  data_freshness?: { weather_source: string };
  degraded_mode: boolean;
};

export type MarketResponse = {
  decision: 'SELL' | 'WAIT' | 'UNKNOWN';
  current_price_inr: number | null;
  price_unit: string;
  trend_direction: 'rising' | 'falling' | 'stable' | 'unknown';
  confidence: 'high' | 'medium' | 'low';
  moving_avg_3d: number | null;
  moving_avg_7d: number | null;
  data_age_hours: number | null;
  voice_explanation: string;
  degraded_mode: boolean;
};

export type SchemeResult = {
  scheme_id: string;
  scheme_name: string;
  ministry: string;
  eligibility_summary: string;
  application_url: string | null;
  deadline?: string | null;
};

export type SchemeResponse = {
  matched_schemes: SchemeResult[];
  total_matches_found: number;
  voice_explanation: string;
};

export type QueryResponse = {
  intent: 'crop_recommendation' | 'market_price' | 'scheme_match' | 'unknown' | string;
  feature_response: CropResponse | MarketResponse | SchemeResponse | Record<string, unknown>;
  voice_explanation: string;
  confidence: number;
  degraded_mode: boolean;
};

// App State

export type AppState = {
  language: LanguageCode;
  isLanguageLoaded: boolean;   // false until AsyncStorage read completes
  isListening: boolean;
  isLoading: boolean;
  currentTranscript: string | null;
  response: QueryResponse | null;
  error: string | null;
};

type Action =
  | { type: 'SET_LANGUAGE'; payload: LanguageCode }
  | { type: 'SET_LANGUAGE_LOADED' }
  | { type: 'SET_LISTENING'; payload: boolean }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_TRANSCRIPT'; payload: string }
  | { type: 'SET_RESPONSE'; payload: QueryResponse }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'RESET' };

// Reducer

const initialState: AppState = {
  language: DEFAULT_LANGUAGE,
  isLanguageLoaded: false,
  isListening: false,
  isLoading: false,
  currentTranscript: null,
  response: null,
  error: null,
};

function appReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_LANGUAGE':
      return { ...state, language: action.payload };
    case 'SET_LANGUAGE_LOADED':
      return { ...state, isLanguageLoaded: true };
    case 'SET_LISTENING':
      return { ...state, isListening: action.payload, error: null };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_TRANSCRIPT':
      return { ...state, currentTranscript: action.payload };
    case 'SET_RESPONSE':
      return { ...state, response: action.payload, isLoading: false, error: null };
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false, isListening: false };
    case 'RESET':
      // Preserve language on reset — farmer should never lose their language pref
      return {
        ...initialState,
        language: state.language,
        isLanguageLoaded: true,
      };
    default:
      return state;
  }
}

// Context

type AppContextType = {
  state: AppState;
  dispatch: React.Dispatch<Action>;
};

const AppContext = createContext<AppContextType | undefined>(undefined);

// Provider with AsyncStorage persistence

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Track whether this is the initial mount or a subsequent language change
  const isMountedRef = useRef(false);

  // Step 1: Load language from AsyncStorage on first mount
  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY_LANGUAGE);
        if (saved && isValidLanguageCode(saved)) {
          dispatch({ type: 'SET_LANGUAGE', payload: saved as LanguageCode });
        }
      } catch {
        // AsyncStorage read failed — silently fall back to default.
        // This cannot block the app from launching.
      } finally {
        dispatch({ type: 'SET_LANGUAGE_LOADED' });
        isMountedRef.current = true;
      }
    })();
  }, []);

  // Step 2: Save language to AsyncStorage whenever it changes
  // Skip the initial mount (before isLanguageLoaded=true) to avoid
  // overwriting a saved value with the default before we've read it.
  useEffect(() => {
    if (!isMountedRef.current) return;
    AsyncStorage.setItem(STORAGE_KEY_LANGUAGE, state.language).catch(() => {
      // Silently ignore write errors — language will default next launch
    });
  }, [state.language]);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

// Hook

export function useAppContext(): AppContextType {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used within AppProvider');
  return ctx;
}

// Helpers

const VALID_LANG_CODES = new Set<string>([
  'hi-IN', 'ta-IN', 'te-IN', 'kn-IN', 'mr-IN', 'en-IN',
]);

function isValidLanguageCode(code: string): boolean {
  return VALID_LANG_CODES.has(code);
}
