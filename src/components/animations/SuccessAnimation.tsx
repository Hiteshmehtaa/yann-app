import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { RiveAnimation } from './RiveAnimation';

interface SuccessAnimationProps {
  style?: ViewStyle;
  size?: number;
  onComplete?: () => void;
}

export const SuccessAnimation: React.FC<SuccessAnimationProps> = ({
  style,
  size = 200,
  onComplete,
}) => {
  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      <RiveAnimation
        animationUrl="https://public.rive.app/community/runtime-files/2063-4080-check-mark-success.riv"
        autoplay={true}
        loop={false}
        onStop={onComplete}
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
