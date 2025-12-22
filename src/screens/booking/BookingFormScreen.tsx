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
  Modal,
  TextInput,
} from 'react-native';

import RazorpayCheckout from 'react-native-razorpay';

import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { Service, Address } from '../../types';

import { Toast } from '../../components/Toast';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { BookingSuccessModal } from '../../components/BookingSuccessModal';
import { BookingAnimation } from '../../components/animations';
import { FloatingLabelInput } from '../../components/ui/FloatingLabelInput';
import { SavedAddressCard } from '../../components/ui/SavedAddressCard';
import { useResponsive } from '../../hooks/useResponsive';
import { MapLocationPicker } from '../../components/ui/MapLocationPicker';
import { BillingSummaryCard } from '../../components/ui/BillingSummaryCard';
import { PremiumDateTimePicker } from '../../components/ui/PremiumDateTimePicker';
import { StickyBookingCTA } from '../../components/ui/StickyBookingCTA';
import { AnimatedButton } from '../../components/AnimatedButton';

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

// Helper function to convert string to numeric hash
const hashCode = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
};

export const BookingFormScreen: React.FC<Props> = ({ navigation, route }) => {
  const { service, selectedProvider, selectedAddress: initialAddress } = route.params;
  const { user } = useAuth();
  const { width: screenWidth, height: screenHeight, isTablet } = useResponsive();
  const { toast, showSuccess: showToastSuccess, showError, hideToast } = useToast();

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  // State
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
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
  const isDriverService = service?.category?.toLowerCase() === 'driver' || false;

  // Get provider price - use price from provider's services array in DB
  const getProviderPrice = (): number => {
    // First check serviceRates array (primary source)
    if (selectedProvider?.serviceRates && Array.isArray(selectedProvider.serviceRates)) {
      const rateObj = selectedProvider.serviceRates.find(
        (rate: any) => 
          rate._id === (service as any)?._id || 
          rate._id === service?.id ||
          rate.serviceId === (service as any)?._id ||
          rate.serviceId === service?.id
      );
      
      if (rateObj?.price) {
        return Number(rateObj.price);
      }
    }

    // Then check services array
    if (selectedProvider?.services && Array.isArray(selectedProvider.services)) {
      const providerService = selectedProvider.services.find(
        (s: any) => 
          s._id === (service as any)?._id || 
          s._id === service?.id ||
          s.serviceName === service?.title
      );
      
      if (providerService?.price) {
        return Number(providerService.price);
      }
    }

    // Fallback to service.price
    const price = typeof service?.price === 'number' ? service.price : 0;
    return price;
  };

  // Calculate GST (18% of base price)
  const getGST = (): number => {
    return basePrice * 0.18; // 18% GST
  };

  const basePrice = getProviderPrice();
  const gstAmount = getGST();
  const totalPrice = basePrice + gstAmount;

  // Payment modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null);

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

  // Handle animation complete - close modal and redirect
  const handleAnimationComplete = () => {
    console.log('🎬 SUCCESS ANIMATION ENDED at:', new Date().toISOString());
    console.log('⏱️ Animation duration: Animation should be 1.27 seconds');
    setShowSuccess(false);
    navigation.reset({
      index: 0,
      routes: [{ name: 'MainTabs', params: { screen: 'BookingsList' } }],
    });
  };

  // Handle submission
  const handleSubmit = async () => {
    if (!validateForm()) {
      showError('Please fill all required fields');
      return;
    }

    setIsLoading(true);
    setShowSuccess(false);

    // Check if online payment is required
    if (formData.paymentMethod !== 'cash') {
      try {
        console.log('💳 Initiating Razorpay payment...');
        await executeRazorpayPayment();
        // Payment success and booking created - loading state handled in executeRazorpayPayment
      } catch (error: any) {
         console.error('❌ Payment flow failed:', error);
         setIsLoading(false);
         
         // Show error message to user (unless cancelled)
         if (error.message?.toLowerCase().includes('cancel')) {
            showError('Payment was cancelled. Please try again when ready.');
         } else {
            const errorMsg = error.message || 'Payment failed. Please try again.';
            showError(errorMsg);
         }
      }
      return;
    }

    // Cash Booking Flow
    try {
      // Get the numeric service ID
      let numericServiceId: number;
      const serviceId = service?.id || (service as any)?._id;
      
      // Check if it's already a number
      if (typeof serviceId === 'number') {
        numericServiceId = serviceId;
      } else if (typeof serviceId === 'string') {
        // Try to parse as number first
        const parsed = Number(serviceId);
        if (!isNaN(parsed)) {
          numericServiceId = parsed;
        } else {
          // If it's a MongoDB ObjectId, convert to hash
          numericServiceId = Math.abs(hashCode(serviceId));
        }
      } else {
        // Fallback to hash of service title
        numericServiceId = Math.abs(hashCode(service?.title || 'unknown'));
      }

      const bookingPayload: any = {
        serviceId: numericServiceId,
        serviceName: service?.title,
        serviceCategory: service?.category,
        customerId: (user as any)?._id || user?.id,
        customerName: selectedAddress?.name || user?.name || 'Guest',
        customerPhone: selectedAddress?.phone || user?.phone || '',
        customerAddress: selectedAddress?.fullAddress || '',
        latitude: selectedAddress?.latitude || 0,
        longitude: selectedAddress?.longitude || 0,
        // Provider navigation details - sending complete address to provider
        providerNavigationAddress: {
          fullAddress: selectedAddress?.fullAddress || '',
          latitude: selectedAddress?.latitude || 0,
          longitude: selectedAddress?.longitude || 0,
          phone: selectedAddress?.phone || user?.phone || '',
        },
        bookingDate: bookingDate?.toISOString().split('T')[0],
        bookingTime: bookingTime?.toTimeString().substring(0, 5),
        basePrice,
        gstAmount,
        totalPrice,
        paymentMethod: formData.paymentMethod,
        notes: formData.notes,
      };

      if (selectedProvider?._id) {
        bookingPayload.providerId = selectedProvider._id;
      }

      if (isDriverService && bookingTime && endTime) {
        bookingPayload.driverDetails = {
          startTime: bookingTime.toTimeString().substring(0, 5),
          endTime: endTime.toTimeString().substring(0, 5),
        };
      }

      await apiService.createBooking(bookingPayload);

      // Hide loading, show success animation
      console.log('✅ BOOKING CREATED - Showing success animation');
      setIsLoading(false);
      setShowSuccess(true);

      // Modal will close and redirect after animation completes (1.27s)
    } catch (error: any) {
      console.error('❌ Booking failed:', error.response?.data || error.message);
      setIsLoading(false);
      showError(error.response?.data?.message || 'Failed to create booking. Please try again.');
    }
  };

  // Handle Razorpay Payment Flow
  const executeRazorpayPayment = async () => {
    try {
      // 1. Validate required data before creating order
      const customerPhone = selectedAddress?.phone || user?.phone || '';
      const customerEmail = user?.email || '';
      const customerName = selectedAddress?.name || user?.name || 'Guest';

      if (!customerPhone || customerPhone.length < 10) {
        throw new Error('Valid phone number is required for payment');
      }

      if (!customerEmail) {
        throw new Error('Email is required for payment');
      }

      console.log('💳 Creating payment order...', {
        amount: totalPrice,
        customerName,
        customerPhone,
        customerEmail,
        serviceName: service?.title,
      });

      // 2. Create Order on Backend
      const orderRes = await apiService.createPaymentOrder({
        amount: totalPrice,
        customerName,
        customerPhone,
        customerEmail,
        serviceName: service?.title || 'Service Booking',
      });

      console.log('📦 Order response:', {
        success: orderRes.success,
        orderId: orderRes.orderId,
        amount: orderRes.amount,
        hasKeyId: !!orderRes.keyId,
      });

      // Validate backend response
      if (!orderRes.success) {
        throw new Error(orderRes.message || 'Failed to create payment order');
      }

      if (!orderRes.orderId) {
        throw new Error('Order ID not received from server');
      }

      if (!orderRes.keyId) {
        throw new Error('Razorpay Key ID not received from server');
      }

      if (!orderRes.amount || orderRes.amount <= 0) {
        throw new Error('Invalid payment amount received from server');
      }

      console.log('✅ Order created:', orderRes.orderId);

      // 3. Prepare Razorpay Options with validated data
      const options = {
        description: `Payment for ${service?.title || 'Service'}`,
        image: 'https://yann-care.vercel.app/logo.png',
        currency: 'INR',
        key: orderRes.keyId,
        amount: orderRes.amount.toString(), // Convert to string for React Native SDK
        name: 'Yann',
        order_id: orderRes.orderId,
        prefill: {
          email: customerEmail,
          contact: customerPhone,
          name: customerName,
        },
        theme: { color: COLORS.primary },
      };

      console.log('🚀 Opening Razorpay with options:', {
        ...options,
        key: options.key.substring(0, 10) + '...',
      });

      // 4. Open Razorpay Checkout
      const data = await RazorpayCheckout.open(options);
      
      console.log('✅ Razorpay payment success:', {
        payment_id: data.razorpay_payment_id,
        order_id: data.razorpay_order_id,
        hasSignature: !!data.razorpay_signature,
      });

      // 5. Verify Payment
      await verifyAndCreateBooking(
        data.razorpay_order_id, 
        data.razorpay_payment_id, 
        data.razorpay_signature
      );

    } catch (error: any) {
      console.error('❌ Payment Error Details:', {
        message: error.message,
        code: error.code,
        description: error.description,
        reason: error.reason,
        step: error.step,
        source: error.source,
      });

      // Handle specific error codes
      if (error.code === 0) {
        // Payment cancelled by user
        throw new Error('Payment cancelled');
      }

      if (error.code === 2) {
        // Network error
        throw new Error('Network error. Please check your internet connection.');
      }

      // Re-throw with descriptive message
      const errorMessage = error.description || error.message || 'Payment failed';
      throw new Error(errorMessage);
    }
  };

  const verifyAndCreateBooking = async (orderId: string, paymentId: string, signature: string) => {
     try {
       console.log('🔐 Verifying payment...', {
         orderId,
         paymentId: paymentId.substring(0, 15) + '...',
         hasSignature: !!signature,
       });

       const verifyRes = await apiService.verifyPayment({
         razorpay_order_id: orderId,
         razorpay_payment_id: paymentId,
         razorpay_signature: signature,
       });

       console.log('✅ Payment verification response:', verifyRes);

       if (!verifyRes.success) {
         throw new Error(verifyRes.message || 'Payment verification failed on server');
       }

       // 4. Create Booking with Payment Details
       console.log('📝 Creating booking after successful payment...');
       await createBookingAfterPayment(orderId, paymentId);
       
     } catch (error: any) {
       console.error('❌ Verify and create booking failed:', error);
       throw new Error(error.message || 'Failed to verify payment or create booking');
     }
  };

  const createBookingAfterPayment = async (orderId: string, paymentId: string) => {
      try {
        // Get the numeric service ID (same logic as cash)
        let numericServiceId: number;
        const serviceId = service?.id || (service as any)?._id;
        
        if (typeof serviceId === 'number') {
          numericServiceId = serviceId;
        } else if (typeof serviceId === 'string') {
          const parsed = Number(serviceId);
          if (!isNaN(parsed)) {
            numericServiceId = parsed;
          } else {
            numericServiceId = Math.abs(hashCode(serviceId));
          }
        } else {
          numericServiceId = Math.abs(hashCode(service?.title || 'unknown'));
        }

        const bookingPayload: any = {
          serviceId: numericServiceId,
          serviceName: service?.title,
          serviceCategory: service?.category,
          customerId: (user as any)?._id || user?.id,
          customerName: selectedAddress?.name || user?.name || 'Guest',
          customerPhone: selectedAddress?.phone || user?.phone || '',
          customerAddress: selectedAddress?.fullAddress || '',
          latitude: selectedAddress?.latitude || 0,
          longitude: selectedAddress?.longitude || 0,
          providerNavigationAddress: {
            fullAddress: selectedAddress?.fullAddress || '',
            latitude: selectedAddress?.latitude || 0,
            longitude: selectedAddress?.longitude || 0,
            phone: selectedAddress?.phone || user?.phone || '',
          },
          bookingDate: bookingDate?.toISOString().split('T')[0],
          bookingTime: bookingTime?.toTimeString().substring(0, 5),
          basePrice,
          gstAmount,
          totalPrice,
          paymentMethod: 'online', // Confirmed online payment
          notes: formData.notes,
          paymentStatus: 'paid',
          paymentOrderId: orderId,
          paymentId: paymentId,
        };

        if (selectedProvider?._id) {
          bookingPayload.providerId = selectedProvider._id;
        }

        if (isDriverService && bookingTime && endTime) {
          bookingPayload.driverDetails = {
            startTime: bookingTime.toTimeString().substring(0, 5),
            endTime: endTime.toTimeString().substring(0, 5),
          };
        }

        console.log('📤 Sending booking payload:', {
          ...bookingPayload,
          paymentOrderId: orderId,
          paymentId: paymentId.substring(0, 15) + '...',
        });

        const bookingResponse = await apiService.createBooking(bookingPayload);

        console.log('✅ Booking created successfully:', bookingResponse);

        setIsLoading(false);
        setShowSuccess(true);
      } catch (error: any) {
        console.error('❌ Failed to create booking after payment:', error);
        setIsLoading(false);
        throw new Error(error.message || 'Failed to create booking after successful payment');
      }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Booking Details</Text>
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
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: isTablet ? 200 : 160 }
          ]}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View style={[{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            
            {/* Enhanced Service Card with Gradient */}
            <View style={styles.serviceCard}>
              <LinearGradient
                colors={['#E8EEFF', '#F8F9FF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.serviceGradient}
              >
                <View style={styles.serviceHeader}>
                  <View style={styles.serviceIconContainer}>
                    <Ionicons name="briefcase-outline" size={28} color={COLORS.primary} />
                  </View>
                  <View style={styles.serviceInfo}>
                    <Text style={styles.serviceName}>{service.title}</Text>
                    <View style={styles.categoryBadge}>
                      <Text style={styles.categoryBadgeText}>{service.category}</Text>
                    </View>
                  </View>
                </View>
              </LinearGradient>
              
              {selectedProvider && (
                <View style={styles.providerInfo}>
                  <LinearGradient
                    colors={[COLORS.primary, COLORS.primaryGradientEnd]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.providerAvatar}
                  >
                    <Text style={styles.providerAvatarText}>
                      {selectedProvider.name?.charAt(0).toUpperCase()}
                    </Text>
                  </LinearGradient>
                  <View style={styles.providerDetails}>
                    <Text style={styles.providerName}>{selectedProvider.name}</Text>
                    <View style={styles.providerRatingRow}>
                      <Ionicons name="star" size={16} color="#FFB800" />
                      <Text style={styles.providerRatingText}>
                        {selectedProvider.rating?.toFixed(1) || '5.0'}
                      </Text>
                      <Text style={styles.providerRatingLabel}>• Professional</Text>
                    </View>
                  </View>
                </View>
              )}
            </View>

            {/* Enhanced Price Summary Card */}
            <View style={styles.priceSummaryCard}>
              <View style={styles.priceSummaryHeader}>
                <Ionicons name="wallet-outline" size={24} color={COLORS.primary} />
                <Text style={styles.sectionHeaderText}>Price Summary</Text>
              </View>
              <View style={styles.priceBreakdown}>
                <View style={styles.priceItemRow}>
                  <Text style={styles.priceItemLabel}>Service Charge</Text>
                  <Text style={styles.priceItemValue}>₹{basePrice.toFixed(2)}</Text>
                </View>
                {gstAmount > 0 && (
                  <View style={styles.priceItemRow}>
                    <Text style={styles.priceItemLabel}>GST (18%)</Text>
                    <Text style={styles.priceItemValue}>₹{gstAmount.toFixed(2)}</Text>
                  </View>
                )}
              </View>
              <LinearGradient
                colors={[COLORS.primary, COLORS.primaryGradientEnd]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.totalAmountGradient}
              >
                <Text style={styles.priceTotalText}>Total Amount</Text>
                <Text style={styles.priceTotalAmount}>₹{totalPrice.toFixed(2)}</Text>
              </LinearGradient>
              {basePrice === 0 && (
                <View style={styles.priceNote}>
                  <Ionicons name="information-circle-outline" size={16} color={COLORS.textSecondary} />
                  <Text style={styles.priceNoteText}>
                    Final price will be confirmed by provider
                  </Text>
                </View>
              )}
            </View>

            {/* Section 1: Address Details */}
            <View style={styles.formSection}>
              <View style={styles.sectionHeader}>
                <Ionicons name="location-outline" size={22} color={COLORS.primary} />
                <Text style={styles.sectionHeaderText}>Service Location</Text>
              </View>

              <SavedAddressCard
                selectedAddress={selectedAddress as any}
                onSelectAddress={() => navigation.navigate('SavedAddresses', { fromBooking: true })}
                onChangeAddress={() => navigation.navigate('SavedAddresses', { fromBooking: true })}
                error={formErrors.address}
              />

              {/* Map Picker Button */}
              <TouchableOpacity
                style={styles.mapButton}
                onPress={() => setShowMapPicker(true)}
                activeOpacity={0.7}
              >
                <Ionicons name="map-outline" size={20} color={COLORS.primary} />
                <Text style={styles.mapButtonText}>Pick location on map</Text>
                <Ionicons name="chevron-forward" size={20} color={COLORS.textTertiary} />
              </TouchableOpacity>
            </View>

            {/* Section 2: Date & Time */}
            <View style={styles.formSection}>
              <View style={styles.sectionHeader}>
                <Ionicons name="calendar-outline" size={22} color={COLORS.primary} />
                <Text style={styles.sectionHeaderText}>Schedule Service</Text>
              </View>

              <View style={styles.dateTimeContainer}>
                <View style={styles.inputHalf}>
                  <PremiumDateTimePicker
                    label="Select Date"
                    value={bookingDate}
                    onChange={setBookingDate}
                    mode="date"
                    error={formErrors.date}
                    minimumDate={new Date()}
                  />
                </View>
                <View style={styles.inputHalf}>
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

            {/* Section 3: Payment Method */}
            <View style={styles.formSection}>
              <View style={styles.sectionHeader}>
                <Ionicons name="card-outline" size={22} color={COLORS.primary} />
                <Text style={styles.sectionHeaderText}>Payment Method</Text>
              </View>

              <View style={styles.paymentOptions}>
                {PAYMENT_METHODS.map((method) => (
                  <TouchableOpacity
                    key={method.id}
                    style={[
                      styles.paymentOption,
                      formData.paymentMethod === method.id && styles.paymentOptionSelected,
                    ]}
                    onPress={() => {
                      setFormData({ ...formData, paymentMethod: method.id });
                      // Removed dummy modal trigger for card/upi
                      if (method.id === 'upi' || method.id === 'card') {
                        setSelectedPaymentMethod(method.id);
                        // setShowPaymentModal(true); // Disable dummy modal
                      }
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={styles.paymentOptionLeft}>
                      <View style={styles.paymentIconWrapper}>
                        <Ionicons
                          name={method.icon as any}
                          size={22}
                          color={formData.paymentMethod === method.id ? COLORS.primary : COLORS.textSecondary}
                        />
                      </View>
                      <Text style={[
                        styles.paymentOptionText,
                        formData.paymentMethod === method.id && styles.paymentOptionTextSelected
                      ]}>
                        {method.label}
                      </Text>
                    </View>
                    <View style={[
                      styles.radioButton,
                      formData.paymentMethod === method.id && styles.radioButtonSelected
                    ]}>
                      {formData.paymentMethod === method.id && (
                        <View style={styles.radioButtonInner} />
                      )}
                    </View>
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
                leftIcon="document-text-outline"
                containerStyle={{ marginTop: SPACING.lg }}
              />
            </View>
          </Animated.View>
        </ScrollView>

        {/* Bottom CTA Button */}
        <View style={styles.bottomCTA}>
          <AnimatedButton
            style={[styles.confirmButton, (!selectedAddress || !bookingDate || !bookingTime) && styles.confirmButtonDisabled]}
            onPress={handleSubmit}
            disabled={!selectedAddress || !bookingDate || !bookingTime || isLoading}
          >
            {isLoading ? (
              <LoadingSpinner visible={true} />
            ) : (
              <>
                <Text style={styles.confirmButtonText}>Confirm Booking</Text>
                <Ionicons name="arrow-forward" size={20} color={COLORS.white} />
              </>
            )}
          </AnimatedButton>
        </View>
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

      <Toast visible={toast.visible} message={toast.message} type={toast.type} onHide={hideToast} />

      <BookingSuccessModal
        visible={showSuccess}
        title="Booking Confirmed!"
        serviceName={service?.title}
        message="We'll notify you once a provider accepts your booking."
        onClose={() => setShowSuccess(false)}
        onAnimationComplete={handleAnimationComplete}
        autoCloseDuration={5000}
      />

      {/* Payment Modal */}
      <Modal
        visible={showPaymentModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPaymentModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.paymentModalContainer}>
            <View style={styles.paymentModalHeader}>
              <Text style={styles.paymentModalTitle}>
                {selectedPaymentMethod === 'upi' ? 'UPI Payment' : 'Card Payment'}
              </Text>
              <TouchableOpacity onPress={() => setShowPaymentModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.paymentModalContent}>
              <View style={styles.paymentAmountCard}>
                <Text style={styles.paymentAmountLabel}>Amount to Pay</Text>
                <Text style={styles.paymentAmount}>₹{totalPrice.toFixed(2)}</Text>
              </View>

              {selectedPaymentMethod === 'upi' ? (
                <View style={styles.upiSection}>
                  <Text style={styles.inputLabel}>Enter UPI ID</Text>
                  <View style={styles.inputContainer}>
                    <Ionicons name="at" size={20} color={COLORS.textSecondary} style={{ marginRight: 10 }} />
                    <TextInput
                      style={styles.paymentInput}
                      placeholder="example@upi"
                      placeholderTextColor={COLORS.textSecondary}
                    />
                  </View>
                  <Text style={styles.helperText}>
                    e.g., yourname@paytm, yourname@googlepay
                  </Text>
                </View>
              ) : (
                <View style={styles.cardSection}>
                  <Text style={styles.inputLabel}>Card Number</Text>
                  <View style={styles.inputContainer}>
                    <Ionicons name="card" size={20} color={COLORS.textSecondary} style={{ marginRight: 10 }} />
                    <TextInput
                      style={styles.paymentInput}
                      placeholder="1234 5678 9012 3456"
                      placeholderTextColor={COLORS.textSecondary}
                      keyboardType="numeric"
                      maxLength={19}
                    />
                  </View>
                  
                  <View style={styles.cardDetailsRow}>
                    <View style={{ flex: 1, marginRight: 10 }}>
                      <Text style={styles.inputLabel}>Expiry Date</Text>
                      <View style={styles.inputContainer}>
                        <TextInput
                          style={styles.paymentInput}
                          placeholder="MM/YY"
                          placeholderTextColor={COLORS.textSecondary}
                          keyboardType="numeric"
                          maxLength={5}
                        />
                      </View>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.inputLabel}>CVV</Text>
                      <View style={styles.inputContainer}>
                        <TextInput
                          style={styles.paymentInput}
                          placeholder="123"
                          placeholderTextColor={COLORS.textSecondary}
                          keyboardType="numeric"
                          maxLength={3}
                          secureTextEntry
                        />
                      </View>
                    </View>
                  </View>
                </View>
              )}

              <TouchableOpacity
                style={styles.proceedPaymentButton}
                onPress={() => {
                  setShowPaymentModal(false);
                  // In future, integrate actual payment gateway
                }}
              >
                <Text style={styles.proceedPaymentButtonText}>Proceed to Pay</Text>
                <Ionicons name="arrow-forward" size={20} color={COLORS.white} />
              </TouchableOpacity>

              <Text style={styles.dummyNotice}>
                * This is a dummy payment screen for demonstration purposes
              </Text>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA', // Professional light gray
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: 'transparent', // Seamless
    zIndex: 10,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1C1E',
  },
  headerSpacer: {
    width: 44,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: 160,
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
  serviceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.xlarge,
    marginBottom: SPACING.xl,
    overflow: 'hidden',
    ...SHADOWS.md,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
  },
  serviceGradient: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  serviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  serviceIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
    ...SHADOWS.sm,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 20,
    fontWeight: '800', // Heavy weight
    color: '#1A1C1E',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.6)', 
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  categoryBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  // Ticket Divider
  ticketDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    width: '100%',
    marginVertical: SPACING.md,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 1,
  },
  providerInfo: {
    backgroundColor: '#FFFFFF',
    padding: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  providerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
    ...SHADOWS.sm,
  },
  providerAvatarText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
  providerDetails: {
    flex: 1,
  },
  providerName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1C1E',
    marginBottom: 4,
  },
  providerRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  providerRatingText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1C1E',
    marginLeft: 4,
    marginRight: 6,
  },
  providerRatingLabel: {
    fontSize: 13,
    color: COLORS.textTertiary,
  },
  // Summary Section
  priceSummaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.large,
    padding: SPACING.lg,
    marginBottom: SPACING.xl,
    ...SHADOWS.sm,
  },
  priceSummaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  priceBreakdown: {
    paddingHorizontal: SPACING.lg,
  },
  sectionHeaderText: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginLeft: SPACING.sm,
  },
  priceItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  priceItemLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  priceItemValue: {
    fontSize: 15,
    color: COLORS.text,
    fontWeight: '600',
  },
  totalAmountGradient: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
    marginTop: SPACING.md,
  },
  priceTotalText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
  priceTotalAmount: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.white,
  },
  priceNote: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    backgroundColor: '#F0F4FF',
  },
  priceNoteText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
    marginLeft: SPACING.xs,
    flex: 1,
  },
  formSection: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    ...SHADOWS.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F5F7FA',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.medium,
    marginTop: SPACING.md,
    borderWidth: 1,
    borderColor: '#E5E8EB',
  },
  mapButtonText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
    marginLeft: SPACING.sm,
  },
  dateTimeContainer: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.sm,
  },
  inputHalf: {
    flex: 1,
    minWidth: 0,
    maxWidth: '48%',
  },
  paymentOptions: {
    gap: SPACING.sm,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: RADIUS.medium,
    padding: SPACING.md,
  },
  paymentOptionSelected: {
    borderColor: COLORS.primary,
    backgroundColor: `${COLORS.primary}08`,
  },
  paymentOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  paymentIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  paymentOptionText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  paymentOptionTextSelected: {
    color: COLORS.text,
    fontWeight: '700',
  },
  radioButton: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonSelected: {
    borderColor: COLORS.primary,
  },
  radioButtonInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.primary,
  },
  bottomCTA: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    ...SHADOWS.lg,
  },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.lg,
    borderRadius: RADIUS.medium,
    gap: SPACING.sm,
  },
  confirmButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
  },
  // Decorative background
  backgroundPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  patternCircle: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: 'rgba(59, 130, 246, 0.08)',
  },
  // Payment Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  paymentModalContainer: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: SPACING.xl,
    paddingBottom: Platform.OS === 'ios' ? 40 : SPACING.xl,
    maxHeight: '80%',
  },
  paymentModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    marginBottom: SPACING.xl,
  },
  paymentModalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
  },
  paymentModalContent: {
    paddingHorizontal: SPACING.xl,
  },
  paymentAmountCard: {
    backgroundColor: '#E0F2FE',
    padding: SPACING.lg,
    borderRadius: RADIUS.medium,
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  paymentAmountLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  paymentAmount: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.primary,
  },
  upiSection: {
    marginBottom: SPACING.xl,
  },
  cardSection: {
    marginBottom: SPACING.xl,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: RADIUS.medium,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  paymentInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text,
    padding: 0,
  },
  helperText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  cardDetailsRow: {
    flexDirection: 'row',
    marginTop: SPACING.sm,
  },
  proceedPaymentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.lg,
    borderRadius: RADIUS.medium,
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },
  proceedPaymentButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
  },
  dummyNotice: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.lg,
    fontStyle: 'italic',
  },
});

export default BookingFormScreen;
