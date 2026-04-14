import React, { useEffect } from 'react';
import {
  TouchableOpacity, View, Text, ActivityIndicator
} from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle,
  withRepeat, withTiming, withSequence, Easing
} from 'react-native-reanimated';
import { useAppContext } from '../context/AppContext';
import { useStrings } from '../utils/language';

type Props = {
  onPress: () => void;
};

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
        ),
        -1,
        false
      );
      ringOpacity.value = withRepeat(
        withSequence(
          withTiming(0.4, { duration: 800 }),
          withTiming(0.0, { duration: 400 })
        ),
        -1,
        false
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
  const label = state.isLoading
    ? strings.thinking
    : state.isListening
    ? strings.listening
    : strings.micHint;

  return (
    <View className="items-center justify-center gap-4">
      <Animated.View 
        className="absolute bg-green-800"
        style={[
          { width: MIC_SIZE + 20, height: MIC_SIZE + 20, borderRadius: (MIC_SIZE + 20) / 2 },
          ringStyle
        ]} 
      />

      <TouchableOpacity
        onPress={onPress}
        disabled={state.isLoading}
        activeOpacity={0.85}
        className={`items-center justify-center shadow-lg elevation-xl flex items-center justify-center ${isActive ? 'bg-red-700 shadow-red-900/50' : 'bg-green-800 shadow-green-900/40'}`}
        style={{ width: MIC_SIZE, height: MIC_SIZE, borderRadius: MIC_SIZE / 2 }}
        accessibilityLabel={label}
        accessibilityRole="button"
        accessibilityHint="Double tap to start speaking"
      >
        {state.isLoading ? (
          <ActivityIndicator size="large" color="#FFFFFF" />
        ) : (
          <Text className="text-[40px]">
            {state.isListening ? '⏹' : '🎤'}
          </Text>
        )}
      </TouchableOpacity>

      <Text className={`text-base text-center ${isActive ? 'text-red-700 font-semibold' : 'text-slate-500 font-medium'}`}>
        {label}
      </Text>
    </View>
  );
}
