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

  const handlePressIn = () => {
    if (!isComingSoon) {
      haptics.light();
      Animated.spring(scaleAnim, {
        toValue: 0.98,
        tension: 100,
        friction: 10,
        useNativeDriver: true,
      }).start();
    }
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 100,
      friction: 10,
      useNativeDriver: true,
    }).start();
  };

  const handlePress = () => {
    if (!isComingSoon) {
      haptics.medium();
      onPress();
    }
  };

  // Service-specific image scaling
  const getImageScale = () => {
    const titleLower = title.toLowerCase();
    if (titleLower.includes('mahamrityunjay') || titleLower.includes('satyanarayan')) {
      return 0.85; // Zoom out
    }
    if (titleLower.includes('lakshmi') || titleLower.includes('ganesh') || titleLower.includes('vishnu')) {
      return 1.15; // Zoom in
    }
    return 1; // Default
  };

  const imageScale = getImageScale();

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
        <View style={[
          styles.card,
          {
            backgroundColor: colors.cardBg,
            borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
            opacity: isComingSoon ? 0.6 : 1,
          }
        ]}>
          {/* Image Section - Centered */}
          <View style={styles.imageSection}>
            {iconImage ? (
              <Image
                source={iconImage}
                style={[styles.serviceImage, { transform: [{ scale: imageScale }] }]}
                resizeMode="contain"
              />
            ) : icon && typeof icon === 'string' && icon.length < 5 ? (
              <Text style={styles.emojiIcon}>{icon}</Text>
            ) : (
              <ServiceIcon
                size={48}
                color={COLORS.primary}
              />
            )}
          </View>

          {/* Title - Below Image */}
          <View style={styles.titleSection}>
            <Text
              style={[styles.serviceTitle, { color: colors.text }]}
              numberOfLines={2}
            >
              {title}
            </Text>
          </View>

          {/* Status Tag */}
          {isNew && !isComingSoon && (
            <View style={styles.newBadge}>
              <Text style={styles.newText}>NEW</Text>
            </View>
          )}

          {/* Active Partners Count */}
          {!isComingSoon && partnerCount > 0 && (
            <View style={[styles.partnerBadge, { backgroundColor: isDark ? 'rgba(0, 0, 0, 0.4)' : 'rgba(255, 255, 255, 0.85)' }]}>
              <View style={[styles.activeDot, { backgroundColor: COLORS.success || '#10B981' }]} />
              <Text style={[styles.partnerText, { color: colors.textSecondary }]}>
                {partnerCount} {partnerCount === 1 ? 'Partner' : 'Partners'}
              </Text>
            </View>
          )}

          {/* Coming Soon Overlay */}
          {isComingSoon && (
            <View style={styles.comingSoonOverlay}>
              <View style={[styles.comingSoonBadge, {
                backgroundColor: isDark ? 'rgba(156, 163, 175, 0.9)' : 'rgba(156, 163, 175, 0.85)'
              }]}>
                <Text style={styles.comingSoonText}>Coming Soon</Text>
              </View>
            </View>
          )}
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  card: {
    height: 160,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  imageSection: {
    height: 110,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 16,
  },
  serviceImage: {
    width: 85,
    height: 85,
  },
  emojiIcon: {
    fontSize: 56,
  },
  titleSection: {
    flex: 1,
    paddingHorizontal: 12,
    paddingBottom: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  serviceTitle: {
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 17,
    letterSpacing: -0.2,
    textAlign: 'center',
  },
  newBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  newText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  comingSoonOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  comingSoonBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  comingSoonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  partnerBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  partnerText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
