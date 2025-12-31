import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Clipboard,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS, SHADOWS } from '../../utils/theme';
import { EmptyState } from '../../components/EmptyState';
import { useNotifications, AppNotification } from '../../contexts/NotificationContext';

// ... imports remain ... 

export const NotificationsListScreen = () => {
  const navigation = useNavigation();
  const { notifications, markAsRead, refreshNotifications } = useNotifications();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const onRefresh = async () => {
    setIsRefreshing(true);
    await refreshNotifications();
    setIsRefreshing(false);
  };
  
  // No local useEffect for listeners needed as context handles it

  const copyOTP = (otp: string) => {
    Clipboard.setString(otp);
    Alert.alert('Copied!', 'OTP copied to clipboard');
  };

  /* 
     Logic handled by NotificationContext 
  */

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'otp_start':
      case 'otp_end':
        return 'lock-closed';
      case 'booking_accepted':
        return 'checkmark-circle';
      case 'booking_rejected':
        return 'close-circle';
      case 'booking_completed':
        return 'checkmark-done-circle';
      default:
        return 'notifications';
    }
  };

  const getNotificationColor = (type: string): [string, string] => {
    switch (type) {
      case 'otp_start':
      case 'otp_end':
        return [COLORS.primary, COLORS.primaryGradientEnd];
      case 'booking_accepted':
        return ['#10B981', '#059669'];
      case 'booking_rejected':
        return ['#EF4444', '#DC2626'];
      case 'booking_completed':
        return ['#8B5CF6', '#7C3AED'];
      default:
        return ['#6B7280', '#4B5563'];
    }
  };

  const formatTimestamp = (timestamp: string | Date) => {
    const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const renderNotification = (notification: AppNotification) => {
    const colors = getNotificationColor(notification.type);
    const icon = getNotificationIcon(notification.type);

    return (
      <TouchableOpacity
        key={notification.id}
        style={[styles.notificationCard, !notification.read && styles.unreadCard]}
        onPress={() => markAsRead(notification.id)}
        activeOpacity={0.7}
      >
        <View style={styles.notificationContent}>
          <LinearGradient
            colors={colors}
            style={styles.iconContainer}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name={icon as any} size={24} color={COLORS.white} />
          </LinearGradient>

          <View style={styles.textContainer}>
            <View style={styles.headerRow}>
              <Text style={styles.title}>{notification.title}</Text>
              {!notification.read && <View style={styles.unreadDot} />}
            </View>
            <Text style={styles.message}>{notification.message}</Text>

            {/* OTP Display */}
            {notification.otp && (
              <View style={styles.otpContainer}>
                <LinearGradient
                  colors={colors}
                  style={styles.otpGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <View style={styles.otpContent}>
                    <View>
                      <Text style={styles.otpLabel}>
                        {notification.type === 'otp_start' ? 'Start Job OTP' : 'Complete Job OTP'}
                      </Text>
                      <Text style={styles.otpValue}>{notification.otp}</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.copyButton}
                      onPress={() => copyOTP(notification.otp!)}
                    >
                      <Ionicons name="copy-outline" size={20} color={COLORS.white} />
                      <Text style={styles.copyText}>Copy</Text>
                    </TouchableOpacity>
                  </View>
                </LinearGradient>
              </View>
            )}

            <Text style={styles.timestamp}>{formatTimestamp(notification.timestamp)}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
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
              title="No notifications yet"
              subtitle="You'll see booking updates and OTPs here"
            />
          </View>
        ) : (
          notifications.map(renderNotification)
        )}
      </ScrollView>
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
    borderBottomColor: COLORS.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.size.xl,
    fontWeight: TYPOGRAPHY.weight.bold,
    color: COLORS.text,
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.md,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  notificationCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.large,
    marginBottom: SPACING.md,
    ...SHADOWS.sm,
  },
  unreadCard: {
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  notificationContent: {
    flexDirection: 'row',
    padding: SPACING.md,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  textContainer: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  title: {
    fontSize: TYPOGRAPHY.size.md,
    fontWeight: TYPOGRAPHY.weight.bold,
    color: COLORS.text,
    flex: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
    marginLeft: SPACING.xs,
  },
  message: {
    fontSize: TYPOGRAPHY.size.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: SPACING.sm,
  },
  otpContainer: {
    marginTop: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  otpGradient: {
    borderRadius: RADIUS.medium,
    padding: 2,
  },
  otpContent: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.medium,
    padding: SPACING.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  otpLabel: {
    fontSize: TYPOGRAPHY.size.xs,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  otpValue: {
    fontSize: 28,
    fontWeight: TYPOGRAPHY.weight.bold,
    color: COLORS.text,
    letterSpacing: 4,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.small,
    gap: SPACING.xs,
  },
  copyText: {
    fontSize: TYPOGRAPHY.size.sm,
    fontWeight: TYPOGRAPHY.weight.semibold,
    color: COLORS.white,
  },
  timestamp: {
    fontSize: TYPOGRAPHY.size.xs,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
});
