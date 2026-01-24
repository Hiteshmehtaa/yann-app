import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  Dimensions,
  Image,
  Vibration,
  Platform,
  AppState,
  AppStateStatus,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { COLORS, SPACING, SHADOWS, RADIUS } from '../../utils/theme';
import { apiService } from '../../services/api';

const { width, height } = Dimensions.get('window');

interface BookingRequestData {
  bookingId: string;
  serviceName: string;
  customerName: string;
  customerAddress?: string;
  totalPrice: number;
  bookingDate?: string;
  bookingTime?: string;
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
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0.5)).current;
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const vibrationRef = useRef<NodeJS.Timeout | null>(null);
  const appStateRef = useRef(AppState.currentState);

  // Calculate remaining time from expiresAt
  useEffect(() => {
    if (visible && requestData?.expiresAt) {
      const updateRemaining = () => {
        const now = new Date();
        const expires = new Date(requestData.expiresAt);
        const remaining = Math.max(0, Math.floor((expires.getTime() - now.getTime()) / 1000));
        setRemainingSeconds(remaining);

        if (remaining <= 0) {
          // Timer expired - auto dismiss
          stopAllEffects();
          onDismiss();
        }
      };

      updateRemaining();
      timerRef.current = setInterval(updateRemaining, 1000);

      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    }
  }, [visible, requestData?.expiresAt]);

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
        Animated.parallel([
          Animated.sequence([
            Animated.timing(pulseAnim, {
              toValue: 1.05,
              duration: 600,
              useNativeDriver: true,
            }),
            Animated.timing(pulseAnim, {
              toValue: 1,
              duration: 600,
              useNativeDriver: true,
            }),
          ]),
          Animated.sequence([
            Animated.timing(glowAnim, {
              toValue: 1,
              duration: 800,
              useNativeDriver: true,
            }),
            Animated.timing(glowAnim, {
              toValue: 0.5,
              duration: 800,
              useNativeDriver: true,
            }),
          ]),
        ])
      );
      pulse.start();

      // Shake animation for urgency
      const shake = Animated.loop(
        Animated.sequence([
          Animated.timing(shakeAnim, { toValue: 5, duration: 50, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: -5, duration: 50, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: 5, duration: 50, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
          Animated.delay(3000), // Pause between shakes
        ])
      );
      shake.start();

      return () => {
        pulse.stop();
        shake.stop();
      };
    }
  }, [visible]);

  const startBuzzerEffects = () => {
    // Start vibration pattern
    if (Platform.OS !== 'web') {
      Vibration.vibrate(VIBRATION_PATTERN);
      vibrationRef.current = setInterval(() => {
        Vibration.vibrate(VIBRATION_PATTERN);
      }, VIBRATION_INTERVAL);
    }

    // Fallback to haptic feedback since expo-av might not be installed
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  };

  const stopAllEffects = () => {
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

  if (!visible || !requestData) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <BlurView intensity={30} tint="dark" style={styles.overlay}>
        <Animated.View
          style={[
            styles.container,
            {
              transform: [
                { scale: pulseAnim },
                { translateX: shakeAnim }
              ]
            }
          ]}
        >
          {/* Glowing Border Effect */}
          <Animated.View
            style={[
              styles.glowBorder,
              { 
                borderColor: getUrgencyColor(),
                opacity: glowAnim 
              }
            ]}
          />

          {/* Header with Timer */}
          <View style={styles.header}>
            <View style={styles.bellContainer}>
              <Ionicons name="notifications" size={28} color="#FFF" />
            </View>
            <Text style={styles.headerTitle}>New Booking Request!</Text>
            <View style={[styles.timerBadge, { backgroundColor: getUrgencyColor() }]}>
              <Ionicons name="time-outline" size={14} color="#FFF" />
              <Text style={styles.timerText}>{formatTime(remainingSeconds)}</Text>
            </View>
          </View>

          {/* Customer & Service Info */}
          <View style={styles.infoSection}>
            <View style={styles.infoRow}>
              <Ionicons name="person-outline" size={20} color={COLORS.textTertiary} />
              <Text style={styles.infoLabel}>Customer:</Text>
              <Text style={styles.infoValue}>{requestData.customerName}</Text>
            </View>

            <View style={styles.infoRow}>
              <Ionicons name="construct-outline" size={20} color={COLORS.textTertiary} />
              <Text style={styles.infoLabel}>Service:</Text>
              <Text style={styles.infoValue}>{requestData.serviceName}</Text>
            </View>

            {requestData.bookingDate && (
              <View style={styles.infoRow}>
                <Ionicons name="calendar-outline" size={20} color={COLORS.textTertiary} />
                <Text style={styles.infoLabel}>Date:</Text>
                <Text style={styles.infoValue}>{requestData.bookingDate}</Text>
              </View>
            )}

            {requestData.bookingTime && (
              <View style={styles.infoRow}>
                <Ionicons name="time-outline" size={20} color={COLORS.textTertiary} />
                <Text style={styles.infoLabel}>Time:</Text>
                <Text style={styles.infoValue}>{requestData.bookingTime}</Text>
              </View>
            )}

            {requestData.customerAddress && (
              <View style={styles.infoRow}>
                <Ionicons name="location-outline" size={20} color={COLORS.textTertiary} />
                <Text style={styles.infoLabel}>Address:</Text>
                <Text style={[styles.infoValue, { flex: 1 }]} numberOfLines={2}>
                  {requestData.customerAddress}
                </Text>
              </View>
            )}
          </View>

          {/* Price */}
          <View style={styles.priceContainer}>
            <Text style={styles.priceLabel}>Earning Potential</Text>
            <Text style={styles.priceValue}>₹{requestData.totalPrice.toFixed(2)}</Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.rejectButton, isRejecting && styles.buttonDisabled]}
              onPress={handleReject}
              disabled={isAccepting || isRejecting}
            >
              <Ionicons name="close" size={24} color="#EF4444" />
              <Text style={styles.rejectButtonText}>
                {isRejecting ? 'Declining...' : 'Decline'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.acceptButton, isAccepting && styles.buttonDisabled]}
              onPress={handleAccept}
              disabled={isAccepting || isRejecting}
            >
              <LinearGradient
                colors={['#10B981', '#059669']}
                style={styles.acceptGradient}
              >
                <Ionicons name="checkmark" size={24} color="#FFF" />
                <Text style={styles.acceptButtonText}>
                  {isAccepting ? 'Accepting...' : 'Accept'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Urgency Message */}
          <Text style={[styles.urgencyText, { color: getUrgencyColor() }]}>
            {remainingSeconds <= 60 
              ? '⚠️ Less than 1 minute left! Respond now!' 
              : 'Customer is waiting for your response'}
          </Text>
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
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  container: {
    width: width * 0.92,
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.xlarge,
    padding: SPACING.lg,
    position: 'relative',
    overflow: 'hidden',
    ...SHADOWS.lg,
  },
  glowBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: RADIUS.xlarge,
    borderWidth: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
    gap: SPACING.sm,
  },
  bellContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    gap: 4,
  },
  timerText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFF',
  },
  infoSection: {
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.medium,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  infoLabel: {
    fontSize: 13,
    color: COLORS.textTertiary,
    width: 70,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  priceContainer: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: RADIUS.medium,
    padding: SPACING.md,
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  priceLabel: {
    fontSize: 12,
    color: COLORS.textTertiary,
    marginBottom: 4,
  },
  priceValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#10B981',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  rejectButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.large,
    borderWidth: 2,
    borderColor: '#FEE2E2',
    backgroundColor: '#FEF2F2',
    gap: SPACING.xs,
  },
  rejectButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
  },
  acceptButton: {
    flex: 1.5,
    borderRadius: RADIUS.large,
    overflow: 'hidden',
  },
  acceptGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    gap: SPACING.xs,
  },
  acceptButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  urgencyText: {
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '500',
  },
});
