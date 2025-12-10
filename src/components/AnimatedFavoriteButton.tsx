import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { HeartAnimation } from './animations';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../utils/theme';

interface AnimatedFavoriteButtonProps {
  isFavorite: boolean;
  onToggle: () => void;
  size?: number;
}

export const AnimatedFavoriteButton: React.FC<AnimatedFavoriteButtonProps> = ({
  isFavorite,
  onToggle,
  size = 40,
}) => {
  const [showAnimation, setShowAnimation] = useState(false);
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    // Show animation when favoriting
    if (!isFavorite) {
      setShowAnimation(true);
      setTimeout(() => setShowAnimation(false), 1500);
    }

    // Scale animation
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.8,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 3,
        useNativeDriver: true,
      }),
    ]).start();

    onToggle();
  };

  return (
    <Pressable onPress={handlePress} style={styles.container}>
      <Animated.View
        style={[
          styles.button,
          {
            width: size,
            height: size,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {showAnimation ? (
          <View style={styles.animationContainer}>
            <HeartAnimation size={size * 1.5} />
          </View>
        ) : (
          <Ionicons
            name={isFavorite ? 'heart' : 'heart-outline'}
            size={size * 0.55}
            color={isFavorite ? COLORS.error : COLORS.textSecondary}
          />
        )}
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  button: {
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  animationContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -20 }, { translateY: -20 }],
  },
});
