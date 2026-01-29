import React, { useState } from 'react';
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
import { apiService } from '../services/api';
import { COLORS, RADIUS, SPACING, SHADOWS, TYPOGRAPHY } from '../utils/theme';

const { width } = Dimensions.get('window');

interface CompletionPaymentModalProps {
  visible: boolean;
  bookingId: string;
  serviceName: string;
  completionAmount: number;
  totalAmount: number;
  onClose: () => void;
  onPaymentSuccess: () => void;
}

export const CompletionPaymentModal: React.FC<CompletionPaymentModalProps> = ({
  visible,
  bookingId,
  serviceName,
  completionAmount,
  totalAmount,
  onClose,
  onPaymentSuccess,
}) => {
  const [isPaying, setIsPaying] = useState(false);

  const handlePayment = async () => {
    try {
      setIsPaying(true);
      const response = await apiService.payCompletionAmount(bookingId);

      if (response.success) {
        Alert.alert(
          'Payment Successful',
          `₹${completionAmount} has been paid successfully.`,
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
            <View style={styles.iconContainer}>
              <Ionicons name="checkmark" size={32} color={COLORS.primary} />
            </View>
            <Text style={styles.title}>Payment Required</Text>
            <Text style={styles.subtitle}>Job Completed</Text>
          </View>

          {/* Amount Display */}
          <View style={styles.amountContainer}>
            <Text style={styles.currency}>₹</Text>
            <Text style={styles.amount}>{completionAmount.toLocaleString()}</Text>
            <Text style={styles.amountLabel}>Remaining Balance (75%)</Text>
          </View>

          {/* Details */}
          <View style={styles.detailsContainer}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Service</Text>
              <Text style={styles.detailValue}>{serviceName}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Total Amount</Text>
              <Text style={styles.detailValue}>₹{totalAmount.toLocaleString()}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Paid (25%)</Text>
              <Text style={styles.detailValueSuccess}>- ₹{(totalAmount - completionAmount).toLocaleString()}</Text>
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
                <Text style={styles.payButtonText}>Pay Now</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.laterButton}
              onPress={onClose}
              disabled={isPaying}
            >
              <Text style={styles.laterButtonText}>Pay Later</Text>
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
    backgroundColor: 'rgba(0,0,0,0.7)', // Dark overlay
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
    marginBottom: SPACING.xl,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.primary + '15', // 15% opacity
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
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
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 1,
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
    left: '25%', // Approximate centering adjustment
    opacity: 0.6,
  },
  amount: {
    fontSize: 48,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: -1,
  },
  amountLabel: {
    fontSize: TYPOGRAPHY.size.sm,
    color: COLORS.textSecondary,
    marginTop: 4,
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
    marginBottom: SPACING.xs,
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
  detailValueSuccess: {
    fontSize: TYPOGRAPHY.size.sm,
    fontWeight: '600',
    color: COLORS.success,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.divider,
    marginVertical: SPACING.sm,
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
  payButtonText: {
    fontSize: TYPOGRAPHY.size.md,
    fontWeight: '700',
    color: COLORS.white,
  },
  laterButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  laterButtonText: {
    fontSize: TYPOGRAPHY.size.md,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
});
