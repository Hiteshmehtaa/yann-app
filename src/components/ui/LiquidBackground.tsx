import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Reanimated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withRepeat,
  withTiming,
  Easing,
  interpolate,
} from 'react-native-reanimated';

interface LiquidBackgroundProps {
  mode?: 'light' | 'dark';
}

export const LiquidBackground: React.FC<LiquidBackgroundProps> = ({ mode = 'light' }) => {
  return (
    <View style={StyleSheet.absoluteFill}>
      <View style={[StyleSheet.absoluteFill, { backgroundColor: mode === 'light' ? '#F6F8FC' : '#0F172A' }]} />
      <RisingBubbles mode={mode} />
    </View>
  );
};

const RisingBubbles = ({ mode }: { mode: 'light' | 'dark' }) => {
  const { height } = Dimensions.get('window');
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {[...Array(10)].map((_, i) => (
        <Bubble key={i} delay={i * 800} height={height} mode={mode} />
      ))}
    </View>
  );
};

const Bubble = ({ delay, height, mode }: { delay: number; height: number; mode: 'light' | 'dark' }) => {
  // Use a fixed value based on delay to keep them scattered but unmoving
  const anim = useSharedValue((delay % 10000) / 10000);
  
  // High-energy colors for both modes, but with different opacity/focus
  const color = Math.random() > 0.5 ? '#3B82F6' : '#FF8A3D';

  // Animation removed for static mode

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateY: interpolate(anim.value, [0, 1], [height * 1.1, -200]) },
        { scale: interpolate(anim.value, [0, 0.5, 1], [0.8, 1.2, 1]) },
      ],
      opacity: interpolate(anim.value, [0, 0.2, 0.8, 1], [0, mode === 'light' ? 0.12 : 0.08, mode === 'light' ? 0.12 : 0.08, 0]),
    };
  });

  const size = 60 + Math.random() * 100;
  const left = Math.random() * 100;

  return (
    <Reanimated.View
      style={[
        {
          position: 'absolute',
          left: `${left}%`,
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
        },
        animatedStyle,
      ]}
    />
  );
};
