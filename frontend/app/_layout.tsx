import { Stack } from 'expo-router';
import '@/global.css';
import { View, Text, ActivityIndicator } from 'react-native';
import { AppProvider, useAppContext } from '../src/context/AppContext';
import { StatusBar } from 'expo-status-bar';

function AppShell() {
  const { state } = useAppContext();

  if (!state.isLanguageLoaded) {
    return (
      <View className="flex-1 bg-[#F7FBF7] items-center justify-center gap-2">
        <Text className="text-[72px]">🌾</Text>
        <Text className="text-[28px] font-extrabold text-green-900 tracking-wide">KisanMitra</Text>
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
    <AppProvider>
      <AppShell />
    </AppProvider>
  );
}
