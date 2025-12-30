import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { SPACING, TYPOGRAPHY, RADIUS, SHADOWS } from '../../utils/theme';

interface VerifiedBadgeProps {
  isVerified: boolean;
  size?: 'small' | 'medium' | 'large';
  onPress?: () => void;
  showLabel?: boolean;
  style?: any;
}

const SIZE_CONFIG = {
  small: {
    badgeSize: 20,
    iconSize: 12,
    fontSize: 10,
    padding: 4,
  },
  medium: {
    badgeSize: 28,
    iconSize: 16,
    fontSize: 12,
    padding: 6,
  },
  large: {
    badgeSize: 36,
    iconSize: 20,
    fontSize: 14,
    padding: 8,
  },
};

export const VerifiedBadge: React.FC<VerifiedBadgeProps> = ({
  isVerified,
  size = 'medium',
  onPress,
  showLabel = true,
  style,
}) => {
  const { colors } = useTheme();
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0)).current;

  const config = SIZE_CONFIG[size];

  useEffect(() => {
    if (isVerified) {
      // Entry animation
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 5,
        tension: 100,
        useNativeDriver: true,
      }).start();

      // Continuous pulse animation
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      );

      // Continuous shimmer animation
      const shimmerAnimation = Animated.loop(
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 2500,
          useNativeDriver: true,
        })
      );

      pulseAnimation.start();
      shimmerAnimation.start();

      return () => {
        pulseAnimation.stop();
        shimmerAnimation.stop();
      };
    } else {
      scaleAnim.setValue(1);
    }
  }, [isVerified]);

  const shimmerTranslate = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-100, 100],
  });

  const BadgeContent = () => (
    <View style={[styles.badgeContent, style]}>
      {isVerified ? (
        <Animated.View style={[styles.verifiedBadge, { transform: [{ scale: scaleAnim }] }]}>
          {/* Glow effect */}
          <Animated.View
            style={[
              styles.glowEffect,
              {
                width: config.badgeSize + 16,
                height: config.badgeSize + 16,
                borderRadius: (config.badgeSize + 16) / 2,
                transform: [{ scale: pulseAnim }],
              },
            ]}
          />
          
          {/* Badge */}
          <LinearGradient
            colors={['#10B981', '#059669']}
            style={[
              styles.badgeIcon,
              {
                width: config.badgeSize,
                height: config.badgeSize,
                borderRadius: config.badgeSize / 2,
              },
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            {/* Shimmer overlay */}
            <Animated.View
              style={[
                styles.shimmerOverlay,
                {
                  transform: [{ translateX: shimmerTranslate }],
                },
              ]}
            />
            <Ionicons name="checkmark" size={config.iconSize} color="#FFFFFF" />
          </LinearGradient>

          {showLabel && (
            <Text style={[styles.verifiedText, { fontSize: config.fontSize, color: '#10B981' }]}>
              Verified
            </Text>
          )}
        </Animated.View>
      ) : (
        <View style={styles.unverifiedBadge}>
          <View
            style={[
              styles.badgeIcon,
              styles.unverifiedIcon,
              {
                width: config.badgeSize,
                height: config.badgeSize,
                borderRadius: config.badgeSize / 2,
                backgroundColor: colors.gray100,
              },
            ]}
          >
            <Ionicons name="shield-outline" size={config.iconSize} color={colors.textSecondary} />
          </View>
          
          {showLabel && (
            <Text style={[styles.unverifiedText, { fontSize: config.fontSize, color: colors.textSecondary }]}>
              Get Verified
            </Text>
          )}
        </View>
      )}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        <BadgeContent />
      </TouchableOpacity>
    );
  }

  return <BadgeContent />;
};

// Inline verified badge (just the icon, for use in profile headers)
interface InlineVerifiedBadgeProps {
  isVerified: boolean;
  size?: number;
}

export const InlineVerifiedBadge: React.FC<InlineVerifiedBadgeProps> = ({
  isVerified,
  size = 18,
}) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isVerified) {
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 1200,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1200,
            useNativeDriver: true,
          }),
        ])
      );
      pulseAnimation.start();
      return () => pulseAnimation.stop();
    }
  }, [isVerified]);

  if (!isVerified) return null;

  return (
    <View style={styles.inlineContainer}>
      <Animated.View
        style={[
          styles.inlineGlow,
          {
            width: size + 8,
            height: size + 8,
            borderRadius: (size + 8) / 2,
            transform: [{ scale: pulseAnim }],
          },
        ]}
      />
      <LinearGradient
        colors={['#10B981', '#059669']}
        style={[
          styles.inlineBadge,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
          },
        ]}
      >
        <Ionicons name="checkmark" size={size * 0.6} color="#FFFFFF" />
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  badgeContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  unverifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  badgeIcon: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    ...SHADOWS.sm,
  },
  unverifiedIcon: {
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.08)',
    borderStyle: 'dashed',
  },
  verifiedText: {
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  unverifiedText: {
    fontWeight: '600',
  },
  glowEffect: {
    position: 'absolute',
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
  },
  shimmerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    width: 40,
    transform: [{ skewX: '-20deg' }],
  },
  // Inline badge styles
  inlineContainer: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  inlineGlow: {
    position: 'absolute',
    backgroundColor: 'rgba(16, 185, 129, 0.25)',
  },
  inlineBadge: {
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.sm,
  },
});

export default VerifiedBadge;
