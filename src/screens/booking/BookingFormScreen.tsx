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

      {/* Modern Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Review Booking</Text>
        <TouchableOpacity style={styles.helpButton}>
           <Ionicons name="help-circle-outline" size={24} color={COLORS.text} />
        </TouchableOpacity>
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
            
            {/* Service & Provider Summary Card */}
            <View style={styles.sectionContainer}>
                <LinearGradient
                  colors={['#ffffff', '#f8faff']}
                  style={styles.mainCard}
                >
                  <View style={styles.serviceRow}>
                    <View style={styles.serviceIconBadge}>
                       <Ionicons name="briefcase" size={24} color={COLORS.primary} />
                    </View>
                    <View style={styles.serviceInfoCol}>
                       <Text style={styles.serviceTitle}>{service.title}</Text>
                       <Text style={styles.serviceCategory}>{service.category}</Text>
                    </View>
                    <View style={styles.priceTag}>
                       <Text style={styles.priceTagText}>₹{basePrice}</Text>
                    </View>
                  </View>

                  {selectedProvider && (
                    <>
                      <View style={styles.divider} />
                      <View style={styles.providerRow}>
                         <View style={styles.providerAvatarContainer}>
                            <Text style={styles.providerAvatarInitials}>
                              {selectedProvider.name?.charAt(0).toUpperCase()}
                            </Text>
                         </View>
                         <View style={{ flex: 1 }}>
                            <Text style={styles.providerLabel}>Service by</Text>
                            <Text style={styles.providerNameText}>{selectedProvider.name}</Text>
                         </View>
                         <View style={styles.ratingContainer}>
                            <Ionicons name="star" size={14} color="#F59E0B" />
                            <Text style={styles.ratingText}>{selectedProvider.rating?.toFixed(1) || '5.0'}</Text>
                         </View>
                      </View>
                    </>
                  )}
                </LinearGradient>
            </View>

            {/* Address Section */}
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Location</Text>
              <View style={styles.sectionCard}>
                 {selectedAddress ? (
                   <View>
                     <SavedAddressCard
                        selectedAddress={selectedAddress as any}
                        onSelectAddress={() => navigation.navigate('SavedAddresses', { fromBooking: true })}
                        onChangeAddress={() => navigation.navigate('SavedAddresses', { fromBooking: true })}
                        error={formErrors.address}
                        containerStyle={{ marginBottom: 0, padding: 0, borderWidth: 0, elevation: 0 }}
                     />
                     <TouchableOpacity
                        style={styles.mapTrigger}
                        onPress={() => setShowMapPicker(true)}
                        activeOpacity={0.7}
                     >
                        <LinearGradient
                           colors={['#F0F7FF', '#E6F0FF']}
                           style={styles.mapTriggerGradient}
                           start={{ x: 0, y: 0 }}
                           end={{ x: 1, y: 0 }}
                        >
                           <Ionicons name="map" size={18} color={COLORS.primary} />
                           <Text style={styles.mapTriggerText}>Adjust Pin Location</Text>
                        </LinearGradient>
                     </TouchableOpacity>
                   </View>
                 ) : (
                   <View style={{ alignItems: 'center', paddingVertical: SPACING.md }}>
                      <TouchableOpacity 
                        style={styles.addAddressBtn}
                        onPress={() => navigation.navigate('SavedAddresses', { fromBooking: true })}
                        activeOpacity={0.7}
                      >
                         <Ionicons name="add-circle-outline" size={24} color={COLORS.primary} />
                         <Text style={styles.addAddressText}>Add Address</Text>
                      </TouchableOpacity>
                      
                      <View style={styles.orDivider}>
                         <View style={styles.dividerLine} />
                      </View>

                      <TouchableOpacity 
                        style={styles.selectMapBtn}
                        onPress={() => setShowMapPicker(true)}
                        activeOpacity={0.7}
                      >
                         <Ionicons name="map-outline" size={20} color={COLORS.textSecondary} />
                         <Text style={styles.selectMapText}>Select on Map</Text>
                      </TouchableOpacity>
                      {formErrors.address && <Text style={{ color: COLORS.error, fontSize: 12, marginTop: 8 }}>{formErrors.address}</Text>}
                   </View>
                 )}
              </View>
            </View>

            {/* Schedule Section */}
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Date & Time</Text>
              <View style={styles.sectionCard}>
                 <View style={styles.dateTimeContainer}>
                    <View style={styles.inputHalf}>
                        <PremiumDateTimePicker
                          label="Date"
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
                    <View style={{ marginTop: SPACING.md }}>
                        <PremiumDateTimePicker
                          label="End Time"
                          value={endTime}
                          onChange={setEndTime}
                          mode="time"
                          error={formErrors.endTime}
                          placeholder="Select end time"
                        />
                    </View>
                  )}
              </View>
            </View>

            {/* Payment Method */}
            <View style={styles.sectionContainer}>
               <Text style={styles.sectionTitle}>Payment Method</Text>
               <View style={styles.paymentMethodsGrid}>
                  {PAYMENT_METHODS.map((method) => {
                     const isSelected = formData.paymentMethod === method.id;
                     return (
                        <TouchableOpacity
                           key={method.id}
                           style={[
                              styles.paymentCard,
                              isSelected && styles.paymentCardSelected
                           ]}
                           onPress={() => {
                              setFormData({ ...formData, paymentMethod: method.id });
                              if (method.id === 'upi' || method.id === 'card') {
                                setSelectedPaymentMethod(method.id);
                              }
                           }}
                           activeOpacity={0.8}
                        >
                           <View style={[
                              styles.paymentIconCircle,
                              isSelected && { backgroundColor: COLORS.primary }
                           ]}>
                              <Ionicons 
                                name={method.icon as any} 
                                size={20} 
                                color={isSelected ? '#fff' : COLORS.textSecondary} 
                              />
                           </View>
                           <Text style={[
                              styles.paymentMethodLabel,
                              isSelected && { color: COLORS.primary, fontWeight: '700' }
                           ]}>{method.label}</Text>
                           
                           {isSelected && (
                              <View style={styles.checkBadge}>
                                <Ionicons name="checkmark" size={12} color="#fff" />
                              </View>
                           )}
                        </TouchableOpacity>
                     );
                  })}
               </View>
            </View>

            {/* Additional Notes */}
            <View style={styles.sectionContainer}>
               <View style={styles.sectionCard}>
                  <FloatingLabelInput
                    label="Add instructions for provider..."
                    value={formData.notes}
                    onChangeText={(text) => setFormData({ ...formData, notes: text })}
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                    leftIcon="create-outline"
                    containerStyle={{ marginTop: 0, borderWidth: 0, backgroundColor: '#F9FAFB' }}
                  />
               </View>
            </View>

            {/* Billing Summary */}
            <View style={[styles.sectionContainer, { marginBottom: SPACING.xl }]}>
              <View style={styles.billCard}>
                 <Text style={styles.billHeader}>Bill Details</Text>
                 
                 <View style={styles.billRow}>
                    <Text style={styles.billLabel}>Item Total</Text>
                    <Text style={styles.billValue}>₹{basePrice.toFixed(2)}</Text>
                 </View>
                 
                 {gstAmount > 0 && (
                    <View style={styles.billRow}>
                       <Text style={styles.billLabel}>Taxes & Fee</Text>
                       <Text style={styles.billValue}>₹{gstAmount.toFixed(2)}</Text>
                    </View>
                 )}
                 
                 <View style={styles.billDivider} />
                 
                 <View style={styles.billRowTotal}>
                    <Text style={styles.billTotalLabel}>To Pay</Text>
                    <Text style={styles.billTotalValue}>₹{totalPrice.toFixed(2)}</Text>
                 </View>
              </View>
            </View>

          </Animated.View>
        </ScrollView>

        {/* Floating Bottom Bar */}
        <View style={styles.floatingFooter}>
          <View style={styles.footerContent}>
            <AnimatedButton
              style={[
                styles.bookButton, 
                (!selectedAddress || !bookingDate || !bookingTime) && styles.bookButtonDisabled
              ]}
              onPress={handleSubmit}
              disabled={isLoading || !selectedAddress || !bookingDate || !bookingTime}
            >
              <Text style={styles.bookButtonText}>Book Appointment</Text>
              <View style={styles.pricePill}>
                 <Text style={styles.pricePillText}>₹{totalPrice.toFixed(0)}</Text>
              </View>
            </AnimatedButton>
          </View>
        </View>

      </KeyboardAvoidingView>

      {/* Map Modal */}
      <MapLocationPicker
        visible={showMapPicker}
        onSelectLocation={(locationInfo) => {
          setSelectedAddress({
            ...selectedAddress!,
            ...locationInfo,
            latitude: locationInfo.latitude,
            longitude: locationInfo.longitude,
          });
          setShowMapPicker(false);
        }}
        onClose={() => setShowMapPicker(false)}
        initialLocation={
          selectedAddress?.latitude && selectedAddress?.longitude
            ? {
                latitude: selectedAddress.latitude,
                longitude: selectedAddress.longitude,
              }
            : undefined
        }
      />

      {/* Success Modal */}
      <BookingSuccessModal
        visible={showSuccess}
        onAnimationComplete={handleAnimationComplete}
      />
      
      <Toast visible={toast.visible} message={toast.message} type={toast.type} onHide={hideToast} />

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
    backgroundColor: '#F4F6F9',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: SPACING.sm,
    marginLeft: -SPACING.sm,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  helpButton: {
    padding: SPACING.sm,
    marginRight: -SPACING.sm,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.lg,
  },
  sectionContainer: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.md,
    marginLeft: SPACING.xs,
  },
  mainCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xlarge,
    padding: SPACING.lg,
    ...SHADOWS.sm,
    borderWidth: 1,
    borderColor: '#EBF0FF',
  },
  serviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  serviceIconBadge: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.large,
    backgroundColor: '#F0F7FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  serviceInfoCol: {
    flex: 1,
  },
  serviceTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  serviceCategory: {
    fontSize: 13,
    color: COLORS.textSecondary,
    backgroundColor: '#F3F4F6',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  priceTag: {
    backgroundColor: '#FFF8E1',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.medium,
  },
  priceTagText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#D97706',
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: SPACING.md,
  },
  providerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  providerAvatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  providerAvatarInitials: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  providerLabel: {
    fontSize: 12,
    color: COLORS.textTertiary,
  },
  providerNameText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#B45309',
    marginLeft: 4,
  },
  sectionCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.large,
    padding: SPACING.lg,
    ...SHADOWS.sm,
  },
  mapTrigger: {
    marginTop: SPACING.md,
  },
  mapTriggerGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: RADIUS.medium,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  mapTriggerText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
    marginLeft: 8,
  },
  addAddressBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: SPACING.md,
  },
  addAddressText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
  },
  orDivider: {
    width: '100%',
    alignItems: 'center',
    marginVertical: SPACING.sm,
  },
  dividerLine: {
    width: 40,
    height: 1,
    backgroundColor: COLORS.border,
  },
  selectMapBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  selectMapText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  dateTimeContainer: {
    flexDirection: 'row',
    marginHorizontal: -SPACING.xs,
  },
  inputHalf: {
    flex: 1,
    paddingHorizontal: SPACING.xs,
  },
  paymentMethodsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  paymentCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.large,
    padding: SPACING.lg,
    borderWidth: 1.5,
    borderColor: '#F1F1F1',
    alignItems: 'center',
    position: 'relative',
  },
  paymentCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: '#F5F9FF',
  },
  paymentIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  paymentMethodLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  checkBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  billCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.large,
    padding: SPACING.xl,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  billHeader: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.lg,
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  billLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  billValue: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '500',
  },
  billDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: SPACING.md,
    borderStyle: 'dashed',
    borderRadius: 1,
  },
  billRowTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.xs,
  },
  billTotalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  billTotalValue: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.primary,
  },
  floatingFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    padding: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingBottom: Platform.OS === 'ios' ? 34 : SPACING.lg,
    ...SHADOWS.md,
  },
  footerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  footerPriceCol: {
    flex: 0.4,
  },
  footerPriceLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  footerPriceValue: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text,
  },
  viewDetailsText: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: '600',
    marginTop: 2,
  },
  bookButton: {
    flex: 1,
    borderRadius: RADIUS.medium,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: SPACING.lg,
    backgroundColor: COLORS.primary,
  },
  pricePill: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.medium,
  },
  pricePillText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  bookButtonDisabled: {
    backgroundColor: '#E5E7EB',
  },
  bookButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
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
