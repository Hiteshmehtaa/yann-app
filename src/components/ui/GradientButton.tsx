import React, { useEffect } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  withSpring,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

interface GradientButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  iconPosition?: 'left' | 'right';
  variant?: 'primary' | 'secondary' | 'success' | 'danger';
  size?: 'small' | 'medium' | 'large';
  style?: ViewStyle;
  textStyle?: TextStyle;
  animated?: boolean;
  fullWidth?: boolean;
}

const GRADIENT_PRESETS: Record<string, readonly [string, string]> = {
  primary: ['#667eea', '#764ba2'] as const,
  secondary: ['#2E59F3', '#4362FF'] as const,
  success: ['#11998e', '#38ef7d'] as const,
  danger: ['#eb3349', '#f45c43'] as const,
};

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);
const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

/**
 * GradientButton - Animated gradient CTA button
 * 
 * Features:
 * - Smooth gradient background with animation
 * - Scale effect on press
 * - Loading state with spinner
 * - Icon support
 * - Multiple variants and sizes
 */
export const GradientButton: React.FC<GradientButtonProps> = ({
  title,
  onPress,
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  variant = 'primary',
  size = 'medium',
  style,
  textStyle,
  animated = true,
  fullWidth = true,
}) => {
  const scale = useSharedValue(1);
  const gradientPosition = useSharedValue(0);

  // Animated gradient effect
  useEffect(() => {
    if (animated && !disabled) {
      gradientPosition.value = withRepeat(
        withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
    }
  }, [animated, disabled]);

  const handlePress = () => {
    if (!disabled && !loading) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onPress();
    }
  };

  const handlePressIn = () => {
    scale.value = withSpring(0.96);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  const animatedButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const animatedGradientStyle = useAnimatedStyle(() => ({
    opacity: interpolate(gradientPosition.value, [0, 0.5, 1], [1, 0.9, 1]),
  }));

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return { paddingVertical: 10, paddingHorizontal: 20 };
      case 'large':
        return { paddingVertical: 18, paddingHorizontal: 32 };
      default:
        return { paddingVertical: 14, paddingHorizontal: 28 };
    }
  };

  const getTextSize = () => {
    switch (size) {
      case 'small':
        return 14;
      case 'large':
        return 18;
      default:
        return 16;
    }
  };

  const gradientColors = GRADIENT_PRESETS[variant];

  return (
    <AnimatedTouchable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      activeOpacity={0.9}
      style={[
        animatedButtonStyle,
        fullWidth && styles.fullWidth,
        disabled && styles.disabled,
        style,
      ]}
    >
      <AnimatedLinearGradient
        colors={disabled ? ['#9CA3AF', '#6B7280'] : gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.gradient,
          getSizeStyles(),
          animatedGradientStyle,
        ]}
      >
        {loading ? (
          <ActivityIndicator color="#FFF" size="small" />
        ) : (
          <>
            {icon && iconPosition === 'left' && (
              <Ionicons
                name={icon}
                size={getTextSize() + 2}
                color="#FFF"
                style={styles.iconLeft}
              />
            )}
            <Text style={[styles.text, { fontSize: getTextSize() }, textStyle]}>
              {title}
            </Text>
            {icon && iconPosition === 'right' && (
              <Ionicons
                name={icon}
                size={getTextSize() + 2}
                color="#FFF"
                style={styles.iconRight}
              />
            )}
          </>
        )}
      </AnimatedLinearGradient>
    </AnimatedTouchable>
  );
};

const styles = StyleSheet.create({
  fullWidth: {
    width: '100%',
  },
  gradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  text: {
    color: '#FFFFFF',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  iconLeft: {
    marginRight: 8,
  },
  iconRight: {
    marginLeft: 8,
  },
  disabled: {
    opacity: 0.6,
  },
});

export default GradientButton;
