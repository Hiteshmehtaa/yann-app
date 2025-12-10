import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import LottieView from 'lottie-react-native';

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
  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      <LottieView
        source={require('../../../assets/lottie/empty.json')}
        autoPlay
        loop
        style={{ width: '100%', height: '100%' }}
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
