import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, SHADOWS } from '../../../utils/theme';
import { FadeInView } from '../../animations/FadeInView';
import { PAYMENT_METHODS } from '../../../utils/constants';

interface BookingStepReviewProps {
    basePrice: number;
    totalPrice: number;
    gstAmount: number;
    serviceGstRate: number;
    paymentMethod: string;
    onPaymentMethodChange: (method: string) => void;
    walletBalance: number;
    maxBonusUsable?: number;
    loadingWallet: boolean;
    initialPayment: number;
    completionPayment: number;
    hasInsufficientBalance: boolean;
    onTopUpPress: () => void;
    isHourlyService: boolean;
    hasOvertimeCharges: boolean;
    bookingTime: Date | null;
    endTime: Date | null;
    duration: number;
    providerHourlyRate: number;
}

export const BookingStepReview: React.FC<BookingStepReviewProps> = ({
    basePrice,
    totalPrice,
    gstAmount,
    serviceGstRate,
    paymentMethod,
    onPaymentMethodChange,
    walletBalance,
    maxBonusUsable = 0,
    loadingWallet,
    initialPayment,
    completionPayment,
    hasInsufficientBalance,
    onTopUpPress,
    isHourlyService,
    hasOvertimeCharges,
    bookingTime,
    endTime,
    duration,
    providerHourlyRate,
}) => {
    return (
        <View style={styles.container}>
            {/* Payment Method Selection */}
            <FadeInView delay={100} style={styles.sectionContainer}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Payment Method</Text>
                </View>

                <View style={styles.cardContainerNoPadding}>
                    <View style={{ padding: 16, gap: 12 }}>
                        {PAYMENT_METHODS.map((method: any) => {
                            const isSelected = paymentMethod === method.id;
                            const isWallet = method.id === 'wallet';

                            return (
                                <TouchableOpacity
                                    key={method.id}
                                    style={[
                                        styles.methodCard,
                                        isSelected && { borderColor: COLORS.primary, backgroundColor: '#EFF6FF' },
                                        isSelected && SHADOWS.md,
                                    ]}
                                    onPress={() => onPaymentMethodChange(method.id)}
                                    activeOpacity={0.7}
                                >
                                    <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16 }}>
                                        <View style={[
                                            styles.methodIcon,
                                            isSelected && { backgroundColor: COLORS.primary }
                                        ]}>
                                            <Ionicons
                                                name={method.icon as any}
                                                size={26}
                                                color={isSelected ? COLORS.white : COLORS.textSecondary}
                                            />
                                        </View>

                                        <View style={{ flex: 1 }}>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                                                <Text style={[styles.methodLabel, isSelected && { color: '#1E40AF' }]}>
                                                    {method.label}
                                                </Text>
                                                {method.recommended && (
                                                    <View style={styles.recommendedBadge}>
                                                        <Text style={styles.recommendedText}>RECOMMENDED</Text>
                                                    </View>
                                                )}
                                            </View>

                                            {method.description && (
                                                <Text style={[styles.methodDesc, isSelected && { color: COLORS.primary }]}>
                                                    {method.description}
                                                </Text>
                                            )}

                                            {/* Wallet Balance + Bonus Credits */}
                                            {isWallet && !loadingWallet && (
                                                <View style={styles.walletInfoBox}>
                                                    <View style={styles.walletInfoRow}>
                                                        <View style={styles.walletInfoLabelRow}>
                                                            <Ionicons name="wallet-outline" size={13} color={COLORS.textSecondary} />
                                                            <Text style={styles.walletInfoLabel}>Wallet Balance</Text>
                                                        </View>
                                                        <Text style={styles.walletInfoValue}>₹{walletBalance.toFixed(2)}</Text>
                                                    </View>
                                                    {maxBonusUsable > 0 && (
                                                        <View style={styles.walletInfoRow}>
                                                            <View style={styles.walletInfoLabelRow}>
                                                                <Ionicons name="gift-outline" size={13} color={COLORS.primary} />
                                                                <Text style={[styles.walletInfoLabel, { color: COLORS.primary }]}>Bonus/Referral Credits</Text>
                                                            </View>
                                                            <Text style={[styles.walletInfoValue, { color: COLORS.primary }]}>
                                                                ₹{maxBonusUsable.toFixed(2)}
                                                            </Text>
                                                        </View>
                                                    )}
                                                </View>
                                            )}
                                        </View>

                                        <View style={[
                                            styles.radioCircle,
                                            isSelected && { borderColor: COLORS.primary, backgroundColor: COLORS.primary }
                                        ]}>
                                            {isSelected && <Ionicons name="checkmark" size={14} color={COLORS.white} />}
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    {/* Staged Payment Breakdown */}
                    {paymentMethod === 'wallet' && (
                        <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
                            <View style={styles.stagedCard}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                                    <Ionicons name="shield-checkmark" size={18} color="#16A34A" />
                                    <Text style={styles.stagedTitle}>Secure Staged Payment</Text>
                                </View>

                                <View style={styles.stagedRow}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        <View style={[styles.dot, { backgroundColor: COLORS.primary }]} />
                                        <Text style={styles.stagedLabel}>After Provider Accepts (25%)</Text>
                                    </View>
                                    <Text style={styles.stagedValue}>₹{initialPayment.toFixed(2)}</Text>
                                </View>

                                <View style={[styles.stagedRow, { marginTop: 8 }]}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        <View style={[styles.dot, { backgroundColor: COLORS.textTertiary }]} />
                                        <Text style={styles.stagedLabelDim}>After Service (75%)</Text>
                                    </View>
                                    <Text style={styles.stagedValueDim}>₹{completionPayment.toFixed(2)}</Text>
                                </View>
                            </View>

                            {hasInsufficientBalance && (
                                <TouchableOpacity
                                    style={styles.insufficientBanner}
                                    onPress={onTopUpPress}
                                >
                                    <View style={styles.insufficientIcon}>
                                        <Ionicons name="wallet-outline" size={20} color={COLORS.error} />
                                    </View>
                                    <View style={{ flex: 1, marginLeft: 12 }}>
                                        <Text style={styles.insufficientTitle}>Top Up Required</Text>
                                        <Text style={styles.insufficientDesc}>
                                            Add ₹{Math.max(0, initialPayment - walletBalance - maxBonusUsable).toFixed(0)} to book this service
                                        </Text>
                                    </View>
                                    <View style={styles.topUpButton}>
                                        <Text style={styles.topUpText}>Top Up</Text>
                                    </View>
                                </TouchableOpacity>
                            )}
                        </View>
                    )}
                </View>
            </FadeInView>

            {/* Receipt Summary */}
            <FadeInView delay={200} style={[styles.sectionContainer, { marginBottom: 100 }]}>
                <View style={styles.receiptCard}>
                    <View style={styles.receiptHeader}>
                        <Text style={styles.receiptTitle}>PAYMENT BREAKDOWN</Text>
                        <View style={styles.receiptBadge}>
                            <Text style={styles.receiptBadgeText}>UNPAID</Text>
                        </View>
                    </View>

                    {/* Table Header */}
                    <View style={styles.tableHeader}>
                        <Text style={[styles.tableCol, { flex: 2, textAlign: 'left' }]}>Item</Text>
                        <Text style={[styles.tableCol, { flex: 1, textAlign: 'center' }]}>Qty/Hrs</Text>
                        <Text style={[styles.tableCol, { flex: 1, textAlign: 'right' }]}>Amount</Text>
                    </View>

                    <View style={styles.dashedLine} />

                    {/* Line Items */}
                    <View style={styles.tableRow}>
                        <View style={{ flex: 2 }}>
                            <Text style={styles.lineItemTitle}>Service Base Fare</Text>
                            <Text style={styles.lineItemSubtitle}>Standard Charge</Text>
                        </View>
                        <Text style={styles.lineItemQty}>-</Text>
                        <Text style={styles.lineItemAmount}>₹{basePrice.toFixed(2)}</Text>
                    </View>

                    {(isHourlyService || hasOvertimeCharges) && bookingTime && endTime && (
                        <View style={styles.tableRow}>
                            <View style={{ flex: 2 }}>
                                <Text style={styles.lineItemTitle}>Hourly Charge</Text>
                                <Text style={styles.lineItemSubtitle}>
                                    ₹{providerHourlyRate}/hr
                                </Text>
                            </View>
                            <Text style={styles.lineItemQty}>{duration.toFixed(1)}</Text>
                            <Text style={styles.lineItemAmount}>₹{(duration * providerHourlyRate).toFixed(2)}</Text>
                        </View>
                    )}

                    <View style={[styles.dashedLine, { marginTop: 16 }]} />

                    {/* Summary Block */}
                    <View style={styles.summaryBlock}>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Subtotal</Text>
                            <Text style={styles.summaryValue}>₹{(totalPrice - gstAmount).toFixed(2)}</Text>
                        </View>

                        {serviceGstRate > 0 && (
                            <View style={styles.summaryRow}>
                                <Text style={styles.summaryLabel}>GST & Fees ({(serviceGstRate * 100).toFixed(0)}%)</Text>
                                <Text style={styles.summaryValue}>₹{gstAmount.toFixed(2)}</Text>
                            </View>
                        )}

                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Platform Fee</Text>
                            <Text style={styles.summaryValue}>₹0.00</Text>
                        </View>
                    </View>

                    <View style={[styles.solidLine, { marginVertical: 12 }]} />

                    {/* Total */}
                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabelReceipt}>Grand Total</Text>
                        <Text style={styles.totalAmountReceipt}>₹{totalPrice.toFixed(2)}</Text>
                    </View>

                    {/* Wallet Breakdown */}
                    {paymentMethod === 'wallet' && (
                        <View style={styles.walletBreakdown}>
                            <View style={styles.walletRow}>
                                <Ionicons name="checkmark-circle" size={16} color={COLORS.primary} />
                                <Text style={styles.walletText}>Pay Now (25%)</Text>
                                <Text style={styles.walletAmount}>₹{initialPayment.toFixed(2)}</Text>
                            </View>
                            {maxBonusUsable > 0 && (
                                <View style={[styles.walletRow, { paddingLeft: 24 }]}>
                                    <Text style={styles.walletSubText}>Incl. bonus credit</Text>
                                    <Text style={styles.walletSubAmount}>
                                        - ₹{Math.min(maxBonusUsable, initialPayment).toFixed(2)}
                                    </Text>
                                </View>
                            )}
                            <View style={styles.walletRow}>
                                <Ionicons name="time" size={16} color={COLORS.textTertiary} />
                                <Text style={[styles.walletText, { color: COLORS.textSecondary }]}>Pay Later (75%)</Text>
                                <Text style={[styles.walletAmount, { color: COLORS.textSecondary }]}>₹{completionPayment.toFixed(2)}</Text>
                            </View>
                        </View>
                    )}
                </View>
            </FadeInView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingBottom: 20,
    },
    sectionContainer: {
        marginBottom: 24,
    },
    sectionHeader: {
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#475569',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    cardContainerNoPadding: {
        backgroundColor: '#fff',
        borderRadius: 24,
        ...SHADOWS.sm,
        borderWidth: 1,
        borderColor: COLORS.gray100,
        overflow: 'hidden',
    },
    methodCard: {
        borderRadius: 16,
        borderWidth: 2,
        borderColor: COLORS.gray200,
        backgroundColor: COLORS.white,
        overflow: 'hidden',
    },
    methodIcon: {
        width: 52,
        height: 52,
        borderRadius: 14,
        backgroundColor: COLORS.gray100,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
    },
    methodLabel: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1E293B',
    },
    recommendedBadge: {
        backgroundColor: COLORS.success,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
        marginLeft: 10,
    },
    recommendedText: {
        fontSize: 10,
        color: COLORS.white,
        fontWeight: '700',
    },
    methodDesc: {
        fontSize: 13,
        color: COLORS.textSecondary,
        lineHeight: 18,
    },
    radioCircle: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#CBD5E1',
        backgroundColor: 'transparent',
        alignItems: 'center',
        justifyContent: 'center',
    },
    stagedCard: {
        backgroundColor: '#F0FDF4',
        borderRadius: 14,
        padding: 14,
        borderWidth: 1,
        borderColor: '#BBF7D0',
    },
    stagedTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: '#166534',
        marginLeft: 8,
    },
    stagedRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        marginRight: 8,
    },
    stagedLabel: {
        fontSize: 14,
        color: '#374151',
    },
    stagedValue: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1F2937',
    },
    stagedLabelDim: {
        fontSize: 14,
        color: '#6B7280',
    },
    stagedValueDim: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6B7280',
    },
    insufficientBanner: {
        backgroundColor: '#FEF2F2',
        borderRadius: 14,
        padding: 14,
        marginTop: 10,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#FECACA',
    },
    insufficientIcon: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: '#FEE2E2',
        alignItems: 'center',
        justifyContent: 'center',
    },
    insufficientTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: COLORS.error,
    },
    insufficientDesc: {
        fontSize: 12,
        color: '#B91C1C',
        marginTop: 2,
    },
    topUpButton: {
        backgroundColor: COLORS.error,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    topUpText: {
        fontSize: 12,
        fontWeight: '600',
        color: COLORS.white,
    },
    receiptCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 24,
        ...SHADOWS.md,
        borderWidth: 1,
        borderColor: COLORS.gray100,
    },
    receiptHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    receiptTitle: {
        fontSize: 14,
        fontWeight: '800',
        color: '#1E293B',
        letterSpacing: 0.5,
    },
    receiptBadge: {
        backgroundColor: '#F1F5F9',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    receiptBadgeText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#64748B',
    },
    tableHeader: {
        flexDirection: 'row',
        marginBottom: 12,
    },
    tableCol: {
        fontSize: 12,
        fontWeight: '600',
        color: '#94A3B8',
        textTransform: 'uppercase',
    },
    tableRow: {
        flexDirection: 'row',
        marginBottom: 16,
    },
    lineItemTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#334155',
        marginBottom: 2,
    },
    lineItemSubtitle: {
        fontSize: 12,
        color: '#94A3B8',
    },
    lineItemQty: {
        flex: 1,
        textAlign: 'center',
        fontSize: 14,
        color: '#64748B',
    },
    lineItemAmount: {
        flex: 1,
        textAlign: 'right',
        fontSize: 14,
        fontWeight: '600',
        color: '#334155',
    },
    summaryBlock: {
        gap: 8,
    },
    solidLine: {
        height: 1,
        backgroundColor: '#E2E8F0',
    },
    walletBreakdown: {
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0',
        gap: 8,
    },
    walletRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    walletText: {
        fontSize: 13,
        fontWeight: '600',
        color: COLORS.primary,
        marginLeft: 8,
        flex: 1,
    },
    walletSubText: {
        fontSize: 11,
        fontWeight: '500',
        color: COLORS.textTertiary,
        flex: 1,
    },
    walletSubAmount: {
        fontSize: 11,
        fontWeight: '600',
        color: COLORS.textTertiary,
    },
    walletInfoBox: {
        marginTop: 10,
        backgroundColor: COLORS.gray50,
        borderRadius: 10,
        padding: 10,
        gap: 6,
    },
    walletInfoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    walletInfoLabelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
    },
    walletInfoLabel: {
        fontSize: 12,
        color: COLORS.textSecondary,
        fontWeight: '500',
    },
    walletInfoValue: {
        fontSize: 13,
        fontWeight: '700',
        color: COLORS.text,
    },
    walletAmount: {
        fontSize: 13,
        fontWeight: '700',
        color: COLORS.primary,
    },
    // Keep existing...
    dashedLine: {
        height: 1,
        borderWidth: 1,
        borderColor: COLORS.gray200,
        borderStyle: 'dashed',
        marginBottom: 16,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    summaryLabel: {
        fontSize: 14,
        color: '#64748B',
    },
    summaryValue: {
        fontSize: 14,
        color: '#334155',
        fontWeight: '500',
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    totalLabelReceipt: {
        fontSize: 18,
        fontWeight: '800',
        color: '#0F172A',
    },
    totalAmountReceipt: {
        fontSize: 22,
        fontWeight: '800',
        color: COLORS.primary,
    },
});
