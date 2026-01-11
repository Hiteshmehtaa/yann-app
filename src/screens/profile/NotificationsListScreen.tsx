import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Clipboard, Alert, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS, SHADOWS } from '../../utils/theme';
import { EmptyState } from '../../components/EmptyState';
import { useNotifications, AppNotification } from '../../contexts/NotificationContext';

// Animated Item Component
const AnimatedNotificationItem = ({ children, index }: { children: React.ReactNode, index: number }) => {
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(20)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        delay: index * 50,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 50,
        delay: index * 50,
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

export const NotificationsListScreen = () => {
  const navigation = useNavigation<any>();
  const { notifications, markAsRead, refreshNotifications } = useNotifications();
  const { user } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const onRefresh = async () => {
    setIsRefreshing(true);
    await refreshNotifications();
    setIsRefreshing(false);
  };

  const copyOTP = (otp: string) => {
    Clipboard.setString(otp);
    Alert.alert('Copied!', 'OTP copied to clipboard');
  };

  const handleNotificationPress = (notification: AppNotification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }

    const isBookingNotification = [
      'booking_accepted',
      'booking_rejected',
      'booking_completed',
      'otp_start',
      'otp_end'
    ].includes(notification.type) || !!notification.bookingId;

    if (isBookingNotification) {
      if (user?.role === 'provider') {
        navigation.navigate('ProviderTabs', { screen: 'ProviderBookings' });
      } else {
        navigation.navigate('MainTabs', { screen: 'BookingsList' });
      }
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'otp_start':
      case 'otp_end': return 'lock-closed';
      case 'booking_accepted': return 'checkmark-circle';
      case 'booking_rejected': return 'close-circle';
      case 'booking_completed': return 'checkmark-done-circle';
      default: return 'notifications';
    }
  };

  const getNotificationColor = (type: string): [string, string] => {
    switch (type) {
      case 'otp_start':
      case 'otp_end': return [COLORS.primary, COLORS.primaryGradientEnd];
      case 'booking_accepted': return ['#10B981', '#059669'];
      case 'booking_rejected': return ['#EF4444', '#DC2626'];
      case 'booking_completed': return ['#8B5CF6', '#7C3AED'];
      default: return ['#6B7280', '#4B5563'];
    }
  };

  const formatTimestamp = (timestamp: string | Date) => {
    const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString();
  };

  const renderNotification = (notification: AppNotification, index: number) => {
    const colors = getNotificationColor(notification.type);
    const icon = getNotificationIcon(notification.type);
    const isRead = notification.read;

    return (
      <AnimatedNotificationItem key={notification.id} index={index}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => handleNotificationPress(notification)}
          style={[
            styles.notificationItem,
            !isRead && styles.notificationItemUnread
          ]}
        >
          <View style={styles.leftSection}>
            <View style={[styles.iconBox, !isRead && { backgroundColor: colors[0] + '15' }]}>
              <Ionicons
                name={icon as any}
                size={20}
                color={!isRead ? colors[0] : COLORS.textTertiary}
              />
            </View>
          </View>

          <View style={styles.rightSection}>
            <View style={styles.headerRow}>
              <Text style={[styles.title, !isRead && styles.titleUnread]} numberOfLines={1}>
                {notification.title}
              </Text>
              <Text style={styles.timeText}>{formatTimestamp(notification.timestamp)}</Text>
            </View>

            <Text style={styles.messageText} numberOfLines={2}>
              {notification.message}
            </Text>

            {notification.otp && (
              <View style={styles.otpContainer}>
                <View>
                  <Text style={styles.otpLabel}>
                    {notification.type === 'otp_start' ? 'Start Code' : 'End Code'}
                  </Text>
                  <Text style={[styles.otpValue, { color: colors[0] }]}>{notification.otp}</Text>
                </View>
                <TouchableOpacity
                  style={[styles.copyButton, { backgroundColor: '#F1F5F9' }]}
                  onPress={() => copyOTP(notification.otp!)}
                >
                  <Ionicons name="copy-outline" size={14} color="#64748B" />
                  <Text style={[styles.copyText, { color: '#64748B' }]}>Copy</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {!isRead && <View style={[styles.unreadDot, { backgroundColor: colors[0] }]} />}
        </TouchableOpacity>
      </AnimatedNotificationItem>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
      >
        {notifications.length === 0 ? (
          <View style={styles.emptyState}>
            <EmptyState
              title="All Caught Up"
              subtitle="No new notifications at the moment."
            />
          </View>
        ) : (
          notifications.map((n, i) => renderNotification(n, i))
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

// Clean Minimal Styles
const styles = StyleSheet.create({
  container: {
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

  scrollView: { flex: 1 },
  scrollContent: { paddingTop: 12, paddingHorizontal: 16 },
  emptyState: { marginTop: 100, alignItems: 'center' },

  // Notification Item
  notificationItem: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 16,
    backgroundColor: 'transparent', // Default transparent (read)
    marginBottom: 8,
  },
  notificationItemUnread: {
    backgroundColor: COLORS.white,
    ...SHADOWS.sm,
    shadowColor: '#64748B',
    shadowOpacity: 0.05,
    borderWidth: 1,
    borderColor: 'transparent',
  },

  leftSection: { marginRight: 12 },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },

  rightSection: { flex: 1 },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 15,
    fontWeight: '500',
    color: '#64748B', // Read color
    flex: 1,
    marginRight: 8,
  },
  titleUnread: {
    fontWeight: '700',
    color: '#0F172A',
  },
  timeText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
  },
  messageText: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
  },

  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    position: 'absolute',
    top: 16,
    right: 16,
  },

  // OTP
  otpContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  otpLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  otpValue: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 2,
    marginTop: 2,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  copyText: {
    fontSize: 11,
    fontWeight: '600',
  },
});
