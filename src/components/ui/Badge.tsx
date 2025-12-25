import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, ViewStyle, TextStyle } from 'react-native';
import { COLORS, RADIUS, TYPOGRAPHY } from '../../utils/theme';

export type BadgeVariant = 'new' | 'popular' | 'coming-soon' | 'hot' | 'sale' | 'premium';

interface BadgeProps {
  variant: BadgeVariant;
  text?: string;
  pulse?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Badge: React.FC<BadgeProps> = ({
  variant,
  text,
  pulse = false,
  style,
  textStyle,
}) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (pulse) {
      const animation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );
      animation.start();
      return () => animation.stop();
    }
  }, [pulse]);

  const getBadgeConfig = () => {
    switch (variant) {
      case 'new':
        return {
          backgroundColor: COLORS.success,
          text: text || 'NEW',
        };
      case 'popular':
        return {
          backgroundColor: COLORS.accentOrange,
          text: text || 'POPULAR',
        };
      case 'coming-soon':
        return {
          backgroundColor: COLORS.textTertiary,
          text: text || 'COMING SOON',
        };
      case 'hot':
        return {
          backgroundColor: COLORS.error,
          text: text || '🔥 HOT',
        };
      case 'sale':
        return {
          backgroundColor: COLORS.warning,
          text: text || 'SALE',
        };
      case 'premium':
        return {
          backgroundColor: COLORS.primary,
          text: text || '⭐ PREMIUM',
        };
      default:
        return {
          backgroundColor: COLORS.primary,
          text: text || 'BADGE',
        };
    }
  };

  const config = getBadgeConfig();

  return (
    <Animated.View
      style={[
        styles.badge,
        { backgroundColor: config.backgroundColor },
        pulse && { transform: [{ scale: pulseAnim }] },
        style,
      ]}
    >
      <Text style={[styles.badgeText, textStyle]}>{config.text}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.small,
    alignSelf: 'flex-start',
  },
  badgeText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.size.xs,
    fontWeight: TYPOGRAPHY.weight.bold,
    letterSpacing: 0.5,
  },
});
