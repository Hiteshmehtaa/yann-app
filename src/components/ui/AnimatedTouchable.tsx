import React, { useRef } from 'react';
import { TouchableOpacity, Animated, ViewStyle, StyleProp } from 'react-native';
import { haptics } from '../../utils/haptics';

interface AnimatedTouchableProps {
  children: React.ReactNode;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  hapticFeedback?: 'light' | 'medium' | 'heavy' | 'none';
  scaleValue?: number;
  disabled?: boolean;
  activeOpacity?: number;
}

/**
 * Enhanced Touchable component with spring animation and haptic feedback
 * Provides premium feel for all interactive elements
 */
export const AnimatedTouchable: React.FC<AnimatedTouchableProps> = ({
  children,
  onPress,
  style,
  hapticFeedback = 'light',
  scaleValue = 0.95,
  disabled = false,
  activeOpacity = 1,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: scaleValue,
      useNativeDriver: true,
      tension: 300,
      friction: 10,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 300,
      friction: 10,
    }).start();
  };

  const handlePress = () => {
    if (hapticFeedback !== 'none') {
      haptics[hapticFeedback]();
    }
    onPress();
  };

  return (
    <TouchableOpacity
      activeOpacity={activeOpacity}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      disabled={disabled}
      style={style}
    >
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        {children}
      </Animated.View>
    </TouchableOpacity>
  );
};
