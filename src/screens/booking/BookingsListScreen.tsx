import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  StatusBar,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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
import { EmptyStateAnimation } from '../../components/animations';
import { EmptyState } from '../../components/EmptyState';
import { TabBar } from '../../components/ui/TabBar';
import { CountdownTimer } from '../../components/ui/CountdownTimer';

// Gradient presets for status
const STATUS_GRADIENTS: Record<string, readonly [string, string]> = {
  accepted: ['#10B981', '#059669'],
  confirmed: ['#10B981', '#059669'],
  active: ['#10B981', '#059669'],
  in_progress: ['#3B82F6', '#2563EB'],
  completed: ['#667eea', '#764ba2'],
  pending: ['#F59E0B', '#D97706'],
  cancelled: ['#EF4444', '#DC2626'],
};

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

const TABS = [
  { key: 'ongoing', label: 'Ongoing' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
];

export const BookingsListScreen: React.FC<Props> = ({ navigation }) => {
  const { isTablet } = useResponsive();
  const { colors, isDark } = useTheme();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('ongoing');

  /**
   * Fetch bookings from backend (like website - GET /api/bookings)
   * This returns all bookings for the authenticated homeowner
   */
  const fetchBookings = async (showLoader = true) => {
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
        setBookings(mappedBookings);
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

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchBookings(false);
  }, []);

  const getStatusStyle = (status: string) => {
    return {
      backgroundColor: STATUS_COLORS[status as keyof typeof STATUS_COLORS] + '15',
    };
  };

  const getStatusTextStyle = (status: string) => {
    return {
      color: STATUS_COLORS[status as keyof typeof STATUS_COLORS],
    };
  };

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
    };

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
    ); // EmptyState needs to handle its own theme inside or be passed colors? EmptyState component usually uses internal styles. Assuming it needs updates if it's external.
       // Actually EmptyState is likely a component using theme internally if updated, or accepts props.
       // Looking at imports: import { EmptyState } from '../../components/EmptyState';
       // We should check that component too.
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <LoadingSpinner visible={true} />
      </SafeAreaView>
    );
  }

  // Filter bookings based on active tab (exclude rejected bookings)
  const filteredBookings = bookings.filter((booking) => {
    const status = booking.status.toLowerCase();
    
    // Never show rejected bookings to members
    if (status === 'rejected') {
      return false;
    }
    
    if (activeTab === 'ongoing') {
      return status === 'pending' || status === 'accepted' || status === 'confirmed' || status === 'active' || status === 'in_progress';
    } else if (activeTab === 'completed') {
      return status === 'completed';
    } else if (activeTab === 'cancelled') {
      return status === 'cancelled';
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
    color: '#FFF',
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
});
