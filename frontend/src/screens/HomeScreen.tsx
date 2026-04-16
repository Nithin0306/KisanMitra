import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, Vibration, Platform,
  StyleSheet, ScrollView,
} from 'react-native';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MicButton } from '../components/MicButton';
import { LanguageSelector } from '../components/LanguageSelector';
import { useAppContext } from '../context/AppContext';
import { useStrings } from '../utils/language';
import {
  startRecording, stopRecordingAndTranscribe, SarvamSTTError,
} from '../services/speech';
import { queryBackend, pingBackend, NetworkError, APIError } from '../services/api';
import { STT_CONFIDENCE_THRESHOLD } from '../utils/constants';

export function HomeScreen() {
  const router = useRouter();
  const { state, dispatch } = useAppContext();
  const strings = useStrings(state.language);
  const isListeningRef = useRef(false);

  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);

  useEffect(() => {
    pingBackend().then(online => setBackendOnline(online));
  }, []);

  const handleMicPress = useCallback(async () => {
    if (state.isListening) {
      dispatch({ type: 'SET_LISTENING', payload: false });
      dispatch({ type: 'SET_LOADING', payload: true });
      isListeningRef.current = false;

      try {
        const sttResult = await stopRecordingAndTranscribe(state.language);

        if (!sttResult.transcript.trim()) {
          dispatch({ type: 'SET_ERROR', payload: strings.errorLowAudio });
          dispatch({ type: 'SET_LOADING', payload: false });
          return;
        }

        if (sttResult.confidence < STT_CONFIDENCE_THRESHOLD) {
          dispatch({ type: 'SET_ERROR', payload: strings.errorLowAudio });
          dispatch({ type: 'SET_LOADING', payload: false });
          return;
        }

        dispatch({ type: 'SET_TRANSCRIPT', payload: sttResult.transcript });

        const response = await queryBackend({
          transcript: sttResult.transcript,
          language_code: state.language,
          stt_confidence: sttResult.confidence,
        });

        dispatch({ type: 'SET_RESPONSE', payload: response });
        router.push('/response' as any);

      } catch (err) {
        dispatch({ type: 'SET_LOADING', payload: false });
        if (err instanceof NetworkError) {
          setBackendOnline(false);
          dispatch({ type: 'SET_ERROR', payload: strings.errorNetwork });
        } else if (err instanceof APIError) {
          dispatch({ type: 'SET_ERROR', payload: err.message });
        } else if (err instanceof SarvamSTTError) {
          dispatch({ type: 'SET_ERROR', payload: 'Voice recognition error. Please try again.' });
        } else {
          dispatch({ type: 'SET_ERROR', payload: strings.errorLowAudio });
        }
      }
      return;
    }

    if (isListeningRef.current) return;
    isListeningRef.current = true;

    try {
      if (Platform.OS !== 'web') Vibration.vibrate(60);
      await startRecording();
      dispatch({ type: 'SET_LISTENING', payload: true });
    } catch {
      isListeningRef.current = false;
      dispatch({ type: 'SET_ERROR', payload: strings.errorLowAudio });
    }
  }, [state.isListening, state.language, strings]);

  return (
    <SafeAreaView style={styles.safe}>

      {backendOnline === false && (
        <Animated.View entering={FadeInDown.delay(50).springify()} style={styles.offlineBanner}>
          <Text style={styles.offlineText}>
            ⚠️ Backend offline — server is not reachable
          </Text>
          <TouchableOpacity
            onPress={() => pingBackend().then(ok => setBackendOnline(ok))}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      <Animated.View entering={FadeInDown.delay(100).springify()}>
        <LanguageSelector />
      </Animated.View>

      <View style={styles.flex1} />

      <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.heroArea}>
        <Text style={styles.logo}>🌾</Text>
        <Text style={styles.appName}>KisanMitra</Text>
        <Text style={styles.tagline} numberOfLines={2}>
          किसान का दोस्त · கர்ஷகனின் நண்பன் · రైతు మిత్రుడు
        </Text>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(350).springify()} style={styles.micArea}>
        <MicButton onPress={handleMicPress} />
      </Animated.View>

      {state.error ? (
        <Animated.View entering={FadeIn.delay(100).duration(300)} style={styles.errorBanner}>
          <Text style={styles.errorText}>{state.error}</Text>
          <TouchableOpacity
            onPress={() => dispatch({ type: 'SET_ERROR', payload: '' })}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.errorDismiss}>✕</Text>
          </TouchableOpacity>
        </Animated.View>
      ) : state.response && !state.isListening && !state.isLoading ? (
        <Animated.View entering={FadeIn.delay(100).duration(300)}>
          <TouchableOpacity
            style={styles.chipRow}
            onPress={() => router.push('/response' as any)}
            activeOpacity={0.8}
          >
            <Text style={styles.chipIcon}>💬</Text>
            <Text style={styles.chipText} numberOfLines={1}>
              {state.response.voice_explanation}
            </Text>
            <Text style={styles.chipArrow}>›</Text>
          </TouchableOpacity>
        </Animated.View>
      ) : null}

      <View style={styles.flex2} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F7FBF7',
  },
  offlineBanner: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF8E1',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#FFD54F',
  },
  offlineText: {
    flex: 1,
    fontSize: 13,
    color: '#E65100',
    fontWeight: '500',
  },
  retryText: {
    fontSize: 13,
    color: '#1565C0',
    fontWeight: '700',
    marginLeft: 12,
  },
  flex1: { flex: 1 },
  flex2: { flex: 2 },
  heroArea: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logo: {
    fontSize: 64,
    lineHeight: 80,
  },
  appName: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1B5E20',
    letterSpacing: 0.5,
    marginTop: 4,
  },
  tagline: {
    fontSize: 13,
    color: '#78909C',
    textAlign: 'center',
    paddingHorizontal: 32,
    lineHeight: 20,
    marginTop: 6,
  },
  micArea: {
    alignItems: 'center',
    marginBottom: 48,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#EF9A9A',
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    color: '#C62828',
    fontWeight: '500',
    lineHeight: 20,
  },
  errorDismiss: {
    fontSize: 16,
    color: '#C62828',
    fontWeight: '700',
    marginLeft: 8,
  },
  chipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  chipIcon: { fontSize: 18 },
  chipText: {
    flex: 1,
    fontSize: 14,
    color: '#37474F',
    lineHeight: 20,
    marginLeft: 8,
  },
  chipArrow: {
    fontSize: 20,
    color: '#90A4AE',
    fontWeight: '700',
    marginLeft: 4,
  },
});
