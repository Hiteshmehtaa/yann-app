import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Modal, Text } from 'react-native';
import LottieView from 'lottie-react-native';
import { COLORS } from '../../utils/theme';

interface BookingAnimationProps {
  visible: boolean;
  type: 'loading' | 'success' | 'error';
  message?: string;
  onAnimationFinish?: () => void;
}

export const BookingAnimation: React.FC<BookingAnimationProps> = ({
  visible,
  type,
  message,
  onAnimationFinish,
}) => {
  const animationRef = useRef<LottieView>(null);

  useEffect(() => {
    if (visible && animationRef.current) {
      animationRef.current.play();
    }
  }, [visible]);

  const getAnimationSource = () => {
    switch (type) {
      case 'loading':
        return require('../../../assets/lottie/loading.json');
      case 'success':
        return require('../../../assets/lottie/Jumping-Lottie-Animation.json');
      case 'error':
        return require('../../../assets/lottie/error.json');
      default:
        return require('../../../assets/lottie/loading.json');
    }
  };

  const getMessage = () => {
    if (message) return message;
    switch (type) {
      case 'loading':
        return 'Processing your booking...';
      case 'success':
        return 'Booking Confirmed!';
      case 'error':
        return 'Something went wrong';
      default:
        return '';
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.container}>
        <View style={styles.content}>
          <LottieView
            ref={animationRef}
            source={getAnimationSource()}
            autoPlay
            loop={type === 'loading'}
            style={styles.animation}
            onAnimationFinish={onAnimationFinish}
          />
          <Text style={styles.message}>{getMessage()}</Text>
          {type === 'loading' && (
            <Text style={styles.subMessage}>Please wait...</Text>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    width: '80%',
    maxWidth: 320,
  },
  animation: {
    width: 200,
    height: 200,
  },
  message: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
    marginTop: 16,
  },
  subMessage: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
});
