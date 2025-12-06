import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StatusBar,
  Animated,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Toast } from '../../components/Toast';
import { useToast } from '../../hooks/useToast';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';
import { PAYMENT_METHODS } from '../../utils/constants';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { Service } from '../../types';
import { COLORS, SPACING, RADIUS, SHADOWS, ICON_SIZES, TYPOGRAPHY, ANIMATIONS } from '../../utils/theme';

type Props = {
  navigation: NativeStackNavigationProp<any>;
  route: RouteProp<{ params: { service: Service; selectedProvider?: any } }, 'params'>;
};

export const BookingFormScreen: React.FC<Props> = ({ navigation, route }) => {
  const { service, selectedProvider } = route.params;
  const { user } = useAuth();
  const { toast, showSuccess, showError, hideToast } = useToast();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  // Check if this is a driver service
  const isDriverService = service.category?.toLowerCase() === 'driver';

  const [formData, setFormData] = useState({
    customerName: user?.name || '',
    customerPhone: user?.phone || '',
    customerAddress: '',
    bookingDate: '',
    bookingTime: '10:00',
    endTime: '20:00', // Default 10 hours for driver services
    paymentMethod: 'cash',
    notes: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  // Refs to manage focus without state updates
  const nameInputRef = useRef<TextInput>(null);
  const phoneInputRef = useRef<TextInput>(null);
  const addressInputRef = useRef<TextInput>(null);

  // Handle date picker change
  const onDateChange = useCallback((event: DateTimePickerEvent, date?: Date) => {
    setShowDatePicker(Platform.OS === 'ios'); // Keep open on iOS, close on Android
    if (date) {
      setSelectedDate(date);
      // Format as YYYY-MM-DD
      const formatted = date.toISOString().split('T')[0];
      setFormData(prev => ({ ...prev, bookingDate: formatted }));
    }
  }, []);

  useEffect(() => {
    console.log('🔄 BookingFormScreen mounted - starting animation');
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: ANIMATIONS.slow,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: ANIMATIONS.slow,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Log component re-renders
  useEffect(() => {
    console.log('🔄 BookingFormScreen re-rendered');
  });

  // Stable update handlers to prevent re-renders stealing focus
  const updateCustomerName = useCallback((value: string) => {
    console.log('📝 Updating customer name:', value);
    setFormData((prev) => ({ ...prev, customerName: value }));
  }, []);

  const updateCustomerPhone = useCallback((value: string) => {
    console.log('📞 Updating customer phone:', value);
    setFormData((prev) => ({ ...prev, customerPhone: value }));
  }, []);

  const updateCustomerAddress = useCallback((value: string) => {
    console.log('📍 Updating customer address:', value);
    setFormData((prev) => ({ ...prev, customerAddress: value }));
  }, []);

  const updateBookingTime = useCallback((value: string) => {
    console.log('🕐 Updating booking time:', value);
    setFormData((prev) => ({ ...prev, bookingTime: value }));
  }, []);

  const updateEndTime = useCallback((value: string) => {
    console.log('🕐 Updating end time:', value);
    setFormData((prev) => ({ ...prev, endTime: value }));
  }, []);

  const updatePaymentMethod = useCallback((value: string) => {
    console.log('💳 Updating payment method:', value);
    setFormData((prev) => ({ ...prev, paymentMethod: value }));
  }, []);

  const updateNotes = useCallback((value: string) => {
    console.log('📝 Updating notes:', value);
    setFormData((prev) => ({ ...prev, notes: value }));
  }, []);

  const validateForm = (): boolean => {
    if (!formData.customerName.trim()) {
      showError('Please enter your name');
      return false;
    }
    if (!formData.customerPhone.trim() || formData.customerPhone.length !== 10) {
      showError('Please enter a valid 10-digit phone number');
      return false;
    }
    if (!formData.customerAddress.trim()) {
      showError('Please enter your address');
      return false;
    }
    if (!formData.bookingDate) {
      showError('Please select a date');
      return false;
    }
    if (!selectedProvider?._id) {
      showError('No provider selected. Please go back and select a provider.');
      return false;
    }
    return true;
  };

  // Get the price for this service from the selected provider
  const getProviderPrice = (): number => {
    if (!selectedProvider) return 0;
    
    // First check if priceForService is set (from by-service endpoint)
    if (selectedProvider.priceForService) {
      return selectedProvider.priceForService;
    }
    
    // Otherwise look in serviceRates
    const serviceRate = selectedProvider.serviceRates?.find(
      (rate: { serviceName?: string; price?: number }) => rate.serviceName?.toLowerCase() === service.title?.toLowerCase()
    );
    return serviceRate?.price || 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      // Get the provider's price for this service
      const providerPrice = getProviderPrice();
      
      if (providerPrice <= 0) {
        showError('Could not determine provider pricing. Please try again.');
        return;
      }

      // Ensure serviceId is a number (handle both id and _id cases)
      let serviceId = 0;
      if (typeof service.id === 'number') {
        serviceId = service.id;
      } else if ((service as any)._id) {
        serviceId = Number.parseInt((service as any)._id, 10) || 0;
      }

      // Build booking data matching website format (POST /api/bookings/create)
      const bookingData = {
        serviceId: serviceId || 1, // Default to 1 if parsing fails
        serviceName: service.title,
        serviceCategory: service.category,
        customerId: user?.id || user?._id || null,
        customerName: formData.customerName,
        customerEmail: user?.email || '',
        customerPhone: formData.customerPhone,
        customerAddress: formData.customerAddress,
        bookingDate: formData.bookingDate,
        bookingTime: formData.bookingTime,
        // Use provider's actual price from API
        basePrice: providerPrice,
        extras: [],
        totalPrice: providerPrice, // Backend will recalculate with extras if any
        paymentMethod: formData.paymentMethod,
        billingType: 'one-time' as const,
        quantity: 1,
        notes: formData.notes,
        // Provider ID is REQUIRED by backend
        providerId: selectedProvider?._id,
        // Add driver details for driver services
        driverDetails: isDriverService ? {
          startTime: formData.bookingTime,
          endTime: formData.endTime,
        } : undefined,
      };

      const bookingResponse = await apiService.createBooking(bookingData);
      console.log('✅ Booking created successfully:', bookingResponse);

      showSuccess('Booking confirmed successfully!');
      setTimeout(() => {
        // Navigate to BookingsList tab with a reset to force refresh
        navigation.reset({
          index: 0,
          routes: [
            {
              name: 'MainTabs',
              params: { screen: 'BookingsList' },
            },
          ],
        });
      }, 1500);
    } catch (error: any) {
      console.error('❌ Booking failed:', error.response?.data || error.message);
      showError(
        error.response?.data?.message || 'Failed to create booking. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={ICON_SIZES.large} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Confirm Booking</Text>
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
          bounces={true}
          alwaysBounceVertical={true}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          nestedScrollEnabled={true}
        >
        <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          {/* Service Summary Card */}
          <View style={styles.summaryCard}>
            <LinearGradient
              colors={[COLORS.primary, COLORS.primaryGradientEnd]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.summaryGradient}
            >
              <View style={styles.summaryIcon}>
                <Ionicons name="sparkles" size={ICON_SIZES.xlarge} color={COLORS.white} />
              </View>
              <Text style={styles.summaryTitle}>{service.title}</Text>
              {selectedProvider && (
                <Text style={styles.summaryProvider}>with {selectedProvider.name}</Text>
              )}
              <View style={styles.summaryRating}>
                <Ionicons name="star" size={14} color={COLORS.warning} />
                <Text style={styles.summaryRatingText}>
                  {selectedProvider?.rating?.toFixed(1) || '4.8'}
                </Text>
              </View>
              {/* Show provider's actual price */}
              <Text style={styles.summaryPrice}>
                {getProviderPrice() > 0 ? `₹${getProviderPrice()}` : service.price}
              </Text>
            </LinearGradient>
          </View>

          {/* Contact Information */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconContainer}>
                <Ionicons name="person" size={ICON_SIZES.medium} color={COLORS.success} />
              </View>
              <Text style={styles.sectionTitle}>Contact Information</Text>
            </View>

            <Input
              ref={nameInputRef}
              label="Full Name"
              leftIcon="person-outline"
              value={formData.customerName}
              onChangeText={updateCustomerName}
              placeholder="Enter your name"
              returnKeyType="next"
              onSubmitEditing={() => phoneInputRef.current?.focus()}
              blurOnSubmit={false}
              onFocus={() => console.log('📝 Full Name field focused')}
            />

            <Input
              ref={phoneInputRef}
              label="Phone Number"
              leftIcon="call-outline"
              value={formData.customerPhone}
              onChangeText={updateCustomerPhone}
              placeholder="10-digit mobile number"
              keyboardType="phone-pad"
              maxLength={10}
              returnKeyType="next"
              onSubmitEditing={() => addressInputRef.current?.focus()}
              blurOnSubmit={false}
              autoComplete="tel"
              autoCapitalize="none"
              autoCorrect={false}
              onFocus={() => console.log('📞 Phone Number field focused')}
            />

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Service Address</Text>
              <TextInput
                ref={addressInputRef}
                style={styles.textArea}
                placeholder="Enter complete address with landmark"
                placeholderTextColor={COLORS.textTertiary}
                multiline
                numberOfLines={4}
                value={formData.customerAddress}
                onChangeText={updateCustomerAddress}
                textAlignVertical="top"
                returnKeyType="done"
                blurOnSubmit={true}
                onFocus={() => console.log('📍 Service Address field focused')}
              />
            </View>
          </View>

          {/* Schedule */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconContainer}>
                <Ionicons name="calendar" size={ICON_SIZES.medium} color={COLORS.accentOrange} />
              </View>
              <Text style={styles.sectionTitle}>Schedule</Text>
            </View>

            <View style={styles.row}>
              <View style={styles.halfInput}>
                <Text style={styles.inputLabel}>Date</Text>
                <TouchableOpacity 
                  style={styles.datePickerButton}
                  onPress={() => {
                    console.log('📅 Date picker opened');
                    setShowDatePicker(true);
                  }}
                >
                  <Ionicons name="calendar-outline" size={18} color={COLORS.primary} />
                  <Text style={[
                    styles.datePickerText,
                    !formData.bookingDate && styles.datePickerPlaceholder
                  ]}>
                    {formData.bookingDate || 'Select Date'}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.halfInput}>
                <Text style={styles.inputLabel}>{isDriverService ? 'Start Time' : 'Time'}</Text>
                <TextInput
                  style={styles.input}
                  placeholder="10:00"
                  placeholderTextColor={COLORS.textTertiary}
                  value={formData.bookingTime}
                  onChangeText={updateBookingTime}
                  onFocus={() => console.log('🕐 Booking Time field focused')}
                />
              </View>
            </View>

            {/* Date Picker Modal */}
            {showDatePicker && (
              <DateTimePicker
                value={selectedDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={onDateChange}
                minimumDate={new Date()}
              />
            )}

            {/* End Time for Driver Services */}
            {isDriverService && (
              <View style={[styles.row, { marginTop: SPACING.sm }]}>
                <View style={styles.halfInput}>
                  <Text style={styles.inputLabel}>End Time</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="20:00"
                    placeholderTextColor={COLORS.textTertiary}
                    value={formData.endTime}
                    onChangeText={updateEndTime}
                    onFocus={() => console.log('🕐 End Time field focused')}
                  />
                </View>
                <View style={styles.halfInput}>
                  <Text style={styles.driverHint}>
                    Base: 10 hrs, overtime extra
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* Payment Method */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconContainer}>
                <Ionicons name="wallet" size={ICON_SIZES.medium} color={COLORS.warning} />
              </View>
              <Text style={styles.sectionTitle}>Payment Method</Text>
            </View>

            <View style={styles.paymentOptions}>
              {PAYMENT_METHODS.map((method) => (
                <TouchableOpacity
                  key={method.id}
                  style={[
                    styles.paymentOption,
                    formData.paymentMethod === method.id && styles.paymentOptionActive,
                  ]}
                  onPress={() => updatePaymentMethod(method.id)}
                >
                  <Ionicons
                    name={method.icon as keyof typeof Ionicons.glyphMap}
                    size={ICON_SIZES.medium}
                    color={formData.paymentMethod === method.id ? COLORS.primary : COLORS.textSecondary}
                  />
                  <Text
                    style={[
                      styles.paymentOptionText,
                      formData.paymentMethod === method.id && styles.paymentOptionTextActive,
                    ]}
                  >
                    {method.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Additional Notes */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconContainer}>
                <Ionicons name="document-text" size={ICON_SIZES.medium} color={COLORS.info} />
              </View>
              <Text style={styles.sectionTitle}>Additional Notes</Text>
            </View>

            <TextInput
              style={styles.textArea}
              placeholder="Any special requirements or instructions..."
              placeholderTextColor={COLORS.textTertiary}
              multiline
              numberOfLines={4}
              value={formData.notes}
              onChangeText={updateNotes}
              textAlignVertical="top"
              onFocus={() => console.log('📝 Additional Notes field focused')}
            />
          </View>

          {/* Price Breakdown */}
          <View style={styles.priceCard}>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Service Fee</Text>
              <Text style={styles.priceValue}>
                {getProviderPrice() > 0 ? `₹${getProviderPrice()}` : 'Calculating...'}
              </Text>
            </View>
            <View style={styles.priceDivider} />
            <View style={styles.priceRow}>
              <Text style={styles.priceTotalLabel}>Total Amount</Text>
              <Text style={styles.priceTotalValue}>
                {getProviderPrice() > 0 ? `₹${getProviderPrice()}` : 'Calculating...'}
              </Text>
            </View>
          </View>

          {/* Submit Button */}
          <Button
            title="Confirm Booking"
            onPress={handleSubmit}
            loading={isLoading}
            size="large"
            style={styles.submitButton}
          />
        </Animated.View>
      </ScrollView>
      </KeyboardAvoidingView>

      <LoadingSpinner visible={isLoading} />
      
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={hideToast}
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
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.cardBg,
    ...SHADOWS.sm,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.small,
    backgroundColor: COLORS.elevated,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: TYPOGRAPHY.size.xl,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
    marginHorizontal: SPACING.md,
  },
  headerSpacer: {
    width: 44,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: SPACING.lg,
  },
  summaryCard: {
    borderRadius: RADIUS.large,
    overflow: 'hidden',
    marginBottom: SPACING.xl,
    ...SHADOWS.md,
  },
  summaryGradient: {
    padding: SPACING.xl,
    alignItems: 'center',
  },
  summaryIcon: {
    width: 64,
    height: 64,
    borderRadius: RADIUS.medium,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  summaryTitle: {
    fontSize: TYPOGRAPHY.size.xxl,
    fontWeight: '800',
    color: COLORS.white,
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  summaryProvider: {
    fontSize: TYPOGRAPHY.size.sm,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  summaryRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: SPACING.sm,
  },
  summaryRatingText: {
    fontSize: TYPOGRAPHY.size.md,
    fontWeight: '600',
    color: COLORS.white,
  },
  summaryPrice: {
    fontSize: TYPOGRAPHY.size.xxxl,
    fontWeight: '800',
    color: COLORS.white,
    letterSpacing: -0.5,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  sectionIconContainer: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.small,
    backgroundColor: COLORS.elevated,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.size.lg,
    fontWeight: '700',
    color: COLORS.text,
  },
  inputGroup: {
    marginBottom: SPACING.md,
  },
  inputLabel: {
    fontSize: TYPOGRAPHY.size.sm,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  input: {
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.medium,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    fontSize: TYPOGRAPHY.size.md,
    color: COLORS.text,
  },
  textArea: {
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.medium,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    fontSize: TYPOGRAPHY.size.md,
    color: COLORS.text,
    minHeight: 100,
  },
  row: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  halfInput: {
    flex: 1,
  },
  paymentOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  paymentOption: {
    flex: 1,
    minWidth: '45%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.medium,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  paymentOptionActive: {
    borderColor: COLORS.primary,
    borderWidth: 2,
    backgroundColor: `${COLORS.primary}08`,
  },
  paymentOptionText: {
    fontSize: TYPOGRAPHY.size.sm,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  paymentOptionTextActive: {
    color: COLORS.primary,
  },
  priceCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.large,
    padding: SPACING.lg,
    marginBottom: SPACING.xl,
    ...SHADOWS.md,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  priceLabel: {
    fontSize: TYPOGRAPHY.size.md,
    color: COLORS.textSecondary,
  },
  priceValue: {
    fontSize: TYPOGRAPHY.size.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  priceDivider: {
    height: 1,
    backgroundColor: COLORS.divider,
    marginVertical: SPACING.sm,
  },
  priceTotalLabel: {
    fontSize: TYPOGRAPHY.size.lg,
    fontWeight: '700',
    color: COLORS.text,
  },
  priceTotalValue: {
    fontSize: TYPOGRAPHY.size.xxl,
    fontWeight: '800',
    color: COLORS.primary,
  },
  submitButton: {
    marginBottom: SPACING.xl,
  },
  driverHint: {
    fontSize: TYPOGRAPHY.size.xs,
    color: COLORS.textSecondary,
    marginTop: SPACING.lg,
    fontStyle: 'italic',
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.medium,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    gap: SPACING.sm,
  },
  datePickerText: {
    fontSize: TYPOGRAPHY.size.md,
    color: COLORS.text,
  },
  datePickerPlaceholder: {
    color: COLORS.textTertiary,
  },
});
