import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  Dimensions,
  Vibration,
  Platform,
  AppState,
  AppStateStatus,
  ScrollView,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { COLORS, SPACING, SHADOWS, RADIUS } from '../../utils/theme';
import { apiService } from '../../services/api';
import { playBookingRequestBuzzer, stopBuzzer, playSuccessSound, playErrorSound } from '../../utils/soundNotifications';

const { width, height } = Dimensions.get('window');

interface BookingRequestData {
  bookingId: string;
  serviceName: string;
  customerName: string;
  customerAddress?: string;
  customerPhone?: string;
  bookingDate?: string;
  bookingTime?: string;
  totalPrice: number;
  notes?: string;
  expiresAt: string;
}

interface ProviderIncomingRequestProps {
  visible: boolean;
  requestData: BookingRequestData | null;
  providerId: string;
  onAccept: () => void;
  onReject: () => void;
  onDismiss: () => void;
}

const VIBRATION_PATTERN = [0, 500, 200, 500, 200, 500, 500]; // Buzz pattern
const VIBRATION_INTERVAL = 5000; // Repeat every 5 seconds

export const ProviderIncomingRequest: React.FC<ProviderIncomingRequestProps> = ({
  visible,
  requestData,
  providerId,
  onAccept,
  onReject,
  onDismiss,
}) => {
  const [remainingSeconds, setRemainingSeconds] = useState(180);
  const [isAccepting, setIsAccepting] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const vibrationRef = useRef<NodeJS.Timeout | null>(null);

  // Calculate remaining time from expiresAt
  useEffect(() => {
    if (!visible || !requestData?.expiresAt) {
      console.log('⏱️ Timer NOT started. visible:', visible, 'expiresAt:', requestData?.expiresAt);
      return;
    }

    console.log('⏱️ Timer started. expiresAt:', requestData.expiresAt);
    const expiresAt = new Date(requestData.expiresAt);

    const updateRemaining = () => {
      const now = new Date();
      const remaining = Math.max(0, Math.floor((expiresAt.getTime() - now.getTime()) / 1000));
      setRemainingSeconds(remaining);

      if (remaining <= 0) {
        console.log('⏱️ Timer expired - auto dismissing');
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        stopAllEffects();
        onDismiss();
      }
    };

    // Initial update
    updateRemaining();

    // Set interval
    timerRef.current = setInterval(updateRemaining, 1000);

    return () => {
      if (timerRef.current) {
        console.log('⏱️ Timer cleanup');
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [visible, requestData?.expiresAt, onDismiss]);

  // Start buzzer/vibration when visible
  useEffect(() => {
    if (visible && requestData) {
      startBuzzerEffects();
    } else {
      stopAllEffects();
    }

    return () => {
      stopAllEffects();
    };
  }, [visible, requestData]);

  // Pulse animation
  useEffect(() => {
    if (visible) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.02,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();

      return () => {
        pulse.stop();
      };
    }
  }, [visible]);

  const startBuzzerEffects = async () => {
    // Play buzzer sound with haptic feedback
    try {
      await playBookingRequestBuzzer();
    } catch (error) {
      console.log('Sound notification failed, using fallback:', error);
    }

    // Start vibration pattern as backup
    if (Platform.OS !== 'web') {
      Vibration.vibrate(VIBRATION_PATTERN);
      vibrationRef.current = setInterval(() => {
        Vibration.vibrate(VIBRATION_PATTERN);
        // Replay buzzer periodically
        playBookingRequestBuzzer().catch(console.log);
      }, VIBRATION_INTERVAL);
    }

    // Fallback to haptic feedback
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  };

  const stopAllEffects = async () => {
    // Stop buzzer sound
    try {
      await stopBuzzer();
    } catch (error) {
      console.log('Failed to stop buzzer:', error);
    }

    // Stop vibration
    if (Platform.OS !== 'web') {
      Vibration.cancel();
    }
    if (vibrationRef.current) {
      clearInterval(vibrationRef.current);
      vibrationRef.current = null;
    }

    // Stop timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleAccept = async () => {
    if (isAccepting || isRejecting || !requestData) return;

    setIsAccepting(true);
    stopAllEffects();

    // Play success sound
    await playSuccessSound();

    try {
      const response = await apiService.respondToBookingRequest(
        requestData.bookingId,
        providerId,
        'accept'
      );

      if (response.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onAccept();
      } else {
        throw new Error(response.message || 'Failed to accept');
      }
    } catch (error: any) {
      console.error('Accept failed:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      // Still call onAccept to dismiss modal
      onAccept();
    } finally {
      setIsAccepting(false);
    }
  };

  const handleReject = async () => {
    if (isAccepting || isRejecting || !requestData) return;

    setIsRejecting(true);
    stopAllEffects();

    // Play error sound
    await playErrorSound();

    try {
      const response = await apiService.respondToBookingRequest(
        requestData.bookingId,
        providerId,
        'reject',
        'Provider declined'
      );

      if (response.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        onReject();
      } else {
        throw new Error(response.message || 'Failed to reject');
      }
    } catch (error: any) {
      console.error('Reject failed:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      onReject();
    } finally {
      setIsRejecting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getUrgencyColor = () => {
    if (remainingSeconds > 120) return '#10B981'; // Green
    if (remainingSeconds > 60) return '#F59E0B'; // Orange
    return '#EF4444'; // Red
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (!visible || !requestData) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <BlurView intensity={95} tint="dark" style={styles.overlay}>
        <Animated.View
          style={[
            styles.container,
            {
              transform: [{ scale: pulseAnim }]
            }
          ]}
        >
          {/* Header */}
          <LinearGradient
            colors={[getUrgencyColor(), getUrgencyColor() + 'DD']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.header}
          >
            <View style={styles.headerContent}>
              <View style={styles.iconBadge}>
                <Ionicons name="notifications" size={28} color="#FFF" />
              </View>
              <Text style={styles.headerTitle}>New Booking Request</Text>
              <View style={styles.timerBadge}>
                <Ionicons name="timer-outline" size={16} color="#FFF" />
                <Text style={styles.timerText}>{formatTime(remainingSeconds)}</Text>
              </View>
            </View>
          </LinearGradient>

          {/* Content */}
          <ScrollView
            style={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.content}>
              {/* Service Info */}
              <View style={styles.serviceCard}>
                <View style={styles.serviceHeader}>
                  <Ionicons name="construct" size={24} color="#3B82F6" />
                  <View style={styles.serviceInfo}>
                    <Text style={styles.serviceLabel}>Service</Text>
                    <Text style={styles.serviceName}>{requestData.serviceName}</Text>
                  </View>
                </View>
              </View>

              {/* Customer Info */}
              <View style={styles.infoCard}>
                <Text style={styles.cardTitle}>Customer Details</Text>

                <View style={styles.infoRow}>
                  <Ionicons name="person" size={20} color="#6B7280" />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Name</Text>
                    <Text style={styles.infoValue}>{requestData.customerName}</Text>
                  </View>
                </View>

                {requestData.customerPhone && (
                  <View style={styles.infoRow}>
                    <Ionicons name="call" size={20} color="#6B7280" />
                    <View style={styles.infoContent}>
                      <Text style={styles.infoLabel}>Phone</Text>
                      <Text style={styles.infoValue}>{requestData.customerPhone}</Text>
                    </View>
                  </View>
                )}

                {requestData.customerAddress && (
                  <View style={styles.infoRow}>
                    <Ionicons name="location" size={20} color="#6B7280" />
                    <View style={styles.infoContent}>
                      <Text style={styles.infoLabel}>Address</Text>
                      <Text style={styles.infoValue}>{requestData.customerAddress}</Text>
                    </View>
                  </View>
                )}
              </View>

              {/* Booking Details */}
              <View style={styles.infoCard}>
                <Text style={styles.cardTitle}>Booking Details</Text>

                {requestData.bookingDate && (
                  <View style={styles.infoRow}>
                    <Ionicons name="calendar" size={20} color="#6B7280" />
                    <View style={styles.infoContent}>
                      <Text style={styles.infoLabel}>Date</Text>
                      <Text style={styles.infoValue}>{formatDate(requestData.bookingDate)}</Text>
                    </View>
                  </View>
                )}

                {requestData.bookingTime && (
                  <View style={styles.infoRow}>
                    <Ionicons name="time" size={20} color="#6B7280" />
                    <View style={styles.infoContent}>
                      <Text style={styles.infoLabel}>Time</Text>
                      <Text style={styles.infoValue}>{requestData.bookingTime}</Text>
                    </View>
                  </View>
                )}

                {requestData.notes && (
                  <View style={styles.infoRow}>
                    <Ionicons name="document-text" size={20} color="#6B7280" />
                    <View style={styles.infoContent}>
                      <Text style={styles.infoLabel}>Notes</Text>
                      <Text style={styles.infoValue}>{requestData.notes}</Text>
                    </View>
                  </View>
                )}
              </View>

              {/* Price */}
              <View style={styles.priceCard}>
                <Text style={styles.priceLabel}>Earning Potential</Text>
                <Text style={styles.priceValue}>₹{requestData.totalPrice.toFixed(2)}</Text>
              </View>

              {/* Urgency Warning */}
              {remainingSeconds <= 60 && (
                <View style={styles.urgencyBanner}>
                  <Ionicons name="warning" size={20} color="#DC2626" />
                  <Text style={styles.urgencyText}>
                    ⚡ Less than 1 minute! Auto-reject imminent
                  </Text>
                </View>
              )}
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.rejectButton, (isAccepting || isRejecting) && styles.buttonDisabled]}
              onPress={handleReject}
              disabled={isAccepting || isRejecting}
              activeOpacity={0.8}
            >
              <Ionicons name="close-circle" size={22} color="#DC2626" />
              <Text style={styles.rejectButtonText}>
                {isRejecting ? 'Declining...' : 'Decline'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.acceptButton, (isAccepting || isRejecting) && styles.buttonDisabled]}
              onPress={handleAccept}
              disabled={isAccepting || isRejecting}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#10B981', '#059669']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.acceptGradient}
              >
                <Ionicons name="checkmark-circle" size={22} color="#FFF" />
                <Text style={styles.acceptButtonText}>
                  {isAccepting ? 'Accepting...' : 'Accept Booking'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </BlurView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  container: {
    width: width * 0.94,
    maxWidth: 480,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.3,
    shadowRadius: 30,
    elevation: 24,
  },
  header: {
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.lg,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    marginLeft: SPACING.md,
    letterSpacing: 0.3,
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    gap: 6,
  },
  timerText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1,
    fontVariant: ['tabular-nums'],
  },
  scrollContent: {
    maxHeight: height * 0.6,
  },
  content: {
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  serviceCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: 16,
    padding: SPACING.lg,
    borderWidth: 1.5,
    borderColor: '#DBEAFE',
  },
  serviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  serviceName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1E40AF',
    letterSpacing: 0.2,
  },
  infoCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: SPACING.md,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.md,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9CA3AF',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    lineHeight: 22,
  },
  priceCard: {
    backgroundColor: '#ECFDF5',
    borderRadius: 16,
    padding: SPACING.lg,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#A7F3D0',
  },
  priceLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#059669',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  priceValue: {
    fontSize: 32,
    fontWeight: '900',
    color: '#047857',
    fontVariant: ['tabular-nums'],
  },
  urgencyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    padding: SPACING.md,
    borderRadius: 12,
    gap: 10,
    borderWidth: 1.5,
    borderColor: '#FEE2E2',
  },
  urgencyText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: '#DC2626',
    lineHeight: 18,
  },
  actions: {
    flexDirection: 'row',
    padding: SPACING.lg,
    gap: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  rejectButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#FEE2E2',
    backgroundColor: '#FEF2F2',
    gap: 8,
  },
  rejectButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#DC2626',
  },
  acceptButton: {
    flex: 1.5,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  acceptGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  acceptButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
