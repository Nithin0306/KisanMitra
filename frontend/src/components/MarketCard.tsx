import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MarketResponse } from '../context/AppContext';
import { DECISION_COLORS } from '../utils/constants';
import { useStrings } from '../utils/language';
import { useAppContext } from '../context/AppContext';

type Props = { data: MarketResponse };

const TREND_ICONS = { rising: '📈', falling: '📉', stable: '➡️', unknown: '❓' };

function confColor(c: 'high' | 'medium' | 'low'): string {
  return c === 'high' ? '#E8F5E9' : c === 'medium' ? '#FFF8E1' : '#FFEBEE';
}

export function MarketCard({ data }: Props) {
  const { state } = useAppContext();
  const strings = useStrings(state.language);
  const dc = DECISION_COLORS[data.decision];

  const decisionLabel = data.decision === 'SELL' ? strings.sellNow
    : data.decision === 'WAIT' ? strings.waitLabel
    : strings.unknown;

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{strings.marketCard}</Text>

      <View style={[styles.decisionBadge, { backgroundColor: dc.bg }]}>
        <Text style={{ fontSize: 32 }}>
          {data.decision === 'SELL' ? '💰' : data.decision === 'WAIT' ? '⏳' : '❓'}
        </Text>
        <Text style={[styles.decisionText, { color: dc.text }]}>{decisionLabel}</Text>
      </View>

      {data.current_price_inr !== null && (
        <View style={styles.priceRow}>
          <Text style={styles.priceLabel}>₹</Text>
          <Text style={styles.priceValue}>
            {Math.round(data.current_price_inr).toLocaleString('en-IN')}
          </Text>
          <Text style={styles.priceUnit}>/{data.price_unit ?? 'quintal'}</Text>
          <Text style={{ fontSize: 22, marginLeft: 6 }}>
            {TREND_ICONS[data.trend_direction]}
          </Text>
        </View>
      )}

      {data.moving_avg_3d !== null && data.moving_avg_7d !== null && (
        <View style={styles.maRow}>
          <Text style={styles.maText}>3d avg: ₹{Math.round(data.moving_avg_3d)}</Text>
          <Text style={styles.maSep}>·</Text>
          <Text style={styles.maText}>7d avg: ₹{Math.round(data.moving_avg_7d)}</Text>
          <View style={[styles.confPill, { backgroundColor: confColor(data.confidence) }]}>
            <Text style={styles.confText}>{data.confidence}</Text>
          </View>
        </View>
      )}

      {data.data_age_hours !== null && data.data_age_hours > 0 && (
        <Text style={styles.staleLabel}>
          {strings.lastUpdated}: {data.data_age_hours}h ago{data.degraded_mode ? ' ⚠️' : ''}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    borderWidth: 1,
    borderColor: '#E3F2FD',
  },
  title: { fontSize: 17, fontWeight: '700', color: '#1565C0', marginBottom: 14 },
  decisionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 14,
    gap: 10,
  },
  decisionText: { fontSize: 26, fontWeight: '800', letterSpacing: 1 },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
    gap: 4,
  },
  priceLabel: { fontSize: 22, color: '#37474F', fontWeight: '500' },
  priceValue: { fontSize: 32, fontWeight: '800', color: '#212121' },
  priceUnit: { fontSize: 14, color: '#78909C' },
  maRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  maText: { fontSize: 13, color: '#546E7A' },
  maSep: { color: '#B0BEC5' },
  confPill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, marginLeft: 6 },
  confText: { fontSize: 11, color: '#37474F', fontWeight: '600', textTransform: 'uppercase' },
  staleLabel: { fontSize: 12, color: '#90A4AE', marginTop: 4 },
});
