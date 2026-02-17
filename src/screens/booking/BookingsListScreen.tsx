import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  StatusBar,
  Alert,
} from 'react-native';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { apiService } from '../../services/api';
import { STATUS_COLORS } from '../../utils/constants';
import type { Booking } from '../../types';
import { format } from 'date-fns';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { COLORS, SPACING, RADIUS, SHADOWS, ICON_SIZES, TYPOGRAPHY } from '../../utils/theme';
import { useTheme } from '../../contexts/ThemeContext';
import { useResponsive } from '../../hooks/useResponsive';
import { EmptyState } from '../../components/EmptyState';
import { TabBar } from '../../components/ui/TabBar';
import { CountdownTimer } from '../../components/ui/CountdownTimer';
import { RatingModal } from '../../components/RatingModal';
import { storage } from '../../utils/storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useNotifications } from '../../contexts/NotificationContext';
import { useAuth } from '../../contexts/AuthContext';

// Gradient presets for status
const STATUS_GRADIENTS: Record<string, readonly [string, string]> = {
  accepted: [COLORS.success, '#059669'],
  confirmed: [COLORS.success, '#059669'],
  active: [COLORS.success, '#059669'],
  in_progress: [COLORS.primary, COLORS.primaryGradientEnd],
  completed: [COLORS.primaryGradientStart, COLORS.primaryGradientEnd], // Using proper theme gradient structure
  pending: [COLORS.warning, '#D97706'],
  cancelled: [COLORS.error, '#DC2626'],
  rejected: [COLORS.error, '#DC2626'],
};

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

