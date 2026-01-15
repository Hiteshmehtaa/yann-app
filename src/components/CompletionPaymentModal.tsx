import React, { useState } from 'react';
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
import { apiService } from '../services/api';
import { COLORS, RADIUS, SPACING } from '../utils/theme';

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
          'Payment Successful! 🎉',
          `₹${completionAmount} has been paid to the service provider.`,
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
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <LinearGradient
            colors={['#10B981', '#059669']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.header}
          >
            <Ionicons name="checkmark-circle" size={48} color="#FFFFFF" />
            <Text style={styles.headerTitle}>Job Completed! ✨</Text>
            <Text style={styles.headerSubtitle}>Complete your payment</Text>
          </LinearGradient>

          {/* Payment Details */}
          <View style={styles.content}>
            <View style={styles.serviceInfo}>
              <Text style={styles.serviceLabel}>Service</Text>
              <Text style={styles.serviceName}>{serviceName}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.paymentBreakdown}>
              <View style={styles.paymentRow}>
                <Text style={styles.paymentLabel}>Initial Payment (25%)</Text>
                <View style={styles.paidBadge}>
                  <Ionicons name="checkmark-circle" size={14} color="#10B981" />
                  <Text style={styles.paidText}>₹{totalAmount * 0.25}</Text>
                </View>
              </View>

              <View style={[styles.paymentRow, styles.highlightRow]}>
                <Text style={styles.paymentLabelBold}>Remaining Payment (75%)</Text>
                <Text style={styles.amountHighlight}>₹{completionAmount}</Text>
              </View>

              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total Service Cost</Text>
                <Text style={styles.totalAmount}>₹{totalAmount}</Text>
              </View>
            </View>

            {/* Info Message */}
            <View style={styles.infoBox}>
              <Ionicons name="information-circle" size={20} color="#3B82F6" />
              <Text style={styles.infoText}>
                The service provider has successfully completed the job. Please pay the remaining amount to settle this booking.
              </Text>
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
              <LinearGradient
                colors={isPaying ? ['#94A3B8', '#64748B'] : ['#10B981', '#059669']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.payButtonGradient}
              >
                {isPaying ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="wallet" size={20} color="#FFFFFF" />
                    <Text style={styles.payButtonText}>Pay ₹{completionAmount}</Text>
                  </>
                )}
              </LinearGradient>
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
  container: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.xlarge,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  header: {
    padding: SPACING.xl,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: SPACING.md,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: SPACING.xs,
  },
  content: {
    padding: SPACING.xl,
  },
  serviceInfo: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  serviceLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  serviceName: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: SPACING.xs,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginBottom: SPACING.lg,
  },
  paymentBreakdown: {
    marginBottom: SPACING.lg,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  highlightRow: {
    backgroundColor: '#F0FDF4',
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.medium,
    marginTop: SPACING.sm,
  },
  paymentLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  paymentLabelBold: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  paidBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  paidText: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '600',
  },
  amountHighlight: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#10B981',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: SPACING.md,
    marginTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#EFF6FF',
    padding: SPACING.md,
    borderRadius: RADIUS.medium,
    gap: SPACING.sm,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#1E40AF',
    lineHeight: 18,
  },
  actions: {
    padding: SPACING.xl,
    paddingTop: 0,
    gap: SPACING.md,
  },
  payButton: {
    borderRadius: RADIUS.large,
    overflow: 'hidden',
  },
  payButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  payButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  laterButton: {
    padding: SPACING.md,
    alignItems: 'center',
  },
  laterButtonText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
});
