import React, { useEffect, useRef } from 'react';
import {
  View, Text, SafeAreaView, ScrollView,
  TouchableOpacity, ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAppContext, CropResponse, MarketResponse, SchemeResponse } from '../context/AppContext';
import { useStrings } from '../utils/language';
import { CropCard } from '../components/CropCard';
import { MarketCard } from '../components/MarketCard';
import { SchemeCard } from '../components/SchemeCard';
import { speakText, stopSpeaking } from '../services/speech';

export function ResponseScreen() {
  const router = useRouter();
  const { state, dispatch } = useAppContext();
  const strings = useStrings(state.language);
  const hasSpokeRef = useRef(false);

  useEffect(() => {
    if (state.response?.voice_explanation && !hasSpokeRef.current) {
      hasSpokeRef.current = true;
      speakText(state.response.voice_explanation, state.language);
    }
    return () => {
      stopSpeaking();
    };
  }, []);

  const handleBack = () => {
    stopSpeaking();
    dispatch({ type: 'RESET' });
    router.back();
  };

  const handleReplay = () => {
    if (state.response?.voice_explanation) {
      speakText(state.response.voice_explanation, state.language);
    }
  };

  if (!state.response) {
    return (
      <SafeAreaView className="flex-1 bg-[#F7FBF7]">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#2E7D32" />
        </View>
      </SafeAreaView>
    );
  }

  const { intent, feature_response, voice_explanation, degraded_mode } = state.response;

  return (
    <SafeAreaView className="flex-1 bg-[#F7FBF7]">

      <View className="flex-row items-center px-4 py-3.5 bg-white border-b border-gray-200">
        <TouchableOpacity
          onPress={handleBack}
          className="w-10 h-10 rounded-full bg-slate-50 items-center justify-center"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text className="text-[22px] text-slate-700 font-semibold">←</Text>
        </TouchableOpacity>
        <Text className="flex-1 text-center text-lg font-bold text-green-900">
          {intent === 'crop_recommendation' ? strings.cropCard
            : intent === 'market_price' ? strings.marketCard
            : strings.schemeCard}
        </Text>
        <TouchableOpacity
          onPress={handleReplay}
          className="w-10 h-10 rounded-full bg-green-50 items-center justify-center"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text className="text-xl">🔊</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="p-4 gap-1"
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-row bg-white rounded-2xl p-3.5 gap-2.5 mb-3 shadow-sm shadow-black/5 border border-green-100">
          <Text className="text-[22px] mt-0.5">🤖</Text>
          <Text className="flex-1 text-base text-neutral-900 leading-6 font-medium">{voice_explanation}</Text>
        </View>

        {state.currentTranscript && (
          <View className="flex-row items-center bg-slate-100 rounded-xl px-3 py-2 gap-2 mb-3">
            <Text className="text-sm">🎤</Text>
            <Text className="flex-1 text-[13px] text-slate-500 italic leading-snug" numberOfLines={2}>
              {state.currentTranscript}
            </Text>
          </View>
        )}

        {intent === 'crop_recommendation' && (
          <CropCard data={feature_response as CropResponse} />
        )}
        {intent === 'market_price' && (
          <MarketCard data={feature_response as MarketResponse} />
        )}
        {intent === 'scheme_match' && (
          <SchemeCard data={feature_response as SchemeResponse} />
        )}

        {intent === 'unknown' && (
          <View className="bg-white rounded-2xl p-6 items-center gap-3 shadow-sm mt-2">
            <Text className="text-[48px]">🤔</Text>
            <Text className="text-base text-slate-600 text-center leading-6">{voice_explanation}</Text>
          </View>
        )}

        {degraded_mode && (
          <View className="bg-amber-50 rounded-xl p-2.5 border border-amber-300 mt-1">
            <Text className="text-[13px] text-orange-900 text-center font-medium">
              ⚠️ Response uses cached data — live data unavailable
            </Text>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      <View className="absolute bottom-0 left-0 right-0 p-4 pb-6 bg-transparent">
        <TouchableOpacity
          className="flex-row items-center justify-center bg-green-800 rounded-full py-4 gap-2.5 shadow-lg shadow-green-900/40 elevation-md"
          onPress={handleBack}
          activeOpacity={0.85}
        >
          <Text className="text-[22px]">🎤</Text>
          <Text className="text-lg font-bold text-white tracking-wide">{strings.tapToSpeak}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
