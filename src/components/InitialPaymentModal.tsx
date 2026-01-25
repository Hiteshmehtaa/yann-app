import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';
import { apiService } from '../services/api';
import { COLORS, RADIUS, SPACING } from '../utils/theme';

const { width } = Dimensions.get('window');

interface InitialPaymentModalProps {
  visible: boolean;
  bookingId: string;
  serviceName: string;
  providerName: string;
  initialPaymentAmount: number;
  totalAmount: number;
  expiresAt: string; // ISO string
  onClose: () => void;
  onPaymentSuccess: () => void;
  onTimeout: () => void;
}

export const InitialPaymentModal: React.FC<InitialPaymentModalProps> = ({
  visible,
  bookingId,
  serviceName,
  providerName,
  initialPaymentAmount,
  totalAmount,
  expiresAt,
  onClose,
  onPaymentSuccess,
  onTimeout,
}) => {
  const [isPaying, setIsPaying] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(180);
  const [isExpired, setIsExpired] = useState(false);

  // Timer countdown
  useEffect(() => {
    if (!visible || !expiresAt) return;

    const calculateRemaining = () => {
      const now = new Date();
      const expires = new Date(expiresAt);
      const diff = Math.max(0, Math.floor((expires.getTime() - now.getTime()) / 1000));

      setRemainingSeconds(diff);

      if (diff === 0 && !isExpired) {
        setIsExpired(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        onTimeout();
      }
    };

    calculateRemaining();
    const interval = setInterval(calculateRemaining, 1000);

    return () => clearInterval(interval);
  }, [visible, expiresAt, isExpired]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getUrgencyColor = () => {
    if (remainingSeconds > 120) return '#10B981'; // Green
    if (remainingSeconds > 60) return '#F59E0B'; // Orange
    return '#EF4444'; // Red
  };

  const handlePayment = async () => {
    try {
      setIsPaying(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const response = await apiService.payInitialAmount(bookingId);

      if (response.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert(
          'Payment Successful! 🎉',
          `₹${initialPaymentAmount} has been paid. Your booking is confirmed.`,
          [
            {
              text: 'OK',
              onPress: () => {
                onPaymentSuccess();
                onClose();
              },
            },
          ]
        );
      }
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const errorMessage = error.response?.data?.message || error.message || 'Payment failed';
      Alert.alert('Payment Failed', errorMessage);
    } finally {
      setIsPaying(false);
    }
  };

  const handleSkip = () => {
    Alert.alert(
      'Skip Payment?',
      'If you don\'t pay within the time limit, your booking will be automatically cancelled.',
      [
        { text: 'Continue Payment', style: 'cancel' },
        {
          text: 'Skip',
          style: 'destructive',
          onPress: onClose,
        },
      ]
    );
  };

  if (isExpired) {
    return (
      <Modal visible={visible} transparent animationType="fade">
        <BlurView intensity={90} tint="dark" style={styles.overlay}>
          <View style={styles.container}>
            <View style={styles.expiredContent}>
              <View style={styles.expiredIconContainer}>
                <Ionicons name="time-outline" size={72} color="#EF4444" />
              </View>
              <Text style={styles.expiredTitle}>Time's Up!</Text>
              <Text style={styles.expiredMessage}>
                Payment window expired. Booking has been cancelled.
              </Text>
              <TouchableOpacity style={styles.expiredButton} onPress={onClose}>
                <Text style={styles.expiredButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </BlurView>
      </Modal>
    );
  }

  const completionAmount = totalAmount - initialPaymentAmount;

  return (
    <Modal visible={visible} transparent animationType="slide">
      <BlurView intensity={90} tint="dark" style={styles.overlay}>
        <View style={styles.container}>
          {/* Success Header */}
          <LinearGradient
            colors={['#10B981', '#059669']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.header}
          >
            <View style={styles.successBadge}>
              <Ionicons name="checkmark-circle" size={64} color="#FFFFFF" />
            </View>
            <Text style={styles.headerTitle}>Booking Confirmed!</Text>
            <Text style={styles.headerSubtitle}>
              {providerName} will arrive soon
            </Text>
          </LinearGradient>

          {/* Timer Badge */}
          <View style={[styles.timerBadge, { backgroundColor: getUrgencyColor() }]}>
            <Ionicons name="timer-outline" size={18} color="#FFF" />
            <Text style={styles.timerText}>{formatTime(remainingSeconds)}</Text>
            <Text style={styles.timerLabel}>remaining</Text>
          </View>

          {/* Content */}
          <View style={styles.content}>
            {/* Service Info Card */}
            <View style={styles.serviceCard}>
              <View style={styles.serviceHeader}>
                <Ionicons name="construct" size={20} color="#6B7280" />
                <Text style={styles.serviceLabel}>Service</Text>
              </View>
              <Text style={styles.serviceName}>{serviceName}</Text>
            </View>

            {/* Payment Breakdown */}
            <View style={styles.paymentCard}>
              <Text style={styles.sectionTitle}>Payment Breakdown</Text>

              <View style={styles.paymentRow}>
                <View style={styles.paymentLeft}>
                  <Text style={styles.paymentLabel}>Initial Payment</Text>
                  <Text style={styles.paymentPercent}>25%</Text>
                </View>
                <Text style={styles.paymentAmount}>₹{initialPaymentAmount.toFixed(2)}</Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.paymentRow}>
                <View style={styles.paymentLeft}>
                  <Text style={styles.paymentLabelSecondary}>After Completion</Text>
                  <Text style={styles.paymentPercentSecondary}>75%</Text>
                </View>
                <Text style={styles.paymentAmountSecondary}>
                  ₹{completionAmount.toFixed(2)}
                </Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total Booking</Text>
                <Text style={styles.totalAmount}>₹{totalAmount.toFixed(2)}</Text>
              </View>
            </View>

            {/* Info Banner */}
            <View style={styles.infoBanner}>
              <Ionicons name="information-circle" size={20} color="#3B82F6" />
              <Text style={styles.infoText}>
                Pay remaining 75% after service completion
              </Text>
            </View>

            {/* Urgency Warning */}
            {remainingSeconds < 60 && (
              <View style={styles.urgencyBanner}>
                <Ionicons name="alert-circle" size={20} color="#EF4444" />
                <Text style={styles.urgencyText}>
                  ⚡ Hurry! Booking will be cancelled if not paid in time
                </Text>
              </View>
            )}
          </View>

          {/* Action Buttons */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.payButton}
              onPress={handlePayment}
              disabled={isPaying}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#10B981', '#059669']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.payButtonGradient}
              >
                {isPaying ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <>
                    <Ionicons name="card" size={22} color="#FFFFFF" />
                    <Text style={styles.payButtonText}>
                      Pay ₹{initialPaymentAmount.toFixed(2)}
                    </Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.skipButton}
              onPress={handleSkip}
              activeOpacity={0.6}
            >
              <Text style={styles.skipButtonText}>Skip for now</Text>
            </TouchableOpacity>
          </View>
        </View>
      </BlurView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  container: {
    width: width * 0.92,
    maxWidth: 440,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.25,
    shadowRadius: 25,
    elevation: 20,
  },
  header: {
    paddingTop: SPACING.xxl,
    paddingBottom: SPACING.xl,
    paddingHorizontal: SPACING.xl,
    alignItems: 'center',
  },
  successBadge: {
    marginBottom: SPACING.md,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 6,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  headerSubtitle: {
    fontSize: 16,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.95)',
    textAlign: 'center',
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: -20,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  timerText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1.5,
    fontVariant: ['tabular-nums'],
  },
  timerLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  content: {
    padding: SPACING.xl,
    gap: SPACING.md,
  },
  serviceCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  serviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  serviceLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  serviceName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: 0.2,
  },
  paymentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: SPACING.lg,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
    marginBottom: SPACING.md,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  paymentLeft: {
    flex: 1,
  },
  paymentLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  paymentPercent: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10B981',
  },
  paymentAmount: {
    fontSize: 20,
    fontWeight: '800',
    color: '#10B981',
    fontVariant: ['tabular-nums'],
  },
  paymentLabelSecondary: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 2,
  },
  paymentPercentSecondary: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  paymentAmountSecondary: {
    fontSize: 17,
    fontWeight: '700',
    color: '#6B7280',
    fontVariant: ['tabular-nums'],
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 8,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: '900',
    color: '#111827',
    fontVariant: ['tabular-nums'],
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    padding: SPACING.md,
    borderRadius: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#1E40AF',
    lineHeight: 18,
  },
  urgencyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    padding: SPACING.md,
    borderRadius: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  urgencyText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: '#DC2626',
    lineHeight: 18,
  },
  actions: {
    padding: SPACING.xl,
    paddingTop: 0,
    gap: SPACING.md,
  },
  payButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  payButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 10,
  },
  payButtonText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  skipButton: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  skipButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6B7280',
  },
  // Expired State
  expiredContent: {
    padding: SPACING.xxl,
    alignItems: 'center',
  },
  expiredIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xl,
  },
  expiredTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#DC2626',
    marginBottom: SPACING.sm,
  },
  expiredMessage: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: SPACING.xl,
    lineHeight: 24,
  },
  expiredButton: {
    backgroundColor: '#DC2626',
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 16,
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  expiredButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
