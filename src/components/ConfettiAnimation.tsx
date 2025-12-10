import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ConfettiPieceProps {
  color: string;
  delay: number;
  startX: number;
}

const ConfettiPiece: React.FC<ConfettiPieceProps> = ({ color, delay, startX }) => {
  const translateY = useRef(new Animated.Value(-50)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const rotate = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const randomDuration = 2000 + Math.random() * 2000;
    const randomSwing = (Math.random() - 0.5) * 200;
    const randomRotation = Math.random() * 720;

    Animated.parallel([
      Animated.timing(translateY, {
        toValue: SCREEN_HEIGHT + 100,
        duration: randomDuration,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(translateX, {
        toValue: randomSwing,
        duration: randomDuration,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(rotate, {
        toValue: randomRotation,
        duration: randomDuration,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: randomDuration,
        delay: delay + randomDuration * 0.7,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const spin = rotate.interpolate({
    inputRange: [0, 360],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View
      style={[
        styles.confetti,
        {
          backgroundColor: color,
          left: startX,
          transform: [
            { translateY },
            { translateX },
            { rotate: spin },
          ],
          opacity,
        },
      ]}
    />
  );
};

interface ConfettiAnimationProps {
  active?: boolean;
  count?: number;
  colors?: string[];
}

export const ConfettiAnimation: React.FC<ConfettiAnimationProps> = ({
  active = true,
  count = 50,
  colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2'],
}) => {
  if (!active) return null;

  const confettiPieces = Array.from({ length: count }, (_, index) => {
    const color = colors[Math.floor(Math.random() * colors.length)];
    const delay = Math.random() * 500;
    const startX = Math.random() * SCREEN_WIDTH;

    return (
      <ConfettiPiece
        key={`confetti-${index}`}
        color={color}
        delay={delay}
        startX={startX}
      />
    );
  });

  return (
    <View style={styles.container} pointerEvents="none">
      {confettiPieces}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
  },
  confetti: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 2,
  },
});
