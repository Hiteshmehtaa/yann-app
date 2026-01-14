import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Platform,
  Linking,
  Alert,
  StatusBar,
  Modal,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import LottieView from 'lottie-react-native';
import { useNavigation } from '@react-navigation/native';
import { apiService } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS, SHADOWS } from '../../utils/theme';
import { EmptyState } from '../../components/EmptyState';
import { OTPInputModal } from '../../components/OTPInputModal';
import { JobTimer } from '../../components/JobTimer';
import { OvertimeBreakdown } from '../../components/OvertimeBreakdown';
import { DepthCard } from '../../components/ui/DepthCard';
import { Button } from '../../components/ui/Button';
import { Animated } from 'react-native';

const AnimatedBookingItem = ({ children, index }: { children: React.ReactNode, index: number }) => {
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(50)).current; // Increased slide distance

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        delay: index * 100, // Slower stagger
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 7,
        tension: 40,
        delay: index * 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      {children}
    </Animated.View>
  );
};

interface ProviderBooking {
  id: string;
  customerName: string;
  customerPhone: string;
  serviceName: string;
  serviceCategory: string;
  scheduledDate: string;
  scheduledTime: string;
  address: string;
  latitude?: number;
  longitude?: number;
  status: 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';
  amount: number;
  paymentStatus: 'pending' | 'paid' | 'partial';
  paymentMethod?: string;
  walletPaymentStage?: 'initial_25_held' | 'initial_25_released' | 'completed' | null;
  escrowDetails?: {
    initialAmount?: number;
    completionAmount?: number;
  };
  notes?: string;
  createdAt: string;
  sortableDate?: number;
  customerAvatar?: string;
}

type FilterStatus = 'all' | 'pending' | 'accepted' | 'in_progress' | 'completed';

