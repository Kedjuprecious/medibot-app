import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './context/AuthContext';
// SafeAreaProvider ensures your UI respects notches and safe areas on iPhones, etc.
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function RootLayout() {
  return (
    <SafeAreaProvider> 
      {/* The Stack component manages navigation between screens */}
      {/* screenOptions={{ headerShown: false }} hides the header for all screens */}
      <AuthProvider>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false }} />
      </AuthProvider>
    </SafeAreaProvider>
  );
}