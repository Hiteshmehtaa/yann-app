import React from 'react';
import { View, StyleSheet, ViewStyle, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withSpring,
  interpolate 
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  intensity?: number;
  tint?: 'light' | 'dark' | 'default';
  borderRadius?: number;
  enableTilt?: boolean;
  glowColor?: string;
}

/**
 * GlassCard - Frosted glass effect card with optional 3D tilt
 * 
 * Features:
 * - Glassmorphism blur effect
 * - Subtle gradient border
 * - Optional 3D parallax tilt on touch
 * - Glow effect option
 */
export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  style,
  intensity = 50,
  tint = 'light',
  borderRadius = 20,
  enableTilt = false,
  glowColor,
}) => {
  const rotateX = useSharedValue(0);
  const rotateY = useSharedValue(0);
  const scale = useSharedValue(1);

  const gesture = Gesture.Pan()
    .onBegin(() => {
      scale.value = withSpring(1.02);
    })
    .onUpdate((event) => {
      if (enableTilt) {
        rotateX.value = interpolate(event.translationY, [-100, 100], [10, -10]);
        rotateY.value = interpolate(event.translationX, [-100, 100], [-10, 10]);
      }
    })
    .onEnd(() => {
      rotateX.value = withSpring(0);
      rotateY.value = withSpring(0);
      scale.value = withSpring(1);
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 1000 },
      { rotateX: `${rotateX.value}deg` },
      { rotateY: `${rotateY.value}deg` },
      { scale: scale.value },
    ],
  }));

  const content = (
    <Animated.View style={[styles.container, { borderRadius }, animatedStyle, style]}>
      {/* Gradient border */}
      <LinearGradient
        colors={['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.gradientBorder, { borderRadius }]}
      />
      
      {/* Glass background */}
      {Platform.OS === 'ios' ? (
        <BlurView
          intensity={intensity}
          tint={tint}
          style={[styles.blurView, { borderRadius }]}
        >
          <View style={styles.content}>{children}</View>
        </BlurView>
      ) : (
        // Android fallback
        <View style={[styles.androidGlass, { borderRadius }]}>
          <View style={styles.content}>{children}</View>
        </View>
      )}
      
      {/* Optional glow */}
      {glowColor && (
        <View style={[styles.glow, { backgroundColor: glowColor, borderRadius }]} />
      )}
    </Animated.View>
  );

  if (enableTilt) {
    return <GestureDetector gesture={gesture}>{content}</GestureDetector>;
  }

  return content;
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    position: 'relative',
  },
  gradientBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    padding: 1,
  },
  blurView: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  androidGlass: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  content: {
    flex: 1,
  },
  glow: {
    position: 'absolute',
    top: -20,
    left: -20,
    right: -20,
    bottom: -20,
    opacity: 0.15,
    zIndex: -1,
  },
});

export default GlassCard;
