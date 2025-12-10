import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ImageBackground } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY, SHADOWS } from '../../utils/theme';

interface SpecialOfferBannerProps {
  discount: string;
  title: string;
  description: string;
  onPress?: () => void;
}

export const SpecialOfferBanner: React.FC<SpecialOfferBannerProps> = ({
  discount,
  title,
  description,
  onPress,
}) => {
  return (
    <TouchableOpacity 
      activeOpacity={0.9} 
      onPress={onPress}
      style={styles.container}
    >
      <LinearGradient
        colors={[COLORS.primary, COLORS.primaryGradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.content}>
          {/* Discount Badge */}
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>{discount}</Text>
            <Text style={styles.offText}>OFF</Text>
          </View>
          
          {/* Title */}
          <Text style={styles.title}>{title}</Text>
          
          {/* Description */}
          <Text style={styles.description} numberOfLines={2}>
            {description}
          </Text>
        </View>

        {/* Decorative Circle */}
        <View style={styles.decorativeCircle} />
        <View style={styles.decorativeCircle2} />
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
    borderRadius: RADIUS.large,
    overflow: 'hidden',
    ...SHADOWS.primary,
  },
  gradient: {
    padding: SPACING.lg,
    minHeight: 120,
    flexDirection: 'row',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    zIndex: 2,
  },
  discountBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.small,
    marginBottom: SPACING.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  discountText: {
    fontSize: 24,
    fontWeight: TYPOGRAPHY.weight.heavy,
    color: COLORS.white,
  },
  offText: {
    fontSize: TYPOGRAPHY.size.sm,
    fontWeight: TYPOGRAPHY.weight.bold,
    color: COLORS.white,
  },
  title: {
    fontSize: TYPOGRAPHY.size.md,
    fontWeight: TYPOGRAPHY.weight.bold,
    color: COLORS.white,
    marginBottom: SPACING.xs,
  },
  description: {
    fontSize: TYPOGRAPHY.size.sm,
    fontWeight: TYPOGRAPHY.weight.regular,
    color: 'rgba(255, 255, 255, 0.9)',
    maxWidth: '85%',
  },
  decorativeCircle: {
    position: 'absolute',
    right: -40,
    top: -20,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    zIndex: 1,
  },
  decorativeCircle2: {
    position: 'absolute',
    right: 10,
    bottom: -30,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    zIndex: 1,
  },
});
