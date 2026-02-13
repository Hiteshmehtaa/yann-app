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
        toValue: 0.97,
        tension: 60,
        friction: 8,
        useNativeDriver: true,
      }).start();
    }
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 60,
      friction: 7,
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
      style={[styles.container, style]}
      disabled={isComingSoon}
    >
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        {/* Gradient Border Container */}
        <LinearGradient
          colors={isDark 
            ? ['rgba(59, 130, 246, 0.3)', 'rgba(139, 92, 246, 0.2)', 'rgba(59, 130, 246, 0.1)']
            : ['rgba(59, 130, 246, 0.15)', 'rgba(139, 92, 246, 0.1)', 'rgba(236, 72, 153, 0.08)']}
          style={[styles.gradientBorder, { opacity: isComingSoon ? 0.4 : 1 }]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {/* Inner Card with Background Gradient */}
          <LinearGradient
            colors={isDark 
              ? ['#1E1E2E', '#1A1A28']
              : ['#FFFFFF', '#FAFBFF']}
            style={styles.premiumCard}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
          >
            {/* Ambient Glow Decoration */}
            <View style={styles.ambientGlow}>
              <LinearGradient
                colors={isDark
                  ? ['rgba(59, 130, 246, 0.15)', 'transparent']
                  : ['rgba(59, 130, 246, 0.08)', 'transparent']}
                style={styles.glowGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0.5 }}
              />
            </View>

            {/* Icon Feature Zone with Multi-Layer Design */}
            <View style={styles.featureZone}>
              {/* Outer Glow Ring */}
              <View style={[styles.iconOuterRing, { 
                backgroundColor: isDark ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.06)' 
              }]}>
                <LinearGradient
                  colors={isDark 
                    ? ['rgba(59, 130, 246, 0.25)', 'rgba(139, 92, 246, 0.15)']
                    : ['#EEF2FF', '#E0E7FF']}
                  style={styles.iconContainer}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  {/* Icon Highlight Layer */}
                  <View style={styles.iconHighlight} />
                  
                  {iconImage ? (
                    <Image
                      source={iconImage}
                      style={styles.serviceIcon}
                      resizeMode="contain"
                    />
                  ) : icon && typeof icon === 'string' && icon.length < 5 ? (
                    <Text style={styles.emojiIcon}>{icon}</Text>
                  ) : (
                    <ServiceIcon
                      size={38}
                      color={COLORS.primary}
                    />
                  )}
                </LinearGradient>
              </View>
            </View>

            {/* Content Section */}
            <View style={styles.contentSection}>
              <Text
                style={[
                  styles.serviceTitle,
                  { color: colors.text },
                ]}
                numberOfLines={2}
              >
                {title}
              </Text>

              {/* Price or Status with Enhanced Design */}
              {isComingSoon ? (
                <LinearGradient
                  colors={isDark ? ['#2A2A3E', '#25273A'] : ['#F3F4F6', '#E5E7EB']}
                  style={styles.statusPill}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={[styles.statusText, { color: colors.textSecondary }]}>
                    Coming Soon
                  </Text>
                </LinearGradient>
              ) : (
                <View style={styles.priceContainer}>
                  <LinearGradient
                    colors={['#3B82F6', '#8B5CF6']}
                    style={styles.priceUnderline}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  />
                  <Text style={styles.servicePrice}>
                    {price}
                  </Text>
                </View>
              )}
            </View>

            {/* Enhanced Bottom Meta: Partner Count */}
            {showCount && !isComingSoon && (
              <View style={styles.metaBadge}>
                <View style={[styles.badgeShadow, { 
                  shadowColor: gradientColors[0],
                }]} />
                <LinearGradient
                  colors={gradientColors}
                  style={styles.badgeGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <View style={styles.badgeShine} />
                  <View style={styles.badgeContent}>
                    <View style={styles.badgeDot} />
                    <Text style={styles.badgeCount}>{partnerCount}</Text>
                  </View>
                </LinearGradient>
              </View>
            )}

            {/* Enhanced Top Right: Status Tags */}
            {(isNew || popular) && !isComingSoon && (
              <View style={styles.statusTag}>
                {isNew ? (
                  <View style={styles.tagContainer}>
                    <View style={[styles.tagGlow, { backgroundColor: '#10B981' }]} />
                    <LinearGradient
                      colors={['#10B981', '#059669']}
                      style={styles.tagGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                    >
                      <View style={styles.tagShine} />
                      <Text style={styles.tagText}>NEW</Text>
                    </LinearGradient>
                  </View>
                ) : popular ? (
                  <View style={styles.tagContainer}>
                    <View style={[styles.tagGlow, { backgroundColor: '#F59E0B' }]} />
                    <LinearGradient
                      colors={['#F59E0B', '#D97706']}
                      style={styles.tagGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                    >
                      <View style={styles.tagShine} />
                      <Text style={styles.tagText}>POPULAR</Text>
                    </LinearGradient>
                  </View>
                ) : null}
              </View>
            )}
          </LinearGradient>
        </LinearGradient>
      </Animated.View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradientBorder: {
    borderRadius: 22,
    padding: 1.5,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  premiumCard: {
    height: 200,
    borderRadius: 20.5,
    padding: 20,
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  ambientGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 120,
    opacity: 0.6,
  },
  glowGradient: {
    flex: 1,
    borderTopLeftRadius: 20.5,
    borderTopRightRadius: 20.5,
  },
  featureZone: {
    marginBottom: 16,
    zIndex: 1,
  },
  iconOuterRing: {
    width: 80,
    height: 80,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  iconHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
  },
  serviceIcon: {
    width: 42,
    height: 42,
    zIndex: 1,
  },
  emojiIcon: {
    fontSize: 38,
    zIndex: 1,
  },
  contentSection: {
    flex: 1,
    justifyContent: 'flex-end',
    zIndex: 1,
  },
  serviceTitle: {
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 20,
    letterSpacing: -0.3,
    marginBottom: 10,
  },
  priceContainer: {
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  priceUnderline: {
    position: 'absolute',
    bottom: -2,
    left: 0,
    right: 0,
    height: 2,
    borderRadius: 1,
    opacity: 0.6,
  },
  servicePrice: {
    fontSize: 16,
    fontWeight: '800',
    color: '#3B82F6',
    letterSpacing: -0.2,
  },
  statusPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 12,
    marginTop: 4,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
  },
  metaBadge: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    zIndex: 2,
  },
  badgeShadow: {
    position: 'absolute',
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    borderRadius: 18,
    opacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 5,
  },
  badgeGradient: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
    overflow: 'hidden',
  },
  badgeShine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  badgeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  badgeDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: 'rgba(255,255,255,0.95)',
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 3,
  },
  badgeCount: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  statusTag: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 2,
  },
  tagContainer: {
    position: 'relative',
  },
  tagGlow: {
    position: 'absolute',
    top: -3,
    left: -3,
    right: -3,
    bottom: -3,
    borderRadius: 15,
    opacity: 0.25,
  },
  tagGradient: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    overflow: 'hidden',
  },
  tagShine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '40%',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  tagText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  // Unused but kept to prevent breakages
  gradientOverlay: { display: 'none' },
  cardContent: { display: 'none' },
});
