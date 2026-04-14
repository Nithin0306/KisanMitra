import React from 'react';
import { View, Text } from 'react-native';
import { CropResponse } from '../context/AppContext';
import { RISK_COLORS } from '../utils/constants';
import { useStrings } from '../utils/language';
import { useAppContext } from '../context/AppContext';

const CROP_EMOJI: Record<string, string> = {
  wheat: '🌾',
  rice: '🍚',
  chickpea: '🫘',
  cotton: '🌿',
  maize: '🌽',
  sorghum: '🌾',
  pearl_millet: '🌾',
  groundnut: '🥜',
  sugarcane: '🎋',
  mustard: '🌻',
};

function cropEmoji(name: string): string {
  return CROP_EMOJI[name.toLowerCase()] ?? '🌱';
}

type Props = {
  data: CropResponse;
};

export function CropCard({ data }: Props) {
  const { state } = useAppContext();
  const strings = useStrings(state.language);
  const riskColor = RISK_COLORS[data.risk_level];

  return (
    <View className="bg-white rounded-2xl p-[18px] mb-3 border border-green-50 shadow-sm shadow-black/5">
      <View className="flex-row justify-between items-center mb-3.5">
        <Text className="text-[17px] font-bold text-green-900">{strings.cropCard}</Text>
        <View 
          className="px-2.5 py-1 rounded-full border"
          style={{ backgroundColor: riskColor.bg, borderColor: riskColor.border }}
        >
          <Text className="text-xs font-bold tracking-wide" style={{ color: riskColor.text }}>
            {strings.riskLabel}: {data.risk_level.toUpperCase()}
          </Text>
        </View>
      </View>

      <View className="gap-2.5 mb-3">
        {data.top_3_crops.map((crop, idx) => (
          <View 
            key={crop.crop_name} 
            className={`flex-row items-center gap-2.5 px-2.5 rounded-xl ${
              idx === 0 ? 'bg-green-50 py-2.5' : 'bg-[#F9FBE7] py-1.5'
            }`}
          >
            <Text className="text-[28px]">{cropEmoji(crop.crop_name)}</Text>
            <View className="flex-1">
              <Text className={`capitalize ${
                idx === 0 ? 'text-lg text-green-900 font-bold' : 'text-base font-semibold text-slate-700'
              }`}>
                {idx === 0 ? '⭐ ' : `${idx + 1}. `}{crop.crop_name.replace('_', ' ')}
              </Text>
              <Text className="text-xs text-slate-500 mt-0.5">
                {crop.climate_fit === 'optimal' ? '✅ Optimal conditions'
                  : crop.climate_fit === 'marginal' ? '⚠️ Marginal conditions'
                  : ''}
              </Text>
            </View>
          </View>
        ))}
      </View>

      {data.reasoning_factors.length > 0 && (
        <Text className="text-[13px] text-slate-600 leading-5 bg-slate-50 p-2.5 rounded-lg mt-1" numberOfLines={2}>
          💬 {data.reasoning_factors[0]}
        </Text>
      )}

      {data.degraded_mode && (
        <Text className="text-xs text-orange-600 mt-2 font-medium">⚠️ Using offline data</Text>
      )}
    </View>
  );
}
