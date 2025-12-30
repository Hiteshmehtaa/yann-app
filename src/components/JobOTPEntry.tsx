import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useTheme } from '../contexts/ThemeContext';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS, SHADOWS } from '../utils/theme';

interface JobOTPEntryProps {
  visible: boolean;
  type: 'start' | 'end';
  onSubmit: (otp: string) => Promise<void>;
  onClose: () => void;
}

export const JobOTPEntry: React.FC<JobOTPEntryProps> = ({
  visible,
  type,
  onSubmit,
  onClose
}) => {
  const { colors, isDark } = useTheme();
  const [otp, setOTP] = useState(['', '', '', '']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const inputRefs = useRef<Array<TextInput | null>>([]);
  const scaleAnim = new Animated.Value(0.9);

  useEffect(() => {
    if (visible) {
      setOTP(['', '', '', '']);
      setError('');
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }).start();
      
      // Auto-focus first input
      setTimeout(() => inputRefs.current[0]?.focus(), 300);
    }
  }, [visible]);

  useEffect(() => {
    // Auto-submit when all 4 digits are entered
    if (otp.every(digit => digit !== '') && !isSubmitting) {
      handleSubmit();
    }
  }, [otp]);

  const handleChange = (text: string, index: number) => {
    // Only allow numbers
    if (text && !/^\d$/.test(text)) return;

    const newOTP = [...otp];
    newOTP[index] = text;
    setOTP(newOTP);
    setError('');

    // Auto-focus next input
    if (text && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async () => {
    const otpString = otp.join('');
    
    if (otpString.length !== 4) {
      setError('Please enter all 4 digits');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await onSubmit(otpString);
      // Success handled by parent
    } catch (err: any) {
      setError(err.message || 'Invalid OTP. Please try again.');
      setOTP(['', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <BlurView intensity={isDark ? 50 : 30} style={StyleSheet.absoluteFill} tint={isDark ? 'dark' : 'light'} />
        
        <Animated.View style={[
          styles.container,
          { backgroundColor: colors.cardBg, transform: [{ scale: scaleAnim }] }
        ]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={[styles.iconContainer, { backgroundColor: colors.elevated }]}>
              <Ionicons 
                name={type === 'start' ? 'play-circle' : 'stop-circle'} 
                size={40} 
                color={type === 'start' ? '#10B981' : '#3B82F6'} 
              />
            </View>
            <Text style={[styles.title, { color: colors.text }]}>
              Enter Customer OTP
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              {type === 'start' 
                ? 'Ask customer for the 4-digit start code'
                : 'Ask customer for the 4-digit end code'}
            </Text>
          </View>

          {/* OTP Input */}
          <View style={styles.otpContainer}>
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => (inputRefs.current[index] = ref)}
                style={[
                  styles.otpInput,
                  { 
                    backgroundColor: colors.elevated,
                    borderColor: digit ? COLORS.primary : colors.border,
                    color: colors.text
                  },
                  error && styles.otpInputError
                ]}
                value={digit}
                onChangeText={(text) => handleChange(text, index)}
                onKeyPress={(e) => handleKeyPress(e, index)}
                keyboardType="number-pad"
                maxLength={1}
                selectTextOnFocus
                editable={!isSubmitting}
              />
            ))}
          </View>

          {/* Error Message */}
          {error ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={16} color="#EF4444" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Submit Button */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              { backgroundColor: COLORS.primary },
              isSubmitting && styles.submitButtonDisabled
            ]}
            onPress={handleSubmit}
            disabled={isSubmitting || otp.some(d => !d)}
            activeOpacity={0.7}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Text style={styles.submitText}>
                  {type === 'start' ? 'Start Job' : 'Complete Job'}
                </Text>
                <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
              </>
            )}
          </TouchableOpacity>

          {/* Cancel Button */}
          <TouchableOpacity
            style={[styles.cancelButton, { backgroundColor: colors.elevated }]}
            onPress={onClose}
            disabled={isSubmitting}
            activeOpacity={0.7}
          >
            <Text style={[styles.cancelText, { color: colors.text }]}>Cancel</Text>
          </TouchableOpacity>
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
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: SPACING.lg,
  },
  container: {
    width: '100%',
    maxWidth: 400,
    borderRadius: RADIUS.xlarge,
    padding: SPACING.xl,
    ...SHADOWS.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: TYPOGRAPHY.size.xl,
    fontWeight: '800',
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.size.sm,
    textAlign: 'center',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  otpInput: {
    width: 64,
    height: 72,
    borderRadius: RADIUS.medium,
    borderWidth: 2,
    fontSize: 32,
    fontWeight: '800',
    textAlign: 'center',
  },
  otpInputError: {
    borderColor: '#EF4444',
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
    color: '#EF4444',
    fontWeight: '600',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.md,
    borderRadius: RADIUS.medium,
    gap: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitText: {
    fontSize: TYPOGRAPHY.size.md,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  cancelButton: {
    padding: SPACING.md,
    borderRadius: RADIUS.medium,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: TYPOGRAPHY.size.md,
    fontWeight: '600',
  },
});
