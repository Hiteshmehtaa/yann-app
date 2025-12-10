import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { RiveAnimation } from './RiveAnimation';

interface HeartAnimationProps {
  style?: ViewStyle;
  size?: number;
}

export const HeartAnimation: React.FC<HeartAnimationProps> = ({
  style,
  size = 80,
}) => {
  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      <RiveAnimation
        animationUrl="https://public.rive.app/community/runtime-files/13-26-heart-like-button.riv"
        autoplay={true}
        loop={false}
        stateMachineName="State Machine 1"
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
