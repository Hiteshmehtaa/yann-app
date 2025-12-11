import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, Modal } from 'react-native';
import LottieView from 'lottie-react-native';
import { BlurView } from 'expo-blur';

interface LoadingSpinnerProps {
  visible: boolean;
  size?: 'small' | 'large';
  color?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  visible, 
  size = 'large',
}) => {
  const animationRef = useRef<LottieView>(null);

  useEffect(() => {
    if (visible && animationRef.current) {
      animationRef.current.play();
    }
  }, [visible]);

  const animationSize = size === 'large' ? 200 : 120;

  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.overlay}>
        <BlurView intensity={40} style={StyleSheet.absoluteFill} />
        <View style={[styles.animationContainer, { width: animationSize, height: animationSize }]}>
          <LottieView
            ref={animationRef}
            source={require('../../assets/lottie/loading.json')}
            autoPlay
            loop
            style={styles.animation}
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  animationContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  animation: {
    width: '100%',
    height: '100%',
  },
});
