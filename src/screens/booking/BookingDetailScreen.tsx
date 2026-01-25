import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    StatusBar,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { format } from 'date-fns';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { COLORS, SPACING, RADIUS, SHADOWS, TYPOGRAPHY } from '../../utils/theme';
import { STATUS_COLORS } from '../../utils/constants';
import { RatingModal } from '../../components/RatingModal';
import { JobTimer } from '../../components/JobTimer';
import { apiService } from '../../services/api';
import type { Booking } from '../../types';

type Props = {
    navigation: NativeStackNavigationProp<any>;
    route: RouteProp<{ params: { booking: Booking } }, 'params'>;
};

export const BookingDetailScreen: React.FC<Props> = ({ navigation, route }) => {
    const { booking: initialBooking } = route.params;
    const [booking, setBooking] = useState<Booking>(initialBooking);
    const [showRatingModal, setShowRatingModal] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isPayingCompletion, setIsPayingCompletion] = useState(false);

    // Check if booking needs 75% completion payment
    const needsCompletionPayment = () => {
        return (
            booking.status === 'completed' &&
            (booking.paymentMethod as string) === 'wallet' &&
            (booking as any).walletPaymentStage === 'initial_25_released'
        );
    };

    // Check if booking is eligible for rating
    const canRate = () => {
        if (booking.status !== 'completed') return false;
        if ((booking as any).hasBeenRated) return false;

        // Check if within 30 days
        if (booking.completedAt) {
            const daysSince = (Date.now() - new Date(booking.completedAt).getTime()) / (1000 * 60 * 60 * 24);
            return daysSince <= 30;
        }
        return false;
    };

    // Handle 75% completion payment
    const handleCompletionPayment = async () => {
        try {
            setIsPayingCompletion(true);
            const response = await apiService.payCompletionAmount(booking._id);

            if (response.success) {
                Alert.alert(
                    'Payment Successful!',
                    `₹${(booking as any).escrowDetails?.completionAmount || booking.totalPrice * 0.75} has been paid to the service provider.`,
                    [
                        {
                            text: 'OK',
                            onPress: () => {
                                // Update booking state
                                setBooking(prev => ({
                                    ...prev,
                                    walletPaymentStage: 'completed',
                                    paymentStatus: 'paid'
                                } as any));
                            },
                        },
                    ]
                );
            }
        } catch (error: any) {
            Alert.alert(
                'Payment Failed',
                error.message || 'Unable to process the completion payment. Please try again.',
                [{ text: 'OK' }]
            );
        } finally {
            setIsPayingCompletion(false);
        }
    };

    const handleSubmitRating = async (rating: number, comment: string) => {
        try {
            await apiService.createReview({
                bookingId: booking._id,
                rating,
                comment,
            });

            Alert.alert(
                'Success',
                'Thank you for your feedback!',
                [
                    {
                        text: 'OK',
                        onPress: () => {
                            // Update booking to mark as rated
                            setBooking(prev => ({ ...prev, hasBeenRated: true } as any));
                            setShowRatingModal(false);
                        },
                    },
                ]
            );
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to submit rating');
        }
    };

    const formattedDate = booking.bookingDate
        ? format(new Date(booking.bookingDate), 'EEEE, MMMM dd, yyyy')
        : 'N/A';

    const providerName = (booking as any).providerName || 'Provider';

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="arrow-back" size={24} color={COLORS.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Booking Details</Text>
                <View style={styles.headerRight} />
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Status Badge */}
                <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[booking.status] + '15' }]}>
                    <View style={[styles.statusDot, { backgroundColor: STATUS_COLORS[booking.status] }]} />
                    <Text style={[styles.statusText, { color: STATUS_COLORS[booking.status] }]}>
                        {booking.status.toUpperCase()}
                    </Text>
                </View>

                {/* Service Info Card */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <View style={styles.serviceIcon}>
                            <Ionicons name="briefcase" size={24} color={COLORS.primary} />
                        </View>
                        <View style={styles.cardHeaderText}>
                            <Text style={styles.serviceName}>{booking.serviceName}</Text>
                            <Text style={styles.serviceCategory}>{booking.serviceCategory}</Text>
                        </View>
                    </View>
                </View>

                {/* Provider Info Card */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Service Provider</Text>
                    <View style={styles.providerRow}>
                        <View style={styles.providerAvatar}>
                            <Text style={styles.providerInitial}>{providerName.charAt(0).toUpperCase()}</Text>
                        </View>
                        <Text style={styles.providerName}>{providerName}</Text>
                    </View>
                </View>

                {/* Booking Details Card */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Booking Information</Text>

                    <View style={styles.infoRow}>
                        <Ionicons name="calendar-outline" size={20} color={COLORS.textSecondary} />
                        <View style={styles.infoContent}>
                            <Text style={styles.infoLabel}>Date</Text>
                            <Text style={styles.infoValue}>{formattedDate}</Text>
                        </View>
                    </View>

                    <View style={styles.infoRow}>
                        <Ionicons name="time-outline" size={20} color={COLORS.textSecondary} />
                        <View style={styles.infoContent}>
                            <Text style={styles.infoLabel}>Time</Text>
                            <Text style={styles.infoValue}>{booking.bookingTime}</Text>
                        </View>
                    </View>

                    <View style={styles.infoRow}>
                        <Ionicons name="location-outline" size={20} color={COLORS.textSecondary} />
                        <View style={styles.infoContent}>
                            <Text style={styles.infoLabel}>Address</Text>
                            <Text style={styles.infoValue}>{booking.customerAddress}</Text>
                        </View>
                    </View>

                    {booking.notes && (
                        <View style={styles.infoRow}>
                            <Ionicons name="document-text-outline" size={20} color={COLORS.textSecondary} />
                            <View style={styles.infoContent}>
                                <Text style={styles.infoLabel}>Notes</Text>
                                <Text style={styles.infoValue}>{booking.notes}</Text>
                            </View>
                        </View>
                    )}
                </View>

                {/* Payment Card */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Payment Details</Text>

                    <View style={styles.priceRow}>
                        <Text style={styles.priceLabel}>Base Price</Text>
                        <Text style={styles.priceValue}>₹{booking.basePrice}</Text>
                    </View>

                    {booking.extras && booking.extras.length > 0 && (
                        <>
                            {booking.extras.map((extra, index) => (
                                <View key={index} style={styles.priceRow}>
                                    <Text style={styles.priceLabel}>{extra.serviceName || 'Extra Service'}</Text>
                                    <Text style={styles.priceValue}>₹{extra.price}</Text>
                                </View>
                            ))}
                        </>
                    )}

                    <View style={styles.divider} />

                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>Total Amount</Text>
                        <Text style={styles.totalValue}>₹{booking.totalPrice}</Text>
                    </View>

                    <View style={styles.paymentMethodRow}>
                        <Text style={styles.paymentMethodLabel}>Payment Method</Text>
                        <Text style={styles.paymentMethodValue}>{booking.paymentMethod?.toUpperCase() || 'N/A'}</Text>
                    </View>

                    {/* Staged Payment Status for Wallet Payments */}
                    {(booking.paymentMethod as string) === 'wallet' && (booking as any).escrowDetails && (
                        <>
                            <View style={styles.divider} />
                            <View style={{ backgroundColor: '#F0F9FF', borderRadius: 12, padding: 12, marginTop: 8 }}>
                                <Text style={{ fontSize: 12, fontWeight: '600', color: '#0369A1', marginBottom: 8 }}>
                                    Staged Payment Status
                                </Text>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                                    <Text style={{ fontSize: 13, color: '#0C4A6E' }}>Initial Payment (25%)</Text>
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        <Ionicons name="checkmark-circle" size={14} color="#10B981" style={{ marginRight: 4 }} />
                                        <Text style={{ fontSize: 13, color: '#10B981', fontWeight: '600' }}>
                                            ₹{(booking as any).escrowDetails.initialAmount}
                                        </Text>
                                    </View>
                                </View>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                    <Text style={{ fontSize: 13, color: '#0C4A6E' }}>Completion Payment (75%)</Text>
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        <Ionicons
                                            name={(booking as any).walletPaymentStage === 'completed' ? 'checkmark-circle' : 'time-outline'}
                                            size={14}
                                            color={(booking as any).walletPaymentStage === 'completed' ? '#10B981' : '#EAB308'}
                                            style={{ marginRight: 4 }}
                                        />
                                        <Text style={{
                                            fontSize: 13,
                                            color: (booking as any).walletPaymentStage === 'completed' ? '#10B981' : '#EAB308',
                                            fontWeight: '600'
                                        }}>
                                            ₹{(booking as any).escrowDetails.completionAmount}
                                            {(booking as any).walletPaymentStage !== 'completed' && ' (Pending)'}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        </>
                    )}
                </View>

                {/* Job Timer - Show for active jobs */}
                {(booking.status === 'accepted' || booking.status === 'in_progress') && (booking as any).jobSession?.startTime && (
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>Job Progress</Text>
                        <JobTimer
                            startTime={new Date((booking as any).jobSession.startTime)}
                            expectedDuration={(booking as any).jobSession.expectedDuration || 60}
                            variant="compact"
                        />
                    </View>
                )}

                {/* Completion Payment Button - For staged wallet payments */}
                {needsCompletionPayment() && (
                    <TouchableOpacity
                        style={[styles.rateButton, { marginBottom: 8 }]}
                        onPress={handleCompletionPayment}
                        activeOpacity={0.8}
                        disabled={isPayingCompletion}
                    >
                        <LinearGradient
                            colors={isPayingCompletion ? ['#94A3B8', '#64748B'] : ['#10B981', '#059669']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.rateButtonGradient}
                        >
                            <Ionicons name="wallet" size={20} color="#FFFFFF" />
                            <Text style={styles.rateButtonText}>
                                {isPayingCompletion
                                    ? 'Processing...'
                                    : `Pay Remaining ₹${(booking as any).escrowDetails?.completionAmount || Math.round(booking.totalPrice * 0.75)}`
                                }
                            </Text>
                        </LinearGradient>
                    </TouchableOpacity>
                )}

                {/* Rate Provider Button - Only for completed bookings */}
                {canRate() && (
                    <TouchableOpacity
                        style={styles.rateButton}
                        onPress={() => setShowRatingModal(true)}
                        activeOpacity={0.8}
                    >
                        <LinearGradient
                            colors={['#60A5FA', '#3B82F6']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.rateButtonGradient}
                        >
                            <Ionicons name="star" size={20} color="#FFFFFF" />
                            <Text style={styles.rateButtonText}>Rate Your Experience</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                )}

                {booking.status === 'completed' && (booking as any).hasBeenRated && (
                    <View style={styles.ratedBadge}>
                        <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                        <Text style={styles.ratedText}>You've rated this service</Text>
                    </View>
                )}
            </ScrollView>

            {/* Rating Modal */}
            <RatingModal
                visible={showRatingModal}
                onClose={() => setShowRatingModal(false)}
                onSubmit={handleSubmitRating}
                providerName={providerName}
                serviceName={booking.serviceName}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.md,
        backgroundColor: COLORS.white,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.divider,
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'flex-start',
    },
    headerRight: {
        width: 40,
    },
    headerTitle: {
        fontSize: TYPOGRAPHY.size.xl,
        fontWeight: TYPOGRAPHY.weight.bold,
        color: COLORS.text,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: SPACING.lg,
        paddingBottom: 40,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        marginBottom: SPACING.lg,
        gap: 8,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    card: {
        backgroundColor: COLORS.white,
        borderRadius: RADIUS.large,
        padding: SPACING.lg,
        marginBottom: SPACING.md,
        ...SHADOWS.sm,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.md,
    },
    serviceIcon: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: COLORS.primary + '15',
        alignItems: 'center',
        justifyContent: 'center',
    },
    cardHeaderText: {
        flex: 1,
    },
    serviceName: {
        fontSize: TYPOGRAPHY.size.lg,
        fontWeight: '700',
        color: COLORS.text,
        marginBottom: 4,
    },
    serviceCategory: {
        fontSize: TYPOGRAPHY.size.sm,
        color: COLORS.textSecondary,
        textTransform: 'capitalize',
    },
    cardTitle: {
        fontSize: TYPOGRAPHY.size.md,
        fontWeight: '700',
        color: COLORS.text,
        marginBottom: SPACING.md,
    },
    providerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.md,
    },
    providerAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    providerInitial: {
        fontSize: 18,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    providerName: {
        fontSize: TYPOGRAPHY.size.md,
        fontWeight: '600',
        color: COLORS.text,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: SPACING.md,
        marginBottom: SPACING.md,
    },
    infoContent: {
        flex: 1,
    },
    infoLabel: {
        fontSize: TYPOGRAPHY.size.xs,
        color: COLORS.textSecondary,
        marginBottom: 4,
    },
    infoValue: {
        fontSize: TYPOGRAPHY.size.sm,
        color: COLORS.text,
        fontWeight: '500',
    },
    priceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.sm,
    },
    priceLabel: {
        fontSize: TYPOGRAPHY.size.sm,
        color: COLORS.textSecondary,
    },
    priceValue: {
        fontSize: TYPOGRAPHY.size.sm,
        fontWeight: '600',
        color: COLORS.text,
    },
    divider: {
        height: 1,
        backgroundColor: COLORS.divider,
        marginVertical: SPACING.md,
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.sm,
    },
    totalLabel: {
        fontSize: TYPOGRAPHY.size.md,
        fontWeight: '700',
        color: COLORS.text,
    },
    totalValue: {
        fontSize: TYPOGRAPHY.size.xl,
        fontWeight: '800',
        color: COLORS.primary,
    },
    paymentMethodRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: SPACING.sm,
        borderTopWidth: 1,
        borderTopColor: COLORS.divider,
    },
    paymentMethodLabel: {
        fontSize: TYPOGRAPHY.size.xs,
        color: COLORS.textSecondary,
    },
    paymentMethodValue: {
        fontSize: TYPOGRAPHY.size.sm,
        fontWeight: '600',
        color: COLORS.text,
    },
    rateButton: {
        borderRadius: RADIUS.medium,
        overflow: 'hidden',
        marginTop: SPACING.md,
        ...SHADOWS.md,
    },
    rateButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        gap: 8,
    },
    rateButtonText: {
        fontSize: TYPOGRAPHY.size.md,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    ratedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 16,
        marginTop: SPACING.md,
        backgroundColor: '#ECFDF5',
        borderRadius: RADIUS.medium,
    },
    ratedText: {
        fontSize: TYPOGRAPHY.size.sm,
        fontWeight: '600',
        color: '#10B981',
    },
});
