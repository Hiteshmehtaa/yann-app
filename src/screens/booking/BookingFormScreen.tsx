import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Animated,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { Service, Address } from '../../types';

import { Toast } from '../../components/Toast';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { FloatingLabelInput } from '../../components/ui/FloatingLabelInput';
import { SavedAddressCard } from '../../components/ui/SavedAddressCard';
import { MapLocationPicker } from '../../components/ui/MapLocationPicker';
import { BillingSummaryCard } from '../../components/ui/BillingSummaryCard';
import { PremiumDateTimePicker } from '../../components/ui/PremiumDateTimePicker';
import { StickyBookingCTA } from '../../components/ui/StickyBookingCTA';

import { useToast } from '../../hooks/useToast';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';
import { PAYMENT_METHODS } from '../../utils/constants';
import { COLORS, SPACING, RADIUS, SHADOWS, TYPOGRAPHY } from '../../utils/theme';

type RootStackParamList = {
  BookingForm: {
    service: Service;
    selectedProvider?: any;
    selectedAddress?: Address;
  };
  SavedAddresses: { fromBooking: boolean };
  MainTabs: { screen: string };
};

type BookingFormScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'BookingForm'>;
type BookingFormScreenRouteProp = RouteProp<RootStackParamList, 'BookingForm'>;

interface Props {
  navigation: BookingFormScreenNavigationProp;
  route: BookingFormScreenRouteProp;
}

interface FormData {
  notes: string;
  paymentMethod: string;
}

