import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { apiService } from '../services/api';
import { COLORS, RADIUS, SPACING } from '../utils/theme';

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
        <View style={styles.overlay}>
          <View style={styles.container}>
            <View style={styles.expiredHeader}>
              <Ionicons name="time-outline" size={64} color="#EF4444" />
              <Text style={styles.expiredTitle}>Time's Up!</Text>
              <Text style={styles.expiredMessage}>
                Payment window expired. Booking has been cancelled.
              </Text>
            </View>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header with Timer */}
          <LinearGradient
            colors={[getUrgencyColor(), getUrgencyColor() + 'DD']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.header}
          >
            <View style={styles.headerTop}>
              <View style={styles.timerBadge}>
                <Ionicons name="timer-outline" size={20} color="#FFF" />
                <Text style={styles.timerText}>{formatTime(remainingSeconds)}</Text>
              </View>
            </View>
            <Ionicons name="checkmark-circle" size={56} color="#FFFFFF" />
            <Text style={styles.headerTitle}>Booking Accepted! 🎉</Text>
            <Text style={styles.headerSubtitle}>
              {providerName} will arrive soon
            </Text>
          </LinearGradient>

          {/* Payment Details */}
          <View style={styles.content}>
            <View style={styles.urgencyBanner}>
              <Ionicons 
                name={remainingSeconds < 60 ? "alert-circle" : "information-circle"} 
                size={20} 
                color={getUrgencyColor()} 
              />
              <Text style={[styles.urgencyText, { color: getUrgencyColor() }]}>
                {remainingSeconds < 60 
                  ? '⚡ Hurry! Time running out'
                  : 'Complete payment to confirm booking'}
              </Text>
            </View>

            <View style={styles.serviceInfo}>
              <Text style={styles.serviceLabel}>Service</Text>
              <Text style={styles.serviceName}>{serviceName}</Text>
            </View>

            <View style={styles.providerInfo}>
              <Text style={styles.providerLabel}>Provider</Text>
              <Text style={styles.providerName}>{providerName}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.paymentBreakdown}>
              <View style={styles.paymentRow}>
                <Text style={styles.paymentLabel}>Initial Payment (25%)</Text>
                <Text style={styles.paymentAmount}>₹{initialPaymentAmount}</Text>
              </View>
              <View style={styles.paymentRow}>
                <Text style={styles.paymentLabelSecondary}>Remaining (75%)</Text>
                <Text style={styles.paymentAmountSecondary}>
                  ₹{totalAmount - initialPaymentAmount}
                </Text>
              </View>
              <View style={styles.paymentRow}>
                <Text style={styles.totalLabel}>Total Booking</Text>
                <Text style={styles.totalAmount}>₹{totalAmount}</Text>
              </View>
            </View>

            <View style={styles.noteBox}>
              <Ionicons name="information-circle-outline" size={18} color="#6B7280" />
              <Text style={styles.noteText}>
                Pay 75% after service completion
              </Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.payButton}
              onPress={handlePayment}
              disabled={isPaying}
            >
              {isPaying ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="card" size={20} color="#FFFFFF" />
                  <Text style={styles.payButtonText}>
                    Pay ₹{initialPaymentAmount} Now
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
              <Text style={styles.skipButtonText}>Skip for now</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.xl,
    width: '100%',
    maxWidth: 450,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  header: {
    padding: SPACING.xl,
    alignItems: 'center',
  },
  headerTop: {
    width: '100%',
    alignItems: 'flex-end',
    marginBottom: SPACING.md,
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  timerText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: SPACING.sm,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 15,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 4,
    textAlign: 'center',
  },
  content: {
    padding: SPACING.xl,
  },
  urgencyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.lg,
    gap: 8,
  },
  urgencyText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },
  serviceInfo: {
    marginBottom: SPACING.md,
  },
  serviceLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#9CA3AF',
    marginBottom: 4,
  },
  serviceName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  providerInfo: {
    marginBottom: SPACING.lg,
  },
  providerLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#9CA3AF',
    marginBottom: 4,
  },
  providerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4B5563',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: SPACING.md,
  },
  paymentBreakdown: {
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paymentLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  paymentAmount: {
    fontSize: 17,
    fontWeight: '700',
    color: '#10B981',
  },
  paymentLabelSecondary: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  paymentAmountSecondary: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6B7280',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
  },
  noteBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    gap: 8,
  },
  noteText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
  },
  actions: {
    padding: SPACING.xl,
    paddingTop: 0,
    gap: SPACING.md,
  },
  payButton: {
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: RADIUS.lg,
    gap: 8,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  payButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  skipButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  skipButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6B7280',
  },
  expiredHeader: {
    padding: SPACING.xxl,
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
  },
  expiredTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#EF4444',
    marginTop: SPACING.md,
  },
  expiredMessage: {
    fontSize: 15,
    fontWeight: '500',
    color: '#6B7280',
    marginTop: SPACING.sm,
    textAlign: 'center',
  },
  closeButton: {
    margin: SPACING.xl,
    backgroundColor: '#EF4444',
    paddingVertical: 14,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