export const ProviderBookingsScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [bookings, setBookings] = useState<ProviderBooking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<ProviderBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterStatus>('all');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Navigation Modal State
  const [navModalVisible, setNavModalVisible] = useState(false);
  const [selectedBookingForNav, setSelectedBookingForNav] = useState<ProviderBooking | null>(null);

  // OTP Modal State
  const [otpModalVisible, setOtpModalVisible] = useState(false);
  const [otpModalTitle, setOtpModalTitle] = useState('');
  const [otpModalSubtitle, setOtpModalSubtitle] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [currentBookingId, setCurrentBookingId] = useState<string | null>(null);
  const [currentJobSessionId, setCurrentJobSessionId] = useState<string | null>(null);
  const [otpAction, setOtpAction] = useState<'start' | 'end' | null>(null);

  // Job Session State
  const [jobSessions, setJobSessions] = useState<{ [bookingId: string]: any }>({});

  useEffect(() => {
    fetchBookings();
  }, []);

  useEffect(() => {
    filterBookings();
  }, [activeFilter, bookings]);

  const fetchBookings = async () => {
    try {
      setError(null);
      const providerId = user?._id || user?.id;
      const email = user?.email;

      console.log('🔍 Fetching bookings for provider:', { providerId, email, name: user?.name });

      const response: any = await apiService.getProviderRequests(providerId, email);

      if (response.success) {
        const formatDate = (dateStr: string) => {
          if (!dateStr || dateStr === 'N/A') return 'N/A';
          try {
            const date = new Date(dateStr);
            return date.toLocaleDateString('en-IN', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric'
            });
          } catch {
            return dateStr;
          }
        };

        const getTimestamp = (dateStr: string, timeStr?: string) => {
          try {
            const date = new Date(dateStr);
            return date.getTime();
          } catch { return 0; }
        };

        const mapBooking = (b: any, statusOverride?: string) => ({
          id: b._id || b.id,
          customerName: b.customerName,
          customerPhone: b.customerPhone,
          serviceName: b.serviceName,
          serviceCategory: b.serviceCategory,
          scheduledDate: formatDate(b.bookingDate || b.scheduledDate),
          scheduledTime: b.bookingTime || b.scheduledTime || 'N/A',
          address: b.customerAddress || b.address || 'N/A',
          latitude: b.latitude,
          longitude: b.longitude,
          status: statusOverride || b.status || 'pending',
          amount: b.totalPrice || b.basePrice || b.amount || 0,
          paymentStatus: b.paymentStatus || 'pending',
          paymentMethod: b.paymentMethod || 'cash',
          walletPaymentStage: b.walletPaymentStage || null,
          escrowDetails: b.escrowDetails || null,
          notes: b.notes || '',
          createdAt: b.createdAt || new Date().toISOString(),
          sortableDate: getTimestamp(b.bookingDate || b.scheduledDate),
          customerAvatar: b.customerAvatar || null,
        });

        const pendingRequests = (response.pendingRequests || []).map((b: any) => mapBooking(b, 'pending'));
        const acceptedBookings = (response.acceptedBookings || []).map((b: any) => mapBooking(b));

        const allBookings = [...pendingRequests, ...acceptedBookings];

        // Deduplicate bookings
        const uniqueBookings = Array.from(new Map(allBookings.map(b => [b.id, b])).values());

        setBookings(uniqueBookings);

        // Populate job sessions
        const sessionsMap: { [key: string]: any } = {};
        acceptedBookings.forEach((b: any) => {
          if (b.jobSession) {
            sessionsMap[b.id] = b.jobSession;
          }
        });

        if (Object.keys(sessionsMap).length > 0) {
          setJobSessions(prev => ({ ...prev, ...sessionsMap }));
        }

        console.log(`✅ Loaded ${allBookings.length} total bookings`);
      }
    } catch (err: any) {
      console.error('❌ Error fetching provider bookings:', err);
      setError(err.isNetworkError ? 'No internet connection' : 'Failed to load bookings');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const getSortedBookings = (list: ProviderBooking[]) => {
    return list.sort((a, b) => {
      // Priority 1: In Progress should be at the very top
      if (a.status === 'in_progress' && b.status !== 'in_progress') return -1;
      if (b.status === 'in_progress' && a.status !== 'in_progress') return 1;

      // Priority 2: Accepted (Upcoming) - SOONEST FIRST
      if (a.status === 'accepted' && b.status === 'accepted') {
        return (a.sortableDate || 0) - (b.sortableDate || 0); // Ascending
      }

      // Priority 3: Pending - NEWEST FIRST
      if (a.status === 'pending' && b.status === 'pending') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(); // Descending
      }

      // Priority 4: Completed/Cancelled - NEWEST FIRST
      return (b.sortableDate || 0) - (a.sortableDate || 0);
    });
  };

  const filterBookings = () => {
    let list = [];
    if (activeFilter === 'all') {
      list = [...bookings];
    } else {
      list = bookings.filter(b => b.status === activeFilter);
    }
    setFilteredBookings(getSortedBookings(list));
  };

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchBookings();
  };

  const openLocationNavigation = (booking: ProviderBooking) => {
    const { latitude, longitude, address } = booking;

    if (!latitude || !longitude) {
      const addressQuery = encodeURIComponent(address);
      const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${addressQuery}`;
      Linking.openURL(googleMapsUrl);
      return;
    }

    setSelectedBookingForNav(booking);
    setNavModalVisible(true);
  };

  const handleNavigationAppSelect = async (appName: 'google' | 'uber' | 'ola' | 'rapido') => {
    if (!selectedBookingForNav || !selectedBookingForNav.latitude || !selectedBookingForNav.longitude) return;

    const { latitude, longitude } = selectedBookingForNav;

    let url = '';

    switch (appName) {
      case 'google':
        url = Platform.select({
          ios: `maps://app?daddr=${latitude},${longitude}`,
          android: `google.navigation:q=${latitude},${longitude}`,
        }) || '';
        if (!url) url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
        break;
      case 'uber':
        url = `uber://?action=setPickup&pickup=my_location&dropoff[latitude]=${latitude}&dropoff[longitude]=${longitude}`;
        break;
      case 'ola':
        url = `ola://app/launch?lat=${latitude}&lng=${longitude}`;
        break;
      case 'rapido':
        url = `rapido://destination?lat=${latitude}&lng=${longitude}`;
        break;
    }

    setNavModalVisible(false);

    if (!url) return;

    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        if (appName === 'google') {
          await Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`);
        } else {
          Alert.alert('App not installed', `Please install ${appName.charAt(0).toUpperCase() + appName.slice(1)} to use this feature.`);
        }
      }
    } catch (err) {
      console.error("Error opening URL:", err);
      Alert.alert('Error', 'Could not open the selected app.');
    }
  };

  const handleAcceptBooking = async (bookingId: string) => {
    setActionLoadingId(bookingId);
    try {
      const response = await apiService.acceptBooking(
        bookingId,
        user?._id || user?.id,
        user?.name
      );
      if (response.success) {
        console.log('✅ Booking accepted');
        fetchBookings();
      }
    } catch (err) {
      console.error('❌ Error accepting booking:', err);
      setError('Failed to accept booking');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRejectBooking = async (bookingId: string) => {
    setActionLoadingId(bookingId);
    try {
      const providerId = user?._id || user?.id;
      if (!providerId) {
        setError('Provider ID not found');
        return;
      }
      const response = await apiService.rejectBooking(bookingId, providerId);
      if (response.success) {
        console.log('✅ Booking rejected');
        fetchBookings();
      }
    } catch (err) {
      console.error('❌ Error rejecting booking:', err);
      setError('Failed to reject booking');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleStatusChange = async (bookingId: string, newStatus: string) => {
    if (newStatus === 'accepted') {
      await handleAcceptBooking(bookingId);
    } else if (newStatus === 'cancelled') {
      await handleRejectBooking(bookingId);
    } else {
      setActionLoadingId(bookingId);
      try {
        const response = await apiService.updateBookingStatus(
          bookingId,
          newStatus as 'in_progress' | 'completed' | 'cancelled',
          user?._id || user?.id
        );
        if (response.success) {
          console.log(`✅ Booking status updated to ${newStatus}`);
          fetchBookings();
        }
      } catch (err) {
        console.error(`❌ Error updating booking status to ${newStatus}:`, err);
        setError(`Failed to update booking status`);
      } finally {
        setActionLoadingId(null);
      }
    }
  };

  const handleStartJob = async (bookingId: string) => {
    try {
      const providerId = user?._id || user?.id;
      if (!providerId) {
        setError('Provider ID not found');
        return;
      }
      const response = await apiService.generateStartOTP(bookingId, providerId);
      if (response.success && response.data) {
        setCurrentBookingId(bookingId);
        setCurrentJobSessionId(response.data.jobSessionId);
        setOtpAction('start');
        setOtpModalTitle('Start Job Verification');
        setOtpModalSubtitle(`Enter the OTP provided by ${response.data.customerName}`);
        setOtpModalVisible(true);
        setOtpError(null);
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to generate OTP');
    }
  };

  const handleEndJob = async (bookingId: string) => {
    try {
      const providerId = user?._id || user?.id;
      if (!providerId) {
        setError('Provider ID not found');
        return;
      }
      const jobSession = jobSessions[bookingId];
      if (!jobSession || !jobSession._id) {
        Alert.alert('Error', 'Job session not found. Please start the job first.');
        return;
      }
      const response = await apiService.generateEndOTP(jobSession._id, providerId);
      if (response.success && response.data) {
        setCurrentBookingId(bookingId);
        setCurrentJobSessionId(jobSession._id);
        setOtpAction('end');
        setOtpModalTitle('Complete Job Verification');
        setOtpModalSubtitle('Enter the completion OTP provided by the customer');
        setOtpModalVisible(true);
        setOtpError(null);
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to generate OTP');
    }
  };

  const handleOTPSubmit = async (otp: string) => {
    if (!currentJobSessionId || !currentBookingId || !otpAction) {
      setOtpError('Invalid session');
      return;
    }
    setOtpLoading(true);
    setOtpError(null);
    try {
      const providerId = user?._id || user?.id;
      if (!providerId) {
        throw new Error('Provider ID not found');
      }
      if (otpAction === 'start') {
        const response = await apiService.verifyStartOTP(currentJobSessionId, otp, providerId);
        if (response.success && response.data) {
          setJobSessions(prev => ({
            ...prev,
            [currentBookingId]: {
              _id: currentJobSessionId,
              startTime: response.data?.startTime || new Date().toISOString(),
              expectedDuration: response.data?.expectedDuration || 480,
              status: response.data?.status || 'in_progress'
            }
          }));
          setOtpModalVisible(false);
          fetchBookings();
          Alert.alert('Success', 'Job started successfully! Timer is now running.');
        }
      } else if (otpAction === 'end') {
        const response = await apiService.verifyEndOTP(currentJobSessionId, otp, providerId);
        if (response.success && response.data) {
          setJobSessions(prev => {
            const newSessions = { ...prev };
            delete newSessions[currentBookingId];
            return newSessions;
          });
          setOtpModalVisible(false);
          fetchBookings();
          let message = 'Job completed successfully!';
          if (response.data.overtimeDuration > 0) {
            message += `\n\nOvertime: ${Math.floor(response.data.overtimeDuration / 60)}h ${response.data.overtimeDuration % 60}m`;
            message += `\nOvertime Charge: ₹${response.data.overtimeCharge}`;
          }
          Alert.alert('Success', message);
        }
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Invalid OTP. Please try again.';
      setOtpError(errorMessage);
    } finally {
      setOtpLoading(false);
    }
  };

  const handleCloseOTPModal = () => {
    setOtpModalVisible(false);
    setOtpError(null);
    setCurrentBookingId(null);
    setCurrentJobSessionId(null);
    setOtpAction(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#FF8A3D';
      case 'accepted': return '#4CAF50';
      case 'in_progress': return COLORS.primary;
      case 'completed': return '#2E7D32';
      case 'cancelled': return '#F44336';
      default: return COLORS.textSecondary;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return 'time-outline';
      case 'accepted': return 'checkmark-circle-outline';
      case 'in_progress': return 'hammer-outline';
      case 'completed': return 'checkmark-done-circle-outline';
      case 'cancelled': return 'close-circle-outline';
      default: return 'help-circle-outline';
    }
  };

  const renderFilterChip = (label: string, value: FilterStatus, count: number) => {
    const isActive = activeFilter === value;
    return (
      <TouchableOpacity
        style={[styles.filterChip, isActive && styles.filterChipActive]}
        onPress={() => setActiveFilter(value)}
        activeOpacity={0.7}
      >
        <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
          {label} {count > 0 && `(${count})`}
        </Text>
      </TouchableOpacity>
    );
  };

  // --- ULTRA-MODERN CARD COMPONENT (SCALED DOWN & THEMED) ---
  const renderBookingCard = (booking: ProviderBooking, index: number) => {
    // Status Logic
    const isAccepted = booking.status === 'accepted';
    const isPending = booking.status === 'pending';
    const isInProgress = booking.status === 'in_progress';
    const isCompleted = booking.status === 'completed';
    const isCancelled = booking.status === 'cancelled';
    const isWalletPayment = booking.paymentMethod === 'wallet';

    // Check if Next Job (only meaningful if upcoming)
    const isNextJob = isAccepted && filteredBookings.find(b => b.status === 'accepted')?.id === booking.id;

    // Configs for styling
    const statusConfig: Record<string, { label: string; color: string; bg: string; dotColor: string }> = {
      pending: { label: 'New Request', color: '#B45309', bg: '#FFFBEB', dotColor: '#F59E0B' },
      accepted: { label: 'Scheduled', color: COLORS.primary, bg: '#E0F2FE', dotColor: COLORS.primary },
      in_progress: { label: 'In Progress', color: '#7C3AED', bg: '#F3E8FF', dotColor: '#9333EA' },
      completed: { label: 'Completed', color: '#15803D', bg: '#DCFCE7', dotColor: '#22C55E' },
      cancelled: { label: 'Cancelled', color: '#B91C1C', bg: '#FEE2E2', dotColor: '#EF4444' },
    };
    const statusStyle = statusConfig[booking.status] || statusConfig.pending;

    // Service Icon Helper
    const getServiceTheme = (category: string) => {
      const cat = category?.toLowerCase() || '';
      if (cat.includes('puja')) return { icon: 'flame', color: '#EA580C', bg: '#FFEDD5' }; // Orange
      if (cat.includes('clean')) return { icon: 'sparkles', color: COLORS.primary, bg: '#E0F2FE' }; // Blue (Primary)
      if (cat.includes('driver')) return { icon: 'car', color: '#4F46E5', bg: '#E0E7FF' }; // Indigo
      return { icon: 'construct', color: '#64748B', bg: '#F1F5F9' }; // Slate
    };
    const serviceTheme = getServiceTheme(booking.serviceCategory);

    // Payment Logic
    const getPaymentDisplay = () => {
      if (!isWalletPayment) return { label: 'Cash Payment', color: '#0F172A', icon: 'cash-outline' };

      const stage = booking.walletPaymentStage || 'default';
      if (stage === 'initial_25_held') return { label: 'Escrow Secured', color: '#CA8A04', icon: 'shield-checkmark' };
      if (stage === 'initial_25_released') return { label: '25% Paid', color: COLORS.primary, icon: 'wallet' };
      if (stage === 'completed') return { label: 'Fully Paid', color: '#16A34A', icon: 'checkmark-circle' };
      return { label: 'Wallet', color: COLORS.primary, icon: 'card' };
    };
    const paymentInfo = getPaymentDisplay();

    return (
      <AnimatedBookingItem key={booking.id} index={index}>
        <View style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 16, // Reduced from 24
          marginBottom: 16, // Reduced margin
          shadowColor: "#0F172A",
          shadowOffset: { width: 0, height: 4 }, // Reduced shadow
          shadowOpacity: 0.06,
          shadowRadius: 10,
          elevation: 3,
          borderWidth: 1,
          borderColor: isNextJob ? COLORS.primary : '#F1F5F9',
        }}>

          {/* --- HEADER: Date/Time + Status --- */}
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: 16, // Reduced padding
            paddingTop: 16,
            paddingBottom: 12,
          }}>
            {/* Date Time Group */}
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{
                paddingHorizontal: 8,
                paddingVertical: 4,
                backgroundColor: '#F8FAFC',
                borderRadius: 6,
                borderWidth: 1,
                borderColor: '#E2E8F0',
                marginRight: 8,
              }}>
                <Text style={{ fontSize: 12, fontWeight: '700', color: '#334155' }}>
                  {booking.scheduledTime}
                </Text>
              </View>
              <Text style={{ fontSize: 13, fontWeight: '500', color: '#64748B' }}>
                {booking.scheduledDate}
              </Text>
            </View>

            {/* Status Badge - Pill Style */}
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 10,
              paddingVertical: 4,
              backgroundColor: statusStyle.bg,
              borderRadius: 100,
            }}>
              <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: statusStyle.dotColor, marginRight: 5 }} />
              <Text style={{ fontSize: 11, fontWeight: '700', color: statusStyle.color }}>
                {statusStyle.label}
              </Text>
            </View>
          </View>

          {/* --- HERO: Service + Price --- */}
          <View style={{
            paddingHorizontal: 16,
            paddingBottom: 16,
            flexDirection: 'row',
            alignItems: 'center',
          }}>
            {/* Big Soft Icon */}
            <View style={{
              width: 48, // Reduced size
              height: 48,
              borderRadius: 14,
              backgroundColor: serviceTheme.bg,
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 12,
            }}>
              <Ionicons name={serviceTheme.icon as any} size={24} color={serviceTheme.color} />
            </View>

            {/* Title & Category */}
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: '#0F172A', letterSpacing: -0.3, lineHeight: 22 }}>
                {booking.serviceName}
              </Text>
              <Text style={{ fontSize: 12, fontWeight: '500', color: '#64748B', marginTop: 1 }}>
                {booking.serviceCategory} • {isWalletPayment ? 'Via Wallet' : 'Cash Job'}
              </Text>
            </View>

            {/* Price - Clean & Big */}
            <Text style={{ fontSize: 18, fontWeight: '800', color: '#0F172A' }}>
              ₹{booking.amount}
            </Text>
          </View>

          {/* --- MIDDLE: Location & Customer (Modern List Item) --- */}
          <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
            {/* Address Row with Icon */}
            <View style={{ flexDirection: 'row', marginBottom: 12 }}>
              <Ionicons name="location" size={16} color="#94A3B8" style={{ marginTop: 2 }} />
              <Text style={{ flex: 1, marginLeft: 6, fontSize: 13, color: '#475569', lineHeight: 18 }}>
                {booking.address}
              </Text>
            </View>

            {/* Customer Profile Row */}
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: '#F8FAFC',
              padding: 10,
              borderRadius: 12,
            }}>
              {booking.customerAvatar ? (
                <Image source={{ uri: booking.customerAvatar }} style={{ width: 36, height: 36, borderRadius: 18 }} />
              ) : (
                <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#E2E8F0', alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontWeight: '700', color: '#64748B', fontSize: 14 }}>
                    {booking.customerName.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}

              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#1E293B' }}>{booking.customerName}</Text>
                <Text style={{ fontSize: 11, color: '#64748B' }}>Verified Customer</Text>
              </View>

              <TouchableOpacity
                onPress={() => Linking.openURL(`tel:${booking.customerPhone}`)}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  backgroundColor: '#FFFFFF',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 1,
                  borderColor: '#E2E8F0',
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.05,
                  shadowRadius: 2,
                  elevation: 1,
                }}
              >
                <Ionicons name="call" size={16} color="#0F172A" />
              </TouchableOpacity>
            </View>
          </View>

          {/* --- INFO: Payment Capsule (If Wallet) --- */}
          {isWalletPayment && booking.escrowDetails && (
            <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                padding: 10,
                backgroundColor: '#FFFFFF',
                borderRadius: 10,
                borderWidth: 1,
                borderColor: '#E2E8F0',
                borderStyle: 'dashed', // Modern touch for financial details
              }}>
                <View style={{
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  backgroundColor: paymentInfo.color + '15',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 8,
                }}>
                  <Ionicons name={paymentInfo.icon as any} size={14} color={paymentInfo.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: '#334155' }}>
                    {paymentInfo.label}
                  </Text>
                  <Text style={{ fontSize: 10, color: '#64748B', marginTop: 1 }}>
                    {booking.walletPaymentStage === 'initial_25_held'
                      ? `₹${booking.escrowDetails?.initialAmount} ready for release`
                      : booking.walletPaymentStage === 'initial_25_released'
                        ? `₹${booking.escrowDetails?.initialAmount} received`
                        : `Total ₹${booking.amount} received`}
                  </Text>
                </View>
                {/* Visual Progress Dots */}
                <View style={{ flexDirection: 'row', gap: 4 }}>
                  <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: paymentInfo.color }} />
                  <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: booking.walletPaymentStage === 'completed' ? '#16A34A' : '#E2E8F0' }} />
                </View>
              </View>
            </View>
          )}

          {/* --- INFO: Notes (If any) --- */}
          {booking.notes ? (
            <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
              <Text style={{ fontSize: 11, color: '#64748B', fontStyle: 'italic', backgroundColor: '#F8FAFC', padding: 8, borderRadius: 6 }}>
                "{booking.notes}"
              </Text>
            </View>
          ) : null}

          {/* --- TIMER (In Progress) --- */}
          {isInProgress && jobSessions[booking.id] && (
            <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
              <JobTimer
                startTime={new Date(jobSessions[booking.id].startTime)}
                expectedDuration={jobSessions[booking.id].expectedDuration}
              />
            </View>
          )}

          {/* --- OVERTIME (Completed) --- */}
          {isCompleted && jobSessions[booking.id]?.overtimeDuration > 0 && (
            <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
              <OvertimeBreakdown
                duration={jobSessions[booking.id].duration || 0}
                expectedDuration={jobSessions[booking.id].expectedDuration || 480}
                overtimeDuration={jobSessions[booking.id].overtimeDuration || 0}
                baseHourlyRate={jobSessions[booking.id].baseHourlyRate || 0}
                overtimeRate={jobSessions[booking.id].overtimeRate || 0}
                overtimeCharge={jobSessions[booking.id].overtimeCharge || 0}
                totalCharge={jobSessions[booking.id].totalCharge || booking.amount}
              />
            </View>
          )}

          {/* --- FOOTER: Actions (Floating-style Buttons) --- */}
          {/* Only show actions if there's something to do. Completed/Cancelled don't need buttons generally unless support */}
          {(isPending || isAccepted || isInProgress) && (
            <View style={{
              padding: 12, // Reduced padding
              borderTopWidth: 1,
              borderTopColor: '#F1F5F9',
              flexDirection: 'row',
              gap: 10,
            }}>

              {isPending && (
                <>
                  <TouchableOpacity
                    onPress={() => handleStatusChange(booking.id, 'cancelled')}
                    style={{
                      flex: 1,
                      paddingVertical: 12,
                      borderRadius: 14,
                      backgroundColor: '#F1F5F9',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text style={{ fontSize: 14, fontWeight: '700', color: '#64748B' }}>Decline</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleStatusChange(booking.id, 'accepted')}
                    style={{
                      flex: 2,
                      paddingVertical: 12,
                      borderRadius: 14,
                      backgroundColor: COLORS.primary, // Use app theme
                      alignItems: 'center',
                      justifyContent: 'center',
                      shadowColor: COLORS.primary,
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.2,
                      shadowRadius: 8,
                      elevation: 4,
                    }}
                  >
                    <Text style={{ fontSize: 14, fontWeight: '700', color: '#FFFFFF' }}>Accept Request</Text>
                  </TouchableOpacity>
                </>
              )}

              {isAccepted && (
                <>
                  <TouchableOpacity
                    onPress={() => openLocationNavigation(booking)}
                    style={{
                      flex: 1,
                      paddingVertical: 12,
                      borderRadius: 14,
                      backgroundColor: '#F1F5F9',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexDirection: 'row',
                      gap: 6
                    }}
                  >
                    <Ionicons name="navigate" size={16} color="#475569" />
                    <Text style={{ fontSize: 14, fontWeight: '700', color: '#475569' }}>Maps</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleStartJob(booking.id)}
                    style={{
                      flex: 2,
                      paddingVertical: 12,
                      borderRadius: 14,
                      backgroundColor: COLORS.primary, // Use app theme
                      alignItems: 'center',
                      justifyContent: 'center',
                      shadowColor: COLORS.primary,
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.25,
                      shadowRadius: 8,
                      elevation: 4,
                      flexDirection: 'row',
                      gap: 8,
                    }}
                  >
                    <Ionicons name="play" size={16} color="#FFF" />
                    <Text style={{ fontSize: 14, fontWeight: '700', color: '#FFFFFF' }}>Start Job</Text>
                  </TouchableOpacity>
                </>
              )}

              {isInProgress && (
                <TouchableOpacity
                  onPress={() => handleEndJob(booking.id)}
                  style={{
                    flex: 1,
                    paddingVertical: 12,
                    borderRadius: 14,
                    backgroundColor: '#16A34A', // Green
                    alignItems: 'center',
                    justifyContent: 'center',
                    shadowColor: "#16A34A",
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.25,
                    shadowRadius: 8,
                    elevation: 4,
                    flexDirection: 'row',
                    gap: 8
                  }}
                >
                  <Ionicons name="checkmark-done-circle" size={18} color="#FFF" />
                  <Text style={{ fontSize: 14, fontWeight: '700', color: '#FFFFFF' }}>Complete Job</Text>
                </TouchableOpacity>
              )}

            </View>
          )}

          {(isCompleted || isCancelled) && (
            <View style={{ padding: 12, borderTopWidth: 1, borderTopColor: '#F8FAFC', alignItems: 'center' }}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: '#94A3B8' }}>
                {isCompleted ? 'Service completed successfully' : 'Booking was cancelled'}
              </Text>
            </View>
          )}

        </View>
      </AnimatedBookingItem>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <LottieView
            source={require('../../../assets/lottie/loading.json')}
            autoPlay
            loop
            style={{ width: 200, height: 200 }}
          />
        </View>
      </View>
    );
  }

  const pendingCount = bookings.filter(b => b.status === 'pending').length;
  const acceptedCount = bookings.filter(b => b.status === 'accepted').length;
  const inProgressCount = bookings.filter(b => b.status === 'in_progress').length;
  const completedCount = bookings.filter(b => b.status === 'completed').length;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Bookings</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {renderFilterChip('All', 'all', bookings.length)}
          {renderFilterChip('New', 'pending', pendingCount)}
          {renderFilterChip('Upcoming', 'accepted', acceptedCount)}
          {renderFilterChip('Active', 'in_progress', inProgressCount)}
          {renderFilterChip('History', 'completed', completedCount)}
        </ScrollView>
      </View>

      <View style={styles.container}>
        {error && (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle" size={20} color="#DC2626" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          bounces={true}
          alwaysBounceVertical={true}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              tintColor={COLORS.primary}
              colors={[COLORS.primary]}
            />
          }
        >
          {filteredBookings.length === 0 ? (
            <View style={styles.emptyState}>
              <EmptyState
                title={activeFilter === 'all' ? 'No bookings yet' : `No ${activeFilter.replace('_', ' ')} bookings`}
                subtitle={activeFilter === 'all'
                  ? 'Bookings will appear here when customers request your services'
                  : `You have no ${activeFilter.replace('_', ' ')} bookings at the moment`}
              />
            </View>
          ) : (
            filteredBookings.map((b, i) => renderBookingCard(b, i))
          )}
        </ScrollView>
      </View>

      {/* Navigation Modal */}
      <Modal
        visible={navModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setNavModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setNavModalVisible(false)}
        >
          <TouchableOpacity style={styles.modalContent} activeOpacity={1}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Navigate to Location</Text>
              <TouchableOpacity onPress={() => setNavModalVisible(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSubtitle}>Choose an app to start navigation</Text>

            <View style={styles.navOptions}>
              <TouchableOpacity style={styles.navOption} onPress={() => handleNavigationAppSelect('google')}>
                <View style={[styles.navIconBox, { backgroundColor: '#E8F5E9' }]}>
                  <Ionicons name="map" size={24} color="#4CAF50" />
                </View>
                <Text style={styles.navOptionText}>Google Maps</Text>
                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
              </TouchableOpacity>

              <TouchableOpacity style={styles.navOption} onPress={() => handleNavigationAppSelect('uber')}>
                <View style={[styles.navIconBox, { backgroundColor: '#F3F4F6' }]}>
                  <Text style={{ fontWeight: '900', fontSize: 18 }}>U</Text>
                </View>
                <Text style={styles.navOptionText}>Uber</Text>
                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
              </TouchableOpacity>

              <TouchableOpacity style={styles.navOption} onPress={() => handleNavigationAppSelect('ola')}>
                <View style={[styles.navIconBox, { backgroundColor: '#ECFCCB' }]}>
                  <Text style={{ fontWeight: '900', fontSize: 16, color: '#65A30D' }}>Ola</Text>
                </View>
                <Text style={styles.navOptionText}>Ola</Text>
                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
              </TouchableOpacity>

              <TouchableOpacity style={styles.navOption} onPress={() => handleNavigationAppSelect('rapido')}>
                <View style={[styles.navIconBox, { backgroundColor: '#FEF9C3' }]}>
                  <Text style={{ fontWeight: '900', fontSize: 16, color: '#EAB308' }}>Rapido</Text>
                </View>
                <Text style={styles.navOptionText}>Rapido</Text>
                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      <OTPInputModal
        visible={otpModalVisible}
        onClose={handleCloseOTPModal}
        onSubmit={handleOTPSubmit}
        title={otpModalTitle}
        subtitle={otpModalSubtitle}
        isLoading={otpLoading}
        error={otpError}
      />
    </SafeAreaView>
  );
};

// Clean Modern Styles
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  headerSpacer: { width: 40 },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // Clean Filters
  filterContainer: {
    backgroundColor: COLORS.white,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 100,
    backgroundColor: '#F1F5F9',
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: COLORS.primary, // Theme color instead of dark
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  filterChipTextActive: {
    color: COLORS.white,
  },

  scrollView: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 40 },
  emptyState: { marginTop: 60, alignItems: 'center' },

  // --- NEW CARD STYLES ---
  bookingCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    marginBottom: 20,
    padding: 0, // content handles padding
    ...SHADOWS.md, // Soft shadow
    shadowColor: '#64748B',
    shadowOpacity: 0.06,
    borderWidth: 1,
    borderColor: 'transparent', // Default no border
    overflow: 'hidden',
  },
  nextJobCard: {
    borderColor: '#3B82F6', // Blue border for next job
    borderWidth: 1,
    ...SHADOWS.lg, // Pop it up slightly more
    shadowColor: '#3B82F6',
    shadowOpacity: 0.15,
  },
  nextJobHighlightBorde: {
    height: 4,
    backgroundColor: '#3B82F6',
    width: '100%',
  },
  nextJobLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#3B82F6',
    marginTop: 2,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },

  // Card Internals
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 16,
    paddingBottom: 12,
  },
  dateText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 100,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },

  cardBody: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  serviceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  serviceName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  serviceCategory: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748B',
  },
  amountText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 12,
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  customerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  customerInitial: {
    fontSize: 16,
    fontWeight: '700',
    color: '#64748B',
  },
  customerName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 2,
  },
  addressText: {
    fontSize: 13,
    color: '#64748B',
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#eff6ff', // Light blue bg
    justifyContent: 'center',
    alignItems: 'center',
  },

  notesContainer: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: '#FFFBEB',
    padding: 10,
    borderRadius: 8,
    marginTop: 12,
  },
  notesText: {
    flex: 1,
    fontSize: 13,
    color: '#B45309',
    lineHeight: 18,
  },

  timerWrapper: { marginTop: 16 },

  cardFooter: {
    padding: 12,
    paddingTop: 0,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingBottom: 4,
  },
  completedText: {
    color: '#059669',
    fontWeight: '600',
    fontSize: 14,
  },

  // Errors & Modals
  errorBanner: {
    backgroundColor: '#FEE2E2',
    padding: 16,
    margin: 20,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  errorText: { color: '#DC2626', fontSize: 14 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#0F172A' },
  modalSubtitle: { fontSize: 14, color: '#64748B', marginBottom: 20 },
  navOptions: { gap: 12 },
  navOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
  },
  navIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  navOptionText: { fontSize: 16, fontWeight: '600', color: '#1E293B' },
});
