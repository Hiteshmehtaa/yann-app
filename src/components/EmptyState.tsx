import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import LottieView from 'lottie-react-native';
import { COLORS, TYPOGRAPHY, SPACING } from '../utils/theme';
import { useTheme } from '../contexts/ThemeContext';

interface EmptyStateProps {
  title: string;
  subtitle?: string;
  animationSource?: any;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  subtitle,
  animationSource = require('../../assets/lottie/empty cart.json'),
}) => {
  const { colors } = useTheme();
  return (
    <View style={styles.container}>
      <LottieView
        source={animationSource}
        autoPlay
        loop
        style={styles.animation}
      />
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      {subtitle && <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{subtitle}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  animation: {
    width: 250,
    height: 250,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: SPACING.md,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
    textAlign: 'center',
  },
});
