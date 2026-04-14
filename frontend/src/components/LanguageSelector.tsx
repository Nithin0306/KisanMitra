import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
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
    <View className="py-2">
      <Text className="text-[13px] text-slate-500 mb-2 px-5 font-medium tracking-wide">
        {strings.selectLanguage}
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="px-4 gap-2"
      >
        {LANGUAGES.map((lang) => {
          const active = lang.code === state.language;
          return (
            <TouchableOpacity
              key={lang.code}
              onPress={() => select(lang.code)}
              className={`min-w-[56px] px-3.5 py-2.5 rounded-full border-[1.5px] items-center justify-center ${
                active ? 'bg-green-900 border-green-900' : 'bg-slate-100 border-slate-300'
              }`}
              activeOpacity={0.75}
              accessibilityLabel={lang.label}
              accessibilityRole="radio"
              accessibilityState={{ selected: active }}
            >
              <Text className={`text-sm font-semibold ${active ? 'text-white' : 'text-slate-600'}`}>
                {lang.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}
