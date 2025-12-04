import React, { useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, useWindowDimensions, ViewStyle, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, RADIUS, ICON_SIZES, SHADOWS, LAYOUT, getResponsiveCardWidth } from '../../utils/theme';

type ServiceCardProps = {
  title: string;
  price: string;
  icon: keyof typeof Ionicons.glyphMap;
  popular?: boolean;
  partnerCount?: number;
  onPress: () => void;
  style?: ViewStyle;
};

export const ServiceCard: React.FC<ServiceCardProps> = ({
  title,
  price,
  icon,
  popular = false,
  partnerCount = 0,
  onPress,
  style,
}) => {
  const { width } = useWindowDimensions();
  const cardWidth = getResponsiveCardWidth(width);
  const cardHeight = cardWidth * LAYOUT.serviceCardAspectRatio;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  return (
    <TouchableOpacity
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
      activeOpacity={1}
    >
      <Animated.View style={[styles.container, { width: cardWidth, height: cardHeight, transform: [{ scale: scaleAnim }] }, style]}>
        <LinearGradient
          colors={[COLORS.cardBg, COLORS.elevated]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
        {/* Icon with gradient background */}
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: popular ? `${COLORS.accentOrange}15` : `${COLORS.primary}15` },
          ]}
        >
          <Ionicons name={icon} size={ICON_SIZES.large} color={popular ? COLORS.accentOrange : COLORS.primary} />
        </View>

        {/* Popular badge */}
        {popular && (
          <View style={styles.popularBadge}>
            <Ionicons name="star" size={10} color={COLORS.warning} />
            <Text style={styles.popularText}>TOP</Text>
          </View>
        )}

        {/* Service title */}
        <Text style={styles.title} numberOfLines={2}>
          {title}
        </Text>

        {/* Partner count badge */}
        <View style={styles.partnerBadge}>
          <Ionicons name="people" size={14} color={partnerCount > 0 ? COLORS.success : COLORS.textTertiary} />
          <Text style={[styles.partnerText, partnerCount > 0 && styles.partnerTextActive]}>
            {partnerCount} {partnerCount === 1 ? 'Partner' : 'Partners'}
          </Text>
        </View>

        {/* Price */}
        <Text style={styles.price}>{price}</Text>
      </LinearGradient>
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.large,
    overflow: 'hidden',
    ...SHADOWS.md,
  },
  gradient: {
    flex: 1,
    padding: SPACING.md,
    justifyContent: 'space-between',
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: RADIUS.medium,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  popularBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: `${COLORS.warning}15`,
    paddingHorizontal: SPACING.xs,
    paddingVertical: 4,
    borderRadius: RADIUS.small,
    gap: 4,
    marginBottom: SPACING.sm,
  },
  popularText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.warning,
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.xs,
    lineHeight: 20,
    minHeight: 40,
  },
  partnerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: SPACING.xs,
  },
  partnerText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textTertiary,
  },
  partnerTextActive: {
    color: COLORS.success,
  },
  price: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
    letterSpacing: 0.3,
  },
});
