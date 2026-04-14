import React from 'react';
import { View, Text } from 'react-native';
import { MarketResponse } from '../context/AppContext';
import { DECISION_COLORS } from '../utils/constants';
import { useStrings } from '../utils/language';
import { useAppContext } from '../context/AppContext';

type Props = {
  data: MarketResponse;
};

const TREND_ICONS = {
  rising:  '📈',
  falling: '📉',
  stable:  '➡️',
  unknown: '❓',
};

export function MarketCard({ data }: Props) {
  const { state } = useAppContext();
  const strings = useStrings(state.language);
  const dc = DECISION_COLORS[data.decision];

  const decisionLabel = data.decision === 'SELL'
    ? strings.sellNow
    : data.decision === 'WAIT'
    ? strings.waitLabel
    : strings.unknown;

  return (
    <View className="bg-white rounded-2xl p-[18px] mb-3 border border-blue-50 shadow-sm shadow-black/5">
      <Text className="text-[17px] font-bold text-blue-800 mb-3.5">{strings.marketCard}</Text>

      <View 
        className="flex-row items-center justify-center py-3.5 rounded-xl mb-3.5 gap-2.5"
        style={{ backgroundColor: dc.bg }}
      >
        <Text className="text-[32px]">
          {data.decision === 'SELL' ? '💰' : data.decision === 'WAIT' ? '⏳' : '❓'}
        </Text>
        <Text className="text-[26px] font-extrabold tracking-widest" style={{ color: dc.text }}>
          {decisionLabel}
        </Text>
      </View>

      {data.current_price_inr !== null && (
        <View className="flex-row items-baseline mb-2 gap-1">
          <Text className="text-[22px] text-slate-700 font-medium">₹</Text>
          <Text className="text-[32px] font-extrabold text-neutral-900">
            {Math.round(data.current_price_inr).toLocaleString('en-IN')}
          </Text>
          <Text className="text-sm text-slate-500">/{data.price_unit ?? 'quintal'}</Text>
          <Text className="text-[22px] ml-1.5">
            {TREND_ICONS[data.trend_direction]}
          </Text>
        </View>
      )}

      {data.moving_avg_3d !== null && data.moving_avg_7d !== null && (
        <View className="flex-row items-center gap-1.5 mb-2">
          <Text className="text-[13px] text-slate-600">3d avg: ₹{Math.round(data.moving_avg_3d)}</Text>
          <Text className="text-slate-400">·</Text>
          <Text className="text-[13px] text-slate-600">7d avg: ₹{Math.round(data.moving_avg_7d)}</Text>
          <View className="px-2 py-0.5 rounded-lg ml-1.5" style={{ backgroundColor: _confColor(data.confidence) }}>
            <Text className="text-[11px] text-slate-700 font-semibold uppercase">{data.confidence}</Text>
          </View>
        </View>
      )}

      {data.data_age_hours !== null && data.data_age_hours > 0 && (
        <Text className="text-xs text-slate-400 mt-1">
          {strings.lastUpdated}: {data.data_age_hours}h ago
          {data.degraded_mode ? ' ⚠️' : ''}
        </Text>
      )}
    </View>
  );
}

function _confColor(c: 'high' | 'medium' | 'low'): string {
  return c === 'high' ? '#E8F5E9' : c === 'medium' ? '#FFF8E1' : '#FFEBEE';
}
