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
  Image,
  ActivityIndicator
} from 'react-native';
import RazorpayCheckout from 'react-native-razorpay';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { Service, Address } from '../../types';
import * as Haptics from 'expo-haptics';

import { BookingAnimation } from '../../components/animations';
import { FloatingLabelInput } from '../../components/ui/FloatingLabelInput';
import { useResponsive } from '../../hooks/useResponsive';
import { CustomDateTimePicker } from '../../components/ui/CustomDateTimePicker';
import { useToast } from '../../hooks/useToast';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';
import { PAYMENT_METHODS } from '../../utils/constants';
import { COLORS, SPACING, SHADOWS } from '../../utils/theme';
import { BookingTimerModal } from '../../components/BookingTimerModal';

const { width, height } = Dimensions.get('window');

type RootStackParamList = {
  BookingForm: {
    service: Service;
    selectedProvider?: any;
    selectedAddress?: Address;
  };
  SavedAddresses: { fromBooking: boolean };
  MainTabs: { screen: string };
  // Add missing route definition
  BookingWaiting: {
    bookingId: string;
    providerId: string;
    providerName: string;
    serviceName: string;
    experienceRange?: any;
  };
  Wallet: undefined;
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
  const { user, logout, isGuest } = useAuth();
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
    paymentMethod: 'wallet', // Default to wallet for staged payment
  });
  const [formErrors, setFormErrors] = useState<any>({});

  // Wallet balance for staged payment UI
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [loadingWallet, setLoadingWallet] = useState(true);

  // Booking Timer Modal State (3-minute provider response window)
  const [showTimerModal, setShowTimerModal] = useState(false);
  const [pendingBookingId, setPendingBookingId] = useState<string | null>(null);

  // Payment Modal State (for 25% initial payment after provider accepts)
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);

  // Experience range tracking (for category-based fallback)
  const [selectedExperienceRange, setSelectedExperienceRange] = useState<{ label: string; min: number; max: number | null } | null>(null);

  // UX: Scroll Reference for Progressive Flow
  const scrollViewRef = useRef<ScrollView>(null);

  // UX: Smart Defaults (Auto-select Tomorrow)
  useEffect(() => {
    if (!bookingDate) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setBookingDate(tomorrow);
    }

    // Auto-select Primary Address if not provided
    if (!selectedAddress && user?.addressBook && user.addressBook.length > 0) {
      const primary = user.addressBook.find((addr: Address) => addr.isPrimary) || user.addressBook[0];
      setSelectedAddress(primary);
    }

    // Calculate experience range from provider's experience
    if (initialProvider?.experience) {
      const exp = initialProvider.experience;
      let range: { label: string; min: number; max: number | null } | null = null;

      if (exp < 5) {
        range = { label: '0-5 Years', min: 0, max: 5 };
      } else if (exp < 10) {
        range = { label: '5-10 Years', min: 5, max: 10 };
      } else if (exp < 15) {
        range = { label: '10-15 Years', min: 10, max: 15 };
      } else if (exp < 20) {
        range = { label: '15-20 Years', min: 15, max: 20 };
      } else if (exp < 25) {
        range = { label: '20-25 Years', min: 20, max: 25 };
      } else if (exp < 30) {
        range = { label: '25-30 Years', min: 25, max: 30 };
      } else {
        range = { label: '30+ Years', min: 30, max: null };
      }

      setSelectedExperienceRange(range);
      console.log(`📊 Set experience range for provider with ${exp} years:`, range);
    }

    // Fetch wallet balance for staged payment UI
    const fetchWalletBalance = async () => {
      try {
        setLoadingWallet(true);
        const response = await apiService.getWalletBalance();
        if (response.success) {
          setWalletBalance(response.data?.balance || 0);
        }
      } catch (error) {
        console.log('Failed to fetch wallet balance:', error);
      } finally {
        setLoadingWallet(false);
      }
    };
    fetchWalletBalance();
  }, []);

  // UX: Progressive Scroll Helper
  const scrollToSection = (yOffset: number) => {
    scrollViewRef.current?.scrollTo({ y: yOffset, animated: true });
  };

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
        const p = provider.serviceRates[service.title];
        if (p) price = Number(p);
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
    // 4. Ultimate Fallback (Fix: Handle string prices from service object)
    if (!price && service.price) {
      price = Number(service.price) || 0;
    }

    return isNaN(price) ? 0 : price;
  };

  // Determine pricing model
  const pricingModel = service.pricingModel || 'fixed';
  const isHourlyService = pricingModel === 'hourly';

  // Check if service has overtime charges
  const hasOvertimeCharges = service.hasOvertimeCharges ?? false;

  // Calculate hourly pricing if applicable
  const calculateHourlyPrice = (): { baseCost: number; duration: number } => {
    // Work for both hourly services AND services with overtime charges
    if ((!isHourlyService && !hasOvertimeCharges) || !bookingTime || !endTime) {
      return { baseCost: 0, duration: 0 };
    }

    const startMinutes = bookingTime.getHours() * 60 + bookingTime.getMinutes();
    const endMinutes = endTime.getHours() * 60 + endTime.getMinutes();
    const durationMinutes = endMinutes > startMinutes ? endMinutes - startMinutes : 0;
    const duration = durationMinutes / 60;

    const hourlyRate = getProviderPrice();
    const baseCost = duration * hourlyRate;

    return { baseCost, duration };
  };

  const hourlyPricing = (isHourlyService || hasOvertimeCharges) ? calculateHourlyPrice() : { baseCost: 0, duration: 0 };

  // Base price calculation
  // For hourly services OR services with overtime charges, calculate based on duration
  const rawBasePrice = (isHourlyService || hasOvertimeCharges) && bookingTime && endTime
    ? hourlyPricing.baseCost
    : getProviderPrice();

  // Debug: Log raw price values
  console.log('💰 Pricing Debug:', {
    rawBasePrice,
    providerPrice: getProviderPrice(),
    hourlyPricing,
    servicePrice: service.price,
    isHourlyService,
    hasOvertimeCharges
  });

  // Ensure basePrice is never NaN - fallback to service price or 0
  const basePrice = isNaN(rawBasePrice) || rawBasePrice === null || rawBasePrice === undefined
    ? (Number(service.price) || 0)
    : rawBasePrice;

  // Use service-specific GST rate (support both percentage and decimal formats)
  const serviceGstPercentage = service.gstPercentage ?? (service.gstRate ? service.gstRate * 100 : 18);
  const serviceGstRate = isNaN(serviceGstPercentage) ? 0.18 : serviceGstPercentage / 100;
  const gstAmount = isNaN(basePrice * serviceGstRate) ? 0 : basePrice * serviceGstRate;
  const totalPrice = isNaN(basePrice + gstAmount) ? basePrice : basePrice + gstAmount;

  // Debug: Final pricing values
  console.log('💵 Final Pricing:', { basePrice, serviceGstRate, gstAmount, totalPrice });

  // Calculate booked duration for overtime services
  const calculateBookedHours = (): number => {
    if (!hasOvertimeCharges || !bookingTime || !endTime) return 0;
    const startMinutes = bookingTime.getHours() * 60 + bookingTime.getMinutes();
    const endMinutes = endTime.getHours() * 60 + endTime.getMinutes();
    const durationMinutes = endMinutes - startMinutes;
    return durationMinutes > 0 ? durationMinutes / 60 : 0;
  };

  const bookedHours = calculateBookedHours();

  // Staged Payment Calculations (for wallet payments)
  const initialPaymentPercentage = 25;
  const initialPayment = Math.round(totalPrice * 0.25 * 100) / 100; // 25%
  const completionPayment = Math.round((totalPrice - initialPayment) * 100) / 100; // 75%
  const hasInsufficientBalance = walletBalance < initialPayment;

  // Header Animation
  const scrollY = useRef(new Animated.Value(0)).current;

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
    // Require end time for hourly services
    if (isHourlyService && !endTime) errors.endTime = 'End time required for hourly service';
    // Require end time for overtime services
    if (hasOvertimeCharges && !endTime) errors.endTime = 'Required';
    // Legacy driver service check
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

  // Timer Modal Handlers
  const handleTimerAccepted = () => {
    setShowTimerModal(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Show payment modal for 25% initial payment
    setShowPaymentModal(true);
  };

  const handleTimerRejected = () => {
    setShowTimerModal(false);
    setPendingBookingId(null);

    // Show category-based fallback options
    showCategoryFallbackOptions('rejected');
  };

  const handleTimerTimeout = () => {
    setShowTimerModal(false);
    setPendingBookingId(null);

    // Show category-based fallback options
    showCategoryFallbackOptions('timeout');
  };

  const handleTimerCancel = () => {
    setShowTimerModal(false);
    setPendingBookingId(null);
    // Booking is already created, just go back
    navigation.goBack();
  };

  // Category-based fallback logic
  const showCategoryFallbackOptions = (reason: 'rejected' | 'timeout') => {
    const title = reason === 'rejected' ? 'Provider Unavailable' : 'Request Timed Out';
    const message = reason === 'rejected'
      ? 'The provider is unable to take your booking.'
      : "The provider didn't respond in time.";

    Alert.alert(
      title,
      `${message} Would you like to see other providers${selectedExperienceRange ? ` in the ${selectedExperienceRange.label} experience range` : ''}?`,
      [
        {
          text: 'Go Back',
          style: 'cancel',
          onPress: () => navigation.goBack()
        },
        {
          text: 'See Alternatives',
          onPress: () => {
            // Navigate to ServiceDetail with experience range pre-selected
            navigation.navigate('ServiceDetail' as any, {
              service,
              experienceRange: selectedExperienceRange,
              excludeProviderId: provider?.id || provider?._id
            });
          }
        }
      ]
    );
  };

  // Handle 25% initial payment
  const handleInitialPayment = async () => {
    if (!pendingBookingId) return;

    setPaymentProcessing(true);

    try {
      // Process 25% payment via wallet
      const response = await apiService.payInitialBookingAmount(pendingBookingId, 'wallet');

      if (response.success) {
        setShowPaymentModal(false);
        setPendingBookingId(null);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        // Show success animation
        setShowSuccess(true);
      } else {
        throw new Error(response.message || 'Payment failed');
      }
    } catch (error: any) {
      console.error('Initial payment failed:', error);
      Alert.alert(
        'Payment Failed',
        error.message || 'Unable to process payment. Please try again.',
        [
          { text: 'OK', style: 'default' }
        ]
      );
    } finally {
      setPaymentProcessing(false);
    }
  };

  const handleSubmit = async () => {
    // Guest User Check
    if (!user || (user as any).isGuest) { // Assuming useAuth provides isGuest or checking user existence
      Alert.alert(
        'Sign In Required',
        'You need an account to book services. Please sign in or create an account.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Sign In / Sign Up',
            onPress: async () => {
              // Logout triggers reset to RoleSelection/Login flow
              await apiService.logout().catch(() => { });
              // Force navigation reset if logout doesn't auto-trigger (it usually does via AuthContext)
              // But calling logout() from AuthContext is safer if accessible.
              // Since we only have `user` from useAuth here, let's grab the full context
            }
          }
        ]
      );
      // We need logout function here. Let's see if useAuth provides it.
      // Yes, line 89: const { user } = useAuth();
      // We should update line 89 to destructure logout as well.
      return;
    }

    if (!validateForm()) {
      showError('Please check missing fields');
      return;
    }

    setIsLoading(true);
    setShowSuccess(false);

    // Wallet Payment Flow (25% staged payment)
    if (formData.paymentMethod === 'wallet') {
      // Validate wallet balance for initial 25%
      if (hasInsufficientBalance) {
        setIsLoading(false);
        Alert.alert(
          'Insufficient Balance',
          `You need ₹${initialPayment.toFixed(2)} to book this service. Would you like to top up your wallet?`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Top Up',
              style: 'default',
              onPress: () => navigation.navigate('Wallet')
            }
          ]
        );
        return;
      }

      try {
        // Use the wallet payment API which handles 25% escrow
        const payload = {
          serviceId: String(service.id || (service as any)._id || ''),
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
          startTime: (isHourlyService || isDriverService || hasOvertimeCharges) && bookingTime
            ? bookingTime.toTimeString().substring(0, 5)
            : (bookingTime ? bookingTime.toTimeString().substring(0, 5) : undefined),
          endTime: (isHourlyService || isDriverService || hasOvertimeCharges) && endTime
            ? endTime.toTimeString().substring(0, 5)
            : undefined,
          notes: formData.notes,
          basePrice: isNaN(basePrice) ? 0 : basePrice,
          gstAmount: isNaN(gstAmount) ? 0 : gstAmount,
          totalPrice: isNaN(totalPrice) ? (isNaN(basePrice) ? 0 : basePrice) : totalPrice,
          ...(hasOvertimeCharges && bookedHours > 0 ? { bookedHours } : {}),
        };

        // Debug: Log payload to verify prices
        console.log('📦 Booking payload prices:', { basePrice: payload.basePrice, gstAmount: payload.gstAmount, totalPrice: payload.totalPrice });

        // Create booking without payment - payment happens after provider accepts
        const response = await apiService.createBooking(payload);

        if (response.success && (response as any).booking) {
          const bookingId = (response as any).booking.id || (response as any).booking._id;
          const providerId = provider?.id || provider?._id;

          // Send booking request to provider with 3-minute timer
          try {
            const requestResponse = await apiService.sendBookingRequest(bookingId, providerId);
            console.log('✅ Booking request sent:', requestResponse);
            if (requestResponse.success) {
              // Navigate to waiting screen instead of showing modal
              setIsLoading(false);
              navigation.navigate('BookingWaiting', {
                bookingId: bookingId,
                providerId: providerId,
                providerName: provider?.name || 'Provider',
                serviceName: service.title,
                experienceRange: selectedExperienceRange,
              });
            } else {
              // If request sending fails, show error
              setIsLoading(false);
              Alert.alert('Request Failed', 'Could not send request to provider. Please try again.');
            }
          } catch (requestError) {
            console.log('Request sending failed:', requestError);
            setIsLoading(false);
            Alert.alert('Request Failed', 'Could not send request to provider. Please try again.');
          }
        } else {
          throw new Error(response.message || 'Booking creation failed');
        }
      } catch (error: any) {
        console.error('Booking creation failed:', error);
        setIsLoading(false);
        showError(error.message || 'Booking creation failed');
      }
      return;
    }

    // Cash Booking Flow
    try {
      const bookingResponse = await createBookingRecord('cash');
      if (bookingResponse?.success && (bookingResponse as any).booking) {
        const bookingId = (bookingResponse as any).booking.id || (bookingResponse as any).booking._id;
        const providerId = provider?.id || provider?._id;

        // Send booking request to provider with 3-minute timer
        try {
          const requestResponse = await apiService.sendBookingRequest(bookingId, providerId);
          console.log('✅ Booking request sent (cash):', requestResponse);
          if (requestResponse.success) {
            // Navigate to waiting screen for cash bookings too
            setIsLoading(false);
            navigation.navigate('BookingWaiting', {
              bookingId: bookingId,
              providerId: providerId,
              providerName: provider?.name || 'Provider',
              serviceName: service.title,
              experienceRange: selectedExperienceRange,
            });
          } else {
            setIsLoading(false);
            setShowSuccess(true);
          }
        } catch (requestError) {
          console.log('Request sending failed:', requestError);
          // Don't show success if the request failed - this is a critical failure
          setIsLoading(false);
          // Show error and don't navigate
          Alert.alert('Booking Request Failed', 'We created the booking but could not notify the provider. Please try again or contact support.');
          // Ideally we should probably cancel/delete the booking here or let the user retry
        }
      } else {
        setIsLoading(false);
        setShowSuccess(true);
      }
    } catch (error: any) {
      console.error('Booking failed:', error);
      setIsLoading(false);
      showError(error.response?.data?.message || 'Booking failed');
    }
  };

  const createBookingRecord = async (method: string, paymentDetails: any = {}) => {
    // Keep serviceId as string - API validation expects string format
    const serviceId = String(service.id || (service as any)._id || '');

    const payload = {
      serviceId: serviceId,
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
      startTime: (isHourlyService || isDriverService || hasOvertimeCharges) && bookingTime
        ? bookingTime.toTimeString().substring(0, 5)
        : (bookingTime ? bookingTime.toTimeString().substring(0, 5) : undefined),
      endTime: (isHourlyService || isDriverService || hasOvertimeCharges) && endTime
        ? endTime.toTimeString().substring(0, 5)
        : undefined,

      paymentMethod: method,
      notes: formData.notes,

      amount: isNaN(totalPrice) ? (isNaN(basePrice) ? 0 : basePrice) : totalPrice,
      baseAmount: isNaN(basePrice) ? 0 : basePrice,
      gstAmount: isNaN(gstAmount) ? 0 : gstAmount,
      totalPrice: isNaN(totalPrice) ? (isNaN(basePrice) ? 0 : basePrice) : totalPrice,

      // Add booked hours for overtime services
      ...(hasOvertimeCharges && bookedHours > 0 ? { bookedHours } : {}),

      paymentDetails,
      status: 'pending'
    };

    // Debug: Log createBookingRecord payload
    console.log('📦 createBookingRecord prices:', { amount: payload.amount, baseAmount: payload.baseAmount, gstAmount: payload.gstAmount, totalPrice: payload.totalPrice });

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

      {/* Ambient Background Elements (Decorative - Matches ProviderProfile) */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {/* Top Right Blob */}
        <View style={{
          position: 'absolute',
          top: -100, right: -100,
          width: 300, height: 300,
          borderRadius: 150,
          backgroundColor: COLORS.primary,
          opacity: 0.05,
        }} />
        {/* Center Left Blob */}
        <View style={{
          position: 'absolute',
          top: height * 0.4, left: -50,
          width: 200, height: 200,
          borderRadius: 100,
          backgroundColor: COLORS.accentOrange,
          opacity: 0.05,
        }} />
        {/* Bottom Right Blob */}
        <View style={{
          position: 'absolute',
          bottom: 0, right: -50,
          width: 250, height: 250,
          borderRadius: 125,
          backgroundColor: COLORS.primary,
          opacity: 0.03,
        }} />
      </View>

      {/* Dynamic Header */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Details</Text>
          <View style={{ width: 44 }} />
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Animated.ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scrollContent, { paddingTop: 20 }]}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: true }
          )}
          scrollEventThrottle={16}
          ref={scrollViewRef as any}
          nestedScrollEnabled={true}
          keyboardShouldPersistTaps="handled"
        >
          {/* Hero Section */}
          <View style={styles.heroSection}>
            <Text style={styles.heroPreTitle}>Finalize</Text>
            <Text style={styles.heroTitle}>Your Booking</Text>
          </View>

          {/* 1. Service Card */}
          <FadeInView delay={100} style={styles.sectionContainer}>
            <View style={styles.cardContainer}>
              <View style={styles.cardHighlight} />
              <View style={styles.serviceRow}>
                <View style={styles.serviceIconContainer}>
                  <Ionicons name="briefcase-outline" size={26} color={COLORS.primary} />
                </View>
                <View style={styles.serviceInfo}>
                  <Text style={styles.serviceName}>{service.title}</Text>
                  <Text style={styles.serviceCategory}>{service.category}</Text>
                </View>
                <View style={styles.priceContainer}>
                  <Text style={styles.priceAmount}>₹{basePrice}</Text>
                  <Text style={styles.priceLabel}>/hr</Text>
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
                    <View style={[styles.providerAvatar, { alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.primaryGradientStart }]}>
                      <Text style={{ fontSize: 16, fontWeight: '700', color: '#fff' }}>
                        {provider.name?.charAt(0) || 'E'}
                      </Text>
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={styles.providerName}>{provider.name}</Text>
                    <View style={styles.ratingRow}>
                      <Ionicons name="star" size={12} color={COLORS.warning} />
                      <Text style={styles.ratingText}>{provider.rating ? provider.rating.toFixed(1) : 'New'}</Text>
                    </View>
                  </View>
                </View>
              )}
            </View>
          </FadeInView>

          {/* 2. Schedule & Location */}
          <FadeInView delay={200} style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Where & When</Text>
            </View>

            <View style={styles.cardContainerNoPadding}>
              {/* Location Selection (Top Part) */}
              {/* Location Selection (Premium Card) */}
              <TouchableOpacity
                style={styles.premiumLocationCard}
                onPress={() => navigation.navigate('SavedAddresses', { fromBooking: true })}
                activeOpacity={0.9}
              >
                <LinearGradient
                  colors={[COLORS.gray50, COLORS.gray100]}
                  style={StyleSheet.absoluteFill}
                />

                <View style={styles.locationHeaderRow}>
                  <View style={styles.locationIconContainer}>
                    <Ionicons name="map" size={24} color={COLORS.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.locationTitle}>Service Location</Text>
                    {selectedAddress && selectedAddress.name && (
                      <View style={styles.addressTag}>
                        <Text style={styles.addressTagText}>{selectedAddress.name}</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.changeButton}>
                    <Text style={styles.changeButtonText}>Change</Text>
                  </View>
                </View>

                <View style={styles.addressDetails}>
                  <Text style={[styles.addressText, !selectedAddress && { color: COLORS.textTertiary, fontStyle: 'italic' }]} numberOfLines={2}>
                    {selectedAddress ? selectedAddress.fullAddress : 'Select service location...'}
                  </Text>
                </View>

                {/* Decorative Map Pattern (Dots) */}
                <View style={styles.mapPattern} pointerEvents="none">
                  <Ionicons name="location" size={120} color={COLORS.gray200} style={{ opacity: 0.1, transform: [{ rotate: '-15deg' }] }} />
                </View>
              </TouchableOpacity>

              <View style={styles.divider} />

              <View style={styles.pickerSection}>
                <View style={{ gap: 16 }}>
                  {/* Date Picker */}
                  <CustomDateTimePicker
                    label="Select Date"
                    mode="date"
                    value={bookingDate}
                    onChange={(date) => {
                      setBookingDate(date);
                    }}
                    minimumDate={new Date()}
                    placeholder="Choose a date"
                    leftIcon="calendar"
                  />

                  {/* Start Time Picker */}
                  <CustomDateTimePicker
                    label="Select Start Time"
                    mode="time"
                    value={bookingTime}
                    onChange={(date) => {
                      setBookingTime(date);
                      // Reset end time if invalid
                      if (endTime && date.getTime() >= endTime.getTime()) {
                        setEndTime(null);
                      }
                    }}
                    placeholder="Choose start time"
                    leftIcon="time"
                  />

                  {/* End Time Picker - Only for Overtime Services */}
                  {(hasOvertimeCharges || isDriverService) && (
                    <View>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        {bookedHours > 0 && (
                          <View style={{ backgroundColor: '#EEF2FF', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, marginLeft: 'auto' }}>
                            <Text style={{ fontSize: 12, fontWeight: '600', color: '#4F46E5' }}>
                              {bookedHours.toFixed(1)} hours
                            </Text>
                          </View>
                        )}
                      </View>

                      <CustomDateTimePicker
                        label="Select End Time"
                        mode="time"
                        value={endTime}
                        onChange={(date) => {
                          // Validate end time > start time
                          if (bookingTime) {
                            const startTime = new Date(bookingTime);
                            if (date.getTime() <= startTime.getTime()) {
                              // Invalid
                              // You might want to show a toast or just not set it, 
                              // or set it responsibly. For now, let's just set it.
                              // The component or validation logic elsewhere handles alerts?
                              // The previous grid disabled invalid times.
                            }
                          }
                          setEndTime(date);
                        }}
                        placeholder="Choose end time"
                        leftIcon="time-outline"
                      />

                      {hasOvertimeCharges && bookedHours > 0 && (
                        <View style={{ marginTop: 8, padding: 12, backgroundColor: '#FEF3C7', borderRadius: 8 }}>
                          <Text style={{ fontSize: 12, color: '#92400E', fontWeight: '500' }}>
                            ⚠️ Overtime charges may apply if job exceeds {bookedHours.toFixed(1)} hours
                          </Text>
                        </View>
                      )}
                    </View>
                  )}
                </View>

                {(formErrors.address || formErrors.date || formErrors.time || formErrors.endTime) && (
                  <View style={styles.errorContainer}>
                    <Ionicons name="alert-circle" size={16} color={COLORS.error} />
                    <Text style={styles.errorText}>Please select Location, Date and Time</Text>
                  </View>
                )}
              </View>
            </View>
          </FadeInView>


          {/* Payment Method - Hidden: Payment happens AFTER provider accepts */}
          {false && (
            <FadeInView delay={300} style={styles.sectionContainer}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Payment Method</Text>
              </View>

              <View style={styles.cardContainerNoPadding}>
                {/* Payment Options - Vertical Cards */}
                <View style={{ padding: 16, gap: 12 }}>
                  {PAYMENT_METHODS.map((method: any) => {
                    const isSelected = formData.paymentMethod === method.id;
                    const isWallet = method.id === 'wallet';

                    return (
                      <TouchableOpacity
                        key={method.id}
                        style={[
                          {
                            borderRadius: 16,
                            borderWidth: 2,
                            borderColor: isSelected ? COLORS.primary : COLORS.gray200,
                            backgroundColor: isSelected ? '#EFF6FF' : COLORS.white,
                            overflow: 'hidden',
                          },
                          isSelected && SHADOWS.md,
                        ]}
                        onPress={() => {
                          setFormData({ ...formData, paymentMethod: method.id });
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        }}
                        activeOpacity={0.7}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16 }}>
                          {/* Icon Container */}
                          <View style={{
                            width: 52,
                            height: 52,
                            borderRadius: 14,
                            backgroundColor: isSelected ? COLORS.primary : COLORS.gray100,
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginRight: 14,
                          }}>
                            <Ionicons
                              name={method.icon as any}
                              size={26}
                              color={isSelected ? COLORS.white : COLORS.textSecondary}
                            />
                          </View>

                          {/* Text Content */}
                          <View style={{ flex: 1 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                              <Text style={{
                                fontSize: 16,
                                fontWeight: '700',
                                color: isSelected ? '#1E40AF' : '#1E293B',
                              }}>
                                {method.label}
                              </Text>
                              {method.recommended && (
                                <View style={{
                                  backgroundColor: COLORS.success,
                                  paddingHorizontal: 8,
                                  paddingVertical: 3,
                                  borderRadius: 6,
                                  marginLeft: 10,
                                }}>
                                  <Text style={{ fontSize: 10, color: COLORS.white, fontWeight: '700' }}>
                                    RECOMMENDED
                                  </Text>
                                </View>
                              )}
                            </View>

                            {method.description && (
                              <Text style={{
                                fontSize: 13,
                                color: isSelected ? COLORS.primary : COLORS.textSecondary,
                                lineHeight: 18,
                              }}>
                                {method.description}
                              </Text>
                            )}

                            {/* Wallet Balance Inline for Wallet Option */}
                            {isWallet && !loadingWallet && (
                              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
                                <Text style={{ fontSize: 12, color: COLORS.textSecondary }}>Balance: </Text>
                                <Text style={{
                                  fontSize: 13,
                                  fontWeight: '700',
                                  color: walletBalance >= initialPayment ? COLORS.success : COLORS.error,
                                }}>
                                  ₹{walletBalance.toFixed(2)}
                                </Text>
                                {walletBalance < initialPayment && (
                                  <Text style={{ fontSize: 11, color: COLORS.error, marginLeft: 6 }}>
                                    (Need ₹{initialPayment.toFixed(0)})
                                  </Text>
                                )}
                              </View>
                            )}
                          </View>

                          {/* Selection Indicator */}
                          <View style={{
                            width: 24,
                            height: 24,
                            borderRadius: 12,
                            borderWidth: 2,
                            borderColor: isSelected ? COLORS.primary : '#CBD5E1',
                            backgroundColor: isSelected ? COLORS.primary : 'transparent',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}>
                            {isSelected && (
                              <Ionicons name="checkmark" size={14} color={COLORS.white} />
                            )}
                          </View>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Wallet Payment Info - Staged Payment Breakdown */}
                {formData.paymentMethod === 'wallet' && (
                  <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
                    {/* Staged Payment Breakdown */}
                    <View style={{
                      backgroundColor: '#F0FDF4',
                      borderRadius: 14,
                      padding: 14,
                      borderWidth: 1,
                      borderColor: '#BBF7D0',
                    }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                        <Ionicons name="shield-checkmark" size={18} color="#16A34A" />
                        <Text style={{ fontSize: 13, fontWeight: '700', color: '#166534', marginLeft: 8 }}>
                          Secure Staged Payment
                        </Text>
                      </View>

                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.primary, marginRight: 8 }} />
                          <Text style={{ fontSize: 14, color: '#374151' }}>After Provider Accepts ({initialPaymentPercentage}%)</Text>
                        </View>
                        <Text style={{ fontSize: 14, fontWeight: '700', color: '#1F2937' }}>₹{initialPayment.toFixed(2)}</Text>
                      </View>

                      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.textTertiary, marginRight: 8 }} />
                          <Text style={{ fontSize: 14, color: '#6B7280' }}>After Service (75%)</Text>
                        </View>
                        <Text style={{ fontSize: 14, fontWeight: '600', color: '#6B7280' }}>₹{completionPayment.toFixed(2)}</Text>
                      </View>
                    </View>

                    {/* Insufficient Balance Warning */}
                    {hasInsufficientBalance && (
                      <TouchableOpacity
                        style={{
                          backgroundColor: '#FEF2F2',
                          borderRadius: 14,
                          padding: 14,
                          marginTop: 10,
                          flexDirection: 'row',
                          alignItems: 'center',
                          borderWidth: 1,
                          borderColor: '#FECACA',
                        }}
                        onPress={() => navigation.navigate('MainTabs', { screen: 'Wallet' })}
                      >
                        <View style={{
                          width: 36,
                          height: 36,
                          borderRadius: 10,
                          backgroundColor: '#FEE2E2',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}>
                          <Ionicons name="wallet-outline" size={20} color={COLORS.error} />
                        </View>
                        <View style={{ flex: 1, marginLeft: 12 }}>
                          <Text style={{ fontSize: 14, fontWeight: '700', color: COLORS.error }}>
                            Top Up Required
                          </Text>
                          <Text style={{ fontSize: 12, color: '#B91C1C', marginTop: 2 }}>
                            Add ₹{(initialPayment - walletBalance).toFixed(0)} to book this service
                          </Text>
                        </View>
                        <View style={{
                          backgroundColor: COLORS.error,
                          paddingHorizontal: 12,
                          paddingVertical: 6,
                          borderRadius: 8,
                        }}>
                          <Text style={{ fontSize: 12, fontWeight: '600', color: COLORS.white }}>Top Up</Text>
                        </View>
                      </TouchableOpacity>
                    )}
                  </View>
                )}

                <View style={{ padding: 16, paddingTop: formData.paymentMethod === 'wallet' ? 0 : 16 }}>
                  <FloatingLabelInput
                    label="Add Note (Gate code, etc.)"
                    value={formData.notes}
                    onChangeText={(t) => setFormData({ ...formData, notes: t })}
                    multiline
                    containerStyle={{ borderWidth: 1, borderColor: COLORS.gray200, backgroundColor: COLORS.gray50, borderRadius: 12 }}
                  />
                </View>
              </View>
            </FadeInView>
          )}

          {/* 4. Receipt Summary */}
          <FadeInView delay={400} style={[styles.sectionContainer, { marginBottom: 140 }]}>
            <View style={styles.receiptCard}>
              {/* Perforated Top Effect */}
              <View style={styles.receiptHeader}>
                <Text style={styles.receiptTitle}>RECEIPT</Text>
                <Text style={styles.receiptId}>#{Math.floor(Math.random() * 100000)}</Text>
              </View>

              <View style={styles.dashedLine} />

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Service Rate</Text>
                <Text style={styles.summaryValue}>₹{basePrice.toFixed(2)}</Text>
              </View>
              {(isHourlyService || hasOvertimeCharges) && bookingTime && endTime && (
                <View style={[styles.summaryRow, { marginTop: 4 }]}>
                  <Text style={[styles.summaryLabel, { fontSize: 12, color: COLORS.textSecondary }]}>
                    {(hourlyPricing.duration || calculateHourlyPrice().duration).toFixed(1)}h × ₹{getProviderPrice()}/hr
                  </Text>
                  <Text style={[styles.summaryValue, { fontSize: 12, color: COLORS.textSecondary }]}>
                    ({bookingTime.toTimeString().substring(0, 5)} - {endTime.toTimeString().substring(0, 5)})
                  </Text>
                </View>
              )}
              {serviceGstRate > 0 && (
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>GST ({(serviceGstRate * 100).toFixed(0)}%)</Text>
                  <Text style={styles.summaryValue}>₹{gstAmount.toFixed(2)}</Text>
                </View>
              )}

              <View style={styles.dashedLine} />

              {/* Show different total based on payment method */}
              {formData.paymentMethod === 'wallet' ? (
                <>
                  <View style={styles.totalRow}>
                    <Text style={styles.totalLabelReceipt}>Booking Total</Text>
                    <Text style={styles.totalAmountReceipt}>₹{totalPrice.toFixed(2)}</Text>
                  </View>
                  <View style={[styles.summaryRow, { marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: COLORS.gray200 }]}>
                    <Text style={[styles.summaryLabel, { fontSize: 12, color: COLORS.primary }]}>💡 Pay 25% after provider accepts</Text>
                    <Text style={[styles.summaryValue, { fontSize: 12, color: COLORS.primary, fontWeight: '600' }]}>₹{initialPayment.toFixed(2)}</Text>
                  </View>
                  <View style={[styles.summaryRow, { marginTop: 4 }]}>
                    <Text style={[styles.summaryLabel, { fontSize: 12 }]}>After Service (75%)</Text>
                    <Text style={[styles.summaryValue, { fontSize: 12 }]}>₹{completionPayment.toFixed(2)}</Text>
                  </View>
                </>
              ) : (
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabelReceipt}>Total to Pay</Text>
                  <Text style={styles.totalAmountReceipt}>₹{totalPrice.toFixed(2)}</Text>
                </View>
              )}

              {/* ZigZag Bottom SVG or Image could go here, for now just clean bottom */}
            </View>
          </FadeInView>

        </Animated.ScrollView>
      </KeyboardAvoidingView>

      {/* Floating Bottom Bar (Updated to match ProviderProfile V4) */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        <BlurView intensity={80} tint="light" style={StyleSheet.absoluteFill} />
        <View style={styles.bottomBarContent}>
          <View style={styles.priceBlock}>
            <Text style={styles.totalLabelSmall}>Total</Text>
            <Text style={styles.finalPrice}>₹{totalPrice.toFixed(2)}</Text>
          </View>

          {/* Dynamic Book Button */}
          <TouchableOpacity
            style={[styles.bookButton, (!bookingDate || !bookingTime) && styles.bookButtonDisabled]}
            onPress={() => {
              if (!bookingDate || !bookingTime) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                showError('Please select date and time');
                return;
              }
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              handleSubmit();
            }}
            disabled={isLoading}
          >
            {/* Gradient only if active */}
            {bookingDate && bookingTime && (
              <LinearGradient
                colors={[COLORS.primary, '#2563EB']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFill}
              />
            )}

            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={[styles.bookButtonText, (!bookingDate || !bookingTime) && { color: COLORS.textTertiary }]}>
                  {!bookingDate ? 'Select Date' : !bookingTime ? 'Select Time' : 'Book Now'}
                </Text>
                {(bookingDate && bookingTime) && <Ionicons name="arrow-forward" size={20} color="#fff" />}
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

      {/* Booking Timer Modal - 3 minute provider response window */}
      <BookingTimerModal
        visible={showTimerModal}
        bookingId={pendingBookingId || ''}
        customerId={(user as any)?._id || user?.id}
        provider={{
          id: provider?.id || provider?._id || '',
          name: provider?.name || 'Provider',
          profileImage: provider?.profileImage || provider?.avatar,
        }}
        serviceName={service.title}
        totalPrice={totalPrice}
        onAccepted={handleTimerAccepted}
        onRejected={handleTimerRejected}
        onTimeout={handleTimerTimeout}
        onCancel={handleTimerCancel}
      />

      {/* Payment Modal - 25% Initial Payment */}
      <Modal
        visible={showPaymentModal}
        transparent
        animationType="fade"
        statusBarTranslucent
      >
        <BlurView intensity={20} tint="dark" style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)' }}>
          <View style={{
            width: width * 0.9,
            backgroundColor: COLORS.cardBg,
            borderRadius: 24,
            padding: 24,
            ...SHADOWS.lg,
          }}>
            {/* Success Icon */}
            <View style={{ alignItems: 'center', marginBottom: 20 }}>
              <View style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                backgroundColor: COLORS.success,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
              }}>
                <Ionicons name="checkmark" size={48} color="#FFF" />
              </View>
              <Text style={{ fontSize: 22, fontWeight: '700', color: COLORS.text, marginBottom: 4 }}>
                Booking Confirmed!
              </Text>
              <Text style={{ fontSize: 14, color: COLORS.textTertiary, textAlign: 'center' }}>
                {provider?.name} has accepted your booking
              </Text>
            </View>

            {/* Payment Breakdown */}
            <View style={{
              backgroundColor: COLORS.background,
              borderRadius: 16,
              padding: 16,
              marginBottom: 20,
            }}>
              <Text style={{ fontSize: 12, color: COLORS.textTertiary, marginBottom: 12, fontWeight: '600' }}>
                PAYMENT BREAKDOWN
              </Text>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text style={{ fontSize: 14, color: COLORS.textSecondary }}>Total Amount</Text>
                <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.text }}>₹{totalPrice.toFixed(2)}</Text>
              </View>

              <View style={{ height: 1, backgroundColor: COLORS.border, marginVertical: 12 }} />

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text style={{ fontSize: 14, color: COLORS.textSecondary }}>Initial Payment (25%)</Text>
                <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.primary }}>₹{initialPayment.toFixed(2)}</Text>
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 13, color: COLORS.textTertiary }}>After Service (75%)</Text>
                <Text style={{ fontSize: 13, color: COLORS.textTertiary }}>₹{completionPayment.toFixed(2)}</Text>
              </View>
            </View>

            {/* Wallet Balance */}
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: 12,
              backgroundColor: walletBalance >= initialPayment ? '#F0FDF4' : '#FEF2F2',
              borderRadius: 12,
              marginBottom: 20,
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons
                  name="wallet"
                  size={20}
                  color={walletBalance >= initialPayment ? COLORS.success : COLORS.error}
                />
                <Text style={{ fontSize: 13, color: COLORS.textSecondary }}>Wallet Balance</Text>
              </View>
              <Text style={{
                fontSize: 16,
                fontWeight: '700',
                color: walletBalance >= initialPayment ? COLORS.success : COLORS.error
              }}>
                ₹{walletBalance.toFixed(2)}
              </Text>
            </View>

            {/* Info Box */}
            <View style={{
              flexDirection: 'row',
              padding: 12,
              backgroundColor: '#EFF6FF',
              borderRadius: 12,
              marginBottom: 20,
              gap: 10,
            }}>
              <Ionicons name="information-circle" size={20} color={COLORS.primary} style={{ marginTop: 2 }} />
              <Text style={{ flex: 1, fontSize: 12, color: '#1E40AF', lineHeight: 18 }}>
                25% will be held in escrow until service completion. The remaining 75% will be charged after the service is completed.
              </Text>
            </View>

            {/* Action Buttons */}
            <View style={{ gap: 12 }}>
              <TouchableOpacity
                style={{
                  backgroundColor: COLORS.primary,
                  paddingVertical: 16,
                  borderRadius: 16,
                  alignItems: 'center',
                  opacity: paymentProcessing || walletBalance < initialPayment ? 0.5 : 1,
                }}
                onPress={handleInitialPayment}
                disabled={paymentProcessing || walletBalance < initialPayment}
              >
                {paymentProcessing ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={{ fontSize: 16, fontWeight: '700', color: '#FFF' }}>
                    Pay ₹{initialPayment.toFixed(2)} Now
                  </Text>
                )}
              </TouchableOpacity>

              {walletBalance < initialPayment && (
                <TouchableOpacity
                  style={{
                    borderWidth: 1.5,
                    borderColor: COLORS.primary,
                    paddingVertical: 14,
                    borderRadius: 16,
                    alignItems: 'center',
                  }}
                  onPress={() => {
                    setShowPaymentModal(false);
                    // Navigate to wallet top-up (this will need proper navigation setup)
                    Alert.alert('Top Up Wallet', 'Wallet top-up feature coming soon!');
                  }}
                >
                  <Text style={{ fontSize: 15, fontWeight: '600', color: COLORS.primary }}>
                    Top Up Wallet
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </BlurView>
      </Modal>

    </View >
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.gray50,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },

  // Header
  header: {
    backgroundColor: 'transparent',
    zIndex: 10,
  },
  headerContent: {
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.gray100, // V4 Light Border
    ...SHADOWS.sm,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
  },

  // Hero
  heroSection: {
    marginBottom: 30,
    marginTop: 10,
  },
  heroPreTitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    fontWeight: '500',
    marginBottom: 4,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -1,
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
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.gray100,
    marginVertical: 12,
  },

  // Cards - V4 Strict Style
  cardContainer: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
    ...SHADOWS.sm,
    borderWidth: 1,
    borderColor: COLORS.gray100,
    position: 'relative',
    overflow: 'hidden',
  },
  cardContainerNoPadding: {
    backgroundColor: '#fff',
    borderRadius: 24,
    ...SHADOWS.sm,
    borderWidth: 1,
    borderColor: COLORS.gray100,
    overflow: 'hidden',
  },
  cardHighlight: {
    position: 'absolute',
    top: 0, left: 0, right: 0, height: 4,
    backgroundColor: COLORS.primary,
    zIndex: 10,
  },

  // NEW: Premium Location Card
  premiumLocationCard: {
    padding: 16,
    backgroundColor: COLORS.gray50,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray100,
    position: 'relative',
    overflow: 'hidden',
    minHeight: 120,
  },
  locationHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    zIndex: 2,
  },
  locationIconContainer: {
    width: 44, height: 44,
    borderRadius: 14,
    backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: COLORS.gray200,
    ...SHADOWS.sm,
  },
  locationTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  addressTag: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  addressTagText: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.primary,
    textTransform: 'uppercase',
  },
  changeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.gray200,
  },
  changeButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0F172A',
  },
  addressDetails: {
    zIndex: 2,
    paddingLeft: 56, // Align with text start
  },
  addressText: {
    fontSize: 15,
    color: '#334155',
    lineHeight: 22,
  },
  mapPattern: {
    position: 'absolute',
    right: -20,
    bottom: -20,
    opacity: 0.5,
    zIndex: 1,
  },
  // End Premium Location Card

  // NEW: Date Picker Strip
  pickerSection: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  pickerLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 12,
  },
  dateStripContainer: {
    paddingRight: 10,
  },
  dateCard: {
    width: 56,
    height: 70,
    borderRadius: 16,
    backgroundColor: COLORS.gray50,
    borderWidth: 1,
    borderColor: COLORS.gray200,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10, // Replaces gap
  },
  dateCardSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
    ...SHADOWS.md,
  },
  dateDay: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 4,
    fontWeight: '500',
  },
  dateNum: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
  },
  textSelected: {
    color: '#fff',
  },

  // NEW: Time Grid
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    // gap: 10 removed
  },
  timeChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: COLORS.gray50,
    borderWidth: 1,
    borderColor: COLORS.gray200,
    minWidth: '30%',
    alignItems: 'center',
    marginRight: 10, // Replaces gap
    marginBottom: 10, // Replaces gap
  },
  timeChipSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  timeText: {
    fontSize: 14,
    color: '#1E293B',
    fontWeight: '500',
  },

  // Custom Service Info (unchanged mostly)
  serviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  serviceIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 16,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    borderWidth: 1,
    borderColor: '#E0E7FF',
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
  },
  serviceCategory: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    backgroundColor: COLORS.gray50,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  priceAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  priceLabel: {
    fontSize: 10,
    color: COLORS.textSecondary,
    marginLeft: 2,
  },
  providerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.gray50,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.gray100,
  },
  providerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    marginRight: 12,
  },
  providerName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },

  // NEW: Receipt Style Summary
  receiptCard: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 24,
    ...SHADOWS.sm,
    borderWidth: 1,
    borderColor: COLORS.gray200,
    position: 'relative',
  },
  receiptHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  receiptTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.textTertiary,
    letterSpacing: 2,
  },
  receiptId: {
    fontSize: 12,
    fontWeight: '600',
    color: '#CBD5E1',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  dashedLine: {
    height: 1,
    borderWidth: 1,
    borderColor: COLORS.gray200,
    borderStyle: 'dashed',
    borderRadius: 1,
    marginVertical: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabelReceipt: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  totalAmountReceipt: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.primary,
  },
  summaryLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },

  // Form Fields
  formRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
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
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  value: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    padding: 10,
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 12,
    color: COLORS.error,
  },

  // Payment methods
  paymentMethodsContainer: {
    padding: 16,
    gap: 12,
  },
  paymentOption: {
    width: 120,
    height: 90,
    borderRadius: 16,
    backgroundColor: COLORS.gray50,
    borderWidth: 1,
    borderColor: COLORS.gray200,
    overflow: 'hidden',
    position: 'relative',
    marginRight: 10,
  },
  paymentOptionSelected: {
    borderColor: COLORS.primary,
    ...SHADOWS.md,
  },
  paymentContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    zIndex: 2,
  },
  paymentText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  checkmarkBadge: {
    position: 'absolute',
    top: 8, right: 8,
    width: 20, height: 20,
    borderRadius: 10,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },

  // Bottom Bar - Fixed V4 Style
  bottomBar: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: COLORS.gray100,
    paddingTop: 16,
    paddingHorizontal: 20,
    zIndex: 999,
  },
  bottomBarContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  priceBlock: {
    flex: 1,
  },
  totalLabelSmall: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  finalPrice: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  bookButton: {
    flex: 1.5,
    height: 52,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    overflow: 'hidden',
    ...SHADOWS.md,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.3,
  },
  bookButtonDisabled: {
    backgroundColor: COLORS.gray100,
    shadowOpacity: 0,
    elevation: 0,
  },
  bookButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },

  modalOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
});
