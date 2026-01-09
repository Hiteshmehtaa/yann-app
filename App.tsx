import React, { useState, useEffect } from 'react';
import { View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/contexts/AuthContext';
import { ThemeProvider } from './src/contexts/ThemeContext';
import { NotificationProvider } from './src/contexts/NotificationContext';
import { AppNavigator } from './src/navigation/AppNavigator';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { OfflineIndicator } from './src/components/OfflineIndicator';
import { OnboardingScreen, isOnboardingCompleted } from './src/screens/onboarding/OnboardingScreen';
import { offlineStorage } from './src/utils/offlineStorage';
import './src/i18n'; // Initialize i18n

export default function App() {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    async function initialize() {
      // Check onboarding status
      const completed = await isOnboardingCompleted();
      setShowOnboarding(!completed);
      setIsReady(true);
    }

    initialize();

    // Initialize offline support
    const unsubscribe = offlineStorage.onNetworkChange((isOnline) => {
      console.log(isOnline ? '📶 Back online' : '📴 Offline mode');
    });

    return unsubscribe;
  }, []);

  if (!isReady) {
    return null; // Or a splash screen
  }

  if (showOnboarding) {
    return (
      <SafeAreaProvider>
        <OnboardingScreen onComplete={() => setShowOnboarding(false)} />
      </SafeAreaProvider>
    );
  }

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <PaperProvider>
          <AuthProvider>
            <ThemeProvider>
              <NotificationProvider>
                <View style={{ flex: 1 }}>
                  <OfflineIndicator />
                  <StatusBar style="auto" />
                  <AppNavigator />
                </View>
              </NotificationProvider>
            </ThemeProvider>
          </AuthProvider>
        </PaperProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
