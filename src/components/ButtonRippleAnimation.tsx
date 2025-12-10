import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Easing,
} from 'react-native';
import { RiveAnimation } from './animations';

interface ButtonRippleAnimationProps {
  size?: number;
  color?: string;
  duration?: number;
}

export const ButtonRippleAnimation: React.FC<ButtonRippleAnimationProps> = ({
  size = 100,
  color = '#3B82F6',
  duration = 2000,
}) => {
  const scaleAnim1 = useRef(new Animated.Value(0)).current;
  const scaleAnim2 = useRef(new Animated.Value(0)).current;
  const opacityAnim1 = useRef(new Animated.Value(0.6)).current;
  const opacityAnim2 = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    const createRipple = (scaleAnim: Animated.Value, opacityAnim: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.parallel([
          Animated.sequence([
            Animated.delay(delay),
            Animated.timing(scaleAnim, {
              toValue: 1,
              duration: duration,
              easing: Easing.out(Easing.ease),
              useNativeDriver: true,
            }),
          ]),
          Animated.sequence([
            Animated.delay(delay),
            Animated.timing(opacityAnim, {
              toValue: 0,
              duration: duration,
              easing: Easing.out(Easing.ease),
              useNativeDriver: true,
            }),
          ]),
        ])
      );
    };

    const ripple1 = createRipple(scaleAnim1, opacityAnim1, 0);
    const ripple2 = createRipple(scaleAnim2, opacityAnim2, duration / 2);

    ripple1.start();
    ripple2.start();

    return () => {
      ripple1.stop();
      ripple2.stop();
    };
  }, []);

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Animated.View
        style={[
          styles.ripple,
          {
            width: size,
            height: size,
            borderColor: color,
            transform: [{ scale: scaleAnim1 }],
            opacity: opacityAnim1,
          },
        ]}
      />
      <Animated.View
        style={[
          styles.ripple,
          {
            width: size,
            height: size,
            borderColor: color,
            transform: [{ scale: scaleAnim2 }],
            opacity: opacityAnim2,
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ripple: {
    position: 'absolute',
    borderRadius: 1000,
    borderWidth: 2,
  },
});
