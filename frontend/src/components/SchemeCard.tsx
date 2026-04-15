import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Alert } from 'react-native';
import { SchemeResponse } from '../context/AppContext';
import { useStrings } from '../utils/language';
import { useAppContext } from '../context/AppContext';

type Props = { data: SchemeResponse };

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
    <View style={styles.card}>
      <Text style={styles.title}>{strings.schemeCard}</Text>
      <Text style={styles.countLabel}>
        {data.total_matches_found} schemes found — showing top {data.matched_schemes.length}
      </Text>

      {data.matched_schemes.map((scheme, idx) => (
        <View
          key={scheme.scheme_id}
          style={[
            styles.schemeRow,
            idx < data.matched_schemes.length - 1 && styles.schemeBorder,
          ]}
        >
          <View style={styles.schemeLeft}>
            <Text style={{ fontSize: 22 }}>📋</Text>
          </View>
          <View style={styles.schemeRight}>
            <Text style={styles.schemeName}>{scheme.scheme_name}</Text>
            <Text style={styles.ministry} numberOfLines={1}>{scheme.ministry}</Text>
            <Text style={styles.eligibility} numberOfLines={3}>
              {scheme.eligibility_summary}
            </Text>
            {scheme.application_url ? (
              <TouchableOpacity
                onPress={() => openURL(scheme.application_url)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.link}>🔗 {strings.learnMore}</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      ))}
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
    borderColor: '#EDE7F6',
  },
  title: { fontSize: 17, fontWeight: '700', color: '#4A148C', marginBottom: 4 },
  countLabel: { fontSize: 12, color: '#9E9E9E', marginBottom: 14 },
  schemeRow: { flexDirection: 'row', gap: 12, paddingVertical: 12 },
  schemeBorder: { borderBottomWidth: 1, borderBottomColor: '#F3E5F5' },
  schemeLeft: { width: 36, alignItems: 'center', paddingTop: 2 },
  schemeRight: { flex: 1, gap: 4 },
  schemeName: { fontSize: 15, fontWeight: '700', color: '#311B92' },
  ministry: { fontSize: 12, color: '#7E57C2', fontWeight: '500' },
  eligibility: { fontSize: 14, color: '#37474F', lineHeight: 20 },
  link: { fontSize: 13, color: '#1565C0', fontWeight: '600', marginTop: 4 },
});
