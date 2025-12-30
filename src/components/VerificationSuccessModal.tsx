import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Animated,
  Dimensions,
  TouchableWithoutFeedback,
} from 'react-native';
import { BlurView } from 'expo-blur';
import LottieView from 'lottie-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../contexts/ThemeContext';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS, SHADOWS } from '../utils/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface VerificationSuccessModalProps {
  visible: boolean;
  onClose: () => void;
  autoCloseDuration?: number;
}

export const VerificationSuccessModal: React.FC<VerificationSuccessModalProps> = ({
  visible,
  onClose,
  autoCloseDuration = 4000,
}) => {
  const { colors, isDark } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const textFadeAnim = useRef(new Animated.Value(0)).current;
  const lottieRef = useRef<LottieView>(null);

  useEffect(() => {
    if (visible) {
      // Reset animations
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.8);
      textFadeAnim.setValue(0);

      // Entry animation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 50,
          useNativeDriver: true,
        }),
      ]).start();

      // Play Lottie animation
      setTimeout(() => {
        lottieRef.current?.play();
      }, 200);

      // Fade in text after animation starts
      setTimeout(() => {
        Animated.timing(textFadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }).start();
      }, 1500);

      // Auto close
      if (autoCloseDuration > 0) {
        const timer = setTimeout(() => {
          handleClose();
        }, autoCloseDuration);

        return () => clearTimeout(timer);
      }
    }
  }, [visible, autoCloseDuration]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.8,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  if (!visible) return null;

  return (
    <Modal 
      transparent 
      visible={visible} 
      animationType="none" 
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <TouchableWithoutFeedback onPress={handleClose}>
        <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
          <BlurView intensity={isDark ? 50 : 30} style={StyleSheet.absoluteFill} tint={isDark ? 'dark' : 'light'} />
          
          <TouchableWithoutFeedback>
            <Animated.View
              style={[
                styles.container,
                {
                  backgroundColor: colors.cardBg,
                  transform: [{ scale: scaleAnim }],
                },
              ]}
            >
              {/* Lottie Animation */}
              <View style={styles.lottieContainer}>
                <LottieView
                  ref={lottieRef}
                  source={require('../../assets/lottie/Success.json')}
                  style={styles.lottie}
                  autoPlay={false}
                  loop={false}
                />
              </View>

              {/* Text Content */}
              <Animated.View style={[styles.textContainer, { opacity: textFadeAnim }]}>
                <Text style={[styles.title, { color: colors.text }]}>
                  Verification Successful! 🎉
                </Text>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                  Your identity has been verified. You now have access to all features.
                </Text>

                {/* Verified Badge Preview */}
                <View style={styles.badgePreview}>
                  <LinearGradient
                    colors={['#10B981', '#059669']}
                    style={styles.previewBadge}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Text style={styles.badgeText}>✓ VERIFIED</Text>
                  </LinearGradient>
                </View>
              </Animated.View>
            </Animated.View>
          </TouchableWithoutFeedback>
        </Animated.View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  container: {
    width: Math.min(SCREEN_WIDTH - 48, 360),
    borderRadius: RADIUS.xlarge,
    overflow: 'hidden',
    alignItems: 'center',
    paddingBottom: SPACING.xl,
    ...SHADOWS.lg,
  },
  lottieContainer: {
    width: '100%',
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -SPACING.md,
  },
  lottie: {
    width: 250,
    height: 250,
  },
  textContainer: {
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    marginTop: -SPACING.lg,
  },
  title: {
    fontSize: TYPOGRAPHY.size.xl,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.size.md,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SPACING.lg,
  },
  badgePreview: {
    marginTop: SPACING.sm,
  },
  previewBadge: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.large,
    ...SHADOWS.md,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: TYPOGRAPHY.size.sm,
    fontWeight: '800',
    letterSpacing: 1,
  },
});

export default VerificationSuccessModal;