export const BookingFormScreen: React.FC<Props> = ({ navigation, route }) => {
  const { service, selectedProvider, selectedAddress: initialAddress } = route.params;
  const { user } = useAuth();
  const { toast, showSuccess, showError, hideToast } = useToast();

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  // State
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(initialAddress || null);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [bookingDate, setBookingDate] = useState<Date | null>(null);
  const [bookingTime, setBookingTime] = useState<Date | null>(null);
  const [endTime, setEndTime] = useState<Date | null>(null);
  const [formData, setFormData] = useState<FormData>({
    notes: '',
    paymentMethod: 'cash',
  });
  const [formErrors, setFormErrors] = useState<any>({});

  // Check if this is a driver service
  const isDriverService = service?.category === 'Driver' || false;

  // Get provider price
  const getProviderPrice = (): number => {
    if (!selectedProvider) {
      return typeof service?.price === 'number' ? service.price : 0;
    }

    if (selectedProvider.priceForService && Array.isArray(selectedProvider.priceForService)) {
      const priceObj = selectedProvider.priceForService.find(
        (p: any) => p.serviceId === (service as any)?._id || p.serviceId === service?.id
      );
      return priceObj?.price || 0;
    }

    if (selectedProvider.serviceRates && Array.isArray(selectedProvider.serviceRates)) {
      const rateObj = selectedProvider.serviceRates.find(
        (r: any) => r.serviceId === (service as any)?._id || r.serviceId === service?.id
      );
      return rateObj?.rate || 0;
    }

    return typeof service?.price === 'number' ? service.price : 0;
  };

  const basePrice = getProviderPrice();

  // Entry animation
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        damping: 15,
      }),
    ]).start();
  }, []);

  // Handle address selection from navigation
  useEffect(() => {
    if (route.params?.selectedAddress) {
      setSelectedAddress(route.params.selectedAddress);
      setFormErrors((prev: any) => ({ ...prev, address: undefined }));
    }
  }, [route.params?.selectedAddress]);

  // Validation
  const validateForm = (): boolean => {
    const errors: any = {};

    if (!selectedAddress) {
      errors.address = 'Please select a delivery address';
    }

    if (!bookingDate) {
      errors.date = 'Please select a booking date';
    }

    if (!bookingTime) {
      errors.time = 'Please select a booking time';
    }

    if (isDriverService && !endTime) {
      errors.endTime = 'Please select end time for driver service';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle submission
  const handleSubmit = async () => {
    if (!validateForm()) {
      showError('Please fill all required fields');
      return;
    }

    setIsLoading(true);

    try {
      const bookingPayload: any = {
        serviceId: (service as any)?._id || service?.id,
        customerId: user?._id,
        customerName: selectedAddress?.name || user?.name,
        customerPhone: selectedAddress?.phone || user?.phone,
        customerAddress: selectedAddress?.fullAddress,
        latitude: selectedAddress?.latitude || 0,
        longitude: selectedAddress?.longitude || 0,
        bookingDate: bookingDate?.toISOString().split('T')[0],
        bookingTime: bookingTime?.toTimeString().substring(0, 5),
        basePrice,
        totalPrice: basePrice,
        paymentMethod: formData.paymentMethod,
        notes: formData.notes,
      };

      if (selectedProvider?._id) {
        bookingPayload.providerId = selectedProvider._id;
      }

      if (isDriverService && endTime) {
        bookingPayload.driverDetails = {
          startTime: bookingTime?.toTimeString().substring(0, 5),
          endTime: endTime.toTimeString().substring(0, 5),
        };
      }

      await apiService.createBooking(bookingPayload);

      showSuccess('Booking confirmed successfully!');

      setTimeout(() => {
        navigation.reset({
          index: 0,
          routes: [{ name: 'MainTabs', params: { screen: 'BookingsList' } }],
        });
      }, 1500);
    } catch (error: any) {
      console.error('❌ Booking failed:', error.response?.data || error.message);
      showError(error.response?.data?.message || 'Failed to create booking. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Safety check
  if (!service) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
        <View style={styles.loadingContainer}>
          <LoadingSpinner visible={true} />
          <Text style={styles.loadingText}>Loading service details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Confirm Booking</Text>
          <Text style={styles.headerSubtitle}>Complete your service request</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View style={[{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            {/* Service Hero Card */}
            <View style={styles.heroCard}>
              <LinearGradient
                colors={[COLORS.primary, COLORS.primaryGradientEnd]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.heroGradient}
              >
                <View style={styles.heroIconContainer}>
                  <Ionicons name="sparkles" size={32} color={COLORS.white} />
                </View>
                <Text style={styles.heroTitle}>{service.title}</Text>
                {selectedProvider && (
                  <View style={styles.providerBadge}>
                    <Ionicons name="person" size={14} color={COLORS.primary} />
                    <Text style={styles.providerBadgeText}>{selectedProvider.name}</Text>
                  </View>
                )}
              </LinearGradient>
            </View>

            {/* Section 1: Address Details */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionNumber}>
                  <Text style={styles.sectionNumberText}>1</Text>
                </View>
                <View style={styles.sectionTitleContainer}>
                  <Text style={styles.sectionTitle}>Service Location</Text>
                  <Text style={styles.sectionSubtitle}>Where should we deliver?</Text>
                </View>
              </View>

              <SavedAddressCard
                selectedAddress={selectedAddress as any}
                onSelectAddress={() => navigation.navigate('SavedAddresses', { fromBooking: true })}
                onChangeAddress={() => navigation.navigate('SavedAddresses', { fromBooking: true })}
                error={formErrors.address}
              />

              {/* Map Picker Button */}
              <TouchableOpacity
                style={styles.mapPickerButton}
                onPress={() => setShowMapPicker(true)}
                activeOpacity={0.7}
              >
                <Ionicons name="map" size={20} color={COLORS.primary} />
                <Text style={styles.mapPickerText}>Pick location on map</Text>
                <Ionicons name="chevron-forward" size={20} color={COLORS.textTertiary} />
              </TouchableOpacity>
            </View>

            {/* Section 2: Date & Time */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionNumber}>
                  <Text style={styles.sectionNumberText}>2</Text>
                </View>
                <View style={styles.sectionTitleContainer}>
                  <Text style={styles.sectionTitle}>Schedule Service</Text>
                  <Text style={styles.sectionSubtitle}>When do you need it?</Text>
                </View>
              </View>

              <View style={styles.dateTimeRow}>
                <View style={styles.dateTimeColumn}>
                  <PremiumDateTimePicker
                    label="Select Date"
                    value={bookingDate}
                    onChange={setBookingDate}
                    mode="date"
                    error={formErrors.date}
                    minimumDate={new Date()}
                  />
                </View>
                <View style={styles.dateTimeColumn}>
                  <PremiumDateTimePicker
                    label={isDriverService ? 'Start Time' : 'Time'}
                    value={bookingTime}
                    onChange={setBookingTime}
                    mode="time"
                    error={formErrors.time}
                  />
                </View>
              </View>

              {isDriverService && (
                <PremiumDateTimePicker
                  label="End Time"
                  value={endTime}
                  onChange={setEndTime}
                  mode="time"
                  error={formErrors.endTime}
                  placeholder="Select end time"
                />
              )}
            </View>

            {/* Section 3: Payment & Notes */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionNumber}>
                  <Text style={styles.sectionNumberText}>3</Text>
                </View>
                <View style={styles.sectionTitleContainer}>
                  <Text style={styles.sectionTitle}>Payment Method</Text>
                  <Text style={styles.sectionSubtitle}>How will you pay?</Text>
                </View>
              </View>

              <View style={styles.paymentMethods}>
                {PAYMENT_METHODS.map((method) => (
                  <TouchableOpacity
                    key={method.id}
                    style={[
                      styles.paymentMethod,
                      formData.paymentMethod === method.id && styles.paymentMethodActive,
                    ]}
                    onPress={() => setFormData({ ...formData, paymentMethod: method.id })}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.paymentIcon,
                        formData.paymentMethod === method.id && styles.paymentIconActive,
                      ]}
                    >
                      <Ionicons
                        name={method.icon as any}
                        size={24}
                        color={
                          formData.paymentMethod === method.id ? COLORS.primary : COLORS.textSecondary
                        }
                      />
                    </View>
                    <Text
                      style={[
                        styles.paymentMethodText,
                        formData.paymentMethod === method.id && styles.paymentMethodTextActive,
                      ]}
                    >
                      {method.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Additional Notes */}
              <FloatingLabelInput
                label="Additional Notes (Optional)"
                value={formData.notes}
                onChangeText={(text) => setFormData({ ...formData, notes: text })}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                leftIcon="document-text"
                containerStyle={{ marginTop: SPACING.md }}
              />
            </View>

            {/* Billing Summary */}
            <BillingSummaryCard
              priceBreakdown={{
                basePrice,
                totalPrice: basePrice,
              }}
              serviceName={service.title}
              containerStyle={{ marginBottom: 120 }}
            />
          </Animated.View>
        </ScrollView>

        {/* Sticky CTA */}
        <StickyBookingCTA
          onPress={handleSubmit}
          loading={isLoading}
          disabled={!selectedAddress || !bookingDate || !bookingTime}
          totalPrice={basePrice}
          serviceName={service.title}
        />
      </KeyboardAvoidingView>

      {/* Map Location Picker Modal */}
      <MapLocationPicker
        visible={showMapPicker}
        onClose={() => setShowMapPicker(false)}
        onSelectLocation={(location) => {
          // Handle map location selection
          console.log('📍 Selected location:', location);
          setShowMapPicker(false);
        }}
        initialLocation={
          selectedAddress?.latitude && selectedAddress?.longitude
            ? {
                latitude: selectedAddress.latitude,
                longitude: selectedAddress.longitude,
              }
            : undefined
        }
      />

      <LoadingSpinner visible={isLoading} />

      <Toast visible={toast.visible} message={toast.message} type={toast.type} onHide={hideToast} />
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
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.cardBg,
    ...SHADOWS.sm,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.elevated,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    marginHorizontal: SPACING.md,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.size.lg,
    fontWeight: '700',
    color: COLORS.text,
  },
  headerSubtitle: {
    fontSize: TYPOGRAPHY.size.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  headerSpacer: {
    width: 44,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.lg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: TYPOGRAPHY.size.md,
    color: COLORS.textSecondary,
  },
  heroCard: {
    borderRadius: RADIUS.xlarge,
    overflow: 'hidden',
    marginBottom: SPACING.xl,
    ...SHADOWS.lg,
  },
  heroGradient: {
    padding: SPACING.xl,
    alignItems: 'center',
  },
  heroIconContainer: {
    width: 72,
    height: 72,
    borderRadius: RADIUS.large,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  heroTitle: {
    fontSize: TYPOGRAPHY.size.xxl,
    fontWeight: '800',
    color: COLORS.white,
    textAlign: 'center',
  },
  providerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    gap: 6,
    marginTop: SPACING.md,
  },
  providerBadgeText: {
    fontSize: TYPOGRAPHY.size.sm,
    fontWeight: '700',
    color: COLORS.primary,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
    gap: SPACING.md,
  },
  sectionNumber: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  sectionNumberText: {
    fontSize: TYPOGRAPHY.size.lg,
    fontWeight: '800',
    color: COLORS.white,
  },
  sectionTitleContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.size.lg,
    fontWeight: '700',
    color: COLORS.text,
  },
  sectionSubtitle: {
    fontSize: TYPOGRAPHY.size.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  mapPickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${COLORS.primary}10`,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.medium,
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  mapPickerText: {
    flex: 1,
    fontSize: TYPOGRAPHY.size.md,
    fontWeight: '600',
    color: COLORS.primary,
  },
  dateTimeRow: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  dateTimeColumn: {
    flex: 1,
  },
  paymentMethods: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  paymentMethod: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.medium,
    borderWidth: 2,
    borderColor: COLORS.border,
    padding: SPACING.md,
    alignItems: 'center',
    gap: SPACING.sm,
  },
  paymentMethodActive: {
    borderColor: COLORS.primary,
    backgroundColor: `${COLORS.primary}08`,
  },
  paymentIcon: {
    width: 52,
    height: 52,
    borderRadius: RADIUS.medium,
    backgroundColor: COLORS.elevated,
    justifyContent: 'center',
    alignItems: 'center',
  },
  paymentIconActive: {
    backgroundColor: `${COLORS.primary}15`,
  },
  paymentMethodText: {
    fontSize: TYPOGRAPHY.size.sm,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  paymentMethodTextActive: {
    color: COLORS.primary,
  },
});

export default BookingFormScreen;
