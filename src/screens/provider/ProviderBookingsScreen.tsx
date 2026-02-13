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
  Dimensions,
  Switch, // Added
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import LottieView from 'lottie-react-native';
import { useNavigation } from '@react-navigation/native';
import { apiService } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { COLORS, SPACING, RADIUS, SHADOWS, GRADIENTS, TYPOGRAPHY } from '../../utils/theme';
import { OTPInputModal } from '../../components/OTPInputModal';
import { JobTimer } from '../../components/JobTimer';

const { width } = Dimensions.get('window');

// ==============================================
// 💎 MODERN SLEEK THEME
// ==============================================
const BG_COLOR = COLORS.background; // #F6F8FC Cool Gray
const CARD_BG = COLORS.cardBg; // #FFFFFF

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
  escrowDetails?: { initialAmount?: number; completionAmount?: number };
  notes?: string;
  createdAt: string;
  sortableDate?: number;
  customerAvatar?: string;
  jobSession?: { startTime: string; expectedDuration: number; status: string };
}

type FilterStatus = 'all' | 'pending' | 'accepted' | 'in_progress' | 'completed' | 'rejected';

export const ProviderBookingsScreen = () => {
  const navigation = useNavigation();
  const { user, updateUser } = useAuth(); // Added updateUser

  // State
  const [bookings, setBookings] = useState<ProviderBooking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<ProviderBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterStatus>('all');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Modals
  const [navModalVisible, setNavModalVisible] = useState(false);
  const [selectedBookingForNav, setSelectedBookingForNav] = useState<ProviderBooking | null>(null);
  const [otpModalVisible, setOtpModalVisible] = useState(false);
  const [otpModalTitle, setOtpModalTitle] = useState('');
  const [otpModalSubtitle, setOtpModalSubtitle] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [currentBookingId, setCurrentBookingId] = useState<string | null>(null);
  const [currentJobSessionId, setCurrentJobSessionId] = useState<string | null>(null);
  const [otpAction, setOtpAction] = useState<'start' | 'end' | null>(null);
  const [jobSessions, setJobSessions] = useState<{ [bookingId: string]: any }>({});

  // Availability State
  const [isAvailable, setIsAvailable] = useState(true); // Default online
  const [isToggling, setIsToggling] = useState(false);

  useEffect(() => {
    fetchBookings();
    // Initialize availability from user status if available
    if (user?.status) {
      setIsAvailable(user.status === 'active');
    }
  }, []);
  useEffect(() => { filterBookings(); }, [activeFilter, bookings]);

  // Data Fetching
  const fetchBookings = async () => {
    try {
      setError(null);
      const response: any = await apiService.getProviderRequests(user?._id || user?.id, user?.email);
      if (response.success) {
        const formatDate = (dateStr: string) => {
          if (!dateStr || dateStr === 'N/A') return 'N/A';
          try { return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }); }
          catch { return dateStr; }
        };
        const getTimestamp = (dateStr: string) => { try { return new Date(dateStr).getTime(); } catch { return 0; } };
        const mapBooking = (b: any, statusOverride?: string) => ({
          id: b._id || b.id, customerName: b.customerName, customerPhone: b.customerPhone,
          serviceName: b.serviceName, serviceCategory: b.serviceCategory,
          scheduledDate: formatDate(b.bookingDate || b.scheduledDate),
          scheduledTime: b.bookingTime || b.scheduledTime || 'N/A',
          address: b.customerAddress || b.address || 'N/A',
          latitude: b.latitude, longitude: b.longitude,
          status: statusOverride || (b.status === 'pending_end' ? 'in_progress' : b.status) || 'pending',
          amount: b.totalPrice || b.basePrice || b.amount || 0,
          paymentStatus: b.paymentStatus || 'pending', paymentMethod: b.paymentMethod || 'cash',
          walletPaymentStage: b.walletPaymentStage || null, escrowDetails: b.escrowDetails || null,
          notes: b.notes || '', createdAt: b.createdAt || new Date().toISOString(),
          sortableDate: getTimestamp(b.bookingDate || b.scheduledDate),
          customerAvatar: b.customerAvatar || null, jobSession: b.jobSession || null,
        });

        const all = [...(response.pendingRequests || []).map((b: any) => mapBooking(b, 'pending')), ...(response.acceptedBookings || []).map((b: any) => mapBooking(b))];
        const unique = Array.from(new Map(all.map(b => [b.id, b])).values());
        setBookings(unique);

        const sessions: any = {};
        (response.acceptedBookings || []).forEach((b: any) => { if (b.jobSession) sessions[b._id || b.id] = b.jobSession; });
        if (Object.keys(sessions).length > 0) setJobSessions(prev => ({ ...prev, ...sessions }));
      }
    } catch { setError('Failed to load'); }
    finally { setIsLoading(false); setIsRefreshing(false); }
  };

  const filterBookings = () => {
    const list = activeFilter === 'all'
      ? bookings.filter(b => b.status !== 'rejected' && b.status !== 'cancelled')
      : activeFilter === 'rejected'
        ? bookings.filter(b => b.status === 'rejected' || b.status === 'cancelled')
        : bookings.filter(b => b.status === activeFilter);

    // Sort
    const sorted = list.sort((a, b) => {
      if (a.status === 'in_progress' && b.status !== 'in_progress') return -1;
      if (b.status === 'in_progress' && a.status !== 'in_progress') return 1;
      return (b.sortableDate || 0) - (a.sortableDate || 0);
    });
    setFilteredBookings(sorted);
  };

  const onRefresh = () => { setIsRefreshing(true); fetchBookings(); };

  // Handlers
  const handleAcceptBooking = async (id: string) => {
    setActionLoadingId(id);
    const userId = user?._id || user?.id || '';
    try { const r = await apiService.acceptBooking(id, userId, user?.name); if (r.success) fetchBookings(); } catch { Alert.alert('Error', 'Failed to accept'); } finally { setActionLoadingId(null); }
  };
  const handleRejectBooking = async (id: string) => {
    setActionLoadingId(id);
    const userId = user?._id || user?.id || '';
    try { const r = await apiService.rejectBooking(id, userId); if (r.success) fetchBookings(); } catch { Alert.alert('Error', 'Failed to reject'); } finally { setActionLoadingId(null); }
  };
  const handleStatusChange = async (id: string, status: string) => {
    const userId = user?._id || user?.id || '';
    if (status === 'accepted') await handleAcceptBooking(id);
    else if (status === 'cancelled') await handleRejectBooking(id);
    else { setActionLoadingId(id); try { const r = await apiService.updateBookingStatus(id, status as any, userId); if (r.success) fetchBookings(); } catch { } finally { setActionLoadingId(null); } }
  };
  const openLocationNavigation = (booking: ProviderBooking) => {
    if (!booking.latitude) { Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(booking.address)}`); return; }
    setSelectedBookingForNav(booking); setNavModalVisible(true);
  };
  const handleNavigationAppSelect = async (appName: 'google' | 'uber' | 'ola' | 'rapido') => {
    if (!selectedBookingForNav?.latitude) return;
    const { latitude, longitude } = selectedBookingForNav;
    let url = '';
    switch (appName) {
      case 'google': url = Platform.select({ ios: `maps://app?daddr=${latitude},${longitude}`, android: `google.navigation:q=${latitude},${longitude}` }) || `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`; break;
      case 'uber': url = `uber://?action=setPickup&pickup=my_location&dropoff[latitude]=${latitude}&dropoff[longitude]=${longitude}`; break;
      case 'ola': url = `ola://app/launch?lat=${latitude}&lng=${longitude}`; break;
      case 'rapido': url = `rapido://destination?lat=${latitude}&lng=${longitude}`; break;
    }
    setNavModalVisible(false);
    if (url) Linking.openURL(url).catch(() => Alert.alert('Error', 'Could not open app'));
  };
  const handleStartJob = async (id: string) => {
    const userId = user?._id || user?.id || '';
    try {
      const r = await apiService.generateStartOTP(id, userId);
      if (r.success && r.data) { // Ensure r.data exists
        setCurrentBookingId(id);
        setCurrentJobSessionId(r.data.jobSessionId);
        setOtpAction('start');
        setOtpModalTitle('Start Job');
        setOtpModalSubtitle('Enter Customer OTP');
        setOtpModalVisible(true);
      }
    } catch (e: any) { Alert.alert('Error', e.message); }
  };
  const handleEndJob = async (id: string) => {
    const userId = user?._id || user?.id || '';
    try { const s = jobSessions[id]; if (!s?._id) return; const r = await apiService.generateEndOTP(s._id, userId); if (r.success) { setCurrentBookingId(id); setCurrentJobSessionId(s._id); setOtpAction('end'); setOtpModalTitle('Complete Job'); setOtpModalSubtitle('Enter Completion OTP'); setOtpModalVisible(true); } } catch (e: any) { Alert.alert('Error', e.message); }
  };
  const handleOTPSubmit = async (otp: string) => {
    if (!currentJobSessionId || !otpAction || !currentBookingId) return;
    setOtpLoading(true);
    try {
      const userId = user?._id || user?.id || '';
      if (otpAction === 'start') {
        const r = await apiService.verifyStartOTP(currentJobSessionId, otp, userId);
        if (r.success) {
          setJobSessions(p => ({
            ...p,
            [currentBookingId]: {
              _id: currentJobSessionId,
              startTime: r.data?.startTime,
              expectedDuration: r.data?.expectedDuration,
              status: 'in_progress'
            }
          }));
          setOtpModalVisible(false);
          fetchBookings();
          Alert.alert('Success', 'Job Started');
        }
      } else {
        const r = await apiService.verifyEndOTP(currentJobSessionId, otp, userId);
        if (r.success) {
          setJobSessions(p => { const n = { ...p }; delete n[currentBookingId]; return n; });
          setOtpModalVisible(false);
          fetchBookings();
          const earned = (r.data as any)?.totalAmount || 0;
          Alert.alert('Job Completed', `Earned: ₹${earned}`);
        }
      }
    } catch (e: any) { setOtpError(e.message || 'Invalid OTP'); } finally { setOtpLoading(false); }
  };
  const handleCloseOTPModal = () => { setOtpModalVisible(false); setOtpError(null); setCurrentBookingId(null); setCurrentJobSessionId(null); setOtpAction(null); };

  // Availability Handler
  const toggleAvailability = async () => {
    if (isToggling) return;
    setIsToggling(true);
    const newStatus = !isAvailable;

    // Optimistic update
    setIsAvailable(newStatus);

    try {
      const userId = user?._id || user?.id || '';
      if (!userId) throw new Error('User ID not found');

      const r = await apiService.updateProviderAvailability(newStatus, userId);
      if (!r.success) {
        // Revert on failure
        setIsAvailable(!newStatus);
        Alert.alert('Error', 'Failed to update status');
      } else {
        // Success - Update global context with FULL returned profile (includes cleared services if offline)
        // r.data contains the updated provider profile
        const updatedProfile = r.data || (r as any).user || (r as any).provider;
        if (updatedProfile) {
          updateUser(updatedProfile);
        } else {
          // Fallback status update if full profile missing
          updateUser({ status: newStatus ? 'active' : 'inactive' });
        }
      }
    } catch (e) {
      setIsAvailable(!newStatus);
      Alert.alert('Error', 'Failed to update status');
    } finally {
      setIsToggling(false);
    }
  };

  // ==============================================
  // 🏷️ RENDERERS - Sleek & Modern
  // ==============================================

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return COLORS.warning;
      case 'accepted': return COLORS.primary;
      case 'in_progress': return COLORS.info;
      case 'awaiting_completion_payment': return '#F97316'; // Orange - waiting for member payment
      case 'completed': return COLORS.success;
      case 'cancelled':
      case 'rejected': return COLORS.error;
      default: return COLORS.textSecondary;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'New Request';
      case 'accepted': return 'Scheduled';
      case 'in_progress': return 'In Progress';
      case 'awaiting_completion_payment': return 'Awaiting Payment';
      case 'completed': return 'Completed';
      case 'rejected': return 'Rejected';
      case 'cancelled': return 'Cancelled';
      default: return status;
    }
  };

  const renderFilter = (label: string, value: FilterStatus, count: number) => {
    const isActive = activeFilter === value;
    return (
      <TouchableOpacity
        onPress={() => setActiveFilter(value)}
        activeOpacity={0.8}
        style={[styles.filterPill, isActive && styles.filterPillActiveBackground]} // Added background logic
      >
        {isActive ? (
          <LinearGradient
            colors={GRADIENTS.primary}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />
        ) : null}

        <Text style={[styles.filterText, isActive && styles.filterTextActive]}>{label}</Text>
        {count > 0 && (
          <View style={[
            styles.filterBadge,
            isActive ? styles.filterBadgeActive : styles.filterBadgeInactive
          ]}>
            <Text style={[
              styles.filterBadgeText,
              isActive ? styles.filterBadgeTextActive : styles.filterBadgeTextInactive
            ]}>{count}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderBookingCard = (item: ProviderBooking, index: number) => {
    const statusColor = getStatusColor(item.status);
    const isPending = item.status === 'pending';
    const isAccepted = item.status === 'accepted';
    const isInProgress = item.status === 'in_progress';
    const session = jobSessions[item.id] || item.jobSession;

    return (
      <View key={item.id} style={styles.card}>

          {/* Card Header Area */}
          <View style={styles.cardHeader}>
            <View style={styles.headerLeft}>
              <View style={[styles.iconBox, { backgroundColor: `${COLORS.primary}10` }]}>
                <Ionicons name="briefcase" size={20} color={COLORS.primary} />
              </View>
              <View>
                <Text style={styles.serviceName}>{item.serviceName}</Text>
                <Text style={styles.serviceCategory}>{item.serviceCategory}</Text>
              </View>
            </View>
            {/* Status Badge - Sleek Pill */}
            <View style={[styles.statusPill, { backgroundColor: `${statusColor}10` }]}>
              <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
              <Text style={[styles.statusText, { color: statusColor }]}>{getStatusLabel(item.status)}</Text>
            </View>
          </View>

          {/* Divider with spacing */}
          <View style={styles.divider} />

          {/* Details Grid - More Spacious */}
          <View style={styles.detailsGrid}>

            {/* Date */}
            <View style={styles.detailItem}>
              <View style={styles.detailIconBox}>
                <Ionicons name="calendar-outline" size={16} color={COLORS.textSecondary} />
              </View>
              <View>
                <Text style={styles.detailLabel}>Date & Time</Text>
                <Text style={styles.detailValue}>{item.scheduledDate} • {item.scheduledTime}</Text>
              </View>
            </View>

            {/* Location */}
            <View style={styles.detailItem}>
              <View style={styles.detailIconBox}>
                <Ionicons name="location-outline" size={16} color={COLORS.textSecondary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.detailLabel}>Location</Text>
                <Text style={styles.detailValue} numberOfLines={1}>{item.address}</Text>
              </View>
            </View>

            {/* Price - Highlighted */}
            <View style={styles.detailItem}>
              <View style={styles.detailIconBox}>
                <Ionicons name="wallet-outline" size={16} color={COLORS.textSecondary} />
              </View>
              <View>
                <Text style={styles.detailLabel}>Earning</Text>
                <Text style={styles.priceValue}>₹{item.amount}</Text>
              </View>
            </View>

          </View>

          {/* Timer active state */}
          {(isAccepted || isInProgress) && session?.startTime && (
            <View style={styles.timerWrapper}>
              <JobTimer startTime={new Date(session.startTime)} expectedDuration={session.expectedDuration || 60} variant="compact" />
            </View>
          )}

          {/* Footer Actions */}
          {(isPending || isAccepted || isInProgress) && (
            <View style={styles.footerActions}>
              {isPending && (
                <>
                  <TouchableOpacity style={styles.actionBtnOutline} onPress={() => handleStatusChange(item.id, 'cancelled')}>
                    <Text style={styles.actionBtnTextOutline}>Decline</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionBtnPrimary} onPress={() => handleStatusChange(item.id, 'accepted')}>
                    <LinearGradient colors={GRADIENTS.primary} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
                    <Text style={styles.actionBtnTextPrimary}>Accept Request</Text>
                  </TouchableOpacity>
                </>
              )}
              {isAccepted && (
                <>
                  <TouchableOpacity style={styles.actionBtnOutline} onPress={() => openLocationNavigation(item)}>
                    <Ionicons name="navigate" size={16} color={COLORS.primary} style={{ marginRight: 6 }} />
                    <Text style={[styles.actionBtnTextOutline, { color: COLORS.primary }]}>Navigate</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionBtnPrimary} onPress={() => handleStartJob(item.id)}>
                    <LinearGradient colors={GRADIENTS.primary} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
                    <Ionicons name="play" size={16} color="#FFF" style={{ marginRight: 6 }} />
                    <Text style={styles.actionBtnTextPrimary}>Start</Text>
                  </TouchableOpacity>
                </>
              )}
              {isInProgress && (
                <TouchableOpacity style={styles.actionBtnFull} onPress={() => handleEndJob(item.id)}>
                  <LinearGradient colors={['#8B5CF6', '#7C3AED']} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
                  <Ionicons name="checkmark-done" size={20} color="#FFF" style={{ marginRight: 8 }} />
                  <Text style={styles.actionBtnTextPrimary}>Complete Job</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Customer Mini Bar (Bottom) */}
          <View style={styles.customerBar}>
            <View style={styles.customerRow}>
              {item.customerAvatar ? (
                <Image source={{ uri: item.customerAvatar }} style={styles.miniAvatar} />
              ) : (
                <View style={styles.avatarPlaceholderMini}>
                  <Text style={styles.avatarTextMini}>{item.customerName.charAt(0)}</Text>
                </View>
              )}
              <Text style={styles.customerNameMini}>{item.customerName}</Text>
            </View>
            <TouchableOpacity onPress={() => Linking.openURL(`tel:${item.customerPhone}`)} style={styles.callBtnMini}>
              <Ionicons name="call" size={14} color={COLORS.primary} />
            </TouchableOpacity>
          </View>

        </View>
    );
  };


  // Count Helpers
  const counts = {
    all: bookings.filter(b => b.status !== 'rejected' && b.status !== 'cancelled').length,
    pending: bookings.filter(b => b.status === 'pending').length,
    accepted: bookings.filter(b => b.status === 'accepted').length,
    in_progress: bookings.filter(b => b.status === 'in_progress').length,
    completed: bookings.filter(b => b.status === 'completed').length,
    rejected: bookings.filter(b => b.status === 'rejected' || b.status === 'cancelled').length,
  };


  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={BG_COLOR} />

      {/* Header Matches Dashboard/Profile */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Bookings</Text>

        {/* Availability Switch */}
        <View style={styles.headerRight}>
          <Text style={[styles.statusLabel, { color: isAvailable ? COLORS.success : COLORS.textTertiary }]}>
            {isAvailable ? 'Online' : 'Offline'}
          </Text>
          <Switch
            trackColor={{ false: COLORS.gray200, true: COLORS.success }}
            thumbColor={'#FFFFFF'}
            ios_backgroundColor={COLORS.gray200}
            onValueChange={toggleAvailability}
            value={isAvailable}
            disabled={isToggling}
            style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
          />
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filtersWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {renderFilter('All', 'all', counts.all)}
          {renderFilter('New', 'pending', counts.pending)}
          {renderFilter('Upcoming', 'accepted', counts.accepted)}
          {renderFilter('Active', 'in_progress', counts.in_progress)}
          {renderFilter('History', 'completed', counts.completed)}
          {renderFilter('Cancelled', 'rejected', counts.rejected)}
        </ScrollView>
      </View>

      {/* List */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <View style={styles.center}>
            <LottieView source={require('../../../assets/lottie/loading.json')} autoPlay loop style={{ width: 120, height: 120 }} />
          </View>
        ) : filteredBookings.length === 0 ? (
          <View style={styles.center}>
            <View style={styles.emptyIcon}><Ionicons name="calendar-outline" size={40} color={COLORS.textTertiary} /></View>
            <Text style={styles.emptyText}>No bookings found</Text>
            <Text style={styles.emptySub}>Your scheduled jobs will appear here</Text>
          </View>
        ) : (
          filteredBookings.map((b, i) => renderBookingCard(b, i))
        )}
      </ScrollView>

      {/* Navigation Modal */}
      <Modal visible={navModalVisible} transparent animationType="slide" onRequestClose={() => setNavModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Navigate to Customer</Text>
            {[{ k: 'google', l: 'Google Maps', c: '#34A853' }, { k: 'uber', l: 'Uber', c: '#000' }, { k: 'ola', l: 'Ola', c: '#b2d235' }, { k: 'rapido', l: 'Rapido', c: '#f9c933' }].map((o: any) => (
              <TouchableOpacity key={o.k} style={styles.modalOption} onPress={() => handleNavigationAppSelect(o.k)}>
                <View style={[styles.modalIconBox, { backgroundColor: `${o.c}10` }]}>
                  <Ionicons name={o.k === 'google' ? 'map' : 'car'} size={22} color={o.c} />
                </View>
                <Text style={styles.modalOptionText}>{o.l}</Text>
                <Ionicons name="chevron-forward" size={18} color={COLORS.textTertiary} />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>

      <OTPInputModal visible={otpModalVisible} onClose={handleCloseOTPModal} onSubmit={handleOTPSubmit} title={otpModalTitle} subtitle={otpModalSubtitle} isLoading={otpLoading} error={otpError} />

    </SafeAreaView>
  );
};

// ==============================================
// 🖌️ STYLES (Sleek & Professional)
// ==============================================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG_COLOR },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md, backgroundColor: BG_COLOR
  },
  headerTitle: { fontSize: 22, fontWeight: '700', color: COLORS.text, letterSpacing: -0.5 },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-start' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusLabel: { fontSize: 12, fontWeight: '600' },

  // Filters
  filtersWrapper: { paddingVertical: SPACING.md, backgroundColor: BG_COLOR },
  filterScroll: { paddingHorizontal: SPACING.lg, gap: 10 },
  filterPill: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 24,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden', // Contain gradient
    // Subtle shadow for unselected
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 4, elevation: 1
  },
  filterPillActiveBackground: {
    backgroundColor: COLORS.primary, // Fallback/Base
    borderWidth: 0,
    elevation: 4, shadowOpacity: 0.15, shadowColor: COLORS.primary
  },
  filterText: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary },
  filterTextActive: { color: '#FFF' },

  filterBadge: { marginLeft: 6, backgroundColor: COLORS.gray100, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
  filterBadgeActive: { backgroundColor: 'rgba(255,255,255,0.25)' },
  filterBadgeInactive: { backgroundColor: COLORS.gray100 },
  filterBadgeText: { fontSize: 10, fontWeight: '700' },
  filterBadgeTextActive: { color: '#FFF' },
  filterBadgeTextInactive: { color: COLORS.textSecondary },

  // Content
  content: { flex: 1, paddingHorizontal: SPACING.lg },
  center: { alignItems: 'center', justifyContent: 'center', marginTop: 100 },
  emptyIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.gray100, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  emptyText: { fontSize: 18, fontWeight: '700', color: COLORS.text, marginBottom: 4 },
  emptySub: { fontSize: 14, color: COLORS.textSecondary },

  // Card
  card: {
    backgroundColor: CARD_BG, borderRadius: 24, marginBottom: 20,
    shadowColor: '#64748B', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.08, shadowRadius: 16, elevation: 4,
    padding: 0, overflow: 'hidden'
  },

  // Card Header
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, paddingTop: 20, paddingBottom: 16 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  iconBox: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  serviceName: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: 2 },
  serviceCategory: { fontSize: 12, color: COLORS.textSecondary },

  statusPill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, gap: 6 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },

  divider: { height: 1, backgroundColor: COLORS.divider, marginHorizontal: 20 },

  // Details Grid
  detailsGrid: { padding: 20, gap: 16 },
  detailItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  detailIconBox: { width: 32, height: 32, borderRadius: 10, backgroundColor: COLORS.gray50, justifyContent: 'center', alignItems: 'center' },
  detailLabel: { fontSize: 11, color: COLORS.textTertiary, marginBottom: 2, textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: '600' },
  detailValue: { fontSize: 14, color: COLORS.text, fontWeight: '600' },
  priceValue: { fontSize: 16, color: COLORS.primary, fontWeight: '700' },

  timerWrapper: { paddingHorizontal: 20, paddingBottom: 16 },

  // Actions
  footerActions: { flexDirection: 'row', gap: 12, paddingHorizontal: 20, paddingBottom: 20 },
  actionBtnOutline: { flex: 1, height: 46, borderRadius: 14, borderWidth: 1, borderColor: COLORS.border, justifyContent: 'center', alignItems: 'center', flexDirection: 'row' },
  actionBtnPrimary: { flex: 1.5, height: 46, borderRadius: 14, overflow: 'hidden', justifyContent: 'center', alignItems: 'center', flexDirection: 'row' },
  actionBtnFull: { flex: 1, height: 48, borderRadius: 14, overflow: 'hidden', justifyContent: 'center', alignItems: 'center', flexDirection: 'row' },

  actionBtnTextOutline: { fontSize: 14, fontWeight: '600', color: COLORS.error },
  actionBtnTextPrimary: { fontSize: 14, fontWeight: '700', color: '#FFF' },

  // Customer Bar (Bottom)
  customerBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, backgroundColor: COLORS.gray50, borderTopWidth: 1, borderTopColor: COLORS.divider },
  customerRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  miniAvatar: { width: 28, height: 28, borderRadius: 14 },
  avatarPlaceholderMini: { width: 28, height: 28, borderRadius: 14, backgroundColor: COLORS.gray200, justifyContent: 'center', alignItems: 'center' },
  avatarTextMini: { fontSize: 12, fontWeight: '700', color: COLORS.textSecondary },
  customerNameMini: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary },
  callBtnMini: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.6)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: '#FFF', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 40 },
  modalHandle: { width: 40, height: 4, backgroundColor: COLORS.gray200, borderRadius: 2, alignSelf: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: COLORS.text, marginBottom: 20 },
  modalOption: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: COLORS.divider },
  modalIconBox: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  modalOptionText: { flex: 1, fontSize: 16, fontWeight: '600', color: COLORS.text },
});
