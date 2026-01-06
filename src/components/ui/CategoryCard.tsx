/**
 * Category Card Component
 * Colorful card design inspired by Design 2
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY, SHADOWS } from '../../utils/theme';

interface CategoryCardProps {
  title: string;
  icon: React.ReactNode;
  color: string;
  count?: number;
  onPress: () => void;
  style?: ViewStyle;
}

export const CategoryCard: React.FC<CategoryCardProps> = ({
  title,
  icon,
  color,
  count,
  onPress,
  style,
}) => {
  // Ensure color is a string and create gradient colors safely
  const baseColor = typeof color === 'string' ? color : '#3B82F6';
  const gradientColors = [baseColor, `${baseColor}CC`] as const;

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={[styles.container, style]}
    >
      <View style={styles.cardContent}>
        {/* Icon Container with Light Blue Background */}
        <View style={styles.iconContainer}>
          {icon}
        </View>

        {/* Title */}
        <Text style={styles.title} numberOfLines={2}>
          {title}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 80,
    marginRight: SPACING.md,
  },
  cardContent: {
    alignItems: 'center',
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: RADIUS.medium,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  title: {
    fontSize: TYPOGRAPHY.size.xs,
    fontWeight: TYPOGRAPHY.weight.medium,
    color: COLORS.text,
    textAlign: 'center',
    lineHeight: 14,
  },
});
