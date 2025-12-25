import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, ViewStyle, StyleProp } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, RADIUS } from '../../utils/theme';
import { useTheme } from '../../contexts/ThemeContext';

interface SkeletonLoaderProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
  variant?: 'rect' | 'circle' | 'text';
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  width = '100%',
  height = 20,
  borderRadius = RADIUS.small,
  style,
  variant = 'rect',
}) => {
  const { colors, isDark } = useTheme();
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  // Use dynamic colors
  const baseColor = isDark ? colors.gray100 : '#F3F4F6'; // gray100
  const highlightColor = isDark ? colors.gray200 : '#E5E7EB'; // gray200

  useEffect(() => {
    const shimmer = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    );
    shimmer.start();
    return () => shimmer.stop();
  }, []);

  const translateX = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-300, 300],
  });

  const getVariantStyle = () => {
    if (variant === 'circle') {
      return {
        width: height,
        height: height,
        borderRadius: height / 2,
      };
    }
    if (variant === 'text') {
      return {
        height: 12,
        borderRadius: 6,
      };
    }
    return {};
  };

  return (
    <View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
          backgroundColor: baseColor,
        },
        getVariantStyle(),
        style,
      ]}
    >
      <Animated.View
        style={[
          styles.shimmer,
          {
            transform: [{ translateX }],
          },
        ]}
      >
        <LinearGradient
          colors={[
            baseColor,
            highlightColor,
            baseColor,
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradient}
        />
      </Animated.View>
    </View>
  );
};

// Preset skeleton components
export const SkeletonCard: React.FC = () => {
  const { colors } = useTheme();
  return (
    <View style={[styles.cardContainer, { backgroundColor: colors.cardBg }]}>
      <SkeletonLoader height={80} borderRadius={RADIUS.large} style={{ marginBottom: 12 }} />
      <SkeletonLoader variant="text" width="60%" style={{ marginBottom: 8 }} />
      <SkeletonLoader variant="text" width="40%" />
    </View>
  );
};

export const SkeletonServiceCard: React.FC = () => {
  const { colors } = useTheme();
  return (
    <View style={[styles.serviceCardContainer, { backgroundColor: colors.cardBg }]}>
      <SkeletonLoader height={60} width={60} borderRadius={RADIUS.medium} style={{ marginBottom: 8 }} />
      <SkeletonLoader variant="text" width="80%" style={{ marginBottom: 4 }} />
      <SkeletonLoader variant="text" width="50%" />
    </View>
  );
};

export const SkeletonList: React.FC<{ count?: number }> = ({ count = 3 }) => (
  <View>
    {Array.from({ length: count }).map((_, index) => (
      <SkeletonCard key={index} />
    ))}
  </View>
);

const styles = StyleSheet.create({
  skeleton: {
    overflow: 'hidden',
  },
  shimmer: {
    width: '100%',
    height: '100%',
  },
  gradient: {
    flex: 1,
  },
  cardContainer: {
    padding: 16,
    borderRadius: RADIUS.large,
    marginBottom: 12,
  },
  serviceCardContainer: {
    padding: 12,
    borderRadius: RADIUS.medium,
    alignItems: 'center',
  },
});
