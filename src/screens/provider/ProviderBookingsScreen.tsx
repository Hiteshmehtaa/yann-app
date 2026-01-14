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
  jobSession?: {
    startTime: string;
    expectedDuration: number;
    status: string;
  };
}

type FilterStatus = 'all' | 'pending' | 'accepted' | 'in_progress' | 'completed';

export const ProviderBookingsScreen = () => {
  // ... (keeping existing hooks)
  const navigation = useNavigation();
  const { user } = useAuth();
  const [bookings, setBookings] = useState<ProviderBooking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<ProviderBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterStatus>('all');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // ... (rest of code)



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

  // --- PREMIUM TICKET CARD COMPONENT ---
  const renderBookingCard = (booking: ProviderBooking, index: number) => {
    const isAccepted = booking.status === 'accepted';
    const isPending = booking.status === 'pending';
    const isInProgress = booking.status === 'in_progress';
    const isCompleted = booking.status === 'completed';
    const isCancelled = booking.status === 'cancelled';
    const isWalletPayment = booking.paymentMethod === 'wallet';

    const isNextJob = isAccepted && filteredBookings.find(b => b.status === 'accepted')?.id === booking.id;

    // Theme Helpers
    const getStatusTheme = () => {
      switch (booking.status) {
        case 'pending': return { color: '#B45309', bg: '#FFFBEB', borderColor: '#FDE68A' };
        case 'accepted': return { color: COLORS.primary, bg: '#F0F9FF', borderColor: '#BAE6FD' };
        case 'in_progress': return { color: '#7C3AED', bg: '#F3E8FF', borderColor: '#E9D5FF' };
        case 'completed': return { color: '#15803D', bg: '#DCFCE7', borderColor: '#BBF7D0' };
        case 'cancelled': return { color: '#B91C1C', bg: '#FEE2E2', borderColor: '#FECACA' };
        default: return { color: '#64748B', bg: '#F1F5F9', borderColor: '#E2E8F0' };
      }
    };
    const statusTheme = getStatusTheme();

    const getServiceIcon = (category: string) => {
      const cat = category?.toLowerCase() || '';
      if (cat.includes('puja')) return 'flame';
      if (cat.includes('clean')) return 'sparkles';
      if (cat.includes('driver')) return 'car';
      return 'construct';
    };

    return (
      <AnimatedBookingItem key={booking.id} index={index}>
        <View style={{
          marginHorizontal: 4, // Tiny margin for shadow room
          marginBottom: 20,
          shadowColor: "#64748B",
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.08,
          shadowRadius: 12,
          elevation: 4, // Soft premium shadow
        }}>
          {/* --- TICKET CONTAINER --- */}
          <View style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 20,
            overflow: 'hidden', // Contain children
          }}>

            {/* --- TOP SECTION: Service & Status --- */}
            <View style={{
              padding: 16,
              backgroundColor: isNextJob ? '#F8FAFC' : '#FFFFFF', // Subtle contrast for next job
            }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                {/* Badge */}
                <View style={{
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                  backgroundColor: statusTheme.bg,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: statusTheme.borderColor,
                  alignSelf: 'flex-start',
                }}>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: statusTheme.color, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    {booking.status.replace('_', ' ')}
                  </Text>
                </View>

                {/* Date Time */}
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: '#1E293B' }}>{booking.scheduledTime}</Text>
                  <Text style={{ fontSize: 12, color: '#64748B' }}>{booking.scheduledDate}</Text>
                </View>
              </View>

              {/* Main Content */}
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{
                  width: 52, height: 52,
                  borderRadius: 14,
                  backgroundColor: COLORS.primary + '10',
                  alignItems: 'center', justifyContent: 'center',
                  marginRight: 14,
                  borderWidth: 1,
                  borderColor: COLORS.primary + '20',
                }}>
                  <Ionicons name={getServiceIcon(booking.serviceCategory) as any} size={26} color={COLORS.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 17, fontWeight: '800', color: '#0F172A', marginBottom: 2 }}>
                    {booking.serviceName}
                  </Text>
                  <Text style={{ fontSize: 13, color: '#64748B', fontWeight: '500' }}>
                    {booking.serviceCategory}
                  </Text>
                </View>
                <Text style={{ fontSize: 20, fontWeight: '800', color: '#0F172A' }}>
                  ₹{booking.amount}
                </Text>
              </View>
            </View>

            {/* --- TICKET RIPPLE DIVIDER --- */}
            <View style={{ height: 1, backgroundColor: '#E2E8F0', overflow: 'visible', marginHorizontal: 16, borderStyle: 'dashed', borderWidth: 1, borderColor: '#CBD5E1', borderLeftWidth: 0, borderRightWidth: 0, borderBottomWidth: 0 }}>
              {/* Left Notch */}
              <View style={{
                position: 'absolute', left: -24, top: -10,
                width: 20, height: 20, borderRadius: 10,
                backgroundColor: '#F8FAFC', // Match screen bg
                borderWidth: 1, borderColor: isNextJob ? COLORS.primary : '#E2E8F0',
                zIndex: 10,
              }} />
              {/* Right Notch */}
              <View style={{
                position: 'absolute', right: -24, top: -10,
                width: 20, height: 20, borderRadius: 10,
                backgroundColor: '#F8FAFC', // Match screen bg
                borderWidth: 1, borderColor: isNextJob ? COLORS.primary : '#E2E8F0',
                zIndex: 10,
              }} />
            </View>


            {/* --- BOTTOM SECTION: Info & Customer --- */}
            <View style={{ padding: 16 }}>

              {/* Address */}
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 }}>
                <View style={{ marginTop: 2, marginRight: 8, width: 24, alignItems: 'center' }}>
                  <Ionicons name="location" size={18} color={COLORS.primary} />
                  {/* Dotted Line */}
                  <View style={{ width: 1, height: 20, backgroundColor: '#E2E8F0', marginVertical: 2 }} />
                  {booking.customerAvatar ? (
                    <Image
                      source={{ uri: booking.customerAvatar }}
                      style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: '#E2E8F0' }}
                    />
                  ) : (
                    <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: '#E2E8F0', alignItems: 'center', justifyContent: 'center' }}>
                      <Ionicons name="person" size={12} color="#64748B" />
                    </View>
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, color: '#334155', lineHeight: 20, marginBottom: 8, fontWeight: '500' }}>
                    {booking.address && booking.address !== 'N/A' ? booking.address : 'Address not provided'}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: '#1E293B' }}>
                      {booking.customerName}
                    </Text>
                    <TouchableOpacity onPress={() => Linking.openURL(`tel:${booking.customerPhone}`)}>
                      <Text style={{ fontSize: 13, fontWeight: '600', color: COLORS.primary }}>Call Customer</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {/* Wallet Info (Compact) */}
              {isWalletPayment && (
                <View style={{
                  flexDirection: 'row', alignItems: 'center',
                  backgroundColor: '#F0F9FF', padding: 10, borderRadius: 10, marginBottom: 16
                }}>
                  <Ionicons name="wallet-outline" size={18} color={COLORS.primary} style={{ marginRight: 8 }} />
                  <Text style={{ fontSize: 12, color: '#0F172A', flex: 1 }}>
                    {booking.walletPaymentStage === 'initial_25_held' ? '25% Escrow Held' : 'Payment Verified'}
                  </Text>
                  <Ionicons name="checkmark-circle" size={16} color={COLORS.primary} />
                </View>
              )}

              {/* Notes */}
              {booking.notes ? (
                <Text style={{ fontSize: 12, color: '#64748B', fontStyle: 'italic', marginBottom: 16 }}>
                  "{booking.notes}"
                </Text>
              ) : null}

              {/* Actions */}
              {(isPending || isAccepted || isInProgress) && (
                <View style={{ flexDirection: 'row', gap: 12, marginTop: 4 }}>
                  {isPending && (
                    <>
                      <Button title="Decline" variant="ghost" size="medium" onPress={() => handleStatusChange(booking.id, 'cancelled')} style={{ flex: 1 }} textStyle={{ color: '#EF4444' }} />
                      <Button title="Accept" variant="primary" size="medium" onPress={() => handleStatusChange(booking.id, 'accepted')} style={{ flex: 2 }} />
                    </>
                  )}
                  {isAccepted && (
                    <>
                      <Button title="Maps" variant="outline" size="medium" onPress={() => openLocationNavigation(booking)} style={{ flex: 1 }} icon={<Ionicons name="compass-outline" size={18} color="#475569" />} />
                      <Button title="Start Job" variant="primary" size="medium" onPress={() => handleStartJob(booking.id)} style={{ flex: 1.5 }} />
                    </>
                  )}
                  {isInProgress && (
                    <Button title="Complete Job" variant="primary" size="medium" onPress={() => handleEndJob(booking.id)} style={{ flex: 1 }} icon={<Ionicons name="checkmark-done" size={20} color="#FFF" />} />
                  )}
                </View>
              )}

              {/* Job Timer - Visible when accepted or in progress */}
              {/* Job Timer - Visible when accepted or in progress AND has start time */}
              {(isAccepted || isInProgress) && booking.jobSession?.startTime && (
                <View style={{ marginTop: 16 }}>
                  <JobTimer
                    startTime={new Date(booking.jobSession.startTime)}
                    expectedDuration={booking.jobSession.expectedDuration || 60}
                  />
                </View>
              )}
            </View>

          </View>
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
