import React, { useEffect } from 'react';
import {
  TouchableOpacity, View, Text, ActivityIndicator, StyleSheet
} from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle,
  withRepeat, withTiming, withSequence, Easing
} from 'react-native-reanimated';
import { useAppContext } from '../context/AppContext';
import { useStrings } from '../utils/language';

type Props = { onPress: () => void };

const MIC_SIZE = 96;

export function MicButton({ onPress }: Props) {
  const { state } = useAppContext();
  const strings = useStrings(state.language);

  const ringScale = useSharedValue(1);
  const ringOpacity = useSharedValue(0);

  useEffect(() => {
    if (state.isListening) {
      ringScale.value = withRepeat(
        withSequence(
          withTiming(1.6, { duration: 800, easing: Easing.out(Easing.ease) }),
          withTiming(1.0, { duration: 400 })
        ), -1, false
      );
      ringOpacity.value = withRepeat(
        withSequence(
          withTiming(0.4, { duration: 800 }),
          withTiming(0.0, { duration: 400 })
        ), -1, false
      );
    } else {
      ringScale.value = withTiming(1, { duration: 300 });
      ringOpacity.value = withTiming(0, { duration: 300 });
    }
  }, [state.isListening]);

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ringScale.value }],
    opacity: ringOpacity.value,
  }));

  const isActive = state.isListening || state.isLoading;
  const label = state.isLoading ? strings.thinking
    : state.isListening ? strings.listening
    : strings.micHint;

  return (
    <View style={styles.container}>
      <Animated.View
        style={[styles.ring, ringStyle]}
      />
      <TouchableOpacity
        onPress={onPress}
        disabled={state.isLoading}
        activeOpacity={0.85}
        style={[styles.button, isActive && styles.buttonActive]}
        accessibilityLabel={label}
        accessibilityRole="button"
        accessibilityHint="Double tap to start speaking"
      >
        {state.isLoading ? (
          <ActivityIndicator size="large" color="#FFFFFF" />
        ) : (
          <Text style={styles.micIcon}>
            {state.isListening ? '⏹' : '🎤'}
          </Text>
        )}
      </TouchableOpacity>
      <Text style={[styles.hint, isActive && styles.hintActive]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  ring: {
    position: 'absolute',
    width: MIC_SIZE + 20,
    height: MIC_SIZE + 20,
    borderRadius: (MIC_SIZE + 20) / 2,
    backgroundColor: '#2E7D32',
  },
  button: {
    width: MIC_SIZE,
    height: MIC_SIZE,
    borderRadius: MIC_SIZE / 2,
    backgroundColor: '#2E7D32',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#1B5E20',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
  },
  buttonActive: { backgroundColor: '#C62828' },
  micIcon: { fontSize: 40 },
  hint: { fontSize: 16, color: '#546E7A', fontWeight: '500', textAlign: 'center' },
  hintActive: { color: '#C62828', fontWeight: '600' },
});
