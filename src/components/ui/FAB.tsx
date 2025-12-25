import React, { useRef, useEffect } from 'react';
import { StyleSheet, Text, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS, SPACING } from '../../utils/theme';
import { AnimatedTouchable } from './AnimatedTouchable';

interface FABProps {
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  label?: string;
  position?: 'bottom-right' | 'bottom-center' | 'bottom-left';
  color?: string;
  size?: 'small' | 'medium' | 'large';
}

/**
 * Floating Action Button with entrance animation
 */
export const FAB: React.FC<FABProps> = ({
  icon,
  onPress,
  label,
  position = 'bottom-right',
  color = COLORS.primary,
  size = 'medium',
}) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(100)).current;

  useEffect(() => {
    // Entrance animation
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 100,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 100,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const sizes = {
    small: { width: 48, height: 48, iconSize: 20 },
    medium: { width: 56, height: 56, iconSize: 24 },
    large: { width: 64, height: 64, iconSize: 28 },
  };

  const positionStyles = {
    'bottom-right': { bottom: 80, right: 20 },
    'bottom-center': { bottom: 80, alignSelf: 'center' as const },
    'bottom-left': { bottom: 80, left: 20 },
  };

  const currentSize = sizes[size];

  return (
    <Animated.View
      style={[
        styles.container,
        positionStyles[position],
        {
          transform: [{ scale: scaleAnim }, { translateY: slideAnim }],
        },
      ]}
    >
      <AnimatedTouchable
        onPress={onPress}
        style={[
          styles.fab,
          {
            backgroundColor: color,
            width: currentSize.width,
            height: currentSize.height,
            borderRadius: currentSize.width / 2,
          },
        ]}
        hapticFeedback="medium"
        scaleValue={0.9}
      >
        <Ionicons name={icon} size={currentSize.iconSize} color="#FFF" />
        {label && <Text style={styles.label}>{label}</Text>}
      </AnimatedTouchable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    zIndex: 1000,
  },
  fab: {
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.primary,
    elevation: 8,
  },
  label: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
});
