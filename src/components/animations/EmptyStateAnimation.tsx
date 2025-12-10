import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { RiveAnimation } from './RiveAnimation';

interface EmptyStateAnimationProps {
  style?: ViewStyle;
  size?: number;
  type?: 'no-data' | 'no-search' | 'no-bookings';
}

export const EmptyStateAnimation: React.FC<EmptyStateAnimationProps> = ({
  style,
  size = 200,
  type = 'no-data',
}) => {
  const getAnimationUrl = () => {
    switch (type) {
      case 'no-search':
        return 'https://public.rive.app/community/runtime-files/1446-2881-search-animation.riv';
      case 'no-bookings':
        return 'https://public.rive.app/community/runtime-files/2487-5002-empty-state.riv';
      default:
        return 'https://public.rive.app/community/runtime-files/2487-5002-empty-state.riv';
    }
  };

  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      <RiveAnimation
        animationUrl={getAnimationUrl()}
        autoplay={true}
        loop={true}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
