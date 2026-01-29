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
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { apiService } from '../services/api';
import { COLORS, RADIUS, SPACING, SHADOWS, TYPOGRAPHY } from '../utils/theme';

const { width } = Dimensions.get('window');

interface InitialPaymentModalProps {
  visible: boolean;
  bookingId: string;
  serviceName: string;
  providerName: string;
  initialPaymentAmount: number;
  totalAmount: number;
  expiresAt: string;
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

  const handlePayment = async () => {
    try {
      setIsPaying(true);
      const response = await apiService.payInitialAmount(bookingId);

      if (response.success) {
        Alert.alert(
          'Booking Confirmed',
          'Your initial payment was successful.',
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
      const errorMessage = error.response?.data?.message || error.message || 'Payment failed';
      Alert.alert('Payment Failed', errorMessage);
    } finally {
      setIsPaying(false);
    }
  };

  const handleSkip = () => {
    Alert.alert(
      'Skip Payment?',
      'Booking will be cancelled if payment is not completed in time.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Skip', style: 'destructive', onPress: onClose },
      ]
    );
  };

  if (isExpired) return null; // Logic handled by parent or different component for expiry

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <BlurView intensity={40} tint="dark" style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.timerContainer}>
              <Ionicons name="time-outline" size={16} color={COLORS.error} />
              <Text style={styles.timerText}>{formatTime(remainingSeconds)}</Text>
            </View>
            <Text style={styles.title}>Confirm Booking</Text>
            <Text style={styles.subtitle}>Pay 25% to start job</Text>
          </View>

          {/* Amount */}
          <View style={styles.amountContainer}>
            <Text style={styles.currency}>₹</Text>
            <Text style={styles.amount}>{initialPaymentAmount.toLocaleString()}</Text>
          </View>

          {/* Details */}
          <View style={styles.detailsContainer}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Service</Text>
              <Text style={styles.detailValue}>{serviceName}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Provider</Text>
              <Text style={styles.detailValue}>{providerName}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Remaining (75%)</Text>
              <Text style={styles.detailValue}>₹{(totalAmount - initialPaymentAmount).toLocaleString()}</Text>
            </View>
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.payButton}
              onPress={handlePayment}
              disabled={isPaying}
              activeOpacity={0.8}
            >
              {isPaying ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <View style={styles.payContent}>
                  <Text style={styles.payButtonText}>Pay Now</Text>
                  <Ionicons name="arrow-forward" size={20} color={COLORS.white} />
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.skipButton}
              onPress={handleSkip}
              disabled={isPaying}
            >
              <Text style={styles.skipButtonText}>Skip</Text>
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
    backgroundColor: 'rgba(0,0,0,0.7)', // Dark overlay to hide the green background
  },
  container: {
    width: width * 0.9,
    maxWidth: 400,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xlarge,
    padding: SPACING.xl,
    ...SHADOWS.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.error + '15',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.large,
    marginBottom: SPACING.md,
    gap: 6,
  },
  timerText: {
    fontSize: TYPOGRAPHY.size.sm,
    fontWeight: '700',
    color: COLORS.error,
    fontVariant: ['tabular-nums'],
  },
  title: {
    fontSize: TYPOGRAPHY.size.xl,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.size.sm,
    color: COLORS.textSecondary,
  },
  amountContainer: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  currency: {
    fontSize: 24,
    color: COLORS.text,
    position: 'absolute',
    top: 8,
    left: '25%',
    opacity: 0.6,
  },
  amount: {
    fontSize: 48,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: -1,
  },
  detailsContainer: {
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.medium,
    padding: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  detailLabel: {
    fontSize: TYPOGRAPHY.size.sm,
    color: COLORS.textSecondary,
  },
  detailValue: {
    fontSize: TYPOGRAPHY.size.sm,
    fontWeight: '600',
    color: COLORS.text,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.divider,
    marginVertical: SPACING.xs,
  },
  actions: {
    gap: SPACING.md,
  },
  payButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: RADIUS.large,
    alignItems: 'center',
    ...SHADOWS.md,
  },
  payContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  payButtonText: {
    fontSize: TYPOGRAPHY.size.md,
    fontWeight: '700',
    color: COLORS.white,
  },
  skipButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  skipButtonText: {
    fontSize: TYPOGRAPHY.size.md,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
});
