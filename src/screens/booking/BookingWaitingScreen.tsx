import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
    Dimensions,
    ScrollView,
    Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { COLORS, SHADOWS, RADIUS } from '../../utils/theme';
import { apiService } from '../../services/api';
import { useNotifications } from '../../contexts/NotificationContext';
import * as Haptics from 'expo-haptics';

const { width, height } = Dimensions.get('window');
const TIMER_DURATION = 180; // 3 minutes in seconds

type Props = {
    navigation: NativeStackNavigationProp<any>;
    route: RouteProp<{
        params: {
            bookingId: string;
            providerId: string;
            providerName: string;
            serviceName: string;
            experienceRange?: { label: string; min: number; max: number | null };
        };
    }, 'params'>;
};

export const BookingWaitingScreen: React.FC<Props> = ({ navigation, route }) => {
    const { bookingId, providerId, providerName, serviceName, experienceRange } = route.params;
    const insets = useSafeAreaInsets();
    const { setPaymentModalData } = useNotifications();

    console.log('📍 BookingWaitingScreen params:', {
        bookingId,
        providerId,
        providerName,
        serviceName,
        experienceRange
    });

    const [timeRemaining, setTimeRemaining] = useState(TIMER_DURATION);
    const [status, setStatus] = useState<'waiting' | 'accepted' | 'rejected' | 'timeout'>('waiting');
    const [alternativeProviders, setAlternativeProviders] = useState<any[]>([]);
    const [showAlternatives, setShowAlternatives] = useState(false);
    const [rejectedProviderIds, setRejectedProviderIds] = useState<string[]>([providerId]); // Start with initial provider
    const [isLoading, setIsLoading] = useState(false);

    // Track current provider (can change when selecting alternative)
    const [currentProviderId, setCurrentProviderId] = useState(providerId);
    const [currentProviderName, setCurrentProviderName] = useState(providerName);

    // Animations
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const rotateAnim = useRef(new Animated.Value(0)).current;

    // Start pulse animation
    useEffect(() => {
        const pulse = Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
            ])
        );

        const rotate = Animated.loop(
            Animated.timing(rotateAnim, {
                toValue: 1,
                duration: 2000,
                useNativeDriver: true,
            })
        );

        pulse.start();
        rotate.start();

        return () => {
            pulse.stop();
            rotate.stop();
        };
    }, []);

    // Timer countdown
    useEffect(() => {
        if (status !== 'waiting') return;

        const interval = setInterval(() => {
            setTimeRemaining((prev) => {
                if (prev <= 1) {
                    clearInterval(interval);
                    handleTimeout();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [status]);

    // Poll for booking status
    useEffect(() => {
        const pollInterval = setInterval(async () => {
            try {
                // Check booking request status from backend
                const response = await apiService.checkBookingRequestStatus(bookingId);
                console.log('📊 Booking status poll:', {
                    success: response.success,
                    status: response.data?.status,
                    bookingId: response.data?._id || response.data?.id
                });

                if (response.success && response.data) {
                    const bookingStatus = response.data.status;
                    console.log(`📌 Current booking status: ${bookingStatus}`);

                    // Update rejected provider IDs if available
                    if (response.data.rejectedProviderIds && response.data.rejectedProviderIds.length > 0) {
                        setRejectedProviderIds(response.data.rejectedProviderIds);
                        console.log('🚫 Rejected providers:', response.data.rejectedProviderIds);
                    }

                    if (bookingStatus === 'accepted') {
                        // Provider accepted! (COD or payment already completed)
                        setStatus('accepted');
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                        clearInterval(pollInterval);

                        // Navigate to booking detail
                        setTimeout(() => {
                            navigation.replace('BookingDetail', {
                                booking: response.data,
                            });
                        }, 1500);
                    } else if (bookingStatus === 'pending_payment') {
                        // Provider accepted, waiting for initial payment
                        // Manually trigger payment modal if notification didn't
                        setStatus('accepted');
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                        clearInterval(pollInterval);

                        console.log('💰 Booking pending payment detected, triggering modal manually');
                        console.log('📊 Booking data:', JSON.stringify(response.data, null, 2));

                        // Calculate payment details
                        const totalPrice = response.data.totalPrice || 0;
                        const initialPaymentAmount = Math.round(totalPrice * 0.25 * 100) / 100; // Proper rounding to 2 decimals
                        const expiresAt = response.data.paymentTimer?.expiresAt || new Date(Date.now() + 3 * 60 * 1000).toISOString();

                        console.log('💵 Payment calculation:', {
                            totalPrice,
                            initialPaymentAmount,
                            percentage: '25%'
                        });

                        // Trigger payment modal directly
                        setPaymentModalData({
                            type: 'initial',
                            bookingId: bookingId,
                            initialPaymentAmount: initialPaymentAmount,
                            totalPrice: totalPrice,
                            providerName: currentProviderName,
                            serviceName: serviceName,
                            expiresAt: expiresAt,
                            notificationId: Date.now().toString()
                        });

                        console.log('✅ Payment modal triggered with data:', {
                            bookingId,
                            initialPaymentAmount,
                            totalPrice,
                            expiresAt
                        });
                    } else if (bookingStatus === 'rejected' || bookingStatus === 'cancelled') {
                        // Provider rejected
                        setStatus('rejected');
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                        clearInterval(pollInterval);
                        loadAlternativeProviders();
                    } else if (bookingStatus === 'expired') {
                        // Request expired (timeout)
                        setStatus('timeout');
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                        clearInterval(pollInterval);
                        loadAlternativeProviders();
                    }
                }
            } catch (error) {
                console.error('Error polling booking status:', error);
            }
        }, 2000); // Poll every 2 seconds

        return () => clearInterval(pollInterval);
    }, [bookingId]);

    const handleTimeout = () => {
        setStatus('timeout');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        loadAlternativeProviders();
    };

    const loadAlternativeProviders = async () => {
        setShowAlternatives(true);

        try {
            // Fetch ALL alternative providers for this service, excluding rejected ones
            const params: any = { service: serviceName };

            console.log(`🔍 Loading all providers for ${serviceName}, excluding rejected ones`);
            console.log(`🚫 Excluding ${rejectedProviderIds.length} rejected provider(s):`, rejectedProviderIds);
            console.log('📦 Request params:', params);

            const response = await apiService.getProvidersByService(serviceName, params);
            console.log('📥 API Response:', {
                success: response.success,
                totalProviders: response.data?.length,
                providers: response.data?.map((p: any) => ({ id: p.id || p._id, name: p.name, experience: p.experience }))
            });

            if (response.success && response.data) {
                // Filter out ALL rejected providers client-side
                const filteredProviders = response.data.filter(
                    (provider: any) => !rejectedProviderIds.includes(String(provider.id || provider._id))
                );
                console.log(`✅ Found ${response.data.length} providers, showing ${filteredProviders.length} after filtering rejected`);
                setAlternativeProviders(filteredProviders);
            } else {
                console.log('⚠️ No alternative providers found');
                setAlternativeProviders([]);
            }
        } catch (error) {
            console.error('Error loading alternative providers:', error);
            setAlternativeProviders([]);
        }
    };

    const selectAlternativeProvider = async (provider: any) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        const newProviderId = provider.id || provider._id;
        console.log('🔄 Rebooking with new provider:', provider.name, 'ID:', newProviderId);

        setIsLoading(true);

        try {
            // Reassign the booking to the new provider
            const reassignResponse = await apiService.reassignBooking(bookingId, newProviderId);

            if (reassignResponse.success) {
                console.log('✅ Booking reassigned, sending request to new provider');

                // Update local state with new provider info
                setCurrentProviderId(newProviderId);
                setCurrentProviderName(provider.name);

                // Add old provider to rejected list
                setRejectedProviderIds(prev => [...prev, newProviderId]);

                // Then send the booking request to new provider
                const response = await apiService.sendBookingRequest(bookingId, newProviderId);

                if (response.success) {
                    console.log('✅ Request sent to new provider:', provider.name);

                    // Reset timer and hide alternatives
                    setTimeRemaining(TIMER_DURATION);
                    setStatus('waiting');
                    setShowAlternatives(false);
                    setIsLoading(false);

                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                } else {
                    console.error('❌ Failed to send request to new provider');
                    setIsLoading(false);
                }
            } else {
                console.error('❌ Failed to reassign booking:', reassignResponse.message);
                setIsLoading(false);
            }
        } catch (error: any) {
            console.error('❌ Error rebooking with new provider:', error.message);
            setIsLoading(false);
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const spin = rotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    if (status === 'accepted') {
        return (
            <View style={[styles.container, { paddingTop: insets.top }]}>
                <LinearGradient
                    colors={['#10B981', '#059669']}
                    style={StyleSheet.absoluteFill}
                />
                <View style={styles.centerContent}>
                    <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                        <View style={styles.successIcon}>
                            <Ionicons name="checkmark-circle" size={100} color="#FFF" />
                        </View>
                    </Animated.View>
                    <Text style={styles.statusTitle}>Booking Accepted!</Text>
                    <Text style={styles.statusSubtitle}>
                        {currentProviderName} has accepted your booking
                    </Text>
                    <Text style={styles.statusDescription}>
                        Payment modal will appear shortly...
                    </Text>
                </View>
            </View>
        );
    }

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <LinearGradient
                colors={['#3B82F6', '#2563EB']}
                style={StyleSheet.absoluteFill}
            />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="close" size={24} color="#FFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Booking Request</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {!showAlternatives ? (
                    <>
                        {/* Sophisticated Timer Display */}
                        <View style={styles.timerSection}>
                            <View style={styles.timerCard}>
                                {/* Progress ring background */}
                                <View style={styles.progressRing}>
                                    <View style={[styles.progressSegment, {
                                        transform: [{ rotate: `${(timeRemaining / TIMER_DURATION) * 360}deg` }]
                                    }]} />
                                </View>

                                {/* Time display */}
                                <View style={styles.timerContent}>
                                    <View style={styles.timerRow}>
                                        <View style={styles.timeBlock}>
                                            <Text style={styles.timeLarge}>{Math.floor(timeRemaining / 60)}</Text>
                                            <Text style={styles.timeUnit}>MINUTES</Text>
                                        </View>
                                        <View style={styles.separatorBlock}>
                                            <View style={styles.dot} />
                                            <View style={styles.dot} />
                                        </View>
                                        <View style={styles.timeBlock}>
                                            <Text style={styles.timeLarge}>{String(timeRemaining % 60).padStart(2, '0')}</Text>
                                            <Text style={styles.timeUnit}>SECONDS</Text>
                                        </View>
                                    </View>

                                    <View style={styles.statusBar}>
                                        <Animated.View style={[styles.statusPulse, { opacity: pulseAnim }]} />
                                        <Text style={styles.statusText}>Waiting for response</Text>
                                    </View>
                                </View>
                            </View>
                        </View>

                        {/* Status Message */}
                        <View style={styles.messageCard}>
                            <Ionicons name="time-outline" size={32} color="#3B82F6" />
                            <Text style={styles.messageTitle}>Waiting for {currentProviderName}</Text>
                            <Text style={styles.messageDescription}>
                                We've sent your booking request to {currentProviderName}. They have 3 minutes to respond.
                            </Text>
                        </View>

                        {/* Service Info */}
                        <View style={styles.infoCard}>
                            <View style={styles.infoRow}>
                                <Ionicons name="construct-outline" size={20} color="#64748B" />
                                <Text style={styles.infoText}>{serviceName}</Text>
                            </View>
                            {experienceRange && (
                                <View style={styles.infoRow}>
                                    <Ionicons name="ribbon-outline" size={20} color="#64748B" />
                                    <Text style={styles.infoText}>{experienceRange.label} experience</Text>
                                </View>
                            )}
                        </View>
                    </>
                ) : (
                    <>
                        {/* Rejection/Timeout Message */}
                        <View style={styles.rejectionCard}>
                            <Ionicons
                                name={status === 'rejected' ? 'close-circle' : 'time'}
                                size={64}
                                color="#EF4444"
                            />
                            <Text style={styles.rejectionTitle}>
                                {status === 'rejected' ? 'Provider Unavailable' : 'Request Timed Out'}
                            </Text>
                            <Text style={styles.rejectionDescription}>
                                {status === 'rejected'
                                    ? `${currentProviderName} is currently unavailable. Choose from other available providers below.`
                                    : `${currentProviderName} didn't respond in time. Choose from other available providers below.`}
                            </Text>
                        </View>

                        {/* Alternative Providers */}
                        <View style={styles.alternativesSection}>
                            <Text style={styles.alternativesTitle}>
                                Available Providers
                            </Text>
                            {alternativeProviders.length === 0 ? (
                                <View style={styles.noProvidersCard}>
                                    <Ionicons name="search-outline" size={48} color="#94A3B8" />
                                    <Text style={styles.noProvidersText}>
                                        No other providers available for this service
                                    </Text>
                                    <Text style={styles.noProvidersSuggestion}>
                                        Try a different service or check back later
                                    </Text>
                                    <TouchableOpacity
                                        style={styles.changeRangeButton}
                                        onPress={() => navigation.navigate('ServiceDetail', { service: { title: serviceName } })}
                                    >
                                        <Ionicons name="refresh" size={20} color="#FFF" />
                                        <Text style={styles.changeRangeText}>Choose Different Category</Text>
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                alternativeProviders.map((provider) => (
                                    <TouchableOpacity
                                        key={provider.id || provider._id}
                                        style={styles.providerCard}
                                        onPress={() => selectAlternativeProvider(provider)}
                                        activeOpacity={0.7}
                                    >
                                        <View style={styles.providerAvatar}>
                                            {provider.profileImage ? (
                                                <Image source={{ uri: provider.profileImage }} style={styles.avatarImage} />
                                            ) : (
                                                <Ionicons name="person" size={32} color="#64748B" />
                                            )}
                                        </View>
                                        <View style={styles.providerInfo}>
                                            <Text style={styles.providerName}>{provider.name}</Text>
                                            <View style={styles.providerMeta}>
                                                <View style={styles.ratingBadge}>
                                                    <Ionicons name="star" size={14} color="#F59E0B" />
                                                    <Text style={styles.ratingText}>{provider.rating || 4.8}</Text>
                                                </View>
                                                <Text style={styles.experienceText}>
                                                    {provider.experience || 5} years exp.
                                                </Text>
                                            </View>
                                        </View>
                                        <View style={styles.priceContainer}>
                                            <Text style={styles.priceText}>₹{provider.priceForService || provider.price}</Text>
                                            <Ionicons name="chevron-forward" size={20} color="#3B82F6" />
                                        </View>
                                    </TouchableOpacity>
                                ))
                            )}
                        </View>
                    </>
                )}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#FFF',
    },
    scrollContent: {
        padding: 24,
        paddingBottom: 40,
    },
    centerContent: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
    },
    animationContainer: {
        alignItems: 'center',
        marginVertical: 48,
    },
    timerSection: {
        marginVertical: 32,
        paddingHorizontal: 8,
    },
    timerCard: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 24,
        padding: 32,
        position: 'relative',
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    progressRing: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        opacity: 0.3,
    },
    progressSegment: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        borderWidth: 3,
        borderColor: 'transparent',
        borderTopColor: '#FFF',
        borderRightColor: '#FFF',
        borderRadius: 24,
    },
    timerContent: {
        alignItems: 'center',
    },
    timerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
    },
    timeBlock: {
        alignItems: 'center',
    },
    timeLarge: {
        fontSize: 72,
        fontWeight: '200',
        color: '#FFF',
        lineHeight: 72,
        fontVariant: ['tabular-nums'],
        textShadowColor: 'rgba(0,0,0,0.3)',
        textShadowOffset: { width: 0, height: 4 },
        textShadowRadius: 8,
    },
    timeUnit: {
        fontSize: 10,
        fontWeight: '600',
        color: 'rgba(255,255,255,0.7)',
        letterSpacing: 1.5,
        marginTop: 4,
    },
    separatorBlock: {
        marginHorizontal: 16,
        justifyContent: 'center',
        gap: 8,
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: 'rgba(255,255,255,0.6)',
    },
    statusBar: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 12,
        paddingHorizontal: 20,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.15)',
    },
    statusPulse: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#10B981',
    },
    statusText: {
        fontSize: 13,
        fontWeight: '600',
        color: 'rgba(255,255,255,0.9)',
        letterSpacing: 0.5,
    },
    circularTimer: {
        width: 200,
        height: 200,
        position: 'relative',
        alignItems: 'center',
        justifyContent: 'center',
    },
    circularRing: {
        position: 'absolute',
        width: 200,
        height: 200,
        borderRadius: 100,
    },
    ringSegment: {
        width: 200,
        height: 200,
        borderRadius: 100,
        borderWidth: 3,
        borderColor: 'transparent',
        borderTopColor: 'rgba(255,255,255,0.4)',
        borderRightColor: 'rgba(255,255,255,0.4)',
    },
    progressCircle: {
        position: 'absolute',
        width: 180,
        height: 180,
        borderRadius: 90,
    },
    progressFill: {
        width: 180,
        height: 180,
        borderRadius: 90,
        borderWidth: 6,
        borderColor: 'transparent',
        borderTopColor: '#FFF',
        borderRightColor: '#FFF',
    },
    timerInner: {
        width: 160,
        height: 160,
        borderRadius: 80,
        backgroundColor: 'rgba(255,255,255,0.15)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.3)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 8,
    },
    timerDigits: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    timerMinutesLarge: {
        fontSize: 52,
        fontWeight: '800',
        color: '#FFF',
        fontVariant: ['tabular-nums'],
        textShadowColor: 'rgba(0,0,0,0.3)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    timerSeparatorLarge: {
        fontSize: 52,
        fontWeight: '800',
        color: 'rgba(255,255,255,0.7)',
        marginHorizontal: 4,
    },
    timerSecondsLarge: {
        fontSize: 52,
        fontWeight: '800',
        color: '#FFF',
        fontVariant: ['tabular-nums'],
        textShadowColor: 'rgba(0,0,0,0.3)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    timerLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: 'rgba(255,255,255,0.9)',
        marginTop: 4,
        letterSpacing: 0.5,
    },
    loaderOuter: {
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 4,
        borderColor: 'rgba(255,255,255,0.3)',
        borderTopColor: '#FFF',
        alignItems: 'center',
        justifyContent: 'center',
    },
    loaderInner: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(255,255,255,0.2)',
    },
    timerContainer: {
        alignItems: 'center',
        marginBottom: 32,
    },
    timerText: {
        fontSize: 56,
        fontWeight: '800',
        color: '#FFF',
        letterSpacing: 2,
    },
    timerLabel: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.8)',
        marginTop: 8,
    },
    messageCard: {
        backgroundColor: '#FFF',
        borderRadius: 20,
        padding: 24,
        alignItems: 'center',
        marginBottom: 20,
        ...SHADOWS.lg,
    },
    messageTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: COLORS.text,
        marginTop: 12,
        marginBottom: 8,
    },
    messageDescription: {
        fontSize: 15,
        color: COLORS.textSecondary,
        textAlign: 'center',
        lineHeight: 22,
    },
    infoCard: {
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderRadius: 16,
        padding: 20,
        gap: 12,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    infoText: {
        fontSize: 15,
        color: '#FFF',
        fontWeight: '500',
    },
    successIcon: {
        marginBottom: 24,
    },
    statusTitle: {
        fontSize: 28,
        fontWeight: '800',
        color: '#FFF',
        marginBottom: 8,
    },
    statusSubtitle: {
        fontSize: 18,
        color: 'rgba(255,255,255,0.9)',
        marginBottom: 4,
    },
    statusDescription: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.7)',
    },
    rejectionCard: {
        backgroundColor: '#FFF',
        borderRadius: 20,
        padding: 32,
        alignItems: 'center',
        marginBottom: 24,
        ...SHADOWS.lg,
    },
    rejectionTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: COLORS.text,
        marginTop: 16,
        marginBottom: 8,
    },
    rejectionDescription: {
        fontSize: 15,
        color: COLORS.textSecondary,
        textAlign: 'center',
        lineHeight: 22,
    },
    alternativesSection: {
        gap: 12,
    },
    alternativesTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#FFF',
        marginBottom: 8,
    },
    providerCard: {
        backgroundColor: '#FFF',
        borderRadius: 16,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        ...SHADOWS.md,
    },
    providerAvatar: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#F1F5F9',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    avatarImage: {
        width: 56,
        height: 56,
        borderRadius: 28,
    },
    providerInfo: {
        flex: 1,
    },
    providerName: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.text,
        marginBottom: 4,
    },
    providerMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    ratingBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    ratingText: {
        fontSize: 13,
        fontWeight: '600',
        color: COLORS.text,
    },
    experienceText: {
        fontSize: 13,
        color: COLORS.textSecondary,
    },
    priceContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    priceText: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.primary,
    },
    noProvidersCard: {
        backgroundColor: '#FFF',
        borderRadius: 20,
        padding: 40,
        alignItems: 'center',
        ...SHADOWS.md,
    },
    noProvidersText: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.text,
        marginTop: 16,
        marginBottom: 8,
        textAlign: 'center',
    },
    noProvidersSuggestion: {
        fontSize: 14,
        color: COLORS.textSecondary,
        marginBottom: 20,
        textAlign: 'center',
        lineHeight: 20,
    },
    changeRangeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: COLORS.primary,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
        ...SHADOWS.md,
    },
    changeRangeText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#FFF',
    },
});
