import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { LANGUAGES, LanguageCode } from '../utils/constants';
import { useAppContext } from '../context/AppContext';
import { useStrings } from '../utils/language';

export function LanguageSelector() {
  const { state, dispatch } = useAppContext();
  const strings = useStrings(state.language);

  const select = (code: LanguageCode) => {
    dispatch({ type: 'SET_LANGUAGE', payload: code });
  };

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{strings.selectLanguage}</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {LANGUAGES.map((lang) => {
          const active = lang.code === state.language;
          return (
            <TouchableOpacity
              key={lang.code}
              onPress={() => select(lang.code)}
              style={[styles.pill, active && styles.pillActive]}
              activeOpacity={0.75}
              accessibilityLabel={lang.label}
              accessibilityRole="radio"
              accessibilityState={{ selected: active }}
            >
              <Text style={[styles.pillText, active && styles.pillTextActive]}>
                {lang.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { paddingVertical: 8 },
  label: {
    fontSize: 13,
    color: '#78909C',
    marginBottom: 8,
    paddingHorizontal: 20,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  row: {
    paddingHorizontal: 16,
    gap: 8,
    alignItems: 'flex-start',  // prevents pills from stretching to full screen height
  },
  pill: {
    height: 44,
    minWidth: 56,
    paddingHorizontal: 14,
    borderRadius: 24,
    backgroundColor: '#F0F4F8',
    borderWidth: 1.5,
    borderColor: '#CFD8DC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillActive: { backgroundColor: '#1B5E20', borderColor: '#1B5E20' },
  pillText: { fontSize: 14, color: '#546E7A', fontWeight: '600' },
  pillTextActive: { color: '#FFFFFF' },
});
