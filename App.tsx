import React from 'react';
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

export default function App() {
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
