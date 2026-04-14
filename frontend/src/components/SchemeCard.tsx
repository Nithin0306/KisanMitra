import React from 'react';
import { View, Text, TouchableOpacity, Linking, Alert } from 'react-native';
import { SchemeResponse } from '../context/AppContext';
import { useStrings } from '../utils/language';
import { useAppContext } from '../context/AppContext';

type Props = {
  data: SchemeResponse;
};

export function SchemeCard({ data }: Props) {
  const { state } = useAppContext();
  const strings = useStrings(state.language);

  const openURL = async (url: string | null) => {
    if (!url) return;
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) Linking.openURL(url);
    } catch {
      Alert.alert('', 'Could not open link');
    }
  };

  return (
    <View className="bg-white rounded-2xl p-[18px] mb-3 border border-purple-50 shadow-sm shadow-black/5">
      <Text className="text-[17px] font-bold text-purple-900 mb-1">{strings.schemeCard}</Text>
      <Text className="text-xs text-slate-400 mb-3.5">
        {data.total_matches_found} schemes found — showing top {data.matched_schemes.length}
      </Text>

      {data.matched_schemes.map((scheme, idx) => (
        <View
          key={scheme.scheme_id}
          className={`flex-row gap-3 py-3 ${idx < data.matched_schemes.length - 1 ? 'border-b border-purple-50' : ''}`}
        >
          <View className="w-9 items-center pt-0.5">
            <Text className="text-[22px]">📋</Text>
          </View>
          <View className="flex-1 gap-1">
            <Text className="text-[15px] font-bold text-indigo-900">{scheme.scheme_name}</Text>
            <Text className="text-xs text-purple-600 font-medium" numberOfLines={1}>{scheme.ministry}</Text>
            <Text className="text-sm text-slate-700 leading-5" numberOfLines={3}>
              {scheme.eligibility_summary}
            </Text>
            {scheme.application_url && (
              <TouchableOpacity
                onPress={() => openURL(scheme.application_url)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text className="text-[13px] text-blue-700 font-semibold mt-1">🔗 {strings.learnMore}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      ))}
    </View>
  );
}
