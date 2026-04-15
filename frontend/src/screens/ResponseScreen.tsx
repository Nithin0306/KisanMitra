import React, { useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  ActivityIndicator, StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
    return () => { stopSpeaking(); };
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
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#2E7D32" />
        </View>
      </SafeAreaView>
    );
  }

  const { intent, feature_response, voice_explanation, degraded_mode } = state.response;
  const title = intent === 'crop_recommendation' ? strings.cropCard
    : intent === 'market_price' ? strings.marketCard
    : strings.schemeCard;

  return (
    <SafeAreaView style={styles.safe}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={handleBack}
          style={styles.headerBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{title}</Text>
        <TouchableOpacity
          onPress={handleReplay}
          style={styles.headerBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={{ fontSize: 20 }}>🔊</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* AI voice bubble */}
        <View style={styles.voiceBubble}>
          <Text style={{ fontSize: 22, marginTop: 2 }}>🤖</Text>
          <Text style={styles.voiceText}>{voice_explanation}</Text>
        </View>

        {/* Transcript chip */}
        {state.currentTranscript ? (
          <View style={styles.transcriptChip}>
            <Text style={{ fontSize: 14 }}>🎤</Text>
            <Text style={styles.transcriptText} numberOfLines={2}>
              {state.currentTranscript}
            </Text>
          </View>
        ) : null}

        {/* Feature cards */}
        {!feature_response.error_code && intent === 'crop_recommendation' && (
          <CropCard data={feature_response as CropResponse} />
        )}
        {!feature_response.error_code && intent === 'market_price' && (
          <MarketCard data={feature_response as MarketResponse} />
        )}
        {!feature_response.error_code && intent === 'scheme_match' && (
          <SchemeCard data={feature_response as SchemeResponse} />
        )}

        {(intent === 'unknown' || feature_response.error_code) && (
          <View style={styles.unknownCard}>
            <Text style={{ fontSize: 48 }}>🤔</Text>
            <Text style={styles.unknownText}>{voice_explanation}</Text>
          </View>
        )}

        {degraded_mode && (
          <View style={styles.degradedBanner}>
            <Text style={styles.degradedText}>
              ⚠️ Using cached data — live data unavailable
            </Text>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Ask again button */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.askAgainBtn}
          onPress={handleBack}
          activeOpacity={0.85}
        >
          <Text style={{ fontSize: 22 }}>🎤</Text>
          <Text style={styles.askAgainText}>{strings.tapToSpeak}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F7FBF7',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 22,
    color: '#37474F',
    fontWeight: '600',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '700',
    color: '#1B5E20',
  },
  scroll: { flex: 1 },
  scrollContent: {
    padding: 16,
    gap: 12,
  },
  voiceBubble: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: '#C8E6C9',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  voiceText: {
    flex: 1,
    fontSize: 16,
    color: '#212121',
    lineHeight: 24,
    fontWeight: '500',
  },
  transcriptChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ECEFF1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  transcriptText: {
    flex: 1,
    fontSize: 13,
    color: '#607D8B',
    fontStyle: 'italic',
    lineHeight: 18,
  },
  unknownCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    gap: 12,
    elevation: 2,
  },
  unknownText: {
    fontSize: 16,
    color: '#546E7A',
    textAlign: 'center',
    lineHeight: 24,
  },
  degradedBanner: {
    backgroundColor: '#FFF8E1',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#FFD54F',
  },
  degradedText: {
    fontSize: 13,
    color: '#E65100',
    textAlign: 'center',
    fontWeight: '500',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: 28,
  },
  askAgainBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2E7D32',
    borderRadius: 50,
    paddingVertical: 16,
    gap: 10,
    elevation: 6,
    shadowColor: '#1B5E20',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  askAgainText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
});
