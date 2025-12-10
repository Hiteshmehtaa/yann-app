import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS, SHADOWS } from '../../utils/theme';

interface PriceBreakdown {
  basePrice: number;
  serviceFee?: number;
  taxes?: number;
  discount?: number;
  totalPrice: number;
}

interface BillingSummaryCardProps {
  priceBreakdown: PriceBreakdown;
  serviceName: string;
  providerName?: string;
  containerStyle?: ViewStyle;
}

export const BillingSummaryCard: React.FC<BillingSummaryCardProps> = ({
  priceBreakdown,
  serviceName,
  providerName,
  containerStyle,
}) => {
  const { basePrice, serviceFee = 0, taxes = 0, discount = 0, totalPrice } = priceBreakdown;
  const showBreakdown = serviceFee > 0 || taxes > 0 || discount > 0;

  return (
    <View style={[styles.container, containerStyle]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerIconContainer}>
          <Ionicons name="receipt" size={20} color={COLORS.primary} />
        </View>
        <Text style={styles.headerTitle}>Billing Summary</Text>
      </View>

      {/* Price Breakdown */}
      <View style={styles.content}>
        {/* Service Name */}
        <View style={styles.serviceRow}>
          <Text style={styles.serviceLabel}>Service</Text>
          <Text style={styles.serviceName} numberOfLines={1}>
            {serviceName}
          </Text>
        </View>

        <View style={styles.divider} />

        {/* Base Price */}
        <View style={styles.priceRow}>
          <Text style={styles.priceLabel}>Base Price</Text>
          <Text style={styles.priceValue}>₹{basePrice.toFixed(2)}</Text>
        </View>

        {/* Service Fee (if provider selected) */}
        {serviceFee > 0 && (
          <View style={styles.priceRow}>
            <View style={styles.labelWithIcon}>
              <Text style={styles.priceLabel}>Service Fee</Text>
              {providerName && (
                <View style={styles.providerTag}>
                  <Ionicons name="person" size={10} color={COLORS.primary} />
                  <Text style={styles.providerTagText}>{providerName}</Text>
                </View>
              )}
            </View>
            <Text style={styles.priceValue}>₹{serviceFee.toFixed(2)}</Text>
          </View>
        )}

        {/* Taxes (if applicable) */}
        {taxes > 0 && (
          <View style={styles.priceRow}>
            <View style={styles.labelWithIcon}>
              <Text style={styles.priceLabel}>Taxes & Fees</Text>
              <View style={styles.infoTag}>
                <Text style={styles.infoTagText}>GST</Text>
              </View>
            </View>
            <Text style={styles.priceValue}>₹{taxes.toFixed(2)}</Text>
          </View>
        )}

        {/* Discount (if applicable) */}
        {discount > 0 && (
          <View style={styles.priceRow}>
            <View style={styles.labelWithIcon}>
              <Text style={styles.priceLabel}>Discount</Text>
              <View style={styles.discountTag}>
                <Ionicons name="pricetag" size={10} color={COLORS.success} />
                <Text style={styles.discountTagText}>Applied</Text>
              </View>
            </View>
            <Text style={styles.discountValue}>-₹{discount.toFixed(2)}</Text>
          </View>
        )}

        {showBreakdown && <View style={styles.divider} />}

        {/* Total */}
        <View style={styles.totalRow}>
          <LinearGradient
            colors={[COLORS.primary, COLORS.primaryGradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.totalGradient}
          >
            <View style={styles.totalContent}>
              <View>
                <Text style={styles.totalLabel}>Total Amount</Text>
                <Text style={styles.totalSubtext}>Inclusive of all taxes</Text>
              </View>
              <View style={styles.totalPriceContainer}>
                <Text style={styles.currencySymbol}>₹</Text>
                <Text style={styles.totalValue}>{totalPrice.toFixed(0)}</Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Payment Note */}
        <View style={styles.noteContainer}>
          <Ionicons name="information-circle" size={16} color={COLORS.info} />
          <Text style={styles.noteText}>
            Payment will be collected after service completion
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.large,
    ...SHADOWS.md,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.lg,
    paddingBottom: SPACING.md,
    gap: SPACING.sm,
  },
  headerIconContainer: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.small,
    backgroundColor: `${COLORS.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.size.lg,
    fontWeight: '700',
    color: COLORS.text,
  },
  content: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.lg,
  },
  serviceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  serviceLabel: {
    fontSize: TYPOGRAPHY.size.sm,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  serviceName: {
    fontSize: TYPOGRAPHY.size.sm,
    fontWeight: '700',
    color: COLORS.text,
    flex: 1,
    textAlign: 'right',
    marginLeft: SPACING.md,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.divider,
    marginVertical: SPACING.md,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  labelWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  priceLabel: {
    fontSize: TYPOGRAPHY.size.md,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  priceValue: {
    fontSize: TYPOGRAPHY.size.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  infoTag: {
    backgroundColor: `${COLORS.info}15`,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.small,
  },
  infoTagText: {
    fontSize: TYPOGRAPHY.size.xs,
    fontWeight: '700',
    color: COLORS.info,
    textTransform: 'uppercase',
  },
  discountTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${COLORS.success}15`,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.small,
    gap: 2,
  },
  discountTagText: {
    fontSize: TYPOGRAPHY.size.xs,
    fontWeight: '700',
    color: COLORS.success,
    textTransform: 'uppercase',
  },
  discountValue: {
    fontSize: TYPOGRAPHY.size.md,
    fontWeight: '700',
    color: COLORS.success,
  },
  providerTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${COLORS.primary}12`,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.small,
    gap: 2,
  },
  providerTagText: {
    fontSize: TYPOGRAPHY.size.xs,
    fontWeight: '700',
    color: COLORS.primary,
    textTransform: 'uppercase',
  },
  totalRow: {
    marginTop: SPACING.sm,
    borderRadius: RADIUS.medium,
    overflow: 'hidden',
  },
  totalGradient: {
    padding: SPACING.lg,
  },
  totalContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: TYPOGRAPHY.size.md,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: 2,
  },
  totalSubtext: {
    fontSize: TYPOGRAPHY.size.xs,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  totalPriceContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  currencySymbol: {
    fontSize: TYPOGRAPHY.size.lg,
    fontWeight: '700',
    color: COLORS.white,
    marginTop: 4,
    marginRight: 2,
  },
  totalValue: {
    fontSize: TYPOGRAPHY.size.xxxl,
    fontWeight: '800',
    color: COLORS.white,
    letterSpacing: -1,
  },
  noteContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: `${COLORS.info}08`,
    padding: SPACING.sm,
    borderRadius: RADIUS.small,
    gap: SPACING.xs,
    marginTop: SPACING.md,
  },
  noteText: {
    flex: 1,
    fontSize: TYPOGRAPHY.size.xs,
    color: COLORS.textSecondary,
    fontWeight: '500',
    lineHeight: 16,
  },
});
