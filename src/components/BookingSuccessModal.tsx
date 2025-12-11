import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Animated,
  Dimensions,
} from 'react-native';
import LottieView from 'lottie-react-native';
import { BlurView } from 'expo-blur';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS } from '../utils/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface BookingSuccessModalProps {
  visible: boolean;
  title?: string;
  message?: string;
  serviceName?: string;
  onClose?: () => void;
  onAnimationComplete?: () => void;
  autoCloseDuration?: number;
}

export const BookingSuccessModal: React.FC<BookingSuccessModalProps> = ({
  visible,
  title = 'Booking Confirmed!',
  message = 'Your service has been booked successfully',
  serviceName,
  onClose,
  onAnimationComplete,
  autoCloseDuration = 5000,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const animationRef = useRef<LottieView>(null);

  useEffect(() => {
    if (visible) {
      const startTime = Date.now();
      console.log('🎬 SUCCESS ANIMATION STARTED at:', new Date().toISOString());

      // Reset animations
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.5);

      // Play Lottie animation
      animationRef.current?.play();

      // Animate modal entrance
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.5,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose?.();
    });
  };

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="none">
      <View style={styles.overlay}>
        <BlurView intensity={30} style={StyleSheet.absoluteFill} />
        
        <Animated.View
          style={[
            styles.container,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <View style={styles.content}>
            {/* Lottie Animation */}
            <View style={styles.animationContainer}>
              <LottieView
                ref={animationRef}
                source={require('../../assets/lottie/Jumping-Lottie-Animation.json')}
                autoPlay
                loop={false}
                style={styles.animation}
                speed={1}
                onAnimationFinish={onAnimationComplete}
              />
            </View>
            
            {/* Title */}
            <Text style={styles.title}>{title}</Text>
            
            {/* Service Name */}
            {serviceName && (
              <View style={styles.serviceNameContainer}>
                <Text style={styles.serviceNameLabel}>Service:</Text>
                <Text style={styles.serviceName}>{serviceName}</Text>
              </View>
            )}
            
            {/* Message */}
            <Text style={styles.message}>{message}</Text>
            
            {/* Status indicator */}
            <View style={styles.statusContainer}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>Provider will be assigned soon</Text>
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  container: {
    width: SCREEN_WIDTH * 0.85,
    maxWidth: 400,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xlarge,
    padding: SPACING.xl,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  content: {
    alignItems: 'center',
    width: '100%',
  },
  animationContainer: {
    width: 200,
    height: 200,
    marginBottom: SPACING.md,
  },
  animation: {
    width: '100%',
    height: '100%',
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  serviceNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
    backgroundColor: COLORS.primary + '10',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.medium,
  },
  serviceNameLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginRight: SPACING.xs,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
  },
  message: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SPACING.lg,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.success + '10',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.success,
    marginRight: SPACING.xs,
  },
  statusText: {
    fontSize: 13,
    color: COLORS.success,
    fontWeight: '600',
  },
});
