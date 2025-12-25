
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
  Image,
  Dimensions,
} from 'react-native';

import RazorpayCheckout from 'react-native-razorpay';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { Service, Address } from '../../types';

import { Toast } from '../../components/Toast';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { BookingSuccessModal } from '../../components/BookingSuccessModal';
import { SavedAddressCard } from '../../components/ui/SavedAddressCard';
import { useResponsive } from '../../hooks/useResponsive';
import { MapLocationPicker } from '../../components/ui/MapLocationPicker';
import { PremiumDateTimePicker } from '../../components/ui/PremiumDateTimePicker';

import { useToast } from '../../hooks/useToast';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';
import { getServiceIconImage } from '../../utils/serviceImages';
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
  const { width: screenWidth, isTablet } = useResponsive();
  const { toast, showSuccess: showToastSuccess, showError, hideToast } = useToast();
  const insets = useSafeAreaInsets();

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

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
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [loadingWallet, setLoadingWallet] = useState(false);

  // Check if this is a driver service
  const isDriverService = service?.category?.toLowerCase() === 'driver' || false;

  // Pricing Logic
  const getProviderPrice = (): number => {
    // 1. Check priceForService first (set in ServiceDetailScreen from backend)
    if (selectedProvider?.priceForService && selectedProvider.priceForService > 0) {
      return Number(selectedProvider.priceForService);
    }

    // 2. Check serviceRates array
    if (selectedProvider?.serviceRates && Array.isArray(selectedProvider.serviceRates)) {
      const rateObj = selectedProvider.serviceRates.find(
        (rate: any) => 
          rate.serviceName === service?.title ||
          rate._id === (service as any)?._id || 
          rate._id === service?.id ||
          rate.serviceId === (service as any)?._id ||
          rate.serviceId === service?.id
      );
      if (rateObj?.price) return Number(rateObj.price);
    }

    // 3. Check services array
    if (selectedProvider?.services && Array.isArray(selectedProvider.services)) {
      const providerService = selectedProvider.services.find(
        (s: any) => 
          s._id === (service as any)?._id || 
          s._id === service?.id ||
          s.serviceName === service?.title
      );
      if (providerService?.price) return Number(providerService.price);
    }

    // 4. Fallback to 0 (don't use service.price - it's unreliable)
    return 0;
  };

  const basePrice = getProviderPrice();
  const gstAmount = basePrice * 0.18;
  const totalPrice = basePrice + gstAmount;

  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Entry Animation
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        damping: 18,
        stiffness: 100,
      }),
    ]).start();
  }, []);

  // Update Address from Navigation
  useEffect(() => {
    if (route.params?.selectedAddress) {
      setSelectedAddress(route.params.selectedAddress);
      setFormErrors((prev: any) => ({ ...prev, address: undefined }));
    }
  }, [route.params?.selectedAddress]);

  // Fetch Wallet Balance
  useEffect(() => {
    const fetchWalletBalance = async () => {
      try {
        setLoadingWallet(true);
        const response = await apiService.getWalletBalance();
        if (response.success && response.data) {
          setWalletBalance(response.data.balance || 0);
        }
      } catch (error) {
        console.error('Failed to fetch wallet balance:', error);
      } finally {
        setLoadingWallet(false);
      }
    };
    fetchWalletBalance();
  }, []);

  // Validation
  const validateForm = (): boolean => {
    const errors: any = {};
    if (!selectedAddress) errors.address = 'Please select a delivery address';
    if (!bookingDate) errors.date = 'Please select a booking date';
    if (!bookingTime) errors.time = 'Please select a booking time';
    if (isDriverService && !endTime) errors.endTime = 'Please select end time';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handlers
  const handleAnimationComplete = () => {
    setShowSuccess(false);
    navigation.reset({
      index: 0,
      routes: [{ name: 'MainTabs', params: { screen: 'BookingsList' } }],
    });
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      showError('Please fill all details to proceed.');
      return;
    }

    setIsLoading(true);
    setShowSuccess(false);

    // Wallet Payment
    if (formData.paymentMethod === 'wallet') {
      if (walletBalance < totalPrice) {
        setIsLoading(false);
        showError(`Insufficient wallet balance. You have ₹${walletBalance.toFixed(2)}, but need ₹${totalPrice.toFixed(2)}`);
        return;
      }
      try {
        await submitBookingPayload('wallet', { paymentStatus: 'paid', paidVia: 'wallet' });
      } catch (error: any) {
        console.error('Wallet payment failed:', error);
        setIsLoading(false);
        showError(error.response?.data?.message || 'Wallet payment failed.');
      }
      return;
    }

    if (formData.paymentMethod !== 'cash') {
      try {
        await executeRazorpayPayment();
      } catch (error: any) {
         console.error('Payment failed:', error);
         setIsLoading(false);
         if (!error.message?.toLowerCase().includes('cancel')) {
            showError(error.message || 'Payment failed.');
         }
      }
      return;
    }

    // Cash Booking
    try {
      await submitBookingPayload('cash');
    } catch (error: any) {
      console.error('Booking failed:', error);
      setIsLoading(false);
      showError(error.response?.data?.message || 'Booking failed.');
    }
  };

  // Helper to generate payload and create booking
  const submitBookingPayload = async (method: string, paymentData: any = {}) => {
      let numericServiceId: number;
      const serviceId = service?.id || (service as any)?._id;
      
      if (typeof serviceId === 'number') {
        numericServiceId = serviceId;
      } else if (typeof serviceId === 'string') {
        const parsed = Number(serviceId);
        numericServiceId = !isNaN(parsed) ? parsed : Math.abs(hashCode(serviceId));
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
        paymentMethod: method === 'cash' ? 'cash' : 'online',
        notes: formData.notes,
        ...paymentData
      };

      if (selectedProvider?._id) bookingPayload.providerId = selectedProvider._id;

      if (isDriverService && bookingTime && endTime) {
        bookingPayload.driverDetails = {
          startTime: bookingTime.toTimeString().substring(0, 5),
          endTime: endTime.toTimeString().substring(0, 5),
        };
      }

      // Use wallet-specific endpoint for wallet payments
      if (method === 'wallet') {
        const response = await apiService.createBookingWithWallet(bookingPayload);
        if (response.success && (response as any).newBalance !== undefined) {
          setWalletBalance((response as any).newBalance); // Update wallet balance
        }
      } else {
        await apiService.createBooking(bookingPayload);
      }
      
      setIsLoading(false);
      setShowSuccess(true);
  };

  const executeRazorpayPayment = async () => {
      const customerPhone = selectedAddress?.phone || user?.phone || '';
      const customerEmail = user?.email || 'user@yann.com';
      
      if (!customerPhone || customerPhone.length < 10) throw new Error('Phone number required');

      const orderRes = await apiService.createPaymentOrder({
        amount: totalPrice,
        customerName: selectedAddress?.name || user?.name || 'User',
        customerPhone,
        customerEmail,
        serviceName: service?.title || 'Service',
      });

      if (!orderRes.success || !orderRes.orderId) throw new Error('Failed to create order');

      const options = {
        description: `Booking: ${service?.title}`,
        image: 'https://yann-care.vercel.app/logo.png',
        currency: 'INR',
        key: orderRes.keyId || '',
        amount: (orderRes.amount || 0).toString(),
        name: 'Yann',
        order_id: orderRes.orderId,
        prefill: { email: customerEmail, contact: customerPhone, name: user?.name },
        theme: { color: COLORS.primary },
      };

      const data = await RazorpayCheckout.open(options);
      
      const verifyRes = await apiService.verifyPayment({
         razorpay_order_id: data.razorpay_order_id,
         razorpay_payment_id: data.razorpay_payment_id,
         razorpay_signature: data.razorpay_signature,
      });

      if (!verifyRes.success) throw new Error('Payment verification failed');

      await submitBookingPayload('online', {
          paymentStatus: 'paid',
          paymentOrderId: data.razorpay_order_id,
          paymentId: data.razorpay_payment_id,
      });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      
      {/* 1. Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Review Booking</Text>
        <View style={{ width: 44 }} />
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView 
          contentContainerStyle={[styles.scrollContent, { paddingBottom: 120 }]}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
            
            {/* 2. Service Card */}
            <View style={styles.serviceCard}>
               <View style={styles.serviceIconBox}>
                 <Image 
                   source={getServiceIconImage(service.title)} 
                   style={{ width: 32, height: 32 }}
                   resizeMode="contain"
                 />
               </View>
               <View style={{ flex: 1 }}>
                 <Text style={styles.serviceTitle}>{service.title}</Text>
                 <Text style={styles.serviceCategory}>{service.category}</Text>
               </View>
               <View style={{ alignItems: 'flex-end' }}>
                 <Text style={styles.servicePrice}>₹{totalPrice.toFixed(0)}</Text>
                 {selectedProvider && (
                    <View style={styles.providerChip}>
                       <Image source={{ uri: selectedProvider.profileImage }} style={styles.providerAvatar} />
                       <Text style={styles.providerName} numberOfLines={1}>{selectedProvider.name}</Text>
                    </View>
                 )}
               </View>
            </View>

            {/* 3. Location Section */}
            <View style={styles.section}>
              <Text style={styles.sectionHeader}>Location</Text>
              <View style={styles.card}>
                {selectedAddress ? (
                  <View style={styles.addressRow}>
                     <View style={[styles.iconCircle, { backgroundColor: '#E0F2FE' }]}>
                        <Ionicons name="location" size={20} color={COLORS.primary} />
                     </View>
                     <View style={{ flex: 1, marginHorizontal: 12 }}>
                        <Text style={styles.addressLabel}>{selectedAddress.label}</Text>
                        <Text style={styles.addressText} numberOfLines={2}>
                          {selectedAddress.fullAddress}
                        </Text>
                     </View>
                     <TouchableOpacity onPress={() => navigation.navigate('SavedAddresses', { fromBooking: true })}>
                        <Text style={styles.changeLink}>Change</Text>
                     </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity 
                    style={styles.addAddressBtn}
                    onPress={() => navigation.navigate('SavedAddresses', { fromBooking: true })}
                  >
                    <Ionicons name="add-circle-outline" size={20} color={COLORS.primary} />
                    <Text style={styles.addAddressText}>Add Address</Text>
                  </TouchableOpacity>
                )}
                
                <TouchableOpacity 
                  style={styles.mapLink}
                  onPress={() => setShowMapPicker(true)}
                >
                  <Ionicons name="map-outline" size={14} color={COLORS.textSecondary} />
                  <Text style={styles.mapLinkText}>Select on Map</Text>
                </TouchableOpacity>
                {formErrors.address && <Text style={styles.errorText}>{formErrors.address}</Text>}
              </View>
            </View>

            {/* 4. Schedule Section */}
            <View style={styles.section}>
              <Text style={styles.sectionHeader}>Schedule</Text>
              <View style={styles.row}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <PremiumDateTimePicker
                    label="Date"
                    value={bookingDate}
                    onChange={setBookingDate}
                    mode="date"
                    error={formErrors.date}
                    minimumDate={new Date()}
                  />
                </View>
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <PremiumDateTimePicker
                    label="Time"
                    value={bookingTime}
                    onChange={setBookingTime}
                    mode="time"
                    error={formErrors.time}
                  />
                </View>
              </View>
              {isDriverService && (
                <View style={{ marginTop: 12 }}>
                   <PremiumDateTimePicker
                    label="End Time"
                    value={endTime}
                    onChange={setEndTime}
                    mode="time"
                    error={formErrors.endTime}
                  />
                </View>
              )}
            </View>

            {/* 5. Payment Section */}
            <View style={styles.section}>
               <Text style={styles.sectionHeader}>Payment Method</Text>
               <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.paymentScroll}>
                  {PAYMENT_METHODS.map((method) => {
                    const isSelected = formData.paymentMethod === method.id;
                    const isWallet = method.id === 'wallet';
                    const insufficientBalance = isWallet && walletBalance < totalPrice;
                    return (
                      <TouchableOpacity
                        key={method.id}
                        style={[
                          styles.paymentOption,
                          isSelected && styles.paymentOptionSelected,
                          insufficientBalance && styles.paymentOptionDisabled
                        ]}
                        onPress={() => {
                          if (insufficientBalance) {
                            showError(`Insufficient balance. Add ₹${(totalPrice - walletBalance).toFixed(0)} to wallet`);
                            return;
                          }
                          setFormData({ ...formData, paymentMethod: method.id });
                        }}
                        disabled={insufficientBalance}
                      >
                         <View style={[styles.paymentIcon, isSelected && { backgroundColor: COLORS.primary }]}>
                            <Ionicons 
                              name={method.icon as any} 
                              size={20} 
                              color={isSelected ? '#FFF' : insufficientBalance ? '#D1D5DB' : COLORS.textSecondary} 
                            />
                         </View>
                         <Text style={[styles.paymentLabel, isSelected && styles.textSelected, insufficientBalance && styles.textDisabled]}>
                           {method.label}
                         </Text>
                         {isWallet && (
                           <Text style={[styles.walletBalanceText, insufficientBalance && styles.textDisabled]}>
                             ₹{walletBalance.toFixed(0)}
                           </Text>
                         )}
                         {isSelected && (
                           <View style={styles.checkBadge}>
                             <Ionicons name="checkmark" size={10} color="#FFF" />
                           </View>
                         )}
                      </TouchableOpacity>
                    );
                  })}
               </ScrollView>
            </View>

            {/* 6. Notes */}
            <View style={styles.section}>
               <Text style={styles.sectionHeader}>Notes</Text>
               <TextInput
                  style={styles.notesInput}
                  placeholder="Any special instructions for the provider?"
                  placeholderTextColor="#9ca3af"
                  multiline
                  value={formData.notes}
                  onChangeText={(t) => setFormData({ ...formData, notes: t })}
               />
            </View>

            {/* 7. Bill Details */}
            <View style={styles.billCard}>
               <Text style={styles.billHeader}>Bill Details</Text>
               <View style={styles.billRow}>
                 <Text style={styles.billLabel}>Item Total</Text>
                 <Text style={styles.billValue}>₹{basePrice.toFixed(2)}</Text>
               </View>
               <View style={styles.billRow}>
                 <Text style={styles.billLabel}>Taxes & Fees (18%)</Text>
                 <Text style={styles.billValue}>₹{gstAmount.toFixed(2)}</Text>
               </View>
               <View style={styles.dashedDivider} />
               <View style={styles.totalRow}>
                 <Text style={styles.totalLabel}>Total Pay</Text>
                 <Text style={styles.totalValue}>₹{totalPrice.toFixed(2)}</Text>
               </View>
            </View>

          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* 8. Bottom Action Bar */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 16 }]}>
         <TouchableOpacity 
            style={[styles.bookBtn, isLoading && styles.bookBtnDisabled]}
            onPress={handleSubmit}
            disabled={isLoading}
         >
            {isLoading ? (
               <LoadingSpinner visible={true} color="#FFF" />
            ) : (
              <>
                 <Text style={styles.bookBtnText}>Book Appointment</Text>
                 <View style={styles.pricePill}>
                    <Text style={styles.pricePillText}>₹{totalPrice.toFixed(0)}</Text>
                 </View>
              </>
            )}
         </TouchableOpacity>
      </View>

      {/* Modals */}
      <MapLocationPicker
        visible={showMapPicker}
        onClose={() => setShowMapPicker(false)}
        onSelectLocation={() => setShowMapPicker(false)}
        initialLocation={selectedAddress?.latitude && selectedAddress?.longitude ? { latitude: selectedAddress.latitude, longitude: selectedAddress.longitude } : undefined}
      />
      
      <BookingSuccessModal
         visible={showSuccess}
         title="Booking Confirmed"
         message="Your service has been scheduled successfully."
         serviceName={service.title}
         onClose={() => setShowSuccess(false)}
         onAnimationComplete={handleAnimationComplete}
      />

      <Toast visible={toast.visible} message={toast.message} type={toast.type} onHide={hideToast} />

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA', // Very light gray background
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: 'transparent',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    letterSpacing: -0.5,
  },
  scrollContent: {
    padding: 20,
  },
  // Service Card
  serviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 20,
    marginBottom: 24,
    ...SHADOWS.sm,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  serviceIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  serviceTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111',
    marginBottom: 2,
  },
  serviceCategory: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  servicePrice: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.primary,
    marginBottom: 4,
  },
  providerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  providerAvatar: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 6,
    backgroundColor: '#DDD',
  },
  providerName: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4B5563',
    maxWidth: 60,
  },
  // Sections
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    fontSize: 15,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 12,
    marginLeft: 4,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 18,
    padding: 16,
    ...SHADOWS.sm,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  // Address
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addressLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111',
  },
  addressText: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  changeLink: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
  },
  addAddressBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  addAddressText: {
    fontWeight: '600',
    color: COLORS.primary,
    marginLeft: 8,
  },
  mapLink: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    justifyContent: 'center',
  },
  mapLinkText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginLeft: 6,
    fontWeight: '500',
  },
  // Schedule
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  // Payment
  paymentScroll: {
    marginLeft: -4,
  },
  paymentOption: {
    width: 100,
    height: 100,
    backgroundColor: '#FFF',
    borderRadius: 16,
    marginHorizontal: 4,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    position: 'relative',
  },
  paymentOptionSelected: {
    borderColor: COLORS.primary,
    backgroundColor: '#F0F9FF',
    borderWidth: 2,
  },
  paymentIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  paymentLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  textSelected: {
    color: COLORS.primary,
  },
  checkBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Notes
  notesInput: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    height: 100,
    textAlignVertical: 'top',
    fontSize: 14,
    color: '#111',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  // Bill
  billCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
  },
  billHeader: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111',
    marginBottom: 16,
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  billLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  billValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111',
  },
  dashedDivider: {
    height: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    borderRadius: 1,
    marginVertical: 14,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.primary,
  },
  // Bottom Bar
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFF',
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    ...SHADOWS.lg,
  },
  bookBtn: {
    backgroundColor: COLORS.primary, // Blue button as requested
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 18,
    borderRadius: 18,
  },
  bookBtnDisabled: {
    backgroundColor: '#9CA3AF',
  },
  bookBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  pricePill: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  pricePillText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 14,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 8,
    marginLeft: 4,
  },
  paymentOptionDisabled: {
    opacity: 0.5,
    borderColor: '#E5E7EB',
  },
  walletBalanceText: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.primary,
    marginTop: 2,
  },
  textDisabled: {
    color: '#D1D5DB',
  },
});

export default BookingFormScreen;
