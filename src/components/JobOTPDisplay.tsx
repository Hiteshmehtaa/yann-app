import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  Clipboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useTheme } from '../contexts/ThemeContext';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS, SHADOWS } from '../utils/theme';

interface JobOTPDisplayProps {
  visible: boolean;
  otp: string;
  expiresIn: number; // seconds
  type: 'start' | 'end';
  onClose: () => void;
  onRegenerate?: () => void;
}

export const JobOTPDisplay: React.FC<JobOTPDisplayProps> = ({
  visible,
  otp,
  expiresIn,
  type,
  onClose,
  onRegenerate
}) => {
  const { colors, isDark } = useTheme();
  const [timeLeft, setTimeLeft] = useState(expiresIn);
  const [copied, setCopied] = useState(false);
  const scaleAnim = new Animated.Value(0.9);

  useEffect(() => {
    if (visible) {
      setTimeLeft(expiresIn);
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  useEffect(() => {
    if (!visible || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [visible, timeLeft]);

  const handleCopy = () => {
    Clipboard.setString(otp);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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
        
        <Animated.View style={[styles.container, { transform: [{ scale: scaleAnim }] }]}>
          <LinearGradient
            colors={type === 'start' ? ['#10B981', '#059669'] : ['#3B82F6', '#2563EB']}
            style={styles.header}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.iconContainer}>
              <Ionicons 
                name={type === 'start' ? 'play-circle' : 'stop-circle'} 
                size={48} 
                color="#FFFFFF" 
              />
            </View>
            <Text style={styles.headerTitle}>
              {type === 'start' ? 'Job Starting' : 'Job Ending'}
            </Text>
            <Text style={styles.headerSubtitle}>
              Share this OTP with your service provider
            </Text>
          </LinearGradient>

          <View style={[styles.content, { backgroundColor: colors.cardBg }]}>
            {/* OTP Display */}
            <View style={styles.otpContainer}>
              <Text style={[styles.otpLabel, { color: colors.textSecondary }]}>
                ONE-TIME PASSWORD
              </Text>
              <View style={styles.otpDigits}>
                {otp.split('').map((digit, index) => (
                  <View key={index} style={[styles.digitBox, { borderColor: colors.border }]}>
                    <Text style={[styles.digit, { color: colors.text }]}>{digit}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Timer */}
            <View style={[styles.timerContainer, { backgroundColor: colors.elevated }]}>
              <Ionicons name="time-outline" size={20} color={timeLeft < 60 ? '#EF4444' : colors.textSecondary} />
              <Text style={[
                styles.timerText,
                { color: timeLeft < 60 ? '#EF4444' : colors.textSecondary }
              ]}>
                Expires in {formatTime(timeLeft)}
              </Text>
            </View>

            {/* Actions */}
            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colors.elevated }]}
                onPress={handleCopy}
                activeOpacity={0.7}
              >
                <Ionicons 
                  name={copied ? 'checkmark-circle' : 'copy-outline'} 
                  size={20} 
                  color={copied ? '#10B981' : colors.text} 
                />
                <Text style={[styles.actionText, { color: colors.text }]}>
                  {copied ? 'Copied!' : 'Copy OTP'}
                </Text>
              </TouchableOpacity>

              {onRegenerate && timeLeft === 0 && (
                <TouchableOpacity
                  style={[styles.actionButton, styles.regenerateButton]}
                  onPress={onRegenerate}
                  activeOpacity={0.7}
                >
                  <Ionicons name="refresh" size={20} color="#FFFFFF" />
                  <Text style={styles.regenerateText}>Regenerate</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Info */}
            <View style={[styles.infoBox, { backgroundColor: colors.elevated }]}>
              <Ionicons name="information-circle-outline" size={20} color={colors.textSecondary} />
              <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                {type === 'start' 
                  ? 'Provider will enter this OTP to start the job timer'
                  : 'Provider will enter this OTP to complete the job and calculate charges'}
              </Text>
            </View>

            {/* Close Button */}
            <TouchableOpacity
              style={[styles.closeButton, { backgroundColor: colors.elevated }]}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Text style={[styles.closeText, { color: colors.text }]}>Close</Text>
            </TouchableOpacity>
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
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: SPACING.lg,
  },
  container: {
    width: '100%',
    maxWidth: 400,
    borderRadius: RADIUS.xlarge,
    overflow: 'hidden',
    ...SHADOWS.lg,
  },
  header: {
    padding: SPACING.xl,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: SPACING.md,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.size.xl,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: SPACING.xs,
  },
  headerSubtitle: {
    fontSize: TYPOGRAPHY.size.sm,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  content: {
    padding: SPACING.xl,
  },
  otpContainer: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  otpLabel: {
    fontSize: TYPOGRAPHY.size.xs,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: SPACING.md,
  },
  otpDigits: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  digitBox: {
    width: 56,
    height: 72,
    borderRadius: RADIUS.medium,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.05)',
  },
  digit: {
    fontSize: 32,
    fontWeight: '800',
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.md,
    borderRadius: RADIUS.medium,
    gap: SPACING.xs,
    marginBottom: SPACING.lg,
  },
  timerText: {
    fontSize: TYPOGRAPHY.size.sm,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.md,
    borderRadius: RADIUS.medium,
    gap: SPACING.xs,
  },
  actionText: {
    fontSize: TYPOGRAPHY.size.sm,
    fontWeight: '600',
  },
  regenerateButton: {
    backgroundColor: '#3B82F6',
  },
  regenerateText: {
    fontSize: TYPOGRAPHY.size.sm,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  infoBox: {
    flexDirection: 'row',
    padding: SPACING.md,
    borderRadius: RADIUS.medium,
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  infoText: {
    flex: 1,
    fontSize: TYPOGRAPHY.size.xs,
    lineHeight: 18,
  },
  closeButton: {
    padding: SPACING.md,
    borderRadius: RADIUS.medium,
    alignItems: 'center',
  },
  closeText: {
    fontSize: TYPOGRAPHY.size.md,
    fontWeight: '600',
  },
});
