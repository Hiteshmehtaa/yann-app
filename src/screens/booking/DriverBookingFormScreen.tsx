import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    StatusBar,
    Animated,
    Image,
    Alert,
    Dimensions,
    Platform,
    Modal,
    ActivityIndicator,
    KeyboardAvoidingView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';

import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';
import { COLORS, SPACING, RADIUS, SHADOWS, TYPOGRAPHY } from '../../utils/theme';
import { FloatingLabelInput } from '../../components/ui/FloatingLabelInput';
import { BookingAnimation } from '../../components/animations';
import * as Haptics from 'expo-haptics';

const { width, height } = Dimensions.get('window');

const MINIMUM_HOURS = 3;
const DURATION_OPTIONS = [3, 4, 5, 6, 8, 10, 12];

type RouteParams = {
    params: {
        service: any;
        selectedDriver: any;
        tripType: 'incity' | 'outstation';
        tripDirection: 'oneway' | 'roundtrip';
        vehicleType: string;
        transmission: string;
        pickupAddress: string;
        dropAddress: string;
        pickupCoords: { latitude: number; longitude: number } | null;
        dropCoords: { latitude: number; longitude: number } | null;
        routeDistanceKm: number;
        driverReturnFare: number;
        driverRate: number;
    };
};

type Props = {
    navigation: NativeStackNavigationProp<any>;
    route: RouteProp<RouteParams, 'params'>;
};

// Fade in wrapper
const FadeInView = ({ children, delay = 0, style }: any) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    useEffect(() => {
        Animated.timing(fadeAnim, { toValue: 1, duration: 600, delay, useNativeDriver: true }).start();
    }, []);
    return <Animated.View style={[{ opacity: fadeAnim }, style]}>{children}</Animated.View>;
};

