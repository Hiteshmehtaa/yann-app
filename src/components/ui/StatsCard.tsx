import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SPACING, SHADOWS, TYPOGRAPHY } from '../../utils/theme';

interface StatsCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string | number;
  iconColor?: string;
  iconBgColor?: string;
  style?: ViewStyle;
  animate?: boolean;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  icon,
  label,
  value,
  iconColor = COLORS.primary,
  iconBgColor = `${COLORS.primary}15`,
  style,
  animate = true,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (animate) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();

      // Animate number counting if value is a number
      if (typeof value === 'number') {
        const duration = 1000;
        const steps = 30;
        const increment = value / steps;
        let current = 0;

        const timer = setInterval(() => {
          current += increment;
          if (current >= value) {
            setDisplayValue(value);
            clearInterval(timer);
          } else {
            setDisplayValue(Math.floor(current));
          }
        }, duration / steps);

        return () => clearInterval(timer);
      }
    }
  }, [value, animate]);

  const finalValue = typeof value === 'number' && animate ? displayValue : value;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        },
        style,
      ]}
    >
      <View style={[styles.iconContainer, { backgroundColor: iconBgColor }]}>
        <Ionicons name={icon} size={24} color={iconColor} />
      </View>
      <Text style={styles.value}>{finalValue}</Text>
      <Text style={styles.label}>{label}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.large,
    padding: SPACING.lg,
    alignItems: 'center',
    minWidth: 100,
    ...SHADOWS.sm,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.medium,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  value: {
    fontSize: TYPOGRAPHY.size.xxl,
    fontWeight: TYPOGRAPHY.weight.bold,
    color: COLORS.text,
    marginBottom: 4,
  },
  label: {
    fontSize: TYPOGRAPHY.size.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});
