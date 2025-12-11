import React, { useRef, useEffect } from 'react';
import { TouchableOpacity, Animated, StyleSheet, TouchableOpacityProps, ViewStyle } from 'react-native';

interface AnimatedCardProps extends TouchableOpacityProps {
  children: React.ReactNode;
  isSelected?: boolean;
  glowColor?: string;
}

export const AnimatedCard: React.FC<AnimatedCardProps> = ({
  children,
  isSelected = false,
  glowColor = '#2196F3',
  style,
  onPress,
  ...props
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(glowAnim, {
      toValue: isSelected ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [isSelected]);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
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

  const handlePress = (e: any) => {
    onPress?.(e);
  };

  const borderColor = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(0, 0, 0, 0.1)', glowColor],
  });

  const shadowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.1, 0.3],
  });

  return (
    <TouchableOpacity
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      activeOpacity={0.9}
      {...props}
    >
      <Animated.View
        style={[
          style,
          {
            transform: [{ scale: scaleAnim }],
            borderWidth: 2,
            borderColor: borderColor,
            shadowColor: glowColor,
            shadowOpacity: shadowOpacity,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 2 },
            elevation: isSelected ? 8 : 4,
          },
        ]}
      >
        {children}
      </Animated.View>
    </TouchableOpacity>
  );
};
