import React, { useState, useEffect, useRef } from 'react';
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
  Animated,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import LottieView from 'lottie-react-native';
import { apiService } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS, SHADOWS } from '../../utils/theme';
import { EmptyState } from '../../components/EmptyState';

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
  notes?: string;
  createdAt: string;
}

type FilterStatus = 'all' | 'pending' | 'accepted' | 'in_progress' | 'completed';

import { useNavigation } from '@react-navigation/native';

export const ProviderBookingsScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [bookings, setBookings] = useState<ProviderBooking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<ProviderBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterStatus>('all');

  useEffect(() => {
    fetchBookings();
  }, []);

  useEffect(() => {
    filterBookings();
  }, [activeFilter, bookings]);

  const fetchBookings = async () => {
    try {
      setError(null);
      // Backend /provider/requests requires providerId or email
      // Pass user's id or email to the API
      const providerId = user?._id || user?.id;
      const email = user?.email;
      
      console.log('🔍 Fetching bookings for provider:', { providerId, email, name: user?.name });
      
      const response: any = await apiService.getProviderRequests(providerId, email);
      
      console.log('📦 API Response:', {
        success: response.success,
        pendingRequests: response.pendingRequests?.length || 0,
        acceptedBookings: response.acceptedBookings?.length || 0,
      });
      
      if (response.success) {
        // Show BOTH pending requests AND accepted bookings
        // Helper function to format date from ISO string or date string
        const formatDate = (dateStr: string) => {
          if (!dateStr || dateStr === 'N/A') return 'N/A';
          try {
            const date = new Date(dateStr);
            // Format as DD/MM/YYYY
            return date.toLocaleDateString('en-IN', { 
              day: '2-digit', 
              month: '2-digit', 
              year: 'numeric' 
            });
          } catch {
            return dateStr;
          }
        };

        const pendingRequests = (response.pendingRequests || []).map((b: any) => ({
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
          status: b.status || 'pending',
          amount: b.totalPrice || b.basePrice || b.amount || 0,
          paymentStatus: b.paymentStatus || 'pending',
          notes: b.notes || '',
          createdAt: b.createdAt || new Date().toISOString(),
        }));
        
        const acceptedBookings = (response.acceptedBookings || []).map((b: any) => ({
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
          status: b.status || 'accepted',
          amount: b.totalPrice || b.basePrice || b.amount || 0,
          paymentStatus: b.paymentStatus || 'pending',
          notes: b.notes || '',
          createdAt: b.createdAt || new Date().toISOString(),
        }));
        
        // Combine both lists - pending requests come first
        const allBookings = [...pendingRequests, ...acceptedBookings];
        
        setBookings(allBookings);
        console.log(`✅ Loaded ${allBookings.length} total bookings (${pendingRequests.length} pending, ${acceptedBookings.length} accepted)`);
        
        // Debug: Log first booking details
        if (allBookings.length > 0) {
          console.log('📋 First booking details:', JSON.stringify(allBookings[0], null, 2));
        } else {
          console.log('⚠️ No bookings found for this provider');
        }
      } else {
        console.log('❌ API response.success is false');
      }
    } catch (err: any) {
      console.error('❌ Error fetching provider bookings:', err);
      setError(err.isNetworkError ? 'No internet connection' : 'Failed to load bookings');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const filterBookings = () => {
    if (activeFilter === 'all') {
      setFilteredBookings(bookings);
    } else {
      setFilteredBookings(bookings.filter(b => b.status === activeFilter));
    }
  };

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchBookings();
  };

  const openLocationNavigation = (booking: ProviderBooking) => {
    const { latitude, longitude, address } = booking;
    
    // If no coordinates, try to open with address text
    if (!latitude || !longitude) {
      const addressQuery = encodeURIComponent(address);
      const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${addressQuery}`;
      
      Alert.alert(
        'Navigate to Location',
        'Open location in:',
        [
          {
            text: 'Google Maps',
            onPress: () => { void Linking.openURL(googleMapsUrl); },
          },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
      return;
    }

    // With coordinates, offer multiple navigation options
    const googleMapsUrl = Platform.select({
      ios: `maps://app?daddr=${latitude},${longitude}`,
      android: `google.navigation:q=${latitude},${longitude}`,
    });
    
    const googleMapsWebUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
    const uberUrl = `uber://?action=setPickup&pickup=my_location&dropoff[latitude]=${latitude}&dropoff[longitude]=${longitude}`;
    const olaUrl = `ola://app/launch?lat=${latitude}&lng=${longitude}`;
    const rapidoUrl = `rapido://destination?lat=${latitude}&lng=${longitude}`;

    Alert.alert(
      'Navigate to Location',
      `${booking.customerName}\n${address}`,
      [
        {
          text: 'Google Maps',
          onPress: () => {
            void (async () => {
              const supported = await Linking.canOpenURL(googleMapsUrl || '');
              if (supported) {
                await Linking.openURL(googleMapsUrl || '');
              } else {
                await Linking.openURL(googleMapsWebUrl);
              }
            })();
          },
        },
        {
          text: 'Uber',
          onPress: () => {
            void (async () => {
              const supported = await Linking.canOpenURL(uberUrl);
              if (supported) {
                await Linking.openURL(uberUrl);
              } else {
                Alert.alert('Uber not installed', 'Please install Uber app to use this feature');
              }
            })();
          },
        },
        {
          text: 'Ola',
          onPress: () => {
            void (async () => {
              const supported = await Linking.canOpenURL(olaUrl);
              if (supported) {
                await Linking.openURL(olaUrl);
              } else {
                Alert.alert('Ola not installed', 'Please install Ola app to use this feature');
              }
            })();
          },
        },
        {
          text: 'Rapido',
          onPress: () => {
            void (async () => {
              const supported = await Linking.canOpenURL(rapidoUrl);
              if (supported) {
                await Linking.openURL(rapidoUrl);
              } else {
                Alert.alert('Rapido not installed', 'Please install Rapido app to use this feature');
              }
            })();
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ],
      { cancelable: true }
    );
  };

  const handleAcceptBooking = async (bookingId: string) => {
    try {
      // Pass providerId and providerName as required by backend
      const response = await apiService.acceptBooking(
        bookingId,
        user?._id || user?.id,
        user?.name
      );
      if (response.success) {
        console.log('✅ Booking accepted');
        fetchBookings(); // Refresh list
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
        fetchBookings(); // Refresh list
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
        // For in_progress, completed - use the update-status endpoint
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

  const getStatusGradient = (status: string): [string, string] => {
    switch (status) {
      case 'pending': return ['#FF8A3D', '#F59E0B'];
      case 'accepted': return ['#0D9488', '#14B8A6'];
      case 'in_progress': return ['#2563EB', '#3B82F6'];
      case 'completed': return ['#059669', '#10B981'];
      case 'cancelled': return ['#DC2626', '#EF4444'];
      default: return ['#6B7280', '#9CA3AF'];
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

  const renderBookingCard = (booking: ProviderBooking) => {
    const statusColor = getStatusColor(booking.status);
    const statusIcon = getStatusIcon(booking.status);

    return (
      <View key={booking.id} style={styles.bookingCard}>
        {/* Status Indicator Bar */}
        <LinearGradient
          colors={getStatusGradient(booking.status)}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.statusBar}
        />
        {/* Header */}
        <View style={styles.bookingHeader}>
          <View style={styles.customerInfo}>
            <View style={styles.customerAvatar}>
              <Text style={styles.customerInitial}>
                {booking.customerName.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.customerDetails}>
              <Text style={styles.customerName}>{booking.customerName}</Text>
              <Text style={styles.customerPhone}>{booking.customerPhone}</Text>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '15' }]}>
            <Ionicons name={statusIcon as any} size={14} color={statusColor} />
            <Text style={[styles.statusText, { color: statusColor }]}>
              {(booking.status || 'pending').replace('_', ' ').toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Service Info */}
        <View style={styles.serviceInfo}>
          <View style={styles.serviceRow}>
            <Ionicons name="construct-outline" size={18} color={COLORS.primary} />
            <Text style={styles.serviceText}>{booking.serviceName}</Text>
          </View>
          <View style={styles.locationRow}>
            <View style={styles.locationInfo}>
              <Ionicons name="location-outline" size={18} color={COLORS.textSecondary} />
              <Text style={styles.addressText} numberOfLines={1}>{booking.address}</Text>
            </View>
            <TouchableOpacity 
              style={styles.navigateButton}
              onPress={() => openLocationNavigation(booking)}
            >
              <Ionicons name="navigate" size={16} color={COLORS.white} />
              <Text style={styles.navigateText}>Navigate</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Date & Time */}
        <View style={styles.dateTimeRow}>
          <View style={styles.dateTimeItem}>
            <Ionicons name="calendar-outline" size={16} color={COLORS.textSecondary} />
            <Text style={styles.dateTimeText}>{booking.scheduledDate}</Text>
          </View>
          <View style={styles.dateTimeItem}>
            <Ionicons name="time-outline" size={16} color={COLORS.textSecondary} />
            <Text style={styles.dateTimeText}>{booking.scheduledTime}</Text>
          </View>
        </View>

        {/* Amount */}
        <View style={styles.amountRow}>
          <Text style={styles.amountLabel}>Booking Amount:</Text>
          <Text style={styles.amountValue}>₹{(booking.amount ?? 0).toLocaleString()}</Text>
        </View>

        {/* Action Buttons */}
        {booking.status === 'pending' && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, styles.rejectButton]}
              onPress={() => handleStatusChange(booking.id, 'cancelled')}
              activeOpacity={0.7}
            >
              <Ionicons name="close-outline" size={20} color="#F44336" />
              <Text style={styles.rejectButtonText}>Reject</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.acceptButton]}
              onPress={() => handleStatusChange(booking.id, 'accepted')}
              activeOpacity={0.7}
            >
              <Ionicons name="checkmark-outline" size={20} color="#FFFFFF" />
              <Text style={styles.acceptButtonText}>Accept</Text>
            </TouchableOpacity>
          </View>
        )}

        {booking.status === 'accepted' && (
          <TouchableOpacity
            style={styles.startButton}
            onPress={() => handleStatusChange(booking.id, 'in_progress')}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={[COLORS.primary, COLORS.primaryGradientEnd]}
              style={styles.gradientButton}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Ionicons name="play-outline" size={20} color="#FFFFFF" />
              <Text style={styles.startButtonText}>Start Job</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {booking.status === 'in_progress' && (
          <TouchableOpacity
            style={styles.startButton}
            onPress={() => handleStatusChange(booking.id, 'completed')}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={['#4CAF50', '#2E7D32']}
              style={styles.gradientButton}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Ionicons name="checkmark-done-outline" size={20} color="#FFFFFF" />
              <Text style={styles.startButtonText}>Mark Complete</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
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
      <StatusBar barStyle="light-content" backgroundColor="#2563EB" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButtonIcon}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Bookings</Text>
        <View style={{ width: 40 }} />
      </View>
      
      <View style={styles.container}>
      {/* Error Banner */}
      {error && (
        <View style={styles.errorBanner}>
          <LottieView
            source={require('../../../assets/lottie/Connection-Lost-Animation.json')}
            autoPlay
            loop
            style={{ width: 32, height: 32 }}
          />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <View style={styles.statsContainer}>
        <LinearGradient
          colors={['#2563EB', '#1E40AF']} // App Theme Blue
          style={styles.statsGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{bookings.length}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{pendingCount}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{inProgressCount}</Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
        </LinearGradient>
      </View>

      {/* Filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        bounces={true}
        style={styles.filtersContainer}
        contentContainerStyle={styles.filtersContent}
      >
        {renderFilterChip('All', 'all', bookings.length)}
        {renderFilterChip('Pending', 'pending', pendingCount)}
        {renderFilterChip('Accepted', 'accepted', acceptedCount)}
        {renderFilterChip('In Progress', 'in_progress', inProgressCount)}
        {renderFilterChip('Completed', 'completed', completedCount)}
      </ScrollView>

      {/* Bookings List */}
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
          filteredBookings.map(renderBookingCard)
        )}
      </ScrollView>
      </View>
    </SafeAreaView>
  );
};

// Mock data for development
const MOCK_BOOKINGS: ProviderBooking[] = [
  {
    id: '1',
    customerName: 'Rajesh Kumar',
    customerPhone: '+91 98765 43210',
    serviceName: 'AC Repair & Service',
    serviceCategory: 'Home Maintenance',
    scheduledDate: '5 Dec 2025',
    scheduledTime: '10:00 AM',
    address: '123 MG Road, Bangalore, Karnataka',
    status: 'pending',
    amount: 1500,
    paymentStatus: 'pending',
    createdAt: '2025-12-02T10:30:00Z',
  },
  {
    id: '2',
    customerName: 'Priya Sharma',
    customerPhone: '+91 87654 32109',
    serviceName: 'Plumbing Repair',
    serviceCategory: 'Home Maintenance',
    scheduledDate: '3 Dec 2025',
    scheduledTime: '2:00 PM',
    address: '456 Koramangala, Bangalore, Karnataka',
    status: 'accepted',
    amount: 800,
    paymentStatus: 'pending',
    createdAt: '2025-12-01T14:20:00Z',
  },
  {
    id: '3',
    customerName: 'Amit Patel',
    customerPhone: '+91 76543 21098',
    serviceName: 'Electrical Work',
    serviceCategory: 'Home Maintenance',
    scheduledDate: '2 Dec 2025',
    scheduledTime: '11:00 AM',
    address: '789 Indiranagar, Bangalore, Karnataka',
    status: 'in_progress',
    amount: 2000,
    paymentStatus: 'pending',
    createdAt: '2025-11-30T09:15:00Z',
  },
  {
    id: '4',
    customerName: 'Sneha Reddy',
    customerPhone: '+91 65432 10987',
    serviceName: 'House Cleaning',
    serviceCategory: 'Cleaning',
    scheduledDate: '1 Dec 2025',
    scheduledTime: '9:00 AM',
    address: '321 Whitefield, Bangalore, Karnataka',
    status: 'completed',
    amount: 1200,
    paymentStatus: 'paid',
    createdAt: '2025-11-28T16:45:00Z',
  },
];

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.size.xl,
    fontWeight: TYPOGRAPHY.weight.bold,
    color: COLORS.text,
  },
  backButtonIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    fontSize: TYPOGRAPHY.size.md,
    fontWeight: TYPOGRAPHY.weight.regular,
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    padding: SPACING.sm,
    gap: SPACING.xs,
  },
  errorText: {
    fontSize: TYPOGRAPHY.size.sm,
    color: '#F44336',
    flex: 1,
  },
  statsContainer: {
    padding: SPACING.md,
  },
  statsGradient: {
    flexDirection: 'row',
    padding: SPACING.lg,
    borderRadius: RADIUS.large,
    alignItems: 'center',
    justifyContent: 'space-around',
    ...SHADOWS.md,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: SPACING.xs,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  filtersContainer: {
    maxHeight: 60,
  },
  filtersContent: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
  },
  filterChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    backgroundColor: '#FFFFFF',
    marginRight: SPACING.sm,
    ...SHADOWS.sm,
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
  },
  filterChipText: {
    fontSize: TYPOGRAPHY.size.sm,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: Platform.OS === 'ios' ? 100 : 80,
  },
  bookingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.large,
    padding: SPACING.md,
    paddingLeft: SPACING.md + 4,
    marginBottom: SPACING.md,
    position: 'relative',
    overflow: 'hidden',
    ...SHADOWS.md,
  },
  statusBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    borderTopLeftRadius: RADIUS.large,
    borderBottomLeftRadius: RADIUS.large,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  customerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  customerAvatar: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.full,
    backgroundColor: '#E8EFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  customerInitial: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.primary,
  },
  customerDetails: {
    flex: 1,
  },
  customerName: {
    fontSize: TYPOGRAPHY.size.lg,
    fontWeight: TYPOGRAPHY.weight.semibold,
    marginBottom: 2,
  },
  customerPhone: {
    fontSize: TYPOGRAPHY.size.sm,
    color: COLORS.textSecondary,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
    borderRadius: RADIUS.small,
    gap: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  serviceInfo: {
    marginBottom: SPACING.sm,
    gap: SPACING.xs,
  },
  serviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  serviceText: {
    fontSize: TYPOGRAPHY.size.md,
    fontWeight: '600',
    flex: 1,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.xs,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    flex: 1,
  },
  addressText: {
    fontSize: TYPOGRAPHY.size.sm,
    color: COLORS.textSecondary,
    flex: 1,
  },
  navigateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.medium,
    gap: 4,
  },
  navigateText: {
    fontSize: TYPOGRAPHY.size.xs,
    fontWeight: '600',
    color: COLORS.white,
  },
  dateTimeRow: {
    flexDirection: 'row',
    marginBottom: SPACING.sm,
    gap: SPACING.md,
  },
  dateTimeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateTimeText: {
    fontSize: TYPOGRAPHY.size.sm,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    marginBottom: SPACING.sm,
  },
  amountLabel: {
    fontSize: TYPOGRAPHY.size.md,
    color: COLORS.textSecondary,
  },
  amountValue: {
    fontSize: TYPOGRAPHY.size.xl,
    fontWeight: TYPOGRAPHY.weight.bold,
    color: COLORS.primary,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.medium,
    gap: 6,
  },
  rejectButton: {
    backgroundColor: '#FFEBEE',
  },
  rejectButtonText: {
    fontSize: TYPOGRAPHY.size.md,
    fontWeight: '600',
    color: '#F44336',
  },
  acceptButton: {
    backgroundColor: COLORS.primary,
  },
  acceptButtonText: {
    fontSize: TYPOGRAPHY.size.md,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  startButton: {
    marginTop: SPACING.sm,
    borderRadius: RADIUS.medium,
    overflow: 'hidden',
  },
  gradientButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
    gap: 8,
  },
  startButtonText: {
    fontSize: TYPOGRAPHY.size.md,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxl * 2,
  },
  emptyTitle: {
    fontSize: TYPOGRAPHY.size.xl,
    fontWeight: TYPOGRAPHY.weight.bold,
    marginTop: SPACING.md,
    marginBottom: SPACING.xs,
  },
  emptySubtitle: {
    fontSize: TYPOGRAPHY.size.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});
