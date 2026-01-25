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
import { playBookingRequestBuzzer, stopBuzzer, playSuccessSound, playErrorSound } from '../../utils/soundNotifications';

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
    if (!visible || !requestData?.expiresAt) {
      console.log('⏱️ Timer NOT started. visible:', visible, 'expiresAt:', requestData?.expiresAt);
      return;
    }

    console.log('⏱️ Timer started. expiresAt:', requestData.expiresAt);
    const expiresAt = new Date(requestData.expiresAt);
    
    const updateRemaining = () => {
      const now = new Date();
      const remaining = Math.max(0, Math.floor((expiresAt.getTime() - now.getTime()) / 1000));
      console.log('⏱️ Timer tick - Remaining:', remaining, 'seconds');
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
          </View>

          {/* Elegant Professional Timer */}
          <View style={styles.timerSection}>
            <View style={styles.timerWrapper}>
              {/* Outer glow ring */}
              <View style={[styles.glowRing, { borderColor: getUrgencyColor() + '30' }]} />
              
              {/* Main timer card */}
              <View style={styles.timerCard}>
                <View style={styles.timerTop}>
                  <Text style={styles.timerTitle}>Response Time</Text>
                  <View style={[styles.statusDot, { backgroundColor: getUrgencyColor() }]} />
                </View>
                
                <View style={styles.timeDisplay}>
                  <View style={styles.timeUnit}>
                    <Text style={styles.timeNumber}>{Math.floor(remainingSeconds / 60)}</Text>
                    <Text style={styles.timeLabel}>min</Text>
                  </View>
                  <Text style={styles.timeSeparator}>:</Text>
                  <View style={styles.timeUnit}>
                    <Text style={styles.timeNumber}>{String(remainingSeconds % 60).padStart(2, '0')}</Text>
                    <Text style={styles.timeLabel}>sec</Text>
                  </View>
                </View>
                
                {/* Elegant progress bar */}
                <View style={styles.progressTrack}>
                  <View 
                    style={[
                      styles.progressBar, 
                      { 
                        width: `${(remainingSeconds / 180) * 100}%`,
                        backgroundColor: getUrgencyColor()
                      }
                    ]} 
                  />
                </View>
                
                <Text style={[styles.warningText, { color: getUrgencyColor() }]}>
                  {remainingSeconds <= 60 
                    ? '⚡ Urgent - Auto-reject imminent' 
                    : 'Auto-rejects if no response'}
                </Text>
              </View>
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
          <View style={styles.urgencyContainer}>
            <Ionicons 
              name={remainingSeconds <= 60 ? "warning" : "information-circle"} 
              size={20} 
              color={getUrgencyColor()} 
            />
            <Text style={[styles.urgencyText, { color: getUrgencyColor() }]}>
              {remainingSeconds <= 60 
                ? 'Less than 1 minute! Will auto-reject if no response' 
                : 'Booking will auto-reject if not accepted in time'}
            </Text>
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
  largeTimerContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
    marginBottom: SPACING.md,
  },
  timerSection: {
    marginBottom: SPACING.lg,
    paddingHorizontal: SPACING.xs,
  },
  timerWrapper: {
    position: 'relative',
    alignItems: 'center',
  },
  glowRing: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: RADIUS.large,
    borderWidth: 2,
    opacity: 0.3,
  },
  timerCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.large,
    padding: SPACING.lg,
    ...SHADOWS.lg,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  timerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  timerTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  timeDisplay: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  timeUnit: {
    alignItems: 'center',
  },
  timeNumber: {
    fontSize: 64,
    fontWeight: '300',
    color: COLORS.text,
    lineHeight: 64,
    fontVariant: ['tabular-nums'],
  },
  timeLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 4,
  },
  timeSeparator: {
    fontSize: 48,
    fontWeight: '200',
    color: COLORS.textTertiary,
    marginHorizontal: SPACING.sm,
    marginBottom: 12,
  },
  progressTrack: {
    height: 4,
    backgroundColor: 'rgba(0,0,0,0.06)',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: SPACING.md,
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  warningText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  circularTimer: {
    width: 160,
    height: 160,
    marginBottom: SPACING.md,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circularBg: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderWidth: 8,
    borderColor: 'rgba(0,0,0,0.08)',
  },
  circularProgress: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    overflow: 'hidden',
  },
  circularProgressHalf: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 8,
    borderColor: 'transparent',
    borderTopColor: 'transparent',
    borderRightColor: 'transparent',
  },
  circularInner: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    ...SHADOWS.md,
  },
  timerMinutes: {
    fontSize: 44,
    fontWeight: '800',
    color: COLORS.text,
    fontVariant: ['tabular-nums'],
  },
  timerSeparator: {
    fontSize: 44,
    fontWeight: '700',
    color: COLORS.textTertiary,
    marginHorizontal: 2,
  },
  timerSeconds: {
    fontSize: 44,
    fontWeight: '800',
    color: COLORS.text,
    fontVariant: ['tabular-nums'],
  },
  urgencyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
  },
  urgencyBadgeText: {
    fontSize: 14,
    fontWeight: '700',
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
  urgencyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: RADIUS.medium,
  },
  urgencyText: {
    fontSize: 13,
    textAlign: 'center',
    fontWeight: '600',
    flex: 1,
  },
});
