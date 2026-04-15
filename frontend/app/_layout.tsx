import { Stack } from 'expo-router';
import '@/global.css';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { AppProvider, useAppContext } from '../src/context/AppContext';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

function AppShell() {
  const { state } = useAppContext();

  if (!state.isLanguageLoaded) {
    return (
      <View style={styles.splash}>
        <Text style={styles.splashEmoji}>🌾</Text>
        <Text style={styles.splashName}>KisanMitra</Text>
        <ActivityIndicator color="#2E7D32" size="small" style={{ marginTop: 24 }} />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="dark" backgroundColor="#F7FBF7" />
      <Stack screenOptions={{ headerShown: false }} />
    </>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <AppShell />
      </AppProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: '#F7FBF7',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  splashEmoji: { fontSize: 72 },
  splashName: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1B5E20',
    letterSpacing: 0.5,
  },
});
