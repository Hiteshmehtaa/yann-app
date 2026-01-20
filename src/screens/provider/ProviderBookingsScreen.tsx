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
  status: 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled' | 'rejected';
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

type FilterStatus = 'all' | 'pending' | 'accepted' | 'in_progress' | 'completed' | 'rejected';

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
          jobSession: b.jobSession || null,
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
      // Exclude rejected/cancelled from 'All' view to keep it clean
      list = bookings.filter(b => b.status !== 'rejected' && b.status !== 'cancelled');
    } else if (activeFilter === 'rejected') {
      // Show both rejected and cancelled in 'Declined' view
      list = bookings.filter(b => b.status === 'rejected' || b.status === 'cancelled');
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

  // --- PRO EFFICIENCY CARD COMPONENT ---
  const renderBookingCard = (booking: ProviderBooking, index: number) => {
    const isAccepted = booking.status === 'accepted';
    const isPending = booking.status === 'pending';
    const isInProgress = booking.status === 'in_progress';
    const isCompleted = booking.status === 'completed';
    const isCancelled = booking.status === 'cancelled';
    const isRejected = booking.status === 'rejected';

    const activeJobSession = jobSessions[booking.id] || booking.jobSession;

    const getStatusColor = (status: string) => {
      switch (status) {
        case 'pending': return '#F59E0B'; // Amber 500
        case 'accepted': return '#3B82F6'; // Blue 500
        case 'in_progress': return '#8B5CF6'; // Violet 500
        case 'completed': return '#10B981'; // Emerald 500
        case 'cancelled':
        case 'rejected': return '#EF4444'; // Red 500
        default: return '#64748B'; // Slate 500
      }
    };

    const statusColor = getStatusColor(booking.status);

    const getPaymentStatusInfo = () => {
      if (booking.paymentMethod === 'wallet') {
        if (booking.walletPaymentStage === 'initial_25_held') return '25% Held';
        if (booking.walletPaymentStage === 'initial_25_released') return '25% Paid';
        if (booking.walletPaymentStage === 'completed') return 'Paid';
        return 'Wallet';
      }
      return 'Cash';
    };

    return (
      <AnimatedBookingItem key={booking.id} index={index}>
        <View style={styles.proCard}>
          {/* Status Indicator Strip */}
          <View style={[styles.statusIndicator, { backgroundColor: statusColor }]} />

          <View style={styles.proContent}>
            {/* Header: Service & Price */}
            <View style={styles.proHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.proServiceName} numberOfLines={1}>
                  {booking.serviceName}
                </Text>
                <View style={styles.proMetaRow}>
                  <View style={[styles.proStatusBadge, { backgroundColor: statusColor + '15' }]}>
                    <Text style={[styles.proStatusText, { color: statusColor }]}>
                      {booking.status.replace('_', ' ')}
                    </Text>
                  </View>
                  <Text style={styles.proCategoryText}>{booking.serviceCategory}</Text>
                </View>
              </View>
              <Text style={styles.proPriceText}>₹{booking.amount}</Text>
            </View>

            {/* Grid Content: Date & Customer */}
            <View style={styles.proGrid}>
              {/* Date & Location Column */}
              <View style={styles.proGridItem}>
                <View style={styles.proIconRow}>
                  <Ionicons name="calendar-outline" size={14} color="#64748B" />
                  <Text style={styles.proLabel}>Date & Time</Text>
                </View>
                <Text style={styles.proValue}>
                  {booking.scheduledDate} • {booking.scheduledTime}
                </Text>
                <View style={[styles.proIconRow, { marginTop: 8 }]}>
                  <Ionicons name="location-outline" size={14} color="#64748B" />
                  <Text style={styles.proValue} numberOfLines={1}>
                    {booking.address || 'N/A'}
                  </Text>
                </View>
              </View>

              {/* Customer Column */}
              <View style={[styles.proGridItem, { paddingLeft: 12, borderLeftWidth: 1, borderLeftColor: '#F1F5F9' }]}>
                <View style={styles.proIconRow}>
                  <Ionicons name="person-outline" size={14} color="#64748B" />
                  <Text style={styles.proLabel}>Customer</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 8 }}>
                  {booking.customerAvatar ? (
                    <Image source={{ uri: booking.customerAvatar }} style={styles.proAvatar} />
                  ) : (
                    <View style={styles.proAvatarPlaceholder}>
                      <Text style={styles.proAvatarText}>{booking.customerName?.charAt(0) || 'C'}</Text>
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={styles.proValue} numberOfLines={1}>{booking.customerName}</Text>
                    <TouchableOpacity onPress={() => Linking.openURL(`tel:${booking.customerPhone}`)}>
                      <Text style={{ fontSize: 12, color: COLORS.primary, fontWeight: '600' }}>Call</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>

            {/* Notes / Payment / Job Timer */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 12 }}>
              <View style={styles.proTag}>
                <Text style={styles.proTagText}>{getPaymentStatusInfo()}</Text>
              </View>
              {(isAccepted || isInProgress) && activeJobSession?.startTime && (
                <View style={{ flex: 1 }}>
                  <JobTimer
                    startTime={new Date(activeJobSession.startTime)}
                    expectedDuration={activeJobSession.expectedDuration || 60}
                    variant="compact"
                  />
                </View>
              )}
            </View>


            {/* Actions */}
            {(isPending || isAccepted || isInProgress) && (
              <View style={styles.proActions}>
                {isPending && (
                  <>
                    <TouchableOpacity
                      onPress={() => handleStatusChange(booking.id, 'cancelled')}
                      style={styles.compactDeclineBtn}
                    >
                      <Text style={styles.compactDeclineText}>Decline</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleStatusChange(booking.id, 'accepted')}
                      style={[styles.compactPrimaryBtn, { backgroundColor: '#0F172A' }]}
                    >
                      <Text style={styles.compactPrimaryText}>Accept</Text>
                    </TouchableOpacity>
                  </>
                )}
                {isAccepted && (
                  <>
                    <TouchableOpacity
                      onPress={() => openLocationNavigation(booking)}
                      style={styles.compactSecondaryBtn}
                    >
                      <Ionicons name="navigate" size={16} color="#475569" />
                      <Text style={styles.compactSecondaryText}>Navigate</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleStartJob(booking.id)}
                      style={[styles.compactPrimaryBtn, { backgroundColor: statusColor, flex: 1 }]}
                    >
                      <Ionicons name="play" size={16} color="#FFF" />
                      <Text style={styles.compactPrimaryText}>Start</Text>
                    </TouchableOpacity>
                  </>
                )}
                {isInProgress && (
                  <TouchableOpacity
                    onPress={() => handleEndJob(booking.id)}
                    style={[styles.compactPrimaryBtn, { backgroundColor: statusColor, flex: 1 }]}
                  >
                    <Ionicons name="checkmark" size={18} color="#FFF" />
                    <Text style={styles.compactPrimaryText}>Complete Job</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {(isCompleted || isCancelled || isRejected) && (
              <View style={{ marginTop: 16, borderTopWidth: 1, borderTopColor: '#F8FAFC', paddingTop: 12 }}>
                <Text style={{ fontSize: 12, fontWeight: '600', color: statusColor, textTransform: 'uppercase' }}>
                  {booking.status.replace('_', ' ')}
                </Text>
              </View>
            )}

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
  const rejectedCount = bookings.filter(b => b.status === 'rejected' || b.status === 'cancelled').length;
  const allCount = bookings.filter(b => b.status !== 'rejected' && b.status !== 'cancelled').length;

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
          {renderFilterChip('All', 'all', allCount)}
          {renderFilterChip('New', 'pending', pendingCount)}
          {renderFilterChip('Upcoming', 'accepted', acceptedCount)}
          {renderFilterChip('Active', 'in_progress', inProgressCount)}
          {renderFilterChip('History', 'completed', completedCount)}
          {renderFilterChip('Declined', 'rejected', rejectedCount)}
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

// --- PRO EFFICIENCY STYLES ---
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC', // Cool gray background
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  headerSpacer: { width: 40 },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Clean Filters (Unchanged mostly)
  filterContainer: {
    backgroundColor: COLORS.white,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: '#0F172A', // Dark efficient color
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748B',
  },
  filterChipTextActive: {
    color: '#F8FAFC',
  },

  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollView: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 100 },
  emptyState: { marginTop: 60, alignItems: 'center' },

  // --- CARD STYLES ---
  proCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    flexDirection: 'row',
    ...SHADOWS.sm,
    shadowColor: '#64748B',
    shadowOpacity: 0.05,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    overflow: 'hidden',
  },
  statusIndicator: {
    width: 4,
    height: '100%',
  },
  proContent: {
    flex: 1,
    padding: 16,
  },
  proHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  proServiceName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  proMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  proStatusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  proStatusText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  proCategoryText: {
    fontSize: 12,
    color: '#64748B',
  },
  proPriceText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },

  // Grid
  proGrid: {
    flexDirection: 'row',
  },
  proGridItem: {
    flex: 1,
  },
  proIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  proLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#94A3B8',
    textTransform: 'uppercase',
  },
  proValue: {
    fontSize: 13,
    color: '#334155',
    fontWeight: '500',
  },
  proAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  proAvatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  proAvatarText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },

  proTag: {
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  proTagText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },

  // Actions
  proActions: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 12,
  },
  compactDeclineBtn: {
    paddingHorizontal: 16,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  compactDeclineText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#EF4444',
  },
  compactPrimaryBtn: {
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    flexDirection: 'row',
    gap: 6,
  },
  compactPrimaryText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  compactSecondaryBtn: {
    height: 36,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    flexDirection: 'row',
    gap: 6,
  },
  compactSecondaryText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },

  // Modals & Errors (Keep existing)
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
