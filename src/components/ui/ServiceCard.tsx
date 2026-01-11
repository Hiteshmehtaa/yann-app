import React, { useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle, Image, ImageSourcePropType, Animated, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SPACING, RADIUS, SHADOWS, COLORS } from '../../utils/theme';
import { ServiceIcon } from '../icons/ServiceIcon';
import { Badge } from './Badge';
import { DepthCard } from './DepthCard';
import { haptics } from '../../utils/haptics';
import { useTheme } from '../../contexts/ThemeContext';

type ServiceCardProps = {
  title: string;
  price: string;
  icon?: string;
  iconImage?: ImageSourcePropType;
  IconComponent?: React.FC<{ size?: number; color?: string }>;
  popular?: boolean;
  partnerCount?: number;
  isComingSoon?: boolean;
  isNew?: boolean;
  onPress: () => void;
  style?: ViewStyle;
};

// Gradient presets for different service categories
const GRADIENT_PRESETS: Record<string, readonly [string, string]> = {
  default: ['#667eea', '#764ba2'],
  transport: ['#11998e', '#38ef7d'],
  cleaning: ['#667eea', '#764ba2'],
  health: ['#eb3349', '#f45c43'],
  spiritual: ['#f7971e', '#ffd200'],
};

export const ServiceCard: React.FC<ServiceCardProps> = ({
  title,
  price,
  icon,
  iconImage,
  IconComponent,
  popular = false,
  partnerCount = 0,
  isComingSoon = false,
  isNew = false,
  onPress,
  style,
}) => {
  const { colors, isDark } = useTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // Partner Count Logic
  const displayCount = partnerCount > 2 ? '2+' : partnerCount;
  const showCount = partnerCount > 0 && !isComingSoon;

  // Get gradient based on service title
  const getGradient = (): readonly [string, string] => {
    if (title.includes('Driver')) return GRADIENT_PRESETS.transport;
    if (title.includes('Clean') || title.includes('Maid')) return GRADIENT_PRESETS.cleaning;
    if (title.includes('Nurse') || title.includes('Attendant')) return GRADIENT_PRESETS.health;
    if (title.includes('Pujari')) return GRADIENT_PRESETS.spiritual;
    return GRADIENT_PRESETS.default;
  };

  const gradientColors = getGradient();

  const handlePressIn = () => {
    if (!isComingSoon) {
      haptics.light();
      Animated.spring(scaleAnim, {
        toValue: 0.92, // More noticeable shrink (was 0.95)
        speed: 20,     // Faster response
        bounciness: 4,
        useNativeDriver: true,
      }).start();
    }
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      speed: 15,
      bounciness: 6, // Slight bounce back
      useNativeDriver: true,
    }).start();
  };

  const handlePress = () => {
    if (!isComingSoon) {
      haptics.medium();
      onPress();
    }
  };

  const AnimatedDepthCard = Animated.createAnimatedComponent(DepthCard);

  return (
    <TouchableOpacity
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={1}
      style={[styles.container, isComingSoon && styles.comingSoonContainer, style]}
      disabled={isComingSoon}
    >
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <View style={[
          styles.glassCard,
          {
            backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.6)',
            borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.4)',
          }
        ]}>

          {/* Partner Count Badge - Top Left */}
          {showCount && (
            <LinearGradient
              colors={gradientColors}
              style={styles.partnerCountBadge}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.partnerCountText}>{displayCount}</Text>
            </LinearGradient>
          )}

          {/* Image/Icon Container (Transparent now) */}
          <View style={[
            styles.imageContainer,
            // Removed background color as per user feedback
            { backgroundColor: 'transparent' }
          ]}>
            {iconImage ? (
              <Image
                source={iconImage}
                style={[styles.serviceImage, isComingSoon && { opacity: 0.5 }]}
                resizeMode="contain" // Contain to show full PNG without cropping
              />
            ) : (
              <ServiceIcon size={40} color={COLORS.primary} />
            )}
          </View>

          {/* Title */}
          <Text
            style={[
              styles.title,
              { color: colors.text },
              isComingSoon && { color: colors.textTertiary }
            ]}
            numberOfLines={2}
          >
            {title}
          </Text>

          {/* Price Tag (New, clean look) */}
          {!isComingSoon && (
            <Text style={[styles.priceTag, { color: colors.textSecondary }]}>
              {price}
            </Text>
          )}

          {/* Badges - Top Right Stack */}
          <View style={styles.badgesContainer}>
            {isNew && !isComingSoon && (
              <View style={styles.badgeWrapper}>
                <Badge variant="new" />
              </View>
            )}

            {popular && !isComingSoon && !isNew && (
              <View style={styles.badgeWrapper}>
                <Badge variant="popular" />
              </View>
            )}

            {isComingSoon && (
              <View style={styles.badgeWrapper}>
                <Badge variant="coming-soon" />
              </View>
            )}
          </View>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  glassCard: {
    height: 160,
    borderRadius: 24,
    borderWidth: 0,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    // Very subtle shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  comingSoonContainer: {
    opacity: 0.8,
  },
  imageContainer: {
    width: 56,
    height: 56,
    borderRadius: 18,
    marginBottom: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  serviceImage: {
    width: '100%',
    height: '100%',
    borderRadius: 18,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
    lineHeight: 18,
  },
  priceTag: {
    fontSize: 11,
    fontWeight: '500',
    opacity: 0.8,
  },
  badgesContainer: {
    position: 'absolute',
    top: 8,
    right: 8,
    alignItems: 'flex-end',
    gap: 4,
  },
  badgeWrapper: {},
  partnerCountBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  partnerCountText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFF',
  },
  // Unused but kept to prevent breakages if refs exist
  gradientOverlay: { display: 'none' },
  cardContent: { display: 'none' },
});
