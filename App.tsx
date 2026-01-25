import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/contexts/AuthContext';
import { ThemeProvider } from './src/contexts/ThemeContext';
import { NotificationProvider } from './src/contexts/NotificationContext';
import { AppNavigator } from './src/navigation/AppNavigator';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { OfflineIndicator } from './src/components/OfflineIndicator';
import { AnimatedSplash } from './src/components/AnimatedSplash';
import { OnboardingScreen, isOnboardingCompleted } from './src/screens/onboarding/OnboardingScreen';
import { offlineStorage } from './src/utils/offlineStorage';
import * as WebBrowser from 'expo-web-browser';
import './src/i18n'; // Initialize i18n

WebBrowser.maybeCompleteAuthSession();

export default function App() {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [showSplash, setShowSplash] = useState(true);

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

  // Show animated splash screen overlay if not ready or showing splash
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

                  {/* Main App Navigator (Always rendered behind splash) */}
                  <AppNavigator />

                  {/* Splash Overlay */}
                  {showSplash && (
                    <AnimatedSplash
                      isReady={isReady}
                      onAnimationComplete={() => setShowSplash(false)}
                    />
                  )}

                  {/* Onboarding Overlay */}
                  {showOnboarding && !showSplash && (
                    <View style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, zIndex: 1000, backgroundColor: '#fff' }}>
                      <OnboardingScreen onComplete={() => setShowOnboarding(false)} />
                    </View>
                  )}
                </View>
              </NotificationProvider>
            </ThemeProvider>
          </AuthProvider>
        </PaperProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
