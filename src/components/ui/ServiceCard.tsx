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

export const ServiceCard = React.memo<ServiceCardProps>(({
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
      style={[styles.container, style]} // Removed opacity from container to keep text sharp
      disabled={isComingSoon}
    >
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <View style={[
          styles.glassCard,
          {
            backgroundColor: isComingSoon
              ? (isDark ? 'rgba(50,50,50,0.3)' : 'rgba(200,200,200,0.3)') // Gray for Coming Soon
              : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.6)'),
            borderColor: isComingSoon
              ? (isDark ? 'rgba(100,100,100,0.2)' : 'rgba(150,150,150,0.2)')
              : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.4)'),
            borderWidth: 1,
            // Grayscale effect hack for content inside? No, handled by tinting children
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
              <Text style={styles.partnerCountText}>{partnerCount} active</Text>
            </LinearGradient>
          )}

          {/* Image/Icon Container */}
          <View style={[
            styles.imageContainer,
            { backgroundColor: 'transparent' }
          ]}>
            {iconImage ? (
              <Image
                source={iconImage}
                style={[
                  styles.serviceImage,
                  isComingSoon && { opacity: 0.3, tintColor: isDark ? '#888' : '#bbb' } // Gray out image
                ]}
                resizeMode="contain"
              />
            ) : (
              <ServiceIcon
                size={40}
                color={isComingSoon ? COLORS.textTertiary : COLORS.primary}
              />
            )}
          </View>

          {/* Title */}
          <Text
            style={[
              styles.title,
              { color: isComingSoon ? colors.textTertiary : colors.text },
            ]}
            numberOfLines={2}
          >
            {title}
          </Text>

          {/* Price Tag OR Coming Soon Text */}
          {isComingSoon ? (
            <Text style={[styles.comingSoonText, { color: colors.textTertiary }]}>
              COMING SOON
            </Text>
          ) : (
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

            {/* Removed the 'Coming Soon' badge since we have text now, or keep it as minimal dot? Removed for clean look */}
          </View>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
});

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
  },
  comingSoonContainer: {
    // No opacity change here, handled in glassCard
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
  comingSoonText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginTop: 4,
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
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  partnerCountText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFF',
  },
  // Unused but kept to prevent breakages if refs exist
  gradientOverlay: { display: 'none' },
  cardContent: { display: 'none' },
});
