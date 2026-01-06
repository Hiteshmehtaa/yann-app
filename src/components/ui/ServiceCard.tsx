import React, { useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle, Image, ImageSourcePropType, Animated, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SPACING, RADIUS, SHADOWS } from '../../utils/theme';
import { ServiceIcon } from '../icons/ServiceIcon';
import { Badge } from './Badge';
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
  const glowAnim = useRef(new Animated.Value(0)).current;

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

  const handlePressIn = () => {
    if (!isComingSoon) {
      haptics.light();
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 0.95,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: false,
        }),
      ]).start();
    }
  };

  const handlePressOut = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(glowAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }),
    ]).start();
  };

  const handlePress = () => {
    if (!isComingSoon) {
      haptics.medium();
      onPress();
    }
  };

  const gradientColors = getGradient();
  const shadowColor = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(0,0,0,0.1)', gradientColors[0]],
  });

  return (
    <TouchableOpacity
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={1}
      style={[styles.container, isComingSoon && styles.comingSoonContainer, style]}
      disabled={isComingSoon}
    >
      <Animated.View style={[
        styles.card, 
        { 
          backgroundColor: isDark ? colors.cardBg : colors.cardBg,
          transform: [{ scale: scaleAnim }],
          borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.03)',
          borderWidth: 1,
        }
      ]}>
        {/* Subtle gradient overlay for dark mode */}
        {isDark && (
          <LinearGradient
            colors={['rgba(99,102,241,0.05)', 'rgba(168,85,247,0.02)', 'transparent']}
            style={styles.gradientOverlay}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
        )}

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

        {/* Image Container with Gradient Background */}
        <LinearGradient
          colors={isComingSoon ? ['#9CA3AF', '#6B7280'] : gradientColors}
          style={styles.imageContainer}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {iconImage ? (
            <Image 
              source={iconImage} 
              style={[styles.serviceImage, isComingSoon && { opacity: 0.5 }]} 
              resizeMode="cover"
            />
          ) : (
            <ServiceIcon size={36} color="#FFF" />
          )}
        </LinearGradient>

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
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  comingSoonContainer: {
    opacity: 0.7,
  },
  card: {
    borderRadius: 20,
    padding: SPACING.md,
    alignItems: 'center',
    height: 155,
    justifyContent: 'space-between',
    position: 'relative',
    overflow: 'hidden',
    // Modern shadow
    ...Platform.select({
      ios: {
        shadowColor: '#60A5FA',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  gradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 20,
  },
  imageContainer: {
    width: 64,
    height: 64,
    borderRadius: 18,
    marginBottom: SPACING.xs,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    // Subtle inner glow
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  serviceImage: {
    width: '100%',
    height: '100%',
    borderRadius: 18,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 17,
    marginTop: 6,
    marginBottom: 4,
    letterSpacing: 0.2,
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
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  partnerCountText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFF',
  },
});