const TABS = [
  { key: 'ongoing', label: 'Ongoing' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
  { key: 'rejected', label: 'Rejected' },
];



export const BookingsListScreen: React.FC<Props> = ({ navigation }) => {
  // Global Notification Context for Payment Modal
  const { setPaymentModalData, paymentModalData } = useNotifications();
  const { isTablet } = useResponsive();
  const { colors, isDark } = useTheme();
  const { isGuest } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('ongoing');
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [selectedBookingForRating, setSelectedBookingForRating] = useState<Booking | null>(null);

  const handleRateBooking = (booking: Booking) => {
    setSelectedBookingForRating(booking);
    setShowRatingModal(true);
  };

  const handleSubmitRating = async (rating: number, comment: string) => {
    if (!selectedBookingForRating) return;

    try {
      console.log('🌟 Submitting review for booking:', selectedBookingForRating._id);

      // Debug: Check if we have a valid token
      const token = await storage.getToken();
      const userData = await storage.getUserData();
      console.log('🔐 Auth check:', {
        hasToken: !!token,
        tokenLength: token?.length,
        hasUser: !!userData,
        userId: userData?.id || userData?._id
      });

      await apiService.createReview({
        bookingId: selectedBookingForRating._id,
        rating,
        comment,
      });

      Alert.alert('Success', 'Thank you for your feedback!');

      // Update local state to mark as rated
      setBookings(prev => prev.map(b =>
        b._id === selectedBookingForRating._id
          ? { ...b, hasBeenRated: true }
          : b
      ));

      setShowRatingModal(false);
      setSelectedBookingForRating(null);
    } catch (error: any) {
      console.error('❌ Review submission error:', error);
      console.error('Error details:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });

      let errorMessage = 'Failed to submit rating';

      if (error.response?.status === 401) {
        errorMessage = 'Your session has expired. Please log out and log in again to submit reviews.';
        console.log('🔐 Session expired - user needs to re-login');
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      Alert.alert('Error', errorMessage);
    }
  };

  /**
   * Fetch bookings from backend (like website - GET /api/bookings)
   * This returns all bookings for the authenticated homeowner
   */
  const fetchBookings = async (showLoader = true) => {
    if (isGuest) {
      setBookings([]);
      setIsLoading(false);
      return;
    }
    if (showLoader) setIsLoading(true);
    try {
      const response = await apiService.getMyBookings();

      if (response.success && response.data) {
        // Map response to ensure consistent format
        const mappedBookings = response.data.map((booking: any) => ({
          ...booking,
          _id: booking._id || booking.id,
          id: booking.id || booking._id,
        }));

        // Deduplicate locally to prevent UI key errors
        const uniqueBookings = Array.from(new Map(mappedBookings.map((b: any) => [b._id, b])).values());

        setBookings(uniqueBookings as Booking[]);
      } else {
        setBookings([]);
      }
    } catch (error: any) {
      setBookings([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Refresh bookings whenever screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchBookings();
    }, [])
  );

  // Auto-show payment modal for newly completed bookings needing payment
  React.useEffect(() => {
    // Prevent interfering if modal is already open
    if (paymentModalData) return;

    const completedBookingNeedingPayment = bookings.find(
      booking =>
        booking.status === 'completed' &&
        (booking.paymentMethod as string) === 'wallet' &&
        (booking as any).walletPaymentStage === 'initial_25_released'
    );

    if (completedBookingNeedingPayment) {
      // Trigger Global Modal instead of local one
      console.log('💸 Triggering Global Payment Modal from List');
      setPaymentModalData({
        type: 'completion',
        bookingId: completedBookingNeedingPayment._id,
        notificationId: 'list-auto-trigger', // Dummy ID
        completionAmount: (completedBookingNeedingPayment as any).escrowDetails?.completionAmount || completedBookingNeedingPayment.totalPrice * 0.75
      });
    }
  }, [bookings, paymentModalData]);

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchBookings(false);
  }, []);

  const renderBookingCard = ({ item }: { item: Booking }) => {
    const formattedDate = item.bookingDate
      ? format(new Date(item.bookingDate), 'EEE, MMM dd')
      : 'N/A';

    // Get provider name from booking data
    const providerName = (item as any).provider?.name || (item as any).providerName || 'Provider';
    const providerInitial = providerName.charAt(0).toUpperCase();

    // Check if booking is upcoming (within next 24 hours)
    const isUpcoming = item.bookingDate && item.bookingTime
      ? (() => {
        const bookingDateTime = new Date(`${item.bookingDate}T${item.bookingTime}`);
        const now = new Date();
        const diff = bookingDateTime.getTime() - now.getTime();
        return diff > 0 && diff < 24 * 60 * 60 * 1000;
      })()
      : false;

    const hasOtp = ((item as any).jobSession?.startOTP || (item as any).jobSession?.endOTP);
    const otpType = ((item as any).jobSession?.endOTP) ? 'end' : 'start';
    const otpValue = ((item as any).jobSession?.endOTP) || ((item as any).jobSession?.startOTP);

    return (
      <TouchableOpacity
        style={[styles.card, { backgroundColor: colors.cardBg }]}
        onPress={() => navigation.navigate('BookingDetail', { booking: item })}
        activeOpacity={0.9}
      >
        <View style={styles.cardMain}>
          {/* Header: Service Name & Price */}
          <View style={styles.cardHeader}>
            <View style={styles.serviceIconFrame}>
              <Ionicons name="briefcase" size={20} color={COLORS.primary} />
            </View>
            <View style={{ flex: 1, paddingHorizontal: 10 }}>
              <Text style={[styles.serviceName, { color: colors.text }]}>{item.serviceName}</Text>
              <Text style={styles.serviceCategoryText}>{item.serviceCategory}</Text>
            </View>
            <Text style={styles.priceValue}>₹{item.totalPrice}</Text>
          </View>

          {/* Divider */}
          <View style={[styles.dashedDivider, { borderColor: colors.divider }]} />

          {/* Info Grid */}
          <View style={styles.infoGrid}>
            <View style={styles.infoCol}>
              <View style={styles.infoRow}>
                <Ionicons name="calendar-clear-outline" size={14} color={COLORS.textSecondary} />
                <Text style={styles.infoText}>{formattedDate}</Text>
              </View>
              <View style={styles.infoRow}>
                <Ionicons name="time-outline" size={14} color={COLORS.textSecondary} />
                <Text style={styles.infoText}>{item.bookingTime}</Text>
              </View>
            </View>

            {/* Status Badge */}
            <View style={[styles.miniStatusBadge, { backgroundColor: STATUS_COLORS[item.status] + '15' }]}>
              <View style={[styles.statusDot, { backgroundColor: STATUS_COLORS[item.status] }]} />
              <Text style={[styles.miniStatusText, { color: STATUS_COLORS[item.status] }]}>
                {item.status.toUpperCase()}
              </Text>
            </View>
          </View>

          {/* Provider Info (Compact) */}
          <View style={styles.providerCompact}>
            <View style={[styles.providerAvatarSmall, { backgroundColor: COLORS.primary + '20' }]}>
              <Text style={{ fontSize: 10, fontWeight: '700', color: COLORS.primary }}>{providerInitial}</Text>
            </View>
            <Text style={[styles.providerNameSmall, { color: colors.textSecondary }]}>Service by {providerName}</Text>
          </View>
        </View>

        {/* Action / OTP Footer */}
        {hasOtp ? (
          <View style={styles.otpFooter}>
            <View style={styles.ticketRips}>
              {Array.from({ length: 15 }).map((_, i) => (
                <View key={i} style={[styles.ripDot, { backgroundColor: colors.background }]} />
              ))}
            </View>
            <View style={[styles.otpStub, { backgroundColor: otpType === 'end' ? '#ECFDF5' : '#EFF6FF' }]}>
              <View>
                <Text style={[styles.otpLabel, { color: otpType === 'end' ? '#059669' : '#1D4ED8' }]}>
                  {otpType === 'end' ? 'COMPLETION CODE' : 'START CODE'}
                </Text>
                <Text style={styles.otpSublabel}>Share with provider</Text>
              </View>
              <Text style={[styles.otpCode, { color: otpType === 'end' ? '#059669' : '#1D4ED8' }]}>
                {otpValue}
              </Text>
            </View>
          </View>
        ) : isUpcoming ? (
          <View style={[styles.countdownFooter, { backgroundColor: COLORS.primary + '08' }]}>
            <Ionicons name="timer-outline" size={14} color={COLORS.primary} />
            <Text style={styles.countdownLabel}>Starting in: </Text>
            <CountdownTimer
              targetDate={new Date(`${item.bookingDate}T${item.bookingTime}`)}
              style={{ fontSize: 12, fontWeight: '700', color: COLORS.primary }}
            />
          </View>
        ) : activeTab === 'completed' && !item.hasBeenRated ? (
          <TouchableOpacity
            style={styles.rateButton}
            onPress={(e) => {
              e.stopPropagation(); // Prevent navigating to detail when clicking rate
              handleRateBooking(item);
            }}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[COLORS.primaryGradientStart, COLORS.primary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.rateButtonGradient}
            >
              <Ionicons name="star" size={16} color={COLORS.white} />
              <Text style={styles.rateButtonText}>Rate Experience</Text>
            </LinearGradient>
          </TouchableOpacity>
        ) : activeTab === 'rejected' ? (
          <View style={[styles.countdownFooter, { backgroundColor: '#FEF2F2' }]}>
            <Ionicons name="information-circle" size={14} color={COLORS.error} />
            <Text style={[styles.countdownLabel, { color: COLORS.error }]}>
              {item.paymentMethod === 'wallet' ? 'Wallet refunded' : 'Booking cancelled'}
            </Text>
          </View>
        ) : null}
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => {
    const emptyMessages = {
      ongoing: {
        title: 'No ongoing bookings',
        subtitle: 'Your active bookings will appear here',
      },
      completed: {
        title: 'No completed bookings',
        subtitle: 'Your completed services will appear here',
      },
      cancelled: {
        title: 'No cancelled bookings',
        subtitle: 'Cancelled bookings will appear here',
      },
      rejected: {
        title: 'No rejected bookings',
        subtitle: 'Bookings declined by partners will appear here',
      },
    };

    if (isGuest) {
      return (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconContainer}>
            <Ionicons name="lock-closed-outline" size={40} color={COLORS.primary} />
          </View>
          <Text style={styles.emptyTitle}>Login Required</Text>
          <Text style={styles.emptyText}>Sign in to view and manage your bookings</Text>
          <TouchableOpacity
            style={styles.browseButton}
            onPress={() => navigation.navigate('Login')}
            activeOpacity={0.8}
          >
            <Text style={styles.browseButtonText}>Sign In</Text>
            <Ionicons name="arrow-forward" size={ICON_SIZES.medium} color={COLORS.white} />
          </TouchableOpacity>
        </View>
      );
    }

    const message = emptyMessages[activeTab as keyof typeof emptyMessages] || {
      title: 'No bookings yet',
      subtitle: 'Your bookings will appear here once you book a service',
    };

    return (
      <View style={styles.emptyContainer}>
        <EmptyState
          title={message.title}
          subtitle={message.subtitle}
        />
        {activeTab === 'ongoing' && (
          <TouchableOpacity
            style={styles.browseButton}
            onPress={() => navigation.navigate('Home')}
            activeOpacity={0.8}
          >
            <Text style={styles.browseButtonText}>Browse services</Text>
            <Ionicons name="arrow-forward" size={ICON_SIZES.medium} color={COLORS.white} />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <LoadingSpinner visible={true} />
      </SafeAreaView>
    );
  }

  // Filter bookings based on active tab
  const filteredBookings = bookings.filter((booking) => {
    const status = booking.status.toLowerCase();

    if (activeTab === 'ongoing') {
      return status === 'pending' || status === 'accepted' || status === 'confirmed' || status === 'active' || status === 'in_progress';
    } else if (activeTab === 'completed') {
      return status === 'completed';
    } else if (activeTab === 'cancelled') {
      return status === 'cancelled';
    } else if (activeTab === 'rejected') {
      return status === 'rejected';
    }
    return true;
  });

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.background} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.cardBg, borderBottomColor: colors.divider }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Bookings</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Tab Bar */}
      <TabBar
        tabs={TABS}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <LoadingSpinner visible={isLoading} />

      {!isLoading && (
        <FlatList
          data={filteredBookings}
          renderItem={renderBookingCard}
          keyExtractor={(item) => item._id}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: isTablet ? 140 : 120 }
          ]}
          bounces={true}
          alwaysBounceVertical={true}
          ListEmptyComponent={renderEmpty}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Rating Modal */}
      <RatingModal
        visible={showRatingModal}
        onClose={() => {
          setShowRatingModal(false);
          setSelectedBookingForRating(null);
        }}
        onSubmit={handleSubmitRating}
        providerName={(selectedBookingForRating as any)?.providerName || 'Provider'}
        serviceName={selectedBookingForRating?.serviceName || 'Service'}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerRight: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.size.xl,
    fontWeight: TYPOGRAPHY.weight.bold,
    color: COLORS.text,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: SPACING.sm,
    fontSize: TYPOGRAPHY.size.sm,
    color: COLORS.textSecondary,
    letterSpacing: 1,
  },
  listContent: {
    padding: SPACING.lg,
    paddingBottom: 120, // Extra padding for floating tab bar
    flexGrow: 1,
  },
  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.large,
    padding: SPACING.lg,
    marginBottom: SPACING.sm,
    ...SHADOWS.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  cardHeaderLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  serviceName: {
    fontSize: TYPOGRAPHY.size.lg,
    fontWeight: '700',
    color: COLORS.text,
  },
  statusBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.small,
  },
  statusText: {
    fontSize: TYPOGRAPHY.size.xs,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  cardBody: {},
  providerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  providerName: {
    fontSize: TYPOGRAPHY.size.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  infoRow: {
    flexDirection: 'row',
    gap: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  infoValue: {
    fontSize: TYPOGRAPHY.size.sm,
    color: COLORS.textSecondary,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
  },
  priceLabel: {
    fontSize: TYPOGRAPHY.size.xs,
    color: COLORS.textSecondary,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  priceValue: {
    fontSize: TYPOGRAPHY.size.xxl,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: -0.5,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xxxl,
    paddingBottom: 80,
  },
  emptyIconContainer: {
    width: 88,
    height: 88,
    borderRadius: RADIUS.xlarge,
    backgroundColor: `${COLORS.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  emptyTitle: {
    fontSize: TYPOGRAPHY.size.xxl,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: SPACING.xs,
    letterSpacing: -0.5,
  },
  emptyText: {
    fontSize: TYPOGRAPHY.size.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.md,
    lineHeight: 22,
  },
  debugText: {
    fontSize: TYPOGRAPHY.size.xs,
    color: COLORS.textTertiary,
    textAlign: 'center',
    marginBottom: SPACING.xxl,
    fontStyle: 'italic',
  },
  browseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.medium,
    paddingHorizontal: SPACING.xxl,
    paddingVertical: SPACING.md,
    gap: SPACING.sm,
    ...SHADOWS.md,
  },
  browseButtonText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.size.sm,
    fontWeight: '700',
    letterSpacing: 1,
  },
  countdownContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: `${COLORS.primary}10`,
    borderRadius: RADIUS.small,
    marginBottom: SPACING.sm,
  },
  countdownText: {
    fontSize: TYPOGRAPHY.size.xs,
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.weight.bold,
  },
  // New gradient status styles
  statusIndicator: {
    position: 'absolute',
    left: 0,
    top: 12,
    bottom: 12,
    width: 4,
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
  },
  cardContent: {
    flex: 1,
    paddingLeft: 8,
  },
  statusBadgeGradient: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusTextWhite: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.white,
    letterSpacing: 0.3,
  },
  // New Booking Card Styles
  cardMain: {
    padding: SPACING.md,
  },
  serviceIconFrame: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: `${COLORS.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceCategoryText: {
    fontSize: TYPOGRAPHY.size.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  dashedDivider: {
    height: 1,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: COLORS.divider,
    borderRadius: 1,
    marginBottom: SPACING.md,
    opacity: 0.5,
  },
  infoGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  infoCol: {
    gap: 8,
  },
  infoText: {
    fontSize: TYPOGRAPHY.size.xs,
    color: COLORS.text,
    fontWeight: '500',
  },
  miniStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  miniStatusText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  providerCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  providerAvatarSmall: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  providerNameSmall: {
    fontSize: 11,
    fontWeight: '500',
  },

  // OTP Stub Styles
  otpFooter: {
    marginTop: 0,
    backgroundColor: 'transparent',
  },
  ticketRips: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    height: 4,
    overflow: 'hidden',
    zIndex: 1,
  },
  ripDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: -4, // half hidden
  },
  otpStub: {
    padding: SPACING.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomLeftRadius: RADIUS.large,
    borderBottomRightRadius: RADIUS.large,
  },
  otpLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 2,
  },
  otpSublabel: {
    fontSize: 10,
    color: COLORS.textTertiary,
  },
  otpCode: {
    fontSize: 20,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
    letterSpacing: 2,
  },

  // Countdown Footer
  countdownFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.sm,
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.03)',
  },
  countdownLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  rateButton: {
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md, // Add bottom margin since it's inside the card
    borderRadius: RADIUS.medium,
    overflow: 'hidden',
    marginTop: SPACING.sm,
  },
  rateButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  rateButtonText: {
    fontSize: TYPOGRAPHY.size.sm,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
