import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    StatusBar,
    Dimensions,
    TextInput,
    Alert,
    Image,
    Platform,
    KeyboardAvoidingView
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Slider from '@react-native-community/slider';

import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';
import { COLORS, RADIUS, SHADOWS } from '../../utils/theme';
import { useToast } from '../../hooks/useToast';
import { LoadingSpinner } from '../../components/LoadingSpinner';

const { width } = Dimensions.get('window');

// Types
type TripType = 'incity' | 'outstation';
type ServiceType = 'oneway' | 'roundtrip';
type Transmission = 'manual' | 'automatic';
type VehicleType = 'hatchback' | 'sedan' | 'suv' | 'luxury' | 'van';

export const DriverBookingScreen = ({ navigation, route }: any) => {
    const { service, selectedProvider, selectedAddress: initialAddress } = route.params;
    const { user } = useAuth();
    const insets = useSafeAreaInsets();
    const { showError } = useToast();

    // State
    const [tripType, setTripType] = useState<TripType>('incity');
    const [serviceType, setServiceType] = useState<ServiceType>('roundtrip');
    const [duration, setDuration] = useState(3); // Minimum 3 hours
    const [pickupAddress, setPickupAddress] = useState(initialAddress?.fullAddress || user?.addressBook?.[0]?.fullAddress || '');
    const [dropAddress, setDropAddress] = useState('');
    const [vehicleType, setVehicleType] = useState<VehicleType | null>(null);
    const [transmission, setTransmission] = useState<Transmission | null>(null);
    const [distanceKm, setDistanceKm] = useState<string>(''); // Manually entered for now if needed, or estimated
    const [notes, setNotes] = useState('');

    const [isLoading, setIsLoading] = useState(false);
    const [providerDetails, setProviderDetails] = useState(selectedProvider);

    // Constants
    const MIN_DURATION = 3;
    const MAX_DURATION = 12;
    const HOURLY_RATE = Number(service.price) || 200; // Fallback
    const RETURN_FARE_PER_KM = 2;

    // Effects
    useEffect(() => {
        // Refresh provider details to get latest capabilities
        if (selectedProvider?.id) {
            apiService.getProviderById(selectedProvider.id).then(res => {
                if (res.success) setProviderDetails(res.data);
            });
        }
    }, []);

    // Price Calculation
    const calculateTotal = () => {
        const baseCost = duration * HOURLY_RATE;
        let returnFare = 0;

        if (serviceType === 'oneway' && distanceKm) {
            returnFare = Number(distanceKm) * RETURN_FARE_PER_KM;
        }

        const total = baseCost + returnFare;
        const gst = total * 0.18; // 18% GST
        return {
            baseCost,
            returnFare,
            gst,
            total: total + gst
        };
    };

    const prices = calculateTotal();

    const handleBook = async () => {
        // Validation
        if (tripType === 'incity' && !pickupAddress) {
            Alert.alert('Missing Info', 'Please enter pickup location');
            return;
        }
        if (!vehicleType || !transmission) {
            Alert.alert('Vehicle Details', 'Please select vehicle type and transmission');
            return;
        }
        if (serviceType === 'oneway' && !distanceKm) {
            Alert.alert('Distance Required', 'Please estimate the one-way distance for fare calculation');
            return;
        }

        setIsLoading(true);

        // Construct Payload
        const payload = {
            serviceId: service.id || service._id,
            serviceName: 'Driver Service', // Explicit name
            serviceCategory: 'driver',
            providerId: providerDetails._id || providerDetails.id,

            // Customer Info
            customerId: user.id || user._id,
            customerName: user.name,
            customerPhone: user.phone,
            customerAddress: pickupAddress, // Use pickup as primary address

            // Dates
            bookingDate: new Date().toISOString(), // Immediate Booking
            bookingTime: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),

            // Driver Specifics
            driverTripDetails: {
                tripType,
                serviceType,
                pickupLocation: { address: pickupAddress },
                dropLocation: { address: dropAddress },
                vehicleType,
                transmission,
                distanceKm: Number(distanceKm) || 0,
                returnFare: prices.returnFare
            },

            // Pricing
            basePrice: HOURLY_RATE,
            quantity: duration, // Used as hours
            totalPrice: prices.total,
            notes,
            billingType: 'hourly'
        };

        try {
            const response = await apiService.createBooking(payload);
            if (response.success) {
                // Send Request to Provider (Trigger Notification)
                const bookingId = response.booking.id || response.booking._id;
                await apiService.sendBookingRequest(bookingId, payload.providerId);

                navigation.reset({
                    index: 0,
                    routes: [{
                        name: 'BookingWaiting',
                        params: {
                            bookingId,
                            providerId: payload.providerId,
                            providerName: providerDetails.name
                        }
                    }],
                });
            }
        } catch (error: any) {
            showError(error.message || 'Booking failed');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <LinearGradient colors={['#1e3a8a', '#172554']} style={styles.header}>
                <View style={[styles.headerContent, { paddingTop: insets.top }]}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#FFF" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Request Personal Driver</Text>
                    <View style={{ width: 40 }} />
                </View>

                {/* Toggle Trip Type */}
                <View style={styles.tripToggle}>
                    <TouchableOpacity
                        style={[styles.toggleBtn, tripType === 'incity' && styles.toggleBtnActive]}
                        onPress={() => setTripType('incity')}
                    >
                        <Text style={[styles.toggleText, tripType === 'incity' && styles.toggleTextActive]}>In-City</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.toggleBtn, tripType === 'outstation' && styles.toggleBtnActive]}
                        onPress={() => setTripType('outstation')}
                    >
                        <Text style={[styles.toggleText, tripType === 'outstation' && styles.toggleTextActive]}>Outstation</Text>
                    </TouchableOpacity>
                </View>
            </LinearGradient>

            <ScrollView contentContainerStyle={styles.content}>

                {/* Route Details */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Route</Text>

                    <View style={styles.inputRow}>
                        <Ionicons name="location" size={20} color="#3B82F6" />
                        <TextInput
                            style={styles.input}
                            placeholder="Pickup Location"
                            value={pickupAddress}
                            onChangeText={setPickupAddress}
                        />
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.inputRow}>
                        <Ionicons name="flag" size={20} color="#EF4444" />
                        <TextInput
                            style={styles.input}
                            placeholder="Drop Location"
                            value={dropAddress}
                            onChangeText={setDropAddress}
                        />
                    </View>

                    {serviceType === 'oneway' && (
                        <View style={[styles.inputRow, { marginTop: 12, backgroundColor: '#F8FAFF' }]}>
                            <Ionicons name="speedometer-outline" size={20} color="#64748B" />
                            <TextInput
                                style={styles.input}
                                placeholder="Approx Distance (km) for Fare"
                                keyboardType="numeric"
                                value={distanceKm}
                                onChangeText={setDistanceKm}
                            />
                        </View>
                    )}
                </View>

                {/* Duration Slider */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Duration ({duration} Hours)</Text>
                    <Text style={styles.subText}>Minimum 3 hours required</Text>
                    <Slider
                        style={{ width: '100%', height: 40 }}
                        minimumValue={3}
                        maximumValue={12}
                        step={1}
                        value={duration}
                        onValueChange={setDuration}
                        minimumTrackTintColor="#3B82F6"
                        maximumTrackTintColor="#CBD5E1"
                        thumbTintColor="#3B82F6"
                    />
                    <View style={styles.sliderLabels}>
                        <Text style={styles.sliderLabel}>3h</Text>
                        <Text style={styles.sliderLabel}>12h</Text>
                    </View>
                </View>

                {/* Trip Options */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Trip Type</Text>
                    <View style={styles.optionRow}>
                        <TouchableOpacity
                            style={[styles.optionCard, serviceType === 'roundtrip' && styles.optionCardActive]}
                            onPress={() => setServiceType('roundtrip')}
                        >
                            <Ionicons name="repeat" size={24} color={serviceType === 'roundtrip' ? '#FFF' : '#64748B'} />
                            <Text style={[styles.optionText, serviceType === 'roundtrip' && styles.optionTextActive]}>Round Trip</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.optionCard, serviceType === 'oneway' && styles.optionCardActive]}
                            onPress={() => setServiceType('oneway')}
                        >
                            <Ionicons name="arrow-forward" size={24} color={serviceType === 'oneway' ? '#FFF' : '#64748B'} />
                            <Text style={[styles.optionText, serviceType === 'oneway' && styles.optionTextActive]}>One Way</Text>
                        </TouchableOpacity>
                    </View>
                    {serviceType === 'oneway' && (
                        <View style={styles.infoBox}>
                            <Ionicons name="information-circle" size={20} color={COLORS.primary} />
                            <Text style={styles.infoNote}>
                                For one-way trips, a return fare of ₹{RETURN_FARE_PER_KM}/km is added to cover the driver's return travel.
                            </Text>
                        </View>
                    )}
                </View>

                {/* Vehicle */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Your Vehicle Details</Text>
                    <Text style={styles.subText}>Select the car you want our partner to drive</Text>

                    {/* Transmission */}
                    <View style={styles.chipRow}>
                        {['manual', 'automatic'].map((t) => (
                            <TouchableOpacity
                                key={t}
                                style={[styles.chip, transmission === t && styles.chipActive]}
                                onPress={() => setTransmission(t as Transmission)}
                            >
                                <Text style={[styles.chipText, transmission === t && styles.chipTextActive]}>
                                    {t.charAt(0).toUpperCase() + t.slice(1)}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Type */}
                    <View style={[styles.chipRow, { marginTop: 12 }]}>
                        {['hatchback', 'sedan', 'suv', 'luxury'].map((v) => (
                            <TouchableOpacity
                                key={v}
                                style={[styles.chip, vehicleType === v && styles.chipActive]}
                                onPress={() => setVehicleType(v as VehicleType)}
                            >
                                <Text style={[styles.chipText, vehicleType === v && styles.chipTextActive]}>
                                    {v.charAt(0).toUpperCase() + v.slice(1)}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

            </ScrollView>

            {/* Footer / Price Breakdown */}
            <View style={styles.footer}>
                <View style={styles.priceRow}>
                    <Text style={styles.totalLabel}>Total Estimate</Text>
                    <Text style={styles.totalPrice}>₹{prices.total.toFixed(0)}</Text>
                </View>
                <Text style={styles.breakdownText}>
                    {duration} hrs x ₹{HOURLY_RATE} + ₹{prices.returnFare} return fare + GST
                </Text>

                <TouchableOpacity style={styles.bookButton} onPress={handleBook} disabled={isLoading}>
                    {isLoading ? <LoadingSpinner color="#FFF" /> : (
                        <Text style={styles.bookButtonText}>Request Driver</Text>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F1F5F9' },
    header: { paddingBottom: 24, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
    headerContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 20 },
    headerTitle: { color: '#FFF', fontSize: 18, fontWeight: '700' },
    backButton: { padding: 8, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 12 },

    tripToggle: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 12, padding: 4, marginHorizontal: 20 },
    toggleBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
    toggleBtnActive: { backgroundColor: '#FFF', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
    toggleText: { color: 'rgba(255,255,255,0.7)', fontWeight: '600' },
    toggleTextActive: { color: '#1e3a8a', fontWeight: '700' },

    content: { padding: 20, paddingBottom: 120 },
    card: { backgroundColor: '#FFF', borderRadius: 16, padding: 16, marginBottom: 16, ...SHADOWS.sm },
    cardTitle: { fontSize: 16, fontWeight: '700', color: '#1E293B', marginBottom: 12 },
    subText: { fontSize: 12, color: '#64748B', marginBottom: 8 },

    inputRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 4 },
    input: { flex: 1, fontSize: 16, color: '#1E293B', paddingVertical: 8 },
    divider: { height: 1, backgroundColor: '#E2E8F0', marginLeft: 32 },

    sliderLabels: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 10, marginTop: -4 },
    sliderLabel: { fontSize: 12, color: '#64748B' },

    optionRow: { flexDirection: 'row', gap: 12 },
    optionCard: { flex: 1, backgroundColor: '#F8FAFC', padding: 16, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
    optionCardActive: { backgroundColor: '#3B82F6', borderColor: '#3B82F6' },
    optionText: { marginTop: 8, fontSize: 14, fontWeight: '600', color: '#64748B' },
    optionTextActive: { color: '#FFF' },
    optionTextActive: { color: '#FFF' },
    infoBox: { flexDirection: 'row', gap: 8, marginTop: 12, backgroundColor: '#EFF6FF', padding: 12, borderRadius: 8 },
    infoNote: { fontSize: 13, color: '#1E40AF', flex: 1, lineHeight: 18 },

    chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#F8FAFC' },
    chipActive: { backgroundColor: '#EFF6FF', borderColor: '#3B82F6' },
    chipText: { fontSize: 13, color: '#64748B', fontWeight: '500' },
    chipTextActive: { color: '#3B82F6', fontWeight: '700' },

    footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#FFF', padding: 20, borderTopLeftRadius: 24, borderTopRightRadius: 24, ...SHADOWS.md },
    priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    totalLabel: { fontSize: 16, color: '#64748B', fontWeight: '600' },
    totalPrice: { fontSize: 24, color: '#1E293B', fontWeight: '800' },
    breakdownText: { fontSize: 12, color: '#94A3B8', marginBottom: 16 },

    bookButton: { backgroundColor: '#1e3a8a', paddingVertical: 16, borderRadius: 16, alignItems: 'center', shadowColor: '#1e3a8a', shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
    bookButtonText: { color: '#FFF', fontSize: 16, fontWeight: '700' }
});
