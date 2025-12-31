import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS, SHADOWS } from '../utils/theme';

interface OTPInputModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (otp: string) => Promise<void>;
  title: string;
  subtitle?: string;
  isLoading?: boolean;
  error?: string | null;
}

export const OTPInputModal: React.FC<OTPInputModalProps> = ({
  visible,
  onClose,
  onSubmit,
  title,
  subtitle,
  isLoading = false,
  error = null,
}) => {
  const [otp, setOtp] = useState(['', '', '', '']);
  const [localError, setLocalError] = useState<string | null>(null);
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const scaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Reset state when modal opens
      setOtp(['', '', '', '']);
      setLocalError(null);
      
      // Animate modal in
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }).start();

      // Auto-focus first input
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 300);
    } else {
      scaleAnim.setValue(0);
    }
  }, [visible]);

  useEffect(() => {
    setLocalError(error);
  }, [error]);

  const handleOtpChange = (value: string, index: number) => {
    // Only allow numbers
    if (value && !/^\d$/.test(value)) {
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setLocalError(null);

    // Auto-focus next input
    if (value && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 4 digits are entered
    if (index === 3 && value) {
      const fullOtp = newOtp.join('');
      if (fullOtp.length === 4) {
        handleSubmit(fullOtp);
      }
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async (otpValue?: string) => {
    const fullOtp = otpValue || otp.join('');
    
    if (fullOtp.length !== 4) {
      setLocalError('Please enter all 4 digits');
      return;
    }

    try {
      await onSubmit(fullOtp);
    } catch (err: any) {
      setLocalError(err.message || 'Invalid OTP. Please try again.');
      // Clear OTP on error
      setOtp(['', '', '', '']);
      inputRefs.current[0]?.focus();
    }
  };

  const handleClose = () => {
    setOtp(['', '', '', '']);
    setLocalError(null);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.modalContainer,
            {
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <LinearGradient
            colors={[COLORS.primary, COLORS.primaryGradientEnd]}
            style={styles.header}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.iconContainer}>
              <Ionicons name="lock-closed" size={32} color={COLORS.white} />
            </View>
            <Text style={styles.title}>{title}</Text>
            {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
          </LinearGradient>

          <View style={styles.content}>
            <Text style={styles.label}>Enter 4-Digit OTP</Text>
            
            <View style={styles.otpContainer}>
              {otp.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => { inputRefs.current[index] = ref; }}
                  style={[
                    styles.otpInput,
                    digit && styles.otpInputFilled,
                    localError && styles.otpInputError,
                  ]}
                  value={digit}
                  onChangeText={(value) => handleOtpChange(value, index)}
                  onKeyPress={(e) => handleKeyPress(e, index)}
                  keyboardType="number-pad"
                  maxLength={1}
                  selectTextOnFocus
                  editable={!isLoading}
                />
              ))}
            </View>

            {localError && (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={16} color={COLORS.error} />
                <Text style={styles.errorText}>{localError}</Text>
              </View>
            )}

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleClose}
                disabled={isLoading}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.submitButton}
                onPress={() => handleSubmit()}
                disabled={isLoading || otp.join('').length !== 4}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={[COLORS.primary, COLORS.primaryGradientEnd]}
                  style={styles.submitGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  {isLoading ? (
                    <ActivityIndicator color={COLORS.white} />
                  ) : (
                    <>
                      <Text style={styles.submitButtonText}>Verify</Text>
                      <Ionicons name="checkmark-circle" size={20} color={COLORS.white} />
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xlarge,
    overflow: 'hidden',
    ...SHADOWS.lg,
  },
  header: {
    padding: SPACING.xl,
    alignItems: 'center',
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: TYPOGRAPHY.size.xl,
    fontWeight: TYPOGRAPHY.weight.bold,
    color: COLORS.white,
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.size.sm,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  content: {
    padding: SPACING.xl,
  },
  label: {
    fontSize: TYPOGRAPHY.size.md,
    fontWeight: TYPOGRAPHY.weight.semibold,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  otpInput: {
    width: 56,
    height: 64,
    borderRadius: RADIUS.medium,
    borderWidth: 2,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
    fontSize: 24,
    fontWeight: TYPOGRAPHY.weight.bold,
    color: COLORS.text,
    textAlign: 'center',
  },
  otpInputFilled: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.white,
  },
  otpInputError: {
    borderColor: COLORS.error,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.md,
  },
  errorText: {
    fontSize: TYPOGRAPHY.size.sm,
    color: COLORS.error,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.md,
  },
  cancelButton: {
    flex: 1,
    height: 48,
    borderRadius: RADIUS.medium,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: TYPOGRAPHY.size.md,
    fontWeight: TYPOGRAPHY.weight.semibold,
    color: COLORS.textSecondary,
  },
  submitButton: {
    flex: 1,
    height: 48,
    borderRadius: RADIUS.medium,
    overflow: 'hidden',
  },
  submitGradient: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  submitButtonText: {
    fontSize: TYPOGRAPHY.size.md,
    fontWeight: TYPOGRAPHY.weight.bold,
    color: COLORS.white,
  },
});
