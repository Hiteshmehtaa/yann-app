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
  Alert,
  Modal,
  Dimensions,
  Image
} from 'react-native';
import RazorpayCheckout from 'react-native-razorpay';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { Service, Address } from '../../types';

import { BookingAnimation } from '../../components/animations';
import { FloatingLabelInput } from '../../components/ui/FloatingLabelInput';
import { useResponsive } from '../../hooks/useResponsive';
import { PremiumDateTimePicker } from '../../components/ui/PremiumDateTimePicker';
import { useToast } from '../../hooks/useToast';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';
import { PAYMENT_METHODS } from '../../utils/constants';
import { COLORS, SPACING, SHADOWS } from '../../utils/theme';

const { width } = Dimensions.get('window');

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

// Fade/Scale In Animation Wrapper
const FadeInView = ({ children, delay = 0, style }: any) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 600,
            delay,
            useNativeDriver: true,
        }).start();
    }, []);
    return <Animated.View style={[{ opacity: fadeAnim }, style]}>{children}</Animated.View>;
};

export const BookingFormScreen: React.FC<Props> = ({ navigation, route }) => {
  const { service, selectedProvider: initialProvider, selectedAddress: initialAddress } = route.params;
  const { user } = useAuth();
  const { isTablet } = useResponsive();
  const { showError } = useToast();
  const insets = useSafeAreaInsets();

  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(initialAddress || null);
  const [bookingDate, setBookingDate] = useState<Date | null>(null);
  const [bookingTime, setBookingTime] = useState<Date | null>(null);
  const [endTime, setEndTime] = useState<Date | null>(null);
  const [formData, setFormData] = useState<FormData>({
    notes: '',
    paymentMethod: 'cash',
  });
  const [formErrors, setFormErrors] = useState<any>({});
  
  // Use state for provider to allow updates from fetch
  const [provider, setProvider] = useState<any>(initialProvider);

  const isDriverService = service?.category?.toLowerCase() === 'driver' || false;
  
  // Fetch latest provider details to ensure pricing is accurate
  useEffect(() => {
    const fetchProviderDetails = async () => {
      if (initialProvider?.id || initialProvider?._id) {
        try {
           const id = initialProvider.id || initialProvider._id;
           const response = await apiService.getProviderById(id);
           if (response.success && response.data) {
              const freshData = response.data;
              setProvider((prev: any) => ({
                 ...prev,
                 ...freshData,
                 serviceRates: freshData.serviceRates || prev.serviceRates || {},
              }));
           }
        } catch (err) {
           console.log('Failed to refresh provider details:', err);
        }
      }
    };
    fetchProviderDetails();
  }, [initialProvider]);

  // Price Calculation Logic
  const getProviderPrice = (): number => {
    let price = 0;
    // 1. Try to find rate for the specific service by NAME
    if (provider?.serviceRates) {
      if (Array.isArray(provider.serviceRates)) {
        const rate = provider.serviceRates.find((r: any) => 
            r.serviceName === service.title || 
            (r.serviceId && String(r.serviceId) === String(service.id || (service as any)._id))
        );
        if (rate && rate.price) price = Number(rate.price);
      } else if (typeof provider.serviceRates === 'object') {
         price = provider.serviceRates[service.title] ? Number(provider.serviceRates[service.title]) : 0;
      }
    }
    // 2. Fallback to first available rate
    if (!price && provider?.serviceRates) {
        if (Array.isArray(provider.serviceRates) && provider.serviceRates.length > 0) {
            price = Number(provider.serviceRates[0].price);
        } else if (typeof provider.serviceRates === 'object') {
            const values = Object.values(provider.serviceRates);
            if (values.length > 0) price = Number(values[0]);
        }
    }
    // 3. Fallback to provider.priceForService
    if (!price && provider?.priceForService) {
        price = Number(provider.priceForService);
    }
    // 4. Ultimate Fallback
    if (!price) {
        price = typeof service.price === 'number' ? service.price : 0;
    }
    return price;
  };

  const basePrice = getProviderPrice();
  const gstAmount = basePrice * 0.18;
  const totalPrice = basePrice + gstAmount;
  
  // Header Animation
  const scrollY = useRef(new Animated.Value(0)).current;
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 60],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  useEffect(() => {
    if (route.params?.selectedAddress) {
      setSelectedAddress(route.params.selectedAddress);
      setFormErrors((prev: any) => ({ ...prev, address: undefined }));
    }
  }, [route.params?.selectedAddress]);

  const validateForm = (): boolean => {
    const errors: any = {};
    if (!selectedAddress) errors.address = 'Required';
    if (!bookingDate) errors.date = 'Required';
    if (!bookingTime) errors.time = 'Required';
    if (isDriverService && !endTime) errors.endTime = 'Required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAnimationComplete = () => {
    setShowSuccess(false);
    navigation.reset({
      index: 0,
      routes: [{ name: 'MainTabs', params: { screen: 'BookingsList' } }],
    });
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      showError('Please check missing fields');
      return;
    }

    setIsLoading(true);
    setShowSuccess(false);

    // Online Payment Flow
    if (formData.paymentMethod !== 'cash') {
      try {
        await executeRazorpayPayment();
      } catch (error: any) {
         console.error('Payment failed:', error);
         setIsLoading(false);
         const msg = error.message?.toLowerCase();
         if (msg?.includes('cancel')) showError('Payment cancelled');
         else showError(error.message || 'Payment failed');
      }
      return;
    }

    // Cash Booking Flow
    try {
      await createBookingRecord('cash');
      setIsLoading(false);
      setShowSuccess(true);
    } catch (error: any) {
      console.error('Booking failed:', error);
      setIsLoading(false);
      showError(error.response?.data?.message || 'Booking failed');
    }
  };

  const createBookingRecord = async (method: string, paymentDetails: any = {}) => {
      let numericServiceId: number;
      const serviceId = service.id || (service as any)._id;
      
      if (typeof serviceId === 'number') numericServiceId = serviceId;
      else if (typeof serviceId === 'string') numericServiceId = parseInt(serviceId, 10);
      else numericServiceId = 0; 

      const payload = {
         serviceId: numericServiceId,
         serviceName: service.title,
         serviceCategory: service.category,
         providerId: provider?.id || provider?._id,
         
         customerId: (user as any)?._id || user?.id,
         customerName: selectedAddress?.name || user?.name || 'Guest',
         customerPhone: selectedAddress?.phone || user?.phone || '',
         customerEmail: user?.email,
         customerAddress: selectedAddress?.fullAddress || '',
         latitude: selectedAddress?.latitude || 0,
         longitude: selectedAddress?.longitude || 0,
         
         providerNavigationAddress: {
             fullAddress: selectedAddress?.fullAddress || '',
             latitude: selectedAddress?.latitude || 0,
             longitude: selectedAddress?.longitude || 0,
             phone: selectedAddress?.phone || user?.phone || '',
         },
         
         bookingDate: bookingDate ? bookingDate.toISOString().split('T')[0] : '', 
         date: bookingDate, 
         bookingTime: bookingTime ? bookingTime.toTimeString().substring(0, 5) : '', 
         time: bookingTime,
         startTime: bookingTime, 
         endTime: isDriverService ? endTime : undefined,
         
         paymentMethod: method,
         notes: formData.notes,
         
         amount: totalPrice, 
         baseAmount: basePrice, 
         gstAmount: gstAmount,
         totalPrice: totalPrice, 
         
         paymentDetails,
         status: 'pending'
      };
      
      const response = await apiService.createBooking(payload);
      return response;
  };

  const executeRazorpayPayment = async () => {
      const orderRes = await apiService.createPaymentOrder({
         amount: totalPrice,
         customerName: user?.name || 'User',
         customerPhone: user?.phone || '9999999999',
         customerEmail: user?.email || 'user@example.com',
         serviceName: service.title || 'Service Booking',
      });
      
      const options = {
        description: `Booking for ${service.title}`,
        image: 'https://yann-care.vercel.app/logo.png', 
        currency: 'INR',
        key: orderRes.keyId || '', 
        amount: (totalPrice * 100).toString(),
        name: 'Yann App',
        order_id: orderRes.orderId || '',
        prefill: {
          email: user?.email || 'user@example.com',
          contact: user?.phone || '9999999999',
          name: user?.name || 'User'
        },
        theme: { color: COLORS.primary }
      };

      RazorpayCheckout.open(options).then(async (data: any) => {
         await createBookingRecord('razorpay', {
            razorpay_payment_id: data.razorpay_payment_id,
            razorpay_order_id: data.razorpay_order_id,
            razorpay_signature: data.razorpay_signature,
         });
         setIsLoading(false);
         setShowSuccess(true);
      }).catch((error: any) => {
         console.log('Razorpay Error:', error);
         throw new Error(error.description || 'Payment failed');
      });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />
      
      {/* Dynamic Header */}
      <Animated.View style={[styles.header, { opacity: headerOpacity, paddingTop: insets.top }]}>
        <View style={styles.headerContent}>
             <TouchableOpacity style={styles.backButtonPlaceholder} onPress={() => navigation.goBack()} />
             <Text style={styles.headerTitleSmall}>Review Booking</Text>
             <View style={{width: 40}} />
        </View>
      </Animated.View>

      <TouchableOpacity 
         style={[styles.backButtonFixed, { top: insets.top + 10 }]} 
         onPress={() => navigation.goBack()}
         activeOpacity={0.8}
      >
         <Ionicons name="arrow-back" size={24} color={COLORS.text} />
      </TouchableOpacity>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Animated.ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 60 }]}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: true }
          )}
          scrollEventThrottle={16}
        >
          {/* Hero Section */}
            <View style={styles.heroSection}>
                <Text style={styles.heroSubtitle}>Complete your</Text>
                <Text style={styles.heroTitle}>Booking Details</Text>
            </View>

          {/* 1. Service Card */}
          <FadeInView delay={100} style={styles.sectionContainer}>
              <View style={styles.sectionHeader}>
                 <Text style={styles.sectionTitle}>Service Selected</Text>
              </View>
              
              <View style={styles.serviceCard}>
                  <View style={styles.serviceRow}>
                     <View style={styles.serviceIconContainer}>
                        <Ionicons name="briefcase" size={24} color={COLORS.primary} />
                     </View>
                     <View style={styles.serviceInfo}>
                        <Text style={styles.serviceName}>{service.title}</Text>
                        <Text style={styles.serviceCategory}>{service.category}</Text>
                     </View>
                     <View style={styles.priceContainer}>
                        <Text style={styles.priceAmount}>₹{basePrice}</Text>
                        <Text style={styles.priceLabel}>base</Text>
                     </View>
                  </View>
                  
                  {provider && (
                     <View style={styles.providerRow}>
                        {provider.profileImage ? (
                            <Image 
                                source={{ uri: provider.profileImage }} 
                                style={styles.providerAvatar}
                            />
                        ) : (
                            <View style={[styles.providerAvatar, { alignItems: 'center', justifyContent: 'center', backgroundColor: '#D1D5DB' }]}>
                                <Text style={{ fontSize: 16, fontWeight: '600', color: '#4B5563' }}>
                                    {provider.name?.charAt(0) || 'E'}
                                </Text>
                            </View>
                        )}
                         <View style={{flex: 1}}>
                             <Text style={styles.providerName}>{provider.name}</Text>
                             <Text style={styles.providerRole}>{provider.services?.[0] || 'Expert'}</Text>
                         </View>
                         <View style={styles.ratingBadge}>
                             <Ionicons name="star" size={12} color="#F59E0B" />
                             <Text style={styles.ratingText}>{provider.rating ? provider.rating.toFixed(1) : 'New'}</Text>
                         </View>
                     </View>
                  )}
              </View>
          </FadeInView>

          {/* 2. Schedule & Location */}
          <FadeInView delay={200} style={styles.sectionContainer}>
             <View style={styles.sectionHeader}>
                 <Text style={styles.sectionTitle}>Date & Location</Text>
             </View>

             <View style={styles.formCard}>
                {/* Address Selector */}
                <TouchableOpacity 
                   style={styles.formRow}
                   onPress={() => navigation.navigate('SavedAddresses', { fromBooking: true })}
                >
                   <View style={[styles.iconBox, { backgroundColor: '#EFF6FF' }]}>
                      <Ionicons name="location" size={20} color={COLORS.primary} />
                   </View>
                   <View style={styles.formContent}>
                      <Text style={styles.label}>Address</Text>
                      <Text style={[styles.value, !selectedAddress && { color: COLORS.textSecondary }]}>
                         {selectedAddress ? selectedAddress.fullAddress : 'Select Delivery Address'}
                      </Text>
                   </View>
                   <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
                </TouchableOpacity>

                <View style={styles.divider} />

                {/* Date Picker */}
                <View style={styles.formRow}>
                    <View style={[styles.iconBox, { backgroundColor: '#F0FDF4' }]}>
                       <Ionicons name="calendar" size={20} color="#16A34A" />
                    </View>
                    <View style={styles.formContent}>
                        <PremiumDateTimePicker
                           label="Date"
                           value={bookingDate}
                           onChange={setBookingDate}
                           mode="date"
                           minimumDate={new Date()}
                           containerStyle={{ marginTop: -8 }}
                        />
                    </View>
                </View>

                <View style={styles.divider} />

                {/* Time Picker */}
                <View style={styles.formRow}>
                    <View style={[styles.iconBox, { backgroundColor: '#FEF3C7' }]}>
                       <Ionicons name="time" size={20} color="#D97706" />
                    </View>
                    <View style={styles.formContent}>
                        <View style={{ flexDirection: 'row', gap: 16 }}>
                            <View style={{ flex: 1 }}>
                                <PremiumDateTimePicker
                                   label={isDriverService ? "Start Time" : "Time"}
                                   value={bookingTime}
                                   onChange={setBookingTime}
                                   mode="time"
                                   containerStyle={{ marginTop: -8 }}
                                />
                            </View>
                            {isDriverService && (
                                <View style={{ flex: 1 }}>
                                   <PremiumDateTimePicker
                                       label="End Time"
                                       value={endTime}
                                       onChange={setEndTime}
                                       mode="time"
                                       containerStyle={{ marginTop: -8 }}
                                    />
                                </View>
                            )}
                        </View>
                    </View>
                </View>

                {(formErrors.address || formErrors.date || formErrors.time) && (
                   <View style={styles.errorContainer}>
                      <Ionicons name="alert-circle" size={16} color="#EF4444" />
                      <Text style={styles.errorText}>Please select all required fields</Text>
                   </View>
                )}
             </View>
          </FadeInView>

          {/* 3. Payment Method */}
          <FadeInView delay={300} style={styles.sectionContainer}>
             <View style={styles.sectionHeader}>
                 <Text style={styles.sectionTitle}>Payment Method</Text>
             </View>

             <View style={styles.formCard}>
                 <ScrollView 
                   horizontal 
                   showsHorizontalScrollIndicator={false}
                   contentContainerStyle={styles.paymentMethodsContainer}
                 >
                    {PAYMENT_METHODS.map((method) => {
                       const isSelected = formData.paymentMethod === method.id;
                       return (
                          <TouchableOpacity 
                             key={method.id}
                             style={[styles.paymentOption, isSelected && styles.paymentOptionSelected]}
                             onPress={() => setFormData({ ...formData, paymentMethod: method.id })}
                          >
                             <View style={[styles.paymentIcon, isSelected && { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                                <Ionicons 
                                   name={method.icon as any} 
                                   size={20} 
                                   color={isSelected ? '#fff' : COLORS.textSecondary} 
                                />
                             </View>
                             <Text style={[styles.paymentText, isSelected && { color: '#fff', fontWeight: '600' }]}>
                                {method.label}
                             </Text>
                          </TouchableOpacity>
                       )
                    })}
                 </ScrollView>
                 
                 <View style={styles.divider} />
                 
                 <View style={styles.noteInputContainer}>
                    <Ionicons name="create-outline" size={20} color={COLORS.textTertiary} style={{ marginTop: 12 }} />
                    <FloatingLabelInput
                        label="Add special instructions (Optional)"
                        value={formData.notes}
                        onChangeText={(t) => setFormData({ ...formData, notes: t })}
                        multiline
                        containerStyle={{ borderWidth: 0, marginTop: 0, flex: 1, backgroundColor: 'transparent' }}
                    />
                 </View>
             </View>
          </FadeInView>

          {/* 4. Bill Summary */}
          <FadeInView delay={400} style={[styles.sectionContainer, { marginBottom: 100 }]}>
              <View style={styles.summaryCard}>
                  <Text style={styles.summaryTitle}>PAYMENT SUMMARY</Text>
                  
                  <View style={styles.summaryRow}>
                     <Text style={styles.summaryLabel}>Base Price</Text>
                     <Text style={styles.summaryValue}>₹{basePrice.toFixed(2)}</Text>
                  </View>
                  <View style={styles.summaryRow}>
                     <Text style={styles.summaryLabel}>Taxes & Fees (18%)</Text>
                     <Text style={styles.summaryValue}>₹{gstAmount.toFixed(2)}</Text>
                  </View>
                  <View style={styles.totalRow}>
                     <Text style={styles.totalLabel}>Total Payable</Text>
                     <Text style={styles.totalAmount}>₹{totalPrice.toFixed(0)}</Text>
                  </View>
              </View>
          </FadeInView>

        </Animated.ScrollView>
      </KeyboardAvoidingView>

      {/* Floating Bottom Bar */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 20) }]}>
         <View style={styles.priceBlock}>
            <Text style={styles.totalLabelSmall}>Total</Text>
            <Text style={styles.finalPrice}>₹{totalPrice.toFixed(0)}</Text>
         </View>
         
         <TouchableOpacity 
           style={styles.bookButton}
           onPress={handleSubmit}
           disabled={isLoading}
         >
             <Text style={styles.bookButtonText}>
                 {isLoading ? 'Processing...' : (formData.paymentMethod === 'cash' ? 'Confirm Booking' : 'Pay Now')}
             </Text>
             {!isLoading && <Ionicons name="arrow-forward" size={20} color="#fff" />}
         </TouchableOpacity>
      </View>

      {/* Success Modal */}
      <Modal visible={showSuccess} transparent animationType="none">
         <View style={styles.modalOverlay}>
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
    backgroundColor: '#F9FAFB', // Light gray bg for card pop
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  
  // Header
  header: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    zIndex: 10,
  },
  headerContent: {
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  backButtonPlaceholder: { width: 40, height: 40 },
  headerTitleSmall: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  backButtonFixed: {
    position: 'absolute',
    left: 20,
    zIndex: 20,
    width: 40, 
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.sm,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  
  // Hero
  heroSection: {
      marginBottom: 30,
      marginTop: 20,
  },
  heroSubtitle: {
      fontSize: 16,
      color: '#6B7280',
      fontWeight: '500',
      marginBottom: 4,
  },
  heroTitle: {
      fontSize: 32,
      fontWeight: '800',
      color: '#111827',
      letterSpacing: -0.5,
  },

  // Sections
  sectionContainer: {
      marginBottom: 24,
  },
  sectionHeader: {
      marginBottom: 12,
  },
  sectionTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: '#374151',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
  },

  // Service Card
  serviceCard: {
      backgroundColor: '#fff',
      borderRadius: 20,
      padding: 20,
      ...SHADOWS.sm,
      borderWidth: 1,
      borderColor: '#F3F4F6',
  },
  serviceRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 20,
  },
  serviceIconContainer: {
      width: 48,
      height: 48,
      borderRadius: 14,
      backgroundColor: '#EFF6FF',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 16,
  },
  serviceInfo: {
      flex: 1,
  },
  serviceName: {
      fontSize: 18,
      fontWeight: '700',
      color: '#111827',
  },
  serviceCategory: {
      fontSize: 13,
      color: '#6B7280',
      marginTop: 2,
  },
  priceContainer: {
      alignItems: 'flex-end',
  },
  priceAmount: {
      fontSize: 20,
      fontWeight: '700',
      color: COLORS.primary,
  },
  priceLabel: {
      fontSize: 11,
      color: '#9CA3AF',
      fontWeight: '500',
  },
  providerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#F9FAFB',
      padding: 12,
      borderRadius: 12,
  },
  providerAvatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      marginRight: 12,
      backgroundColor: '#D1D5DB', // fallback color
  },
  providerName: {
      fontSize: 14,
      fontWeight: '600',
      color: '#1F2937',
  },
  providerRole: {
      fontSize: 12,
      color: '#6B7280',
  },
  ratingBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#FEF3C7',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
      gap: 4,
  },
  ratingText: {
      fontSize: 12,
      fontWeight: '700',
      color: '#D97706',
  },

  // Form Card
  formCard: {
      backgroundColor: '#fff',
      borderRadius: 20,
      ...SHADOWS.sm,
      borderWidth: 1,
      borderColor: '#F3F4F6',
      overflow: 'hidden',
  },
  formRow: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
  },
  iconBox: {
      width: 40,
      height: 40,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 16, 
  },
  formContent: {
      flex: 1,
  },
  label: {
      fontSize: 12,
      color: '#6B7280',
      marginBottom: 2,
      fontWeight: '500',
  },
  value: {
      fontSize: 15,
      color: '#111827',
      fontWeight: '500',
  },
  divider: {
      height: 1,
      backgroundColor: '#F3F4F6',
      marginLeft: 72, // aligns with content
  },
  errorContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#FEF2F2',
      padding: 12,
      gap: 8,
  },
  errorText: {
      fontSize: 13,
      color: '#EF4444',
      fontWeight: '500',
  },

  // Payment
  paymentMethodsContainer: {
      padding: 16,
      gap: 12,
  },
  paymentOption: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#F9FAFB',
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 30,
      borderWidth: 1,
      borderColor: '#E5E7EB',
      gap: 8,
  },
  paymentOptionSelected: {
      backgroundColor: COLORS.primary,
      borderColor: COLORS.primary,
  },
  paymentIcon: {
      width: 24,
      height: 24,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
  },
  paymentText: {
      fontSize: 14,
      color: '#4B5563',
  },
  noteInputContainer: {
      flexDirection: 'row',
      paddingHorizontal: 16,
      paddingBottom: 8,
  },

  // Summary
  summaryCard: {
      backgroundColor: '#F3F4F6',
      borderRadius: 20,
      padding: 24,
  },
  summaryTitle: {
      fontSize: 13,
      fontWeight: '700',
      color: '#6B7280',
      marginBottom: 16,
      letterSpacing: 1,
  },
  summaryRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 12,
  },
  summaryLabel: {
      fontSize: 15,
      color: '#4B5563',
  },
  summaryValue: {
      fontSize: 15,
      fontWeight: '600',
      color: '#111827',
  },
  totalRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 16,
      paddingTop: 16,
      borderTopWidth: 1,
      borderTopColor: '#E5E7EB',
  },
  totalLabel: {
      fontSize: 16,
      fontWeight: '700',
      color: '#111827',
  },
  totalAmount: {
      fontSize: 24,
      fontWeight: '800',
      color: COLORS.primary,
  },

  // Bottom Bar
  bottomBar: {
      position: 'absolute',
      bottom: 0,
      left: 0, 
      right: 0,
      backgroundColor: '#fff',
      padding: 20,
      flexDirection: 'row',
      alignItems: 'center',
      borderTopWidth: 1,
      borderTopColor: '#F3F4F6',
      ...SHADOWS.lg,
  },
  priceBlock: {
      flex: 1,
  },
  totalLabelSmall: {
      fontSize: 12,
      color: '#6B7280',
      fontWeight: '500',
  },
  finalPrice: {
      fontSize: 20,
      fontWeight: '800',
      color: COLORS.primary,
  },
  bookButton: {
      backgroundColor: COLORS.primary,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 14,
      paddingHorizontal: 24,
      borderRadius: 16,
      gap: 8,
      ...SHADOWS.md,
  },
  bookButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '700',
  },

  // Modal
  modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(255,255,255,0.98)',
      alignItems: 'center',
      justifyContent: 'center',
  },
});
