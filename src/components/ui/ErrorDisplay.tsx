import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import LottieView from 'lottie-react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { SPACING, LAYOUT } from '../../utils/theme';

type ErrorDisplayProps = {
  error: Error | null;
  onRetry?: () => void;
  isNetworkError?: boolean;
};

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ 
  error, 
  onRetry,
  isNetworkError = false 
}) => {
  const { colors } = useTheme();

  if (!error) return null;

  // Determine which animation to show
  const animationSource = isNetworkError
    ? require('../../../assets/lottie/Connection-Lost-Animation.json')
    : require('../../../assets/lottie/error.json');

  const errorTitle = isNetworkError 
    ? 'No Internet Connection' 
    : 'Something Went Wrong';

  const errorMessage = isNetworkError
    ? 'Please check your internet connection and try again.'
    : error.message || 'An unexpected error occurred. Please try again.';

  return (
    <View style={styles.container}>
      {/* Lottie Animation */}
      <LottieView
        source={animationSource}
        autoPlay
        loop
        style={styles.animation}
      />

      {/* Error Title */}
      <Text style={[styles.title, { color: colors.text }]}>
        {errorTitle}
      </Text>

      {/* Error Message */}
      <Text style={[styles.message, { color: colors.textSecondary }]}>
        {errorMessage}
      </Text>

      {/* Retry Button */}
      {onRetry && (
        <TouchableOpacity 
          style={[styles.retryButton, { backgroundColor: colors.primary }]}
          onPress={onRetry}
          activeOpacity={0.8}
        >
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: LAYOUT.screenPadding,
  },
  animation: {
    width: 250,
    height: 250,
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: SPACING.sm,
    letterSpacing: -0.3,
  },
  message: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SPACING.xl,
    maxWidth: 300,
  },
  retryButton: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
