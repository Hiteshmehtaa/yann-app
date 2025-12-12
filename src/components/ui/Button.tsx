import React, { useRef } from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle, Animated, View } from 'react-native';
import LottieView from 'lottie-react-native';
import { COLORS, SPACING, RADIUS, SHADOWS, TYPOGRAPHY } from '../../utils/theme';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';
type ButtonSize = 'small' | 'medium' | 'large';

type ButtonProps = {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
};

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'large',
  disabled = false,
  loading = false,
  style,
  textStyle,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.96,
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

  const containerStyles = [
    styles.base,
    styles[variant],
    styles[`size_${size}`],
    disabled && styles.disabled,
    style,
  ];

  const textStyles = [
    styles.text,
    styles[`text_${variant}`],
    styles[`textSize_${size}`],
    disabled && styles.textDisabled,
    textStyle,
  ];

  return (
    <TouchableOpacity
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={1}
    >
      <Animated.View style={[containerStyles, { transform: [{ scale: scaleAnim }] }]}>
        {loading ? (
          <View style={{ width: 24, height: 24, justifyContent: 'center', alignItems: 'center' }}>
            <LottieView
              source={require('../../../assets/lottie/loading.json')}
              autoPlay
              loop
              style={{ width: 30, height: 30 }}
            />
          </View>
        ) : (
          <Text style={textStyles}>{title}</Text>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  // Base Styles
  base: {
    borderRadius: RADIUS.medium,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  text: {
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  
  // Size Variants
  size_small: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    minHeight: 36,
  },
  size_medium: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    minHeight: 44,
  },
  size_large: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    minHeight: 52,
  },
  
  textSize_small: {
    fontSize: TYPOGRAPHY.size.sm,
  },
  textSize_medium: {
    fontSize: TYPOGRAPHY.size.md,
  },
  textSize_large: {
    fontSize: TYPOGRAPHY.size.lg,
  },
  
  // Button Variants
  primary: {
    backgroundColor: COLORS.primary,
    ...SHADOWS.md,
  },
  text_primary: {
    color: COLORS.white,
  },
  
  secondary: {
    backgroundColor: COLORS.accentOrange,
    ...SHADOWS.md,
  },
  text_secondary: {
    color: COLORS.white,
  },
  
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  text_outline: {
    color: COLORS.text,
  },
  
  ghost: {
    backgroundColor: 'transparent',
  },
  text_ghost: {
    color: COLORS.primary,
  },
  
  // Disabled State
  disabled: {
    backgroundColor: COLORS.border,
    opacity: 0.5,
  },
  textDisabled: {
    color: COLORS.textTertiary,
  },
});
