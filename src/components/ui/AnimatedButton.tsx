import React, { useRef } from 'react';
import { TouchableOpacity, Animated, StyleProp, ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';

interface AnimatedButtonProps {
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
  disabled?: boolean;
  scaleMin?: number;
  hapticFeedback?: boolean;
}

export const AnimatedButton: React.FC<AnimatedButtonProps> = ({ 
  onPress, 
  style, 
  children, 
  disabled,
  scaleMin = 0.95,
  hapticFeedback = true
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (hapticFeedback) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    Animated.spring(scaleAnim, {
      toValue: scaleMin,
      useNativeDriver: true,
      friction: 7,
      tension: 40
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      friction: 7,
      tension: 40
    }).start();
  };

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
      disabled={disabled}
      style={style}
    >
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        {children}
      </Animated.View>
    </TouchableOpacity>
  );
};
