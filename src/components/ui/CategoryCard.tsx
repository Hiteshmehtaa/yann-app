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
  const baseColor = typeof color === 'string' ? color : '#4F46E5';
  const gradientColors = [baseColor, `${baseColor}CC`] as const;

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={[styles.container, style]}
    >
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        {/* Icon Container */}
        <View style={styles.iconContainer}>
          <View style={[styles.iconWrapper, { backgroundColor: 'rgba(255, 255, 255, 0.25)' }]}>
            {icon}
          </View>
        </View>

        {/* Title and Count */}
        <View style={styles.content}>
          <Text style={styles.title} numberOfLines={2}>
            {title}
          </Text>
          {count !== undefined && (
            <Text style={styles.count}>{count} services</Text>
          )}
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 160,
    height: 120,
    marginRight: SPACING.md,
  },
  gradient: {
    flex: 1,
    borderRadius: RADIUS.large,
    padding: SPACING.md,
    justifyContent: 'space-between',
    ...SHADOWS.md,
  },
  iconContainer: {
    alignItems: 'flex-start',
  },
  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.medium,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  title: {
    fontSize: TYPOGRAPHY.size.md,
    fontWeight: TYPOGRAPHY.weight.bold,
    color: COLORS.white,
    marginBottom: 4,
  },
  count: {
    fontSize: TYPOGRAPHY.size.xs,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: TYPOGRAPHY.weight.medium,
  },
});
