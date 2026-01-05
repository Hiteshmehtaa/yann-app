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
  paymentStatus: 'pending' | 'paid';
  paymentMethod?: string;
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
    }
  };

  const handleRejectBooking = async (bookingId: string) => {
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
    }
  };

  const handleStatusChange = async (bookingId: string, newStatus: string) => {
    try {
      if (newStatus === 'accepted') {
        await handleAcceptBooking(bookingId);
      } else if (newStatus === 'cancelled') {
        await handleRejectBooking(bookingId);
      } else {
        const response = await apiService.updateBookingStatus(
          bookingId,
          newStatus as 'in_progress' | 'completed' | 'cancelled',
          user?._id || user?.id
        );
        if (response.success) {
          console.log(`✅ Booking status updated to ${newStatus}`);
          fetchBookings();
        }
      }
    } catch (err) {
      console.error(`❌ Error updating booking status to ${newStatus}:`, err);
      setError(`Failed to update booking status`);
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

  const renderBookingCard = (booking: ProviderBooking, index: number) => {
    const isPending = booking.status === 'pending';
    const isAccepted = booking.status === 'accepted';
    const displayStatus = isAccepted ? 'UPCOMING' : booking.status.toUpperCase().replace('_', ' ');
    const statusColor = getStatusColor(booking.status);

    // Check if this is the "Next Job"
    const isNextJob = isAccepted && filteredBookings.find(b => b.status === 'accepted')?.id === booking.id;

    // --- STANDARD CARD DESIGN (Accepted, In Progress, Completed) ---
    return (
      <View key={booking.id} style={[styles.bookingCard, isNextJob && styles.nextJobCard]}>

        {isNextJob && (
          <View style={styles.nextJobBadge}>
            <Ionicons name="flash" size={12} color="#FFF" />
            <Text style={styles.nextJobText}>NEXT JOB</Text>
          </View>
        )}

        <View style={[styles.cardHeader, isNextJob && { paddingTop: 24 }]}>
          <View style={styles.dateContainer}>
            <Ionicons name="calendar" size={16} color={COLORS.primary} />
            <Text style={styles.dateText}>{booking.scheduledDate} • {booking.scheduledTime}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '10' }]}>
            <Ionicons name={getStatusIcon(booking.status) as any} size={12} color={statusColor} />
            <Text style={[styles.statusText, { color: statusColor }]}>
              {displayStatus}
            </Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.serviceSection}>
            <Text style={styles.serviceName}>{booking.serviceName}</Text>
            <Text style={styles.serviceCategory}>{booking.serviceCategory} Service</Text>
          </View>

          <View style={styles.customerSection}>
            <View style={[styles.customerAvatar, { backgroundColor: booking.customerAvatar ? 'transparent' : '#DBEAFE' }]}>
              {booking.customerAvatar ? (
                <Image
                  source={{ uri: booking.customerAvatar }}
                  style={{ width: 42, height: 42, borderRadius: 21 }}
                />
              ) : (
                <Text style={styles.customerInitial}>
                  {booking.customerName.charAt(0).toUpperCase()}
                </Text>
              )}
            </View>
            <View style={styles.customerInfo}>
              <Text style={styles.customerName}>{booking.customerName}</Text>
              <View style={styles.addressRow}>
                <Ionicons name="location-outline" size={14} color={COLORS.textSecondary} />
                <Text style={styles.addressText} numberOfLines={2}>
                  {booking.address && booking.address !== 'N/A' ? booking.address : 'Location available in details'}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.detailsGrid}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Payment</Text>
              <Text style={styles.detailValue}>
                {booking.paymentMethod?.toUpperCase()}
                {booking.paymentStatus === 'paid' && <Text style={{ color: COLORS.success }}> ✓</Text>}
              </Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Amount</Text>
              <Text style={[styles.detailValue, { color: COLORS.primary }]}>₹{booking.amount}</Text>
            </View>
          </View>

          {booking.notes ? (
            <View style={styles.notesBox}>
              <Text style={styles.notesText}>" {booking.notes} "</Text>
            </View>
          ) : null}

          {booking.status === 'in_progress' && jobSessions[booking.id] && (
            <View style={styles.timerWrapper}>
              <JobTimer
                startTime={new Date(jobSessions[booking.id].startTime)}
                expectedDuration={jobSessions[booking.id].expectedDuration}
              />
            </View>
          )}

          {booking.status === 'completed' && jobSessions[booking.id] && jobSessions[booking.id].overtimeDuration > 0 && (
            <View style={{ marginTop: 12 }}>
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
        </View>

        <View style={styles.cardFooter}>
          {booking.status === 'pending' && (
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity
                style={[styles.secondaryButton, { flex: 1, borderColor: '#EF4444' }]}
                onPress={() => handleStatusChange(booking.id, 'cancelled')}
              >
                <Text style={[styles.secondaryButtonText, { color: '#EF4444' }]}>Reject</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.primaryButton, { flex: 1, backgroundColor: COLORS.primary }]}
                onPress={() => handleStatusChange(booking.id, 'accepted')}
              >
                <Text style={styles.primaryButtonText}>Accept Booking</Text>
              </TouchableOpacity>
            </View>
          )}

          {booking.status === 'accepted' && (
            <View style={{ gap: 12 }}>

              <TouchableOpacity
                style={styles.navigateButton}
                onPress={() => openLocationNavigation(booking)}
              >
                <Ionicons name="navigate" size={18} color={COLORS.primary} />
                <Text style={styles.navigateButtonText}>Navigate to Location</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.primaryButton, { backgroundColor: '#2563EB' }]}
                onPress={() => handleStartJob(booking.id)}
              >
                <Ionicons name="play" size={18} color="white" />
                <Text style={styles.primaryButtonText}>Start Job</Text>
              </TouchableOpacity>
            </View>
          )}

          {booking.status === 'in_progress' && (
            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: '#059669' }]}
              onPress={() => handleEndJob(booking.id)}
            >
              <Ionicons name="checkmark-done" size={18} color="white" />
              <Text style={styles.primaryButtonText}>Complete Job</Text>
            </TouchableOpacity>
          )}

          {booking.status === 'completed' && (
            <View style={{ alignItems: 'center', paddingBottom: 12 }}>
              <View style={[styles.statusBadge, { backgroundColor: '#ECFDF5' }]}>
                <Ionicons name="checkmark-circle" size={14} color="#059669" />
                <Text style={[styles.statusText, { color: '#059669' }]}>COMPLETED</Text>
              </View>
            </View>
          )}
        </View>
      </View>
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

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  headerSpacer: {
    width: 40,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    padding: SPACING.md,
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
    gap: SPACING.sm,
  },
  errorText: {
    color: '#991B1B',
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },

  // Filters
  filterContainer: {
    backgroundColor: COLORS.white,
    paddingVertical: 12,
    paddingHorizontal: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.03)',
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 100,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  filterChipActive: {
    backgroundColor: '#2563EB',
    borderColor: '#1D4ED8',
    ...SHADOWS.sm,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  filterChipTextActive: {
    color: COLORS.white,
  },

  // List
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: 40,
  },
  emptyState: {
    marginTop: 60,
    alignItems: 'center',
  },

  // Booking Card
  bookingCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
    ...SHADOWS.md,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#F9FAFB',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    letterSpacing: -0.2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  cardBody: {
    padding: 16,
  },

  // Service
  serviceSection: {
    marginBottom: 16,
  },
  serviceName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  serviceCategory: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },

  // Customer
  customerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  customerAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  customerInitial: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2563EB',
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addressText: {
    fontSize: 13,
    color: '#6B7280',
    flex: 1,
    lineHeight: 18,
  },

  // Details Grid
  detailsGrid: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderColor: '#E5E7EB',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  detailItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },

  // Notes
  notesBox: {
    backgroundColor: '#FFFBEB',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FEF3C7',
    marginBottom: 16,
  },
  notesText: {
    fontSize: 14,
    color: '#92400E',
    fontStyle: 'italic',
    lineHeight: 20,
  },

  // Timer
  timerWrapper: {
    backgroundColor: '#F0FDFA',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CCFBF1',
    marginBottom: 16,
    alignItems: 'center',
  },

  // Footer Actions
  cardFooter: {
    padding: 16,
    paddingTop: 0,
    gap: 12,
  },

  // Buttons
  primaryButton: {
    flexDirection: 'row',
    backgroundColor: '#2563EB',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...SHADOWS.sm,
  },
  primaryButtonText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '600',
  },
  secondaryButton: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  secondaryButtonText: {
    color: '#374151',
    fontSize: 15,
    fontWeight: '600',
  },

  // Navigation Button
  navigateButton: {
    flexDirection: 'row',
    backgroundColor: '#EFF6FF',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  navigateButtonText: {
    color: '#2563EB',
    fontSize: 15,
    fontWeight: '600',
  },

  // Next Job Styles
  nextJobCard: {
    borderColor: '#2563EB',
    borderWidth: 2,
  },
  nextJobBadge: {
    position: 'absolute',
    top: 0,
    left: 0,
    backgroundColor: '#2563EB',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderBottomRightRadius: 12,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  nextJobText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  // --- PENDING CARD STYLES ---
  pendingCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    marginBottom: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    ...SHADOWS.md,
    position: 'relative',
    overflow: 'hidden',
  },
  pendingBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#F59E0B',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderBottomLeftRadius: 12,
  },
  pendingBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  pendingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  customerAvatarSmall: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFF7ED',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  customerInitialSmall: {
    fontSize: 20,
    fontWeight: '700',
    color: '#D97706',
  },
  pendingCustomerName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  pendingServiceName: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  pendingPriceContainer: {
    alignItems: 'flex-end',
  },
  pendingPriceLabel: {
    fontSize: 10,
    color: '#6B7280',
    fontWeight: '600',
    letterSpacing: 1,
    marginBottom: 2,
  },
  pendingPriceValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#059669', // Green for money
  },
  pendingDetails: {
    gap: 8,
    marginBottom: 20,
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 12,
  },
  pendingDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pendingDetailText: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
  pendingActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  pendingAcceptButton: {
    flex: 2,
    backgroundColor: '#111827', // Black/Dark for high contrast
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    ...SHADOWS.md,
  },
  pendingAcceptText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  pendingRejectButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
  },
  pendingRejectText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '600',
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 24,
  },
  navOptions: {
    gap: 12,
  },
  navOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  navIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  navOptionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
});
