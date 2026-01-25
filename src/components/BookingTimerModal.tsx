import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  Dimensions,
  Image,
  ActivityIndicator,
  AppState,
  AppStateStatus,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import LottieView from 'lottie-react-native';
import * as Haptics from 'expo-haptics';
import { COLORS, SPACING, SHADOWS, RADIUS } from '../utils/theme';
import { apiService } from '../services/api';

const { width, height } = Dimensions.get('window');

interface BookingTimerModalProps {
  visible: boolean;
  bookingId: string;
  customerId?: string;
  provider: {
    id: string;
    name: string;
    profileImage?: string;
  };
  serviceName: string;
  totalPrice: number;
  onAccepted: () => void;
  onRejected: () => void;
  onTimeout: () => void;
  onCancel: () => void;
}

const TOTAL_SECONDS = 180; // 3 minutes
const POLL_INTERVAL = 3000; // Poll every 3 seconds
const BUZZER_INTERVAL = 30000; // Send buzzer every 30 seconds

export const BookingTimerModal: React.FC<BookingTimerModalProps> = ({
  visible,
  bookingId,
  customerId,
  provider,
  serviceName,
  totalPrice,
  onAccepted,
  onRejected,
  onTimeout,
  onCancel,
}) => {
  const [remainingSeconds, setRemainingSeconds] = useState(TOTAL_SECONDS);
  const [status, setStatus] = useState<'waiting' | 'accepted' | 'rejected' | 'expired'>('waiting');
  const [isPolling, setIsPolling] = useState(false);

  const progressAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);
  const buzzerRef = useRef<NodeJS.Timeout | null>(null);
  const appStateRef = useRef(AppState.currentState);

  // Pulse animation for waiting state
  useEffect(() => {
    if (visible && status === 'waiting') {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [visible, status]);

  // Handle app state changes (background/foreground)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (appStateRef.current.match(/inactive|background/) && nextAppState === 'active') {
        // App came to foreground - immediately check status
        checkStatus();
      }
      appStateRef.current = nextAppState;
    });

    return () => subscription.remove();
  }, [bookingId]);

  // Main timer countdown
  useEffect(() => {
    if (visible && status === 'waiting' && remainingSeconds > 0) {
      timerRef.current = setInterval(() => {
        setRemainingSeconds(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            setStatus('expired');
            onTimeout();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    }
  }, [visible, status]);

  // Progress bar animation
  useEffect(() => {
    const progress = remainingSeconds / TOTAL_SECONDS;
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 1000,
      useNativeDriver: false,
    }).start();
  }, [remainingSeconds]);

  // Poll for status updates
  useEffect(() => {
    if (visible && status === 'waiting') {
      pollRef.current = setInterval(() => {
        checkStatus();
      }, POLL_INTERVAL);

      return () => {
        if (pollRef.current) clearInterval(pollRef.current);
      };
    }
  }, [visible, status, bookingId]);

  // Send buzzer notifications periodically
  useEffect(() => {
    if (visible && status === 'waiting') {
      buzzerRef.current = setInterval(() => {
        sendBuzzer();
      }, BUZZER_INTERVAL);

      return () => {
        if (buzzerRef.current) clearInterval(buzzerRef.current);
      };
    }
  }, [visible, status, bookingId]);

  const checkStatus = async () => {
    if (!bookingId || isPolling) return;

    try {
      setIsPolling(true);
      const response = await apiService.checkBookingRequestStatus(bookingId, customerId);

      if (response.success && response.data) {
        const { status: newStatus, remainingSeconds: serverRemainingSeconds } = response.data;

        // Sync timer with server
        if (serverRemainingSeconds !== undefined && serverRemainingSeconds !== remainingSeconds) {
          setRemainingSeconds(serverRemainingSeconds);
        }

        if (newStatus === 'accepted') {
          setStatus('accepted');
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          clearAllIntervals();
          setTimeout(onAccepted, 1500); // Show success state briefly
        } else if (newStatus === 'rejected') {
          setStatus('rejected');
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          clearAllIntervals();
          setTimeout(onRejected, 1500);
        } else if (newStatus === 'expired') {
          setStatus('expired');
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          clearAllIntervals();
          setTimeout(onTimeout, 1500);
        }
      }
    } catch (error) {
      console.log('Status check failed:', error);
    } finally {
      setIsPolling(false);
    }
  };

  const sendBuzzer = async () => {
    if (!bookingId || status !== 'waiting') return;

    try {
      await apiService.sendProviderBuzzer(bookingId);
      console.log('Buzzer sent to provider');
    } catch (error) {
      console.log('Buzzer failed:', error);
    }
  };

  const clearAllIntervals = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (pollRef.current) clearInterval(pollRef.current);
    if (buzzerRef.current) clearInterval(buzzerRef.current);
  };

  const handleCancel = () => {
    clearAllIntervals();
    onCancel();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgressColor = () => {
    if (remainingSeconds > 120) return ['#10B981', '#059669']; // Green
    if (remainingSeconds > 60) return ['#F59E0B', '#D97706']; // Orange
    return ['#EF4444', '#DC2626']; // Red
  };

  const getStatusContent = () => {
    switch (status) {
      case 'accepted':
        return {
          icon: 'checkmark-circle',
          color: '#10B981',
          title: 'Booking Confirmed!',
          message: `${provider.name} has accepted your booking`,
        };
      case 'rejected':
        return {
          icon: 'close-circle',
          color: '#EF4444',
          title: 'Provider Unavailable',
          message: 'Please select another provider',
        };
      case 'expired':
        return {
          icon: 'time',
          color: '#F59E0B',
          title: 'Request Timed Out',
          message: 'Provider didn\'t respond. Please try another provider.',
        };
      default:
        return null;
    }
  };

  const statusContent = getStatusContent();

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <BlurView intensity={20} tint="dark" style={styles.overlay}>
        <Animated.View 
          style={[
            styles.container,
            status === 'waiting' && { transform: [{ scale: pulseAnim }] }
          ]}
        >
          {/* Status Icon or Timer */}
          {statusContent ? (
            <View style={styles.statusContainer}>
              <Ionicons 
                name={statusContent.icon as any} 
                size={80} 
                color={statusContent.color} 
              />
              <Text style={styles.statusTitle}>{statusContent.title}</Text>
              <Text style={styles.statusMessage}>{statusContent.message}</Text>
            </View>
          ) : (
            <>
              {/* Provider Info */}
              <View style={styles.providerInfo}>
                {provider.profileImage ? (
                  <Image source={{ uri: provider.profileImage }} style={styles.providerImage} />
                ) : (
                  <View style={styles.providerImagePlaceholder}>
                    <Ionicons name="person" size={32} color={COLORS.textTertiary} />
                  </View>
                )}
                <Text style={styles.providerName}>{provider.name}</Text>
                <Text style={styles.serviceText}>{serviceName}</Text>
              </View>

              {/* Timer Circle */}
              <View style={styles.timerContainer}>
                <View style={styles.timerCircle}>
                  <LinearGradient
                    colors={getProgressColor() as any}
                    style={styles.timerGradient}
                  >
                    <Text style={styles.timerText}>{formatTime(remainingSeconds)}</Text>
                    <Text style={styles.timerLabel}>remaining</Text>
                  </LinearGradient>
                </View>

                {/* Animated Progress Ring */}
                <Animated.View 
                  style={[
                    styles.progressRing,
                    {
                      borderColor: getProgressColor()[0],
                      opacity: progressAnim,
                    }
                  ]} 
                />
              </View>

              {/* Waiting Message */}
              <View style={styles.messageContainer}>
                <ActivityIndicator size="small" color={COLORS.primary} />
                <Text style={styles.waitingText}>
                  Waiting for {provider.name} to respond...
                </Text>
              </View>

              {/* Price */}
              <View style={styles.priceContainer}>
                <Text style={styles.priceLabel}>Total Amount</Text>
                <Text style={styles.priceValue}>₹{totalPrice.toFixed(2)}</Text>
              </View>

              {/* Cancel Button */}
              <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
                <Text style={styles.cancelButtonText}>Cancel Request</Text>
              </TouchableOpacity>

              {/* Info Text */}
              <Text style={styles.infoText}>
                Provider will receive continuous notifications until they respond
              </Text>
            </>
          )}
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
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  container: {
    width: width * 0.88,
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.xlarge,
    padding: SPACING.xl,
    alignItems: 'center',
    ...SHADOWS.lg,
  },
  providerInfo: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  providerImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: SPACING.sm,
  },
  providerImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  providerName: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  serviceText: {
    fontSize: 14,
    color: COLORS.textTertiary,
  },
  timerContainer: {
    position: 'relative',
    marginVertical: SPACING.lg,
  },
  timerCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    overflow: 'hidden',
  },
  timerGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timerText: {
    fontSize: 36,
    fontWeight: '800',
    color: '#FFF',
  },
  timerLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  progressRing: {
    position: 'absolute',
    top: -8,
    left: -8,
    right: -8,
    bottom: -8,
    borderRadius: 78,
    borderWidth: 4,
  },
  messageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
    gap: SPACING.sm,
  },
  waitingText: {
    fontSize: 14,
    color: COLORS.textTertiary,
  },
  priceContainer: {
    backgroundColor: COLORS.background,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    borderRadius: RADIUS.medium,
    marginBottom: SPACING.lg,
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: 12,
    color: COLORS.textTertiary,
    marginBottom: 4,
  },
  priceValue: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.primary,
  },
  cancelButton: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    borderRadius: RADIUS.full,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    marginBottom: SPACING.sm,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textTertiary,
  },
  infoText: {
    fontSize: 11,
    color: COLORS.textTertiary,
    textAlign: 'center',
    maxWidth: '80%',
  },
  statusContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  statusTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: SPACING.md,
  },
  statusMessage: {
    fontSize: 14,
    color: COLORS.textTertiary,
    marginTop: SPACING.sm,
    textAlign: 'center',
  },
});
