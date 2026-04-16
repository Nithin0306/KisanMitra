import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CropResponse } from '../context/AppContext';
import { RISK_COLORS } from '../utils/constants';
import { useAppContext } from '../context/AppContext';
import { useStrings, translateCrop } from '../utils/language';

const CROP_EMOJI: Record<string, string> = {
  wheat: '🌾', rice: '🍚', chickpea: '🫘', cotton: '🌿',
  maize: '🌽', sorghum: '🌾', pearl_millet: '🌾',
  groundnut: '🥜', sugarcane: '🎋', mustard: '🌻',
};

function cropEmoji(name: string): string {
  return CROP_EMOJI[name.toLowerCase()] ?? '🌱';
}

type Props = { data: CropResponse };

export function CropCard({ data }: Props) {
  const { state } = useAppContext();
  const strings = useStrings(state.language);
  const riskColor = RISK_COLORS[data.risk_level];

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>{strings.cropCard}</Text>
        <View style={[styles.riskBadge, { backgroundColor: riskColor.bg, borderColor: riskColor.border }]}>
          <Text style={[styles.riskText, { color: riskColor.text }]}>
            {strings.riskLabel}: {data.risk_level === 'high' ? strings.riskHigh : data.risk_level === 'medium' ? strings.riskMedium : strings.riskLow}
          </Text>
        </View>
      </View>

      <View style={styles.cropList}>
        {data.top_3_crops.map((crop, idx) => (
          <View key={crop.crop_name} style={[styles.cropRow, idx === 0 && styles.topCrop]}>
            <Text style={styles.cropEmoji}>{cropEmoji(crop.crop_name)}</Text>
            <View style={styles.cropInfo}>
              <Text style={[styles.cropName, idx === 0 && styles.topCropName]}>
                {idx === 0 ? '⭐ ' : `${idx + 1}. `}<Text style={{ textTransform: 'capitalize' }}>{translateCrop(crop.crop_name, state.language)}</Text>
              </Text>
              <Text style={styles.cropFit}>
                {crop.climate_fit === 'optimal' ? strings.fitOptimal
                  : crop.climate_fit === 'marginal' ? strings.fitMarginal : strings.fitUnsuitable}
              </Text>
            </View>
          </View>
        ))}
      </View>

      {data.reasoning_factors.length > 0 && (
        <Text style={styles.reasoning} numberOfLines={2}>
          💬 {data.reasoning_factors[0]}
        </Text>
      )}

      {data.degraded_mode && (
        <Text style={styles.degraded}>{strings.offlineData}</Text>
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
    borderColor: '#E8F5E9',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  title: { fontSize: 17, fontWeight: '700', color: '#1B5E20' },
  riskBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
  },
  riskText: { fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },
  cropList: { gap: 10, marginBottom: 12 },
  cropRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: '#F9FBE7',
  },
  topCrop: { backgroundColor: '#E8F5E9', paddingVertical: 10 },
  cropEmoji: { fontSize: 28 },
  cropInfo: { flex: 1 },
  cropName: { fontSize: 16, fontWeight: '600', color: '#37474F', textTransform: 'capitalize' },
  topCropName: { fontSize: 18, color: '#1B5E20', fontWeight: '700' },
  cropFit: { fontSize: 12, color: '#78909C', marginTop: 2 },
  reasoning: {
    fontSize: 13,
    color: '#546E7A',
    lineHeight: 20,
    backgroundColor: '#F5F5F5',
    padding: 10,
    borderRadius: 8,
    marginTop: 4,
  },
  degraded: { fontSize: 12, color: '#E65100', marginTop: 8, fontWeight: '500' },
});
