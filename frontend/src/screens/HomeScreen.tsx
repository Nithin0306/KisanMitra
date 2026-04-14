import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, SafeAreaView, TouchableOpacity, Vibration, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MicButton } from '../components/MicButton';
import { LanguageSelector } from '../components/LanguageSelector';
import { useAppContext } from '../context/AppContext';
import { useStrings } from '../utils/language';
import {
  startRecording, stopRecordingAndTranscribe,
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
    <SafeAreaView className="flex-1 bg-[#F7FBF7]">
      <View className="flex-1 items-center">

        {backendOnline === false && (
          <View className="w-full flex-row items-center justify-between bg-amber-50 px-4 py-2.5 border-b border-amber-300">
            <Text className="flex-1 text-[13px] text-orange-900 font-medium">
              ⚠️ Backend offline — check that the server is running
            </Text>
            <TouchableOpacity
              onPress={() => pingBackend().then(ok => setBackendOnline(ok))}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text className="text-[13px] text-blue-700 font-bold ml-3">Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        <LanguageSelector />

        <View className="flex-1" />

        <View className="items-center gap-1.5 mb-12">
          <Text className="text-[64px]">🌾</Text>
          <Text className="text-[32px] font-extrabold text-green-900 tracking-wide">KisanMitra</Text>
          <Text className="text-[14px] text-slate-500 text-center px-5 leading-5" numberOfLines={2}>
            விவசாயியின் நண்பன் · किसान का दोस्त · రైతు మిత్రుడు
          </Text>
        </View>

        <View className="mb-12">
          <MicButton onPress={handleMicPress} />
        </View>

        {state.error && (
          <View className="flex-row items-center bg-red-50 rounded-xl px-4 py-3 mx-6 mb-4 gap-2 border border-red-200">
            <Text className="flex-1 text-sm text-red-800 font-medium leading-5">{state.error}</Text>
            <TouchableOpacity
              onPress={() => dispatch({ type: 'SET_ERROR', payload: '' })}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text className="text-base text-red-800 font-bold">✕</Text>
            </TouchableOpacity>
          </View>
        )}

        {state.response && !state.error && !state.isListening && !state.isLoading && (
          <TouchableOpacity
            className="flex-row items-center bg-white rounded-3xl px-4 py-3 mx-6 mb-4 gap-2 shadow-sm shadow-black/5 border border-slate-200 max-w-[360px]"
            onPress={() => router.push('/response' as any)}
            activeOpacity={0.8}
          >
            <Text className="text-lg">💬</Text>
            <Text className="flex-1 text-sm text-slate-700 leading-5" numberOfLines={1}>
              {state.response.voice_explanation}
            </Text>
            <Text className="text-xl text-slate-400 font-bold">›</Text>
          </TouchableOpacity>
        )}

        <View className="flex-[2]" />
      </View>
    </SafeAreaView>
  );
}
