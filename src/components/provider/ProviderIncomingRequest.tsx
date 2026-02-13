import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    Animated,
    Dimensions,
    Vibration,
    Platform,
    ScrollView,
    Image, // Added Image import
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { apiService } from '../../services/api';
import { playBookingRequestBuzzer, stopBuzzer, playSuccessSound, playErrorSound } from '../../utils/soundNotifications';
import { COLORS } from '../../utils/theme';

const { width, height } = Dimensions.get('window');

// Premium Palette - Aligned with App Theme
const THEME_STYLES = {
    primary: COLORS.primary, // #3B82F6
    secondary: COLORS.textSecondary,
    accent: COLORS.primary,
    success: COLORS.success,
    danger: COLORS.error,
    surface: COLORS.white,
    background: COLORS.background,
    border: COLORS.border,
};

interface BookingRequestData {
    bookingId: string;
    serviceName: string;
    serviceCategory?: string;
    customerName: string;
    customerProfileImage?: string;
    customerAddress?: string;
    customerPhone?: string;
    bookingDate?: string;
    bookingTime?: string;
    totalPrice: number;
    bookedHours?: number;
    billingType?: string;
    notes?: string;
    expiresAt: string;
    driverDetails?: any;
    driverTripDetails?: any;
    pricingBreakdown?: any;
}

interface ProviderIncomingRequestProps {
    visible: boolean;
    requestData: BookingRequestData | null;
    providerId: string;
    onAccept: () => void;
    onReject: () => void;
    onDismiss: () => void;
}

const VIBRATION_PATTERN = [0, 1000, 1000, 1000, 1000, 1000, 1000]; // 1s vibrate, 1s pause loop
const VIBRATION_INTERVAL = 6000; // Repeat whole pattern every 6s