export const DriverBookingFormScreen: React.FC<Props> = ({ navigation, route }) => {
    const {
        service,
        selectedDriver,
        tripType,
        tripDirection,
        vehicleType,
        transmission,
        pickupAddress,
        dropAddress,
        pickupCoords,
        dropCoords,
        routeDistanceKm,
        driverReturnFare,
        driverRate,
    } = route.params;

    const { user } = useAuth();
    const insets = useSafeAreaInsets();
    const scrollViewRef = useRef<ScrollView>(null);

    // Form State
    const [bookingDate, setBookingDate] = useState<Date | null>(null);
    const [bookingTime, setBookingTime] = useState<string | null>(null);
    const [selectedDuration, setSelectedDuration] = useState<number>(MINIMUM_HOURS);
    const [notes, setNotes] = useState('');

    // UI State
    const [isLoading, setIsLoading] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    // Wallet
    const [walletBalance, setWalletBalance] = useState(0);
    const [loadingWallet, setLoadingWallet] = useState(true);

    // Auto-select defaults
    useEffect(() => {
        // Default to tomorrow
        if (!bookingDate) {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            setBookingDate(tomorrow);
        }
        // Fetch wallet
        const fetchWallet = async () => {
            try {
                setLoadingWallet(true);
                const response = await apiService.getWalletBalance();
                if (response.success) {
                    setWalletBalance(response.data?.balance || 0);
                }
            } catch (e) {
                console.log('Wallet fetch failed:', e);
            } finally {
                setLoadingWallet(false);
            }
        };
        fetchWallet();
    }, []);

    // Price Calculations
    const basePrice = driverRate * selectedDuration; // hourly rate x hours
    const serviceGstRate = service.gstRate || 0.18;
    const gstAmount = basePrice * serviceGstRate;
    const subtotalBeforeFare = basePrice + gstAmount;
    const totalPrice = subtotalBeforeFare + driverReturnFare; // Add return fare to total

    // Staged Payment (25% / 75%)
    // The 25% payment INCLUDES the driver return fare
    const initialPayment = Math.round(totalPrice * 0.25 * 100) / 100;
    const completionPayment = Math.round((totalPrice - initialPayment) * 100) / 100;
    const hasInsufficientBalance = walletBalance < initialPayment;

    // Generate time slots based on 30-min intervals
    const getTimeSlots = () => {
        const slots: string[] = [];
        for (let h = 6; h <= 22; h++) {
            slots.push(`${h.toString().padStart(2, '0')}:00`);
            if (h < 22) {
                slots.push(`${h.toString().padStart(2, '0')}:30`);
            }
        }
        return slots;
    };

    // Compute end time display
    const getEndTime = (): string => {
        if (!bookingTime) return '--:--';
        const [h, m] = bookingTime.split(':').map(Number);
        const endH = h + selectedDuration;
        const endM = m;
        if (endH >= 24) {
            return `${(endH - 24).toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')} (next day)`;
        }
        return `${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`;
    };

    const validateForm = (): boolean => {
        if (!bookingDate) {
            Alert.alert('Missing Date', 'Please select a booking date');
            return false;
        }
        if (!bookingTime) {
            Alert.alert('Missing Time', 'Please select a start time');
            return false;
        }
        if (selectedDuration < MINIMUM_HOURS) {
            Alert.alert('Minimum Duration', `Minimum booking duration is ${MINIMUM_HOURS} hours`);
            return false;
        }
        return true;
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;

        // Check wallet balance
        if (hasInsufficientBalance) {
            Alert.alert(
                'Insufficient Balance',
                `You need ₹${initialPayment.toFixed(2)} to book. Would you like to top up?`,
                [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Top Up', onPress: () => navigation.navigate('Wallet') },
                ]
            );
            return;
        }

        setIsLoading(true);

        try {
            const [th, tm] = (bookingTime || '09:00').split(':').map(Number);
            const startTimeObj = new Date();
            startTimeObj.setHours(th, tm, 0);
            const endTimeObj = new Date();
            endTimeObj.setHours(th + selectedDuration, tm, 0);

            const payload = {
                serviceId: String(service.id || service._id || ''),
                serviceName: service.title,
                serviceCategory: service.category || 'driver',
                providerId: selectedDriver._id || selectedDriver.id,
                customerId: (user as any)?._id || user?.id,
                customerName: user?.name || 'Guest',
                customerPhone: user?.phone || '',
                customerEmail: user?.email,
                customerAddress: pickupAddress || '',
                latitude: pickupCoords?.latitude || 0,
                longitude: pickupCoords?.longitude || 0,
                providerNavigationAddress: {
                    fullAddress: pickupAddress || '',
                    latitude: pickupCoords?.latitude || 0,
                    longitude: pickupCoords?.longitude || 0,
                    phone: user?.phone || '',
                },
                bookingDate: bookingDate ? bookingDate.toISOString().split('T')[0] : '',
                bookingTime: bookingTime || '09:00',
                startTime: bookingTime || '09:00',
                endTime: endTimeObj.toTimeString().substring(0, 5),
                // Backend uses "quantity" as duration hours for driver category
                quantity: selectedDuration,
                bookedHours: selectedDuration,
                paymentMethod: 'wallet',
                billingType: 'hourly',
                notes: notes || '',
                basePrice: isNaN(basePrice) ? 0 : Number(basePrice.toFixed(2)),
                gstAmount: isNaN(gstAmount) ? 0 : Number(gstAmount.toFixed(2)),
                totalPrice: isNaN(totalPrice) ? 0 : Number(totalPrice.toFixed(2)),
                // Backend reads "driverTripDetails" for the primary driver flow
                driverTripDetails: {
                    tripType,
                    serviceType: tripDirection, // backend expects "serviceType" not "tripDirection"
                    pickupLocation: {
                        address: pickupAddress || '',
                        latitude: pickupCoords?.latitude || 0,
                        longitude: pickupCoords?.longitude || 0,
                        city: '',
                    },
                    dropLocation: {
                        address: dropAddress || '',
                        latitude: dropCoords?.latitude || 0,
                        longitude: dropCoords?.longitude || 0,
                        city: '',
                    },
                    vehicleType,
                    transmission,
                    distanceKm: routeDistanceKm || 0,
                    returnFare: driverReturnFare || 0,
                },
                // Also send driverDetails for legacy compatibility
                driverDetails: {
                    startTime: bookingTime || '09:00',
                    endTime: endTimeObj.toTimeString().substring(0, 5),
                    totalHours: selectedDuration,
                    baseHours: selectedDuration,
                    hourlyRate: driverRate || 0,
                    overtimeHours: 0,
                    overtimeRate: 0,
                    overtimeMultiplier: 2,
                    baseCost: isNaN(basePrice) ? 0 : Number(basePrice.toFixed(2)),
                    overtimeCost: 0,
                    driverReturnFare: driverReturnFare || 0,
                    tripType,
                    serviceType: tripDirection,
                    vehicleType,
                    transmission,
                    pickupAddress: pickupAddress || '',
                    dropAddress: dropAddress || '',
                    routeDistanceKm: routeDistanceKm || 0,
                },
            };

            // Create booking
            console.log('📦 Driver booking payload:', JSON.stringify({
                serviceId: payload.serviceId,
                serviceName: payload.serviceName,
                serviceCategory: payload.serviceCategory,
                providerId: payload.providerId,
                quantity: payload.quantity,
                bookedHours: payload.bookedHours,
                billingType: payload.billingType,
                basePrice: payload.basePrice,
                totalPrice: payload.totalPrice,
                hasDTPDetails: !!payload.driverTripDetails,
                hasDriverDetails: !!payload.driverDetails,
            }, null, 2));

            const response = await apiService.createBooking(payload);
            console.log('✅ Driver booking response:', JSON.stringify(response, null, 2));

            if (response.success && (response as any).booking) {
                const bookingId = (response as any).booking.id || (response as any).booking._id;
                const providerId = selectedDriver._id || selectedDriver.id;

                // Send booking request to driver (3-minute timer)
                try {
                    const requestResponse = await apiService.sendBookingRequest(bookingId, providerId);
                    console.log('✅ Booking request sent:', requestResponse);
                    if (requestResponse.success) {
                        setIsLoading(false);
                        navigation.navigate('BookingWaiting', {
                            bookingId,
                            providerId,
                            providerName: selectedDriver.name || 'Driver',
                            serviceName: service.title,
                        });
                    } else {
                        setIsLoading(false);
                        Alert.alert('Request Failed', 'Could not send request to driver. Please try again.');
                    }
                } catch (reqError) {
                    console.error('Request send failed:', reqError);
                    setIsLoading(false);
                    Alert.alert('Request Failed', 'Could not notify the driver. Please try again.');
                }
            } else {
                throw new Error(response.message || 'Booking creation failed');
            }
        } catch (error: any) {
            console.error('Booking failed:', error);
            console.error('Error details:', error.response?.data || error.message);
            setIsLoading(false);
            const errorMsg = error.response?.data?.message || error.message || 'Something went wrong. Please try again.';
            Alert.alert('Booking Failed', errorMsg);
        }
    };

    const handleAnimationComplete = () => {
        setShowSuccess(false);
        navigation.reset({
            index: 0,
            routes: [{ name: 'MainTabs', params: { screen: 'BookingsList' } }],
        });
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />

            {/* Ambient Background */}
            <View style={StyleSheet.absoluteFill} pointerEvents="none">
                <View style={styles.blob1} />
                <View style={styles.blob2} />
                <View style={styles.blob3} />
            </View>

            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top }]}>
                <View style={styles.headerContent}>
                    <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={24} color={COLORS.text} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Book Driver</Text>
                    <View style={{ width: 44 }} />
                </View>
            </View>

            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <ScrollView
                    ref={scrollViewRef}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={[styles.scrollContent, { paddingTop: 20 }]}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Hero */}
                    <View style={styles.heroSection}>
                        <Text style={styles.heroPreTitle}>Finalize</Text>
                        <Text style={styles.heroTitle}>Your Driver Booking</Text>
                    </View>

                    {/* 1. Driver Card */}
                    <FadeInView delay={100} style={styles.sectionContainer}>
                        <View style={styles.cardContainer}>
                            <View style={styles.cardHighlight} />
                            <View style={styles.driverRow}>
                                {/* Avatar */}
                                {selectedDriver.profileImage ? (
                                    <Image source={{ uri: selectedDriver.profileImage }} style={styles.driverAvatar} />
                                ) : (
                                    <LinearGradient
                                        colors={['#6366F1', '#8B5CF6']}
                                        style={styles.driverAvatarPlaceholder}
                                    >
                                        <Text style={styles.driverAvatarText}>
                                            {selectedDriver.name?.charAt(0)?.toUpperCase() || 'D'}
                                        </Text>
                                    </LinearGradient>
                                )}
                                <View style={styles.driverInfo}>
                                    <Text style={styles.driverName}>{selectedDriver.name}</Text>
                                    <View style={styles.driverMetaRow}>
                                        <Ionicons name="star" size={12} color="#F59E0B" />
                                        <Text style={styles.driverRating}>
                                            {selectedDriver.rating > 0 ? selectedDriver.rating.toFixed(1) : 'New'}
                                        </Text>
                                        <View style={styles.metaDot} />
                                        <Text style={styles.driverExp}>
                                            {selectedDriver.experience} yrs exp
                                        </Text>
                                    </View>
                                </View>
                                <View style={styles.driverPriceBox}>
                                    <Text style={styles.driverPriceAmount}>₹{driverRate}</Text>
                                    <Text style={styles.driverPriceUnit}>/hr</Text>
                                </View>
                            </View>

                            {/* Trip Summary */}
                            <View style={styles.tripSummaryRow}>
                                <View style={styles.tripTag}>
                                    <Ionicons name="navigate-outline" size={12} color="#6366F1" />
                                    <Text style={styles.tripTagText}>
                                        {tripType === 'incity' ? 'In-City' : 'Outstation'} • {tripDirection === 'oneway' ? 'One Way' : 'Round Trip'}
                                    </Text>
                                </View>
                                <View style={styles.tripTag}>
                                    <Ionicons name="car-sport-outline" size={12} color="#6366F1" />
                                    <Text style={styles.tripTagText}>
                                        {vehicleType.charAt(0).toUpperCase() + vehicleType.slice(1)} • {transmission.charAt(0).toUpperCase() + transmission.slice(1)}
                                    </Text>
                                </View>
                            </View>

                            {/* Route Info */}
                            <View style={styles.routeInfo}>
                                <View style={styles.routePoint}>
                                    <View style={[styles.routeDot, { backgroundColor: '#10B981' }]} />
                                    <Text style={styles.routeAddress} numberOfLines={1}>{pickupAddress || 'Pickup'}</Text>
                                </View>
                                <View style={styles.routeLine} />
                                <View style={styles.routePoint}>
                                    <View style={[styles.routeDot, { backgroundColor: '#EF4444' }]} />
                                    <Text style={styles.routeAddress} numberOfLines={1}>{dropAddress || 'Drop'}</Text>
                                </View>
                                {routeDistanceKm > 0 && (
                                    <Text style={styles.routeDistance}>{routeDistanceKm.toFixed(1)} km</Text>
                                )}
                            </View>
                        </View>
                    </FadeInView>

                    {/* 2. Date Selection */}
                    <FadeInView delay={200} style={styles.sectionContainer}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Select Date</Text>
                        </View>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.dateStripContainer}
                        >
                            {Array.from({ length: 14 }).map((_, i) => {
                                const date = new Date();
                                date.setDate(date.getDate() + i);
                                const isSelected = bookingDate &&
                                    date.getDate() === bookingDate.getDate() &&
                                    date.getMonth() === bookingDate.getMonth();
                                const isToday = i === 0;

                                return (
                                    <TouchableOpacity
                                        key={i}
                                        style={[styles.dateCard, isSelected && styles.dateCardSelected]}
                                        onPress={() => {
                                            Haptics.selectionAsync();
                                            setBookingDate(date);
                                        }}
                                    >
                                        <Text style={[styles.dateDay, isSelected && styles.textSelected]}>
                                            {isToday ? 'Today' : date.toLocaleDateString('en-US', { weekday: 'short' })}
                                        </Text>
                                        <Text style={[styles.dateNum, isSelected && styles.textSelected]}>
                                            {date.getDate()}
                                        </Text>
                                        <Text style={[styles.dateMonth, isSelected && styles.textSelected]}>
                                            {date.toLocaleDateString('en-US', { month: 'short' })}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>
                    </FadeInView>

                    {/* 4. Time Selection */}
                    <FadeInView delay={300} style={styles.sectionContainer}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Start Time</Text>
                            {bookingTime && (
                                <View style={styles.selectedTimeBadge}>
                                    <Ionicons name="time-outline" size={14} color="#6366F1" />
                                    <Text style={styles.selectedTimeText}>{bookingTime}</Text>
                                </View>
                            )}
                        </View>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.timeStripContainer}
                        >
                            {getTimeSlots().map((time) => {
                                const isSelected = bookingTime === time;
                                return (
                                    <TouchableOpacity
                                        key={time}
                                        style={[styles.timeChip, isSelected && styles.timeChipSelected]}
                                        onPress={() => {
                                            Haptics.selectionAsync();
                                            setBookingTime(time);
                                        }}
                                    >
                                        <Text style={[styles.timeText, isSelected && styles.textSelected]}>
                                            {time}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>
                    </FadeInView>

                    {/* 5. Duration Selection */}
                    <FadeInView delay={400} style={styles.sectionContainer}>
                        <View style={styles.sectionHeader}>
                            <View>
                                <Text style={styles.sectionTitle}>Duration</Text>
                                <Text style={styles.sectionSubtitle}>Minimum {MINIMUM_HOURS} hours</Text>
                            </View>
                            {bookingTime && (
                                <View style={styles.durationBadge}>
                                    <Text style={styles.durationBadgeText}>
                                        {bookingTime} - {getEndTime()}
                                    </Text>
                                </View>
                            )}
                        </View>

                        <View style={styles.durationGrid}>
                            {DURATION_OPTIONS.map((hours) => {
                                const isSelected = selectedDuration === hours;
                                const estimatedCost = driverRate * hours;
                                return (
                                    <TouchableOpacity
                                        key={hours}
                                        style={[styles.durationCard, isSelected && styles.durationCardSelected]}
                                        onPress={() => {
                                            Haptics.selectionAsync();
                                            setSelectedDuration(hours);
                                        }}
                                    >
                                        {isSelected && (
                                            <LinearGradient
                                                colors={['#6366F1', '#4F46E5']}
                                                style={StyleSheet.absoluteFill}
                                                start={{ x: 0, y: 0 }}
                                                end={{ x: 1, y: 1 }}
                                            />
                                        )}
                                        <Text style={[styles.durationHours, isSelected && styles.textWhite]}>
                                            {hours}
                                        </Text>
                                        <Text style={[styles.durationLabel, isSelected && styles.textWhiteLight]}>
                                            hours
                                        </Text>
                                        <Text style={[styles.durationCost, isSelected && styles.textWhiteLight]}>
                                            ₹{estimatedCost}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </FadeInView>

                    {/* 6. Notes */}
                    <FadeInView delay={500} style={styles.sectionContainer}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Additional Notes</Text>
                        </View>
                        <View style={styles.notesContainer}>
                            <FloatingLabelInput
                                label="Any instructions for the driver..."
                                value={notes}
                                onChangeText={setNotes}
                                multiline
                                containerStyle={{
                                    borderWidth: 1,
                                    borderColor: '#E2E8F0',
                                    backgroundColor: '#F8FAFC',
                                    borderRadius: 12,
                                }}
                            />
                        </View>
                    </FadeInView>

                    {/* 7. Price Breakdown / Receipt */}
                    <FadeInView delay={600} style={[styles.sectionContainer, { marginBottom: 160 }]}>
                        <View style={styles.receiptCard}>
                            {/* Receipt Header */}
                            <View style={styles.receiptHeader}>
                                <Text style={styles.receiptTitle}>BOOKING SUMMARY</Text>
                                <Ionicons name="receipt-outline" size={18} color="#94A3B8" />
                            </View>

                            <View style={styles.dashedLine} />

                            {/* Service Rate */}
                            <View style={styles.summaryRow}>
                                <Text style={styles.summaryLabel}>
                                    Driver Rate ({selectedDuration}h × ₹{driverRate}/hr)
                                </Text>
                                <Text style={styles.summaryValue}>₹{basePrice.toFixed(2)}</Text>
                            </View>

                            {/* GST */}
                            <View style={styles.summaryRow}>
                                <Text style={styles.summaryLabel}>GST ({(serviceGstRate * 100).toFixed(0)}%)</Text>
                                <Text style={styles.summaryValue}>₹{gstAmount.toFixed(2)}</Text>
                            </View>

                            {/* Driver Return Fare */}
                            {driverReturnFare > 0 && (
                                <View style={styles.summaryRow}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                        <Text style={styles.summaryLabel}>Driver Return Fare</Text>
                                        <View style={styles.oneWayTag}>
                                            <Text style={styles.oneWayTagText}>ONE WAY</Text>
                                        </View>
                                    </View>
                                    <Text style={[styles.summaryValue, { color: '#F97316' }]}>₹{driverReturnFare.toFixed(2)}</Text>
                                </View>
                            )}
                            {driverReturnFare > 0 && (
                                <Text style={styles.returnFareNote}>
                                    {routeDistanceKm.toFixed(1)} km × ₹2/km for driver's return journey
                                </Text>
                            )}

                            <View style={styles.dashedLine} />

                            {/* Total */}
                            <View style={styles.totalRow}>
                                <Text style={styles.totalLabel}>Booking Total</Text>
                                <Text style={styles.totalAmount}>₹{totalPrice.toFixed(2)}</Text>
                            </View>

                            {/* Staged Payment Breakdown */}
                            <View style={styles.stagedPayment}>
                                <View style={styles.stagedHeader}>
                                    <Ionicons name="shield-checkmark" size={16} color="#16A34A" />
                                    <Text style={styles.stagedTitle}>Secure Staged Payment</Text>
                                </View>
                                <View style={styles.stagedRow}>
                                    <View style={styles.stagedDotRow}>
                                        <View style={[styles.stagedDot, { backgroundColor: '#3B82F6' }]} />
                                        <Text style={styles.stagedLabel}>After Driver Accepts (25%)</Text>
                                    </View>
                                    <Text style={styles.stagedAmount}>₹{initialPayment.toFixed(2)}</Text>
                                </View>
                                <View style={styles.stagedRow}>
                                    <View style={styles.stagedDotRow}>
                                        <View style={[styles.stagedDot, { backgroundColor: '#94A3B8' }]} />
                                        <Text style={[styles.stagedLabel, { color: '#6B7280' }]}>After Service (75%)</Text>
                                    </View>
                                    <Text style={[styles.stagedAmount, { color: '#6B7280' }]}>₹{completionPayment.toFixed(2)}</Text>
                                </View>
                            </View>

                            {/* Wallet Balance */}
                            {!loadingWallet && (
                                <View style={styles.walletRow}>
                                    <View style={styles.walletInfo}>
                                        <Ionicons name="wallet-outline" size={16} color="#64748B" />
                                        <Text style={styles.walletLabel}>Wallet Balance</Text>
                                    </View>
                                    <Text style={[styles.walletAmount, {
                                        color: hasInsufficientBalance ? '#EF4444' : '#10B981'
                                    }]}>
                                        ₹{walletBalance.toFixed(2)}
                                    </Text>
                                </View>
                            )}

                            {/* Insufficient Balance Warning */}
                            {hasInsufficientBalance && !loadingWallet && (
                                <TouchableOpacity
                                    style={styles.topUpWarning}
                                    onPress={() => navigation.navigate('Wallet')}
                                >
                                    <View style={styles.topUpIconBg}>
                                        <Ionicons name="wallet-outline" size={18} color="#DC2626" />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.topUpTitle}>Top Up Required</Text>
                                        <Text style={styles.topUpSubtitle}>
                                            Add ₹{(initialPayment - walletBalance).toFixed(0)} to book
                                        </Text>
                                    </View>
                                    <View style={styles.topUpButton}>
                                        <Text style={styles.topUpButtonText}>Top Up</Text>
                                    </View>
                                </TouchableOpacity>
                            )}
                        </View>
                    </FadeInView>
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Floating Bottom Bar */}
            <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 20) }]}>
                {Platform.OS === 'ios' ? (
                    <BlurView intensity={80} tint="light" style={StyleSheet.absoluteFill} />
                ) : (
                    <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(255,255,255,0.97)' }]} />
                )}
                <View style={styles.bottomBarContent}>
                    <View style={styles.priceBlock}>
                        <Text style={styles.bottomTotalLabel}>Total</Text>
                        <Text style={styles.bottomTotalAmount}>₹{totalPrice.toFixed(2)}</Text>
                        <Text style={styles.payNowLabel}>Pay ₹{initialPayment.toFixed(0)} now (25%)</Text>
                    </View>

                    <TouchableOpacity
                        style={[
                            styles.bookButton,
                            (!bookingDate || !bookingTime) && styles.bookButtonDisabled,
                        ]}
                        onPress={() => {
                            if (!bookingDate || !bookingTime) {
                                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                                Alert.alert('Missing Info', 'Please select date and time');
                                return;
                            }
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                            handleSubmit();
                        }}
                        disabled={isLoading}
                    >
                        {bookingDate && bookingTime && (
                            <LinearGradient
                                colors={['#6366F1', '#4F46E5']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={StyleSheet.absoluteFill}
                            />
                        )}
                        {isLoading ? (
                            <ActivityIndicator color="#FFF" />
                        ) : (
                            <>
                                <Text style={[styles.bookButtonText, (!bookingDate || !bookingTime) && { color: '#94A3B8' }]}>
                                    {!bookingDate ? 'Select Date' : !bookingTime ? 'Select Time' : 'Confirm Booking'}
                                </Text>
                                {bookingDate && bookingTime && (
                                    <Ionicons name="arrow-forward" size={20} color="#FFF" />
                                )}
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            </View>

            {/* Success Modal */}
            <Modal visible={showSuccess} transparent animationType="none">
                <View style={styles.modalOverlay}>
                    <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
                    <BookingAnimation
                        visible={showSuccess}
                        type="success"
                        onAnimationFinish={handleAnimationComplete}
                    />
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    blob1: {
        position: 'absolute',
        top: -100,
        right: -100,
        width: 300,
        height: 300,
        borderRadius: 150,
        backgroundColor: '#6366F1',
        opacity: 0.05,
    },
    blob2: {
        position: 'absolute',
        top: height * 0.4,
        left: -50,
        width: 200,
        height: 200,
        borderRadius: 100,
        backgroundColor: '#F97316',
        opacity: 0.05,
    },
    blob3: {
        position: 'absolute',
        bottom: 0,
        right: -50,
        width: 250,
        height: 250,
        borderRadius: 125,
        backgroundColor: '#6366F1',
        opacity: 0.03,
    },
    header: {
        zIndex: 100,
        backgroundColor: 'rgba(255,255,255,0.97)',
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.md,
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: RADIUS.medium,
        backgroundColor: COLORS.surface,
        justifyContent: 'center',
        alignItems: 'center',
        ...SHADOWS.sm,
    },
    headerTitle: {
        flex: 1,
        fontSize: TYPOGRAPHY.size.lg,
        fontWeight: '700' as any,
        color: COLORS.text,
        textAlign: 'center',
    },
    scrollContent: {
        paddingHorizontal: SPACING.lg,
        paddingBottom: 40,
    },
    heroSection: {
        marginBottom: 20,
        paddingTop: 8,
    },
    heroPreTitle: {
        fontSize: 14,
        fontWeight: '600' as any,
        color: COLORS.textSecondary,
        textTransform: 'uppercase' as any,
        letterSpacing: 1.5,
    },
    heroTitle: {
        fontSize: 28,
        fontWeight: '800' as any,
        color: COLORS.text,
        marginTop: 4,
    },
    sectionContainer: {
        marginBottom: 20,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700' as any,
        color: COLORS.text,
    },
    sectionSubtitle: {
        fontSize: 12,
        color: COLORS.textSecondary,
        marginTop: 2,
    },
    // Driver Card
    cardContainer: {
        backgroundColor: '#FFF',
        borderRadius: RADIUS.xlarge,
        padding: SPACING.lg,
        borderWidth: 1,
        borderColor: COLORS.borderLight,
        overflow: 'hidden',
        ...SHADOWS.md,
    },
    cardHighlight: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 4,
        backgroundColor: '#6366F1',
    },
    driverRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    driverAvatar: {
        width: 52,
        height: 52,
        borderRadius: 16,
    },
    driverAvatarPlaceholder: {
        width: 52,
        height: 52,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    driverAvatarText: {
        fontSize: 20,
        fontWeight: '700' as any,
        color: '#FFF',
    },
    driverInfo: {
        flex: 1,
        marginLeft: 12,
    },
    driverName: {
        fontSize: 16,
        fontWeight: '700' as any,
        color: COLORS.text,
    },
    driverMetaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },
    driverRating: {
        fontSize: 13,
        fontWeight: '600' as any,
        color: '#92400E',
        marginLeft: 4,
    },
    metaDot: {
        width: 3,
        height: 3,
        borderRadius: 1.5,
        backgroundColor: '#CBD5E1',
        marginHorizontal: 8,
    },
    driverExp: {
        fontSize: 13,
        color: COLORS.textSecondary,
    },
    driverPriceBox: {
        alignItems: 'flex-end',
    },
    driverPriceAmount: {
        fontSize: 20,
        fontWeight: '800' as any,
        color: COLORS.primary,
    },
    driverPriceUnit: {
        fontSize: 12,
        color: COLORS.textSecondary,
    },
    tripSummaryRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 12,
    },
    tripTag: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#EEF2FF',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
    },
    tripTagText: {
        fontSize: 11,
        fontWeight: '600' as any,
        color: '#4F46E5',
    },
    routeInfo: {
        marginTop: 16,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
    },
    routePoint: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    routeDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    routeAddress: {
        fontSize: 13,
        color: COLORS.textSecondary,
        flex: 1,
    },
    routeLine: {
        width: 1,
        height: 20,
        backgroundColor: '#E2E8F0',
        marginLeft: 4.5,
        marginVertical: 2,
    },
    routeDistance: {
        fontSize: 12,
        fontWeight: '600' as any,
        color: '#64748B',
        marginTop: 8,
        textAlign: 'right',
    },

    // Date Strip
    dateStripContainer: {
        paddingHorizontal: 4,
        gap: 8,
    },
    dateCard: {
        width: 72,
        height: 88,
        borderRadius: 16,
        backgroundColor: '#FFF',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        ...SHADOWS.sm,
    },
    dateCardSelected: {
        borderWidth: 2,
        borderColor: '#6366F1',
        backgroundColor: '#EEF2FF',
        ...SHADOWS.md,
    },
    dateDay: {
        fontSize: 11,
        fontWeight: '600' as any,
        color: '#64748B',
        marginBottom: 4,
    },
    dateNum: {
        fontSize: 22,
        fontWeight: '800' as any,
        color: COLORS.text,
    },
    dateMonth: {
        fontSize: 11,
        fontWeight: '500' as any,
        color: '#94A3B8',
        marginTop: 2,
    },
    textSelected: {
        color: '#4F46E5',
    },
    // Time Selection
    selectedTimeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#EEF2FF',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    selectedTimeText: {
        fontSize: 13,
        fontWeight: '700' as any,
        color: '#6366F1',
    },
    timeStripContainer: {
        paddingHorizontal: 4,
        gap: 8,
    },
    timeChip: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
        backgroundColor: '#FFF',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        ...SHADOWS.sm,
    },
    timeChipSelected: {
        borderWidth: 2,
        borderColor: '#6366F1',
        backgroundColor: '#EEF2FF',
    },
    timeText: {
        fontSize: 14,
        fontWeight: '600' as any,
        color: '#374151',
    },
    // Duration
    durationBadge: {
        backgroundColor: '#F0FDF4',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    durationBadgeText: {
        fontSize: 12,
        fontWeight: '600' as any,
        color: '#059669',
    },
    durationGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    durationCard: {
        width: (width - SPACING.lg * 2 - 30) / 4,
        height: 90,
        borderRadius: 16,
        backgroundColor: '#FFF',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        overflow: 'hidden',
        ...SHADOWS.sm,
    },
    durationCardSelected: {
        borderWidth: 0,
        ...SHADOWS.md,
    },
    durationHours: {
        fontSize: 22,
        fontWeight: '800' as any,
        color: COLORS.text,
    },
    durationLabel: {
        fontSize: 11,
        fontWeight: '500' as any,
        color: '#94A3B8',
        marginTop: 2,
    },
    durationCost: {
        fontSize: 11,
        fontWeight: '600' as any,
        color: '#64748B',
        marginTop: 4,
    },
    textWhite: {
        color: '#FFF',
    },
    textWhiteLight: {
        color: 'rgba(255,255,255,0.8)',
    },
    // Notes
    notesContainer: {
        backgroundColor: '#FFF',
        borderRadius: RADIUS.large,
        padding: 4,
    },
    // Receipt
    receiptCard: {
        backgroundColor: '#FFF',
        borderRadius: RADIUS.xlarge,
        padding: SPACING.lg,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        ...SHADOWS.md,
    },
    receiptHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    receiptTitle: {
        fontSize: 12,
        fontWeight: '700' as any,
        color: '#94A3B8',
        letterSpacing: 1.5,
    },
    dashedLine: {
        height: 1,
        borderStyle: 'dashed' as any,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        marginVertical: 14,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    summaryLabel: {
        fontSize: 14,
        color: '#64748B',
    },
    summaryValue: {
        fontSize: 14,
        fontWeight: '600' as any,
        color: '#1E293B',
    },
    oneWayTag: {
        backgroundColor: '#FFF7ED',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    oneWayTagText: {
        fontSize: 9,
        fontWeight: '700' as any,
        color: '#F97316',
    },
    returnFareNote: {
        fontSize: 11,
        color: '#94A3B8',
        fontStyle: 'italic' as any,
        marginTop: -4,
        marginBottom: 8,
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 14,
    },
    totalLabel: {
        fontSize: 16,
        fontWeight: '700' as any,
        color: COLORS.text,
    },
    totalAmount: {
        fontSize: 22,
        fontWeight: '800' as any,
        color: COLORS.primary,
    },
    // Staged Payment
    stagedPayment: {
        backgroundColor: '#F0FDF4',
        borderRadius: 14,
        padding: 14,
        borderWidth: 1,
        borderColor: '#BBF7D0',
        marginBottom: 12,
    },
    stagedHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 10,
    },
    stagedTitle: {
        fontSize: 13,
        fontWeight: '700' as any,
        color: '#166534',
    },
    stagedRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    stagedDotRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    stagedDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        marginRight: 8,
    },
    stagedLabel: {
        fontSize: 14,
        color: '#374151',
    },
    stagedAmount: {
        fontSize: 14,
        fontWeight: '700' as any,
        color: '#1F2937',
    },
    // Wallet
    walletRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 8,
    },
    walletInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    walletLabel: {
        fontSize: 13,
        color: '#64748B',
    },
    walletAmount: {
        fontSize: 14,
        fontWeight: '700' as any,
    },
    // Top Up Warning
    topUpWarning: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FEF2F2',
        borderRadius: 14,
        padding: 14,
        marginTop: 12,
        borderWidth: 1,
        borderColor: '#FECACA',
    },
    topUpIconBg: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: '#FEE2E2',
        justifyContent: 'center',
        alignItems: 'center',
    },
    topUpTitle: {
        fontSize: 14,
        fontWeight: '700' as any,
        color: '#DC2626',
        marginLeft: 12,
    },
    topUpSubtitle: {
        fontSize: 12,
        color: '#B91C1C',
        marginLeft: 12,
        marginTop: 2,
    },
    topUpButton: {
        backgroundColor: '#DC2626',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    topUpButtonText: {
        fontSize: 12,
        fontWeight: '600' as any,
        color: '#FFF',
    },
    // Bottom Bar
    bottomBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
        overflow: 'hidden',
    },
    bottomBarContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: SPACING.lg,
        paddingTop: 14,
    },
    priceBlock: {},
    bottomTotalLabel: {
        fontSize: 12,
        color: '#64748B',
        fontWeight: '500' as any,
    },
    bottomTotalAmount: {
        fontSize: 22,
        fontWeight: '800' as any,
        color: COLORS.text,
        marginTop: 2,
    },
    payNowLabel: {
        fontSize: 11,
        color: '#6366F1',
        fontWeight: '600' as any,
        marginTop: 2,
    },
    bookButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 52,
        paddingHorizontal: 32,
        borderRadius: RADIUS.large,
        backgroundColor: '#E2E8F0',
        overflow: 'hidden',
        gap: 8,
        ...SHADOWS.md,
    },
    bookButtonDisabled: {
        backgroundColor: '#F1F5F9',
    },
    bookButtonText: {
        fontSize: 16,
        fontWeight: '700' as any,
        color: '#FFF',
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
});
