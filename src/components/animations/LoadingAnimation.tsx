import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { RiveAnimation } from './RiveAnimation';

interface LoadingAnimationProps {
  style?: ViewStyle;
  size?: number;
}

export const LoadingAnimation: React.FC<LoadingAnimationProps> = ({
  style,
  size = 100,
}) => {
  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      <RiveAnimation
        animationUrl="https://public.rive.app/community/runtime-files/2244-4456-loading-animation.riv"
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