export const ProviderIncomingRequest: React.FC<ProviderIncomingRequestProps> = ({
    visible,
    requestData,
    providerId,
    onAccept,
    onReject,
    onDismiss,
}) => {
    // Strict Timer Initialization
    const [remainingSeconds, setRemainingSeconds] = useState(() => {
        if (requestData?.expiresAt) {
            const expires = new Date(requestData.expiresAt);
            const now = new Date();
            return Math.max(0, Math.floor((expires.getTime() - now.getTime()) / 1000));
        }
        return 180;
    });

    const [isAccepting, setIsAccepting] = useState(false);
    const [isRejecting, setIsRejecting] = useState(false);
    const [showDetails, setShowDetails] = useState(false);
    const [fetchedDetails, setFetchedDetails] = useState<any>(null);
    const [loadingDetails, setLoadingDetails] = useState(false);

    // Detect driver booking by serviceCategory or serviceName
    const isDriverBooking = !!(requestData?.serviceCategory === 'driver'
        || requestData?.serviceName?.toLowerCase().includes('driver'));

    // Auto-fetch booking details for driver bookings (pickup/drop/pricing)
    useEffect(() => {
        if (!visible || !isDriverBooking || !requestData?.bookingId) return;
        if (requestData.driverTripDetails || requestData.driverDetails || fetchedDetails) return;
        
        let cancelled = false;
        (async () => {
            try {
                const res = await apiService.getBookingById(requestData.bookingId);
                if (!cancelled && res.success && res.data) {
                    setFetchedDetails(res.data);
                }
            } catch (e) {
                console.log('Auto-fetch booking details failed:', e);
            }
        })();
        return () => { cancelled = true; };
    }, [visible, isDriverBooking, requestData?.bookingId]);

    // Animations
    const slideAnim = useRef(new Animated.Value(500)).current; // Slide up
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const vibrationRef = useRef<NodeJS.Timeout | null>(null);

    // 1. Timer Logic
    useEffect(() => {
        if (!visible || !requestData?.expiresAt) return;

        const stopAllEffects = async () => {
            try { await stopBuzzer(); } catch (e) { }

            // Cancel vibration
            if (Platform.OS !== 'web') {
                Vibration.cancel(); // Stops native loop on Android and current vibe on iOS
            }

            // Clear manual intervals
            if (vibrationRef.current) {
                clearInterval(vibrationRef.current);
                vibrationRef.current = null;
            }
        };

        const expiresAt = new Date(requestData.expiresAt);

        const updateRemaining = () => {
            const now = new Date();
            const remaining = Math.max(0, Math.floor((expiresAt.getTime() - now.getTime()) / 1000));
            setRemainingSeconds(remaining);

            if (remaining <= 0) {
                if (timerRef.current) {
                    clearInterval(timerRef.current);
                    timerRef.current = null;
                }
                stopAllEffects();
                onDismiss();
            }
        };

        updateRemaining();
        timerRef.current = setInterval(updateRemaining, 1000);

        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
        };
    }, [visible, requestData?.expiresAt, onDismiss]);

    // 2. Sound & Haptics
    useEffect(() => {
        // Wrap async call in function
        const startEffects = async () => {
            if (visible && requestData) {
                await startBuzzerEffects();
                // Entrance Animation
                Animated.parallel([
                    Animated.spring(slideAnim, {
                        toValue: 0,
                        useNativeDriver: true,
                        damping: 20,
                        stiffness: 150,
                    }),
                    Animated.timing(fadeAnim, {
                        toValue: 1,
                        duration: 300,
                        useNativeDriver: true,
                    })
                ]).start();
            } else {
                await stopAllEffects();
                slideAnim.setValue(500);
                fadeAnim.setValue(0);
            }
        };

        startEffects();

        return () => { stopAllEffects(); };
    }, [visible, requestData]);

    const startBuzzerEffects = async () => {
        // Wait 500ms to let system notification sound finish before starting in-app buzzer
        // This prevents double buzzer when app is opened from notification
        await new Promise(resolve => setTimeout(resolve, 500));
        
        try {
            // Play buzzer sound - it will loop continuously until stopBuzzer() is called
            await playBookingRequestBuzzer();
        } catch (e) { 
            console.log('Buzzer error', e); 
        }

        // Start continuous vibration
        if (Platform.OS === 'android') {
            // Android supports native looping: vibrate(pattern, repeatIndex)
            // Pattern: [wait, vibrate, wait]
            // repeatIndex: index to repeat from (1 = repeat vibrate+wait)
            Vibration.vibrate([0, 1000, 1000], 0); // Continuous loop
        } else {
            // iOS manual loop
            Vibration.vibrate(1000);
            vibrationRef.current = setInterval(() => {
                Vibration.vibrate(1000);
            }, 2000);
        }
    };

    const stopAllEffects = async () => {
        try { await stopBuzzer(); } catch (e) { }

        // Cancel vibration
        if (Platform.OS !== 'web') {
            Vibration.cancel(); // Stops native loop on Android and current vibe on iOS
        }

        // Clear manual intervals
        if (vibrationRef.current) {
            clearInterval(vibrationRef.current);
            vibrationRef.current = null;
        }
    };

    const handleAction = async (type: 'accept' | 'reject') => {
        console.log(`🖱️ handleAction triggered: ${type}`);
        if (isAccepting || isRejecting || !requestData) {
            console.log(`⚠️ handleAction blocked: isAccepting=${isAccepting}, isRejecting=${isRejecting}, hasData=${!!requestData}`);
            return;
        }

        if (type === 'accept') setIsAccepting(true);
        else setIsRejecting(true);

        console.log('🛑 Calling stopAllEffects from handleAction');
        await stopAllEffects(); // Await to ensure buzzer stops

        try {
            if (type === 'accept') await playSuccessSound();
            else await playErrorSound();

            console.log(`🚀 Sending ${type} API request...`);
            const response = await apiService.respondToBookingRequest(
                requestData.bookingId,
                providerId,
                type,
                type === 'reject' ? 'Provider declined' : undefined
            );

            if (response.success) {
                Haptics.notificationAsync(
                    type === 'accept'
                        ? Haptics.NotificationFeedbackType.Success
                        : Haptics.NotificationFeedbackType.Warning
                );
                type === 'accept' ? onAccept() : onReject();
            } else {
                throw new Error(response.message);
            }
        } catch (error) {
            console.error(`${type} failed:`, error);
            // Still close modal on error to prevent being stuck
            type === 'accept' ? onAccept() : onReject();
        } finally {
            setIsAccepting(false);
            setIsRejecting(false);
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return 'Today';
        const date = new Date(dateString);
        const today = new Date();
        const isToday = date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear();

        if (isToday) return 'Today';

        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric'
        });
    };

    if (!visible || !requestData) return null;

    return (
        <Modal
            visible={visible}
            transparent
            animationType="none"
            statusBarTranslucent
        >
            <BlurView intensity={50} tint="dark" style={styles.overlay}>
                <Animated.View
                    style={[
                        styles.container,
                        {
                            transform: [{ translateY: slideAnim }],
                            opacity: fadeAnim
                        }
                    ]}
                >
                    {/* Header Badge */}
                    <View style={styles.header}>
                        <LinearGradient
                            colors={[COLORS.primaryLight, '#EBF5FF']}
                            style={styles.badge}
                        >
                            <View style={[styles.badgeDot, { backgroundColor: COLORS.primary }]} />
                            <Text style={[styles.badgeText, { color: COLORS.primary }]}>NEW REQUEST</Text>
                        </LinearGradient>

                        <View style={[styles.timerContainer, remainingSeconds < 60 && styles.timerUrgent]}>
                            <Ionicons name="time-outline" size={14} color={remainingSeconds < 60 ? COLORS.error : COLORS.textSecondary} />
                            <Text style={[styles.timerText, remainingSeconds < 60 && styles.textUrgent]}>
                                {formatTime(remainingSeconds)}
                            </Text>
                        </View>
                    </View>

                    {/* Price Hero */}
                    <View style={styles.heroSection}>
                        <Text style={styles.heroLabel}>Your Earning</Text>
                        <Text style={styles.heroPrice}>₹{requestData.totalPrice?.toFixed?.(0) || requestData.totalPrice || 0}</Text>
                        <Text style={styles.serviceName}>{requestData.serviceName}</Text>
                        {requestData.bookedHours ? (
                            <Text style={styles.durationBadgeText}>{requestData.bookedHours} hrs • {requestData.billingType === 'hourly' ? 'Hourly' : 'Fixed'}</Text>
                        ) : null}
                    </View>

                    {/* Divider */}
                    <View style={styles.divider} />

                    {/* Details List */}
                    <ScrollView
                        style={styles.detailsContainer}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ paddingBottom: 24 }}
                    >
                        {/* Customer */}
                        <View style={styles.row}>
                            <View style={[styles.iconBox, requestData.customerProfileImage && { backgroundColor: 'transparent', overflow: 'hidden' }]}>
                                {requestData.customerProfileImage ? (
                                    <Image
                                        source={{ uri: requestData.customerProfileImage }}
                                        style={{ width: '100%', height: '100%', borderRadius: 12 }}
                                    />
                                ) : (
                                    <Ionicons name="person" size={18} color={COLORS.primary} />
                                )}
                            </View>
                            <View style={styles.rowContent}>
                                <Text style={styles.rowLabel}>Customer</Text>
                                <Text style={styles.rowValue}>{requestData.customerName}</Text>
                            </View>
                        </View>

                        {/* Pickup & Drop Location for Driver bookings */}
                        {isDriverBooking ? (
                            (() => {
                                // Resolve pickup/drop from notification data or fetched booking
                                const trip = requestData.driverTripDetails || fetchedDetails?.driverTripDetails || null;
                                const driver = requestData.driverDetails || fetchedDetails?.driverDetails || null;
                                const pickupText = trip?.pickupLocation?.address
                                    || driver?.pickupLocation
                                    || driver?.pickupAddress
                                    || requestData.customerAddress
                                    || 'Not specified';
                                const dropText = trip?.dropLocation?.address
                                    || driver?.dropLocation
                                    || driver?.dropAddress
                                    || 'Not specified';

                                return (
                                    <>
                                        {/* Pickup */}
                                        <View style={styles.row}>
                                            <View style={[styles.iconBox, { backgroundColor: '#ECFDF5' }]}>
                                                <Ionicons name="radio-button-on" size={16} color="#10B981" />
                                            </View>
                                            <View style={styles.rowContent}>
                                                <Text style={styles.rowLabel}>Pickup Location</Text>
                                                <Text style={styles.rowValue} numberOfLines={2}>
                                                    {pickupText}
                                                </Text>
                                            </View>
                                        </View>
                                        {/* Drop */}
                                        <View style={styles.row}>
                                            <View style={[styles.iconBox, { backgroundColor: '#FEF2F2' }]}>
                                                <Ionicons name="location" size={18} color="#EF4444" />
                                            </View>
                                            <View style={styles.rowContent}>
                                                <Text style={styles.rowLabel}>Drop Location</Text>
                                                <Text style={styles.rowValue} numberOfLines={2}>
                                                    {dropText}
                                                </Text>
                                            </View>
                                        </View>
                                    </>
                                );
                            })()
                        ) : (
                            /* Location — for non-driver bookings */
                            <View style={styles.row}>
                                <View style={styles.iconBox}>
                                    <Ionicons name="location" size={18} color={COLORS.primary} />
                                </View>
                                <View style={styles.rowContent}>
                                    <Text style={styles.rowLabel}>Location</Text>
                                    <Text style={styles.rowValue} numberOfLines={2}>
                                        {requestData.customerAddress || 'No address provided'}
                                    </Text>
                                </View>
                            </View>
                        )}

                        {/* Schedule */}
                        <View style={styles.row}>
                            <View style={styles.iconBox}>
                                <Ionicons name="calendar" size={18} color={COLORS.primary} />
                            </View>
                            <View style={styles.rowContent}>
                                <Text style={styles.rowLabel}>Schedule</Text>
                                <Text style={styles.rowValue}>
                                    {formatDate(requestData.bookingDate)} • {requestData.bookingTime}
                                </Text>
                            </View>
                        </View>

                        {/* View More Details (Driver) */}
                        {isDriverBooking && (
                            <>
                                <TouchableOpacity
                                    style={styles.viewDetailsBtn}
                                    onPress={async () => {
                                        const newShowDetails = !showDetails;
                                        setShowDetails(newShowDetails);
                                        // Fetch booking details from API if not available from notification
                                        if (newShowDetails && !requestData.driverTripDetails && !requestData.driverDetails && !fetchedDetails) {
                                            setLoadingDetails(true);
                                            try {
                                                const res = await apiService.getBookingById(requestData.bookingId);
                                                if (res.success && res.data) {
                                                    setFetchedDetails(res.data);
                                                }
                                            } catch (e) {
                                                console.log('Could not fetch booking details:', e);
                                            } finally {
                                                setLoadingDetails(false);
                                            }
                                        }
                                    }}
                                    activeOpacity={0.7}
                                >
                                    <Ionicons name={showDetails ? 'chevron-up' : 'chevron-down'} size={16} color={COLORS.primary} />
                                    <Text style={styles.viewDetailsBtnText}>
                                        {showDetails ? 'Hide Details' : 'View More Details'}
                                    </Text>
                                </TouchableOpacity>

                                {showDetails && (
                                    <View style={styles.expandedDetails}>
                                        {loadingDetails ? (
                                            <Text style={{ textAlign: 'center', color: COLORS.textSecondary, paddingVertical: 12, fontSize: 13 }}>Loading details...</Text>
                                        ) : (() => {
                                            // Use notification data first, then fetched data as fallback
                                            const tripDetails = requestData.driverTripDetails || fetchedDetails?.driverTripDetails || null;
                                            const driverDets = requestData.driverDetails || fetchedDetails?.driverDetails || null;
                                            const pricing = requestData.pricingBreakdown || fetchedDetails?.pricingBreakdown || null;
                                            const hours = requestData.bookedHours || fetchedDetails?.quantity || fetchedDetails?.bookedHours || 0;

                                            return (<>
                                        {/* Trip Type & Direction */}
                                        <View style={styles.detailRow}>
                                            <View style={styles.detailChip}>
                                                <Ionicons name="swap-horizontal" size={14} color="#6366F1" />
                                                <Text style={styles.detailChipText}>
                                                    {(tripDetails?.tripType || driverDets?.tripType || 'incity') === 'incity' ? 'In-City' : 'Outstation'}
                                                </Text>
                                            </View>
                                            <View style={styles.detailChip}>
                                                <Ionicons name="navigate" size={14} color="#6366F1" />
                                                <Text style={styles.detailChipText}>
                                                    {(tripDetails?.serviceType || driverDets?.serviceType || 'oneway') === 'oneway' ? 'One Way' : 'Round Trip'}
                                                </Text>
                                            </View>
                                        </View>

                                        {/* Vehicle & Transmission */}
                                        <View style={styles.detailRow}>
                                            {(tripDetails?.vehicleType || driverDets?.vehicleType) ? (
                                                <View style={[styles.detailChip, { backgroundColor: '#F0F9FF', borderColor: '#BAE6FD' }]}>
                                                    <Ionicons name="car-sport" size={14} color="#0EA5E9" />
                                                    <Text style={[styles.detailChipText, { color: '#0369A1' }]}>
                                                        {(tripDetails?.vehicleType || driverDets?.vehicleType || '').charAt(0).toUpperCase() + (tripDetails?.vehicleType || driverDets?.vehicleType || '').slice(1)}
                                                    </Text>
                                                </View>
                                            ) : null}
                                            {(tripDetails?.transmission || driverDets?.transmission) ? (
                                                <View style={[styles.detailChip, { backgroundColor: '#F0F9FF', borderColor: '#BAE6FD' }]}>
                                                    <Ionicons name="cog" size={14} color="#0EA5E9" />
                                                    <Text style={[styles.detailChipText, { color: '#0369A1' }]}>
                                                        {(tripDetails?.transmission || driverDets?.transmission) === 'manual' ? 'Manual Transmission' : 'Automatic Transmission'}
                                                    </Text>
                                                </View>
                                            ) : null}
                                        </View>

                                        {/* Distance */}
                                        {(tripDetails?.distanceKm || driverDets?.distanceKm) ? (
                                            <View style={styles.detailInfoRow}>
                                                <Text style={styles.detailInfoLabel}>Distance</Text>
                                                <Text style={styles.detailInfoValue}>
                                                    {Number(tripDetails?.distanceKm || driverDets?.distanceKm || 0).toFixed(1)} km
                                                </Text>
                                            </View>
                                        ) : null}

                                        {/* Duration */}
                                        {hours ? (
                                            <View style={styles.detailInfoRow}>
                                                <Text style={styles.detailInfoLabel}>Duration</Text>
                                                <Text style={styles.detailInfoValue}>{hours} hours</Text>
                                            </View>
                                        ) : null}

                                        {/* Rate */}
                                        {(driverDets?.hourlyRate || pricing?.hourlyRate) ? (
                                            <View style={styles.detailInfoRow}>
                                                <Text style={styles.detailInfoLabel}>Your Rate</Text>
                                                <Text style={styles.detailInfoValue}>
                                                    {pricing?.hourlyRate || `₹${driverDets?.hourlyRate}/hr`}
                                                </Text>
                                            </View>
                                        ) : null}

                                        {/* Return Fare */}
                                        {(tripDetails?.returnFare > 0 || driverDets?.driverReturnFare > 0) ? (
                                            <View style={styles.detailInfoRow}>
                                                <Text style={styles.detailInfoLabel}>Return Fare</Text>
                                                <Text style={styles.detailInfoValue}>
                                                    ₹{tripDetails?.returnFare || driverDets?.driverReturnFare || 0}
                                                </Text>
                                            </View>
                                        ) : null}

                                        {/* Pricing Breakdown */}
                                        {pricing && (
                                            <View style={styles.breakdownBox}>
                                                <Text style={styles.breakdownTitle}>Price Breakdown</Text>
                                                {pricing.baseCost != null && (
                                                    <View style={styles.breakdownRow}>
                                                        <Text style={styles.breakdownLabel}>Base ({pricing.duration || `${hours}hrs`})</Text>
                                                        <Text style={styles.breakdownValue}>₹{pricing.baseCost}</Text>
                                                    </View>
                                                )}
                                                {pricing.returnFare > 0 && (
                                                    <View style={styles.breakdownRow}>
                                                        <Text style={styles.breakdownLabel}>Return Fare</Text>
                                                        <Text style={styles.breakdownValue}>₹{pricing.returnFare}</Text>
                                                    </View>
                                                )}
                                                {pricing.gst > 0 && (
                                                    <View style={styles.breakdownRow}>
                                                        <Text style={styles.breakdownLabel}>GST ({pricing.gstPercentage || 18}%)</Text>
                                                        <Text style={styles.breakdownValue}>₹{pricing.gst}</Text>
                                                    </View>
                                                )}
                                                <View style={[styles.breakdownRow, styles.breakdownTotalRow]}>
                                                    <Text style={styles.breakdownTotalLabel}>Total</Text>
                                                    <Text style={styles.breakdownTotalValue}>₹{pricing.total || requestData.totalPrice}</Text>
                                                </View>
                                            </View>
                                        )}
                                    </>);
                                        })()}
                                    </View>
                                )}
                            </>
                        )}

                        {/* Notes */}
                        {requestData.notes ? (
                            <View style={styles.noteBox}>
                                <Text style={styles.noteTitle}>Note from customer:</Text>
                                <Text style={styles.noteText}>{requestData.notes}</Text>
                            </View>
                        ) : null}
                    </ScrollView>

                    {/* Actions - Fixed at Bottom */}
                    <View style={styles.actionContainer}>
                        <TouchableOpacity
                            style={styles.declineButton}
                            onPress={() => handleAction('reject')}
                            disabled={isAccepting || isRejecting}
                        >
                            <Ionicons name="close" size={24} color={COLORS.textSecondary} />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.acceptButtonWrapper}
                            onPress={() => handleAction('accept')}
                            disabled={isAccepting || isRejecting}
                            activeOpacity={0.9}
                        >
                            <LinearGradient
                                colors={['#3B82F6', '#2563EB']} // Primary Gradient
                                style={styles.acceptButton}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                            >
                                {isAccepting ? (
                                    <Text style={styles.acceptText}>Accepting...</Text>
                                ) : (
                                    <>
                                        <Text style={styles.acceptText}>Accept Job</Text>
                                        <Ionicons name="arrow-forward" size={20} color={COLORS.white} />
                                    </>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>

                </Animated.View>
            </BlurView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'flex-end', // Bottom sheet style
        backgroundColor: 'rgba(0,0,0,0.6)',
    },
    container: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingTop: 24,
        paddingHorizontal: 20,
        paddingBottom: 40,
        maxHeight: height * 0.85,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 25,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.primaryLight,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 100,
        gap: 6,
        borderWidth: 1,
        borderColor: '#DBEAFE',
    },
    badgeDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: COLORS.primary,
    },
    badgeText: {
        fontSize: 12,
        fontWeight: '700',
        color: COLORS.primary,
        letterSpacing: 0.5,
    },
    timerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#F1F5F9', // Slate 100
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 100,
    },
    timerUrgent: {
        backgroundColor: '#FEF2F2',
    },
    timerText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#71717A',
        fontVariant: ['tabular-nums'],
    },
    textUrgent: {
        color: '#EF4444',
    },
    heroSection: {
        alignItems: 'center',
        marginBottom: 24,
    },
    heroLabel: {
        fontSize: 14,
        color: COLORS.textSecondary,
        marginBottom: 4,
        fontWeight: '500',
    },
    heroPrice: {
        fontSize: 48,
        fontWeight: '800',
        color: COLORS.text,
        letterSpacing: -1,
        marginBottom: 8,
    },
    serviceName: {
        fontSize: 18,
        fontWeight: '600',
        color: COLORS.primary,
        textAlign: 'center',
    },
    durationBadgeText: {
        fontSize: 13,
        fontWeight: '600',
        color: COLORS.textSecondary,
        marginTop: 4,
    },
    divider: {
        height: 1,
        backgroundColor: '#F3F4F6',
        marginBottom: 24,
    },
    detailsContainer: {
        flexGrow: 0,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center', // Changed from flex-start to align icons better
        marginBottom: 20,
        gap: 16,
    },
    iconBox: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: COLORS.primaryLight,
        alignItems: 'center',
        justifyContent: 'center',
    },
    rowContent: {
        flex: 1,
    },
    rowLabel: {
        fontSize: 12,
        color: COLORS.textSecondary,
        marginBottom: 2,
        fontWeight: '500',
    },
    rowValue: {
        fontSize: 16,
        color: COLORS.text,
        fontWeight: '600',
    },
    distanceText: {
        fontSize: 12,
        color: '#71717A',
        marginTop: 2,
    },
    ratingBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFBEB',
        alignSelf: 'flex-start',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        marginTop: 4,
        gap: 2,
    },
    ratingText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#B45309',
    },
    noteBox: {
        backgroundColor: '#FEFCE8', // Light yellow
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#FEF08A',
        marginBottom: 20,
    },
    noteTitle: {
        fontSize: 12,
        fontWeight: '700',
        color: '#854D0E',
        marginBottom: 4,
    },
    noteText: {
        fontSize: 14,
        color: '#854D0E',
    },
    actionContainer: {
        flexDirection: 'row',
        gap: 16,
        marginTop: 8,
    },
    declineButton: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#F1F5F9', // Slate 100
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    acceptButtonWrapper: {
        flex: 1,
        height: 64,
        borderRadius: 32,
        overflow: 'hidden',
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 8,
    },
    acceptButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
    },
    acceptText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    // View More Details
    viewDetailsBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 10,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#DBEAFE',
        borderRadius: 12,
        backgroundColor: '#F0F7FF',
    },
    viewDetailsBtnText: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.primary,
    },
    expandedDetails: {
        backgroundColor: '#F8FAFC',
        borderRadius: 16,
        padding: 16,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    detailRow: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 10,
        flexWrap: 'wrap',
    },
    detailChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#EEF2FF',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#E0E7FF',
    },
    detailChipText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#4338CA',
    },
    detailInfoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 6,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    detailInfoLabel: {
        fontSize: 13,
        fontWeight: '500',
        color: COLORS.textSecondary,
    },
    detailInfoValue: {
        fontSize: 14,
        fontWeight: '700',
        color: COLORS.text,
    },
    breakdownBox: {
        marginTop: 12,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 14,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    breakdownTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: COLORS.text,
        marginBottom: 10,
    },
    breakdownRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 4,
    },
    breakdownLabel: {
        fontSize: 13,
        color: COLORS.textSecondary,
        fontWeight: '500',
    },
    breakdownValue: {
        fontSize: 13,
        color: COLORS.text,
        fontWeight: '600',
    },
    breakdownTotalRow: {
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0',
        marginTop: 8,
        paddingTop: 8,
    },
    breakdownTotalLabel: {
        fontSize: 14,
        fontWeight: '700',
        color: COLORS.text,
    },
    breakdownTotalValue: {
        fontSize: 16,
        fontWeight: '800',
        color: COLORS.primary,
    },
});
