import React, { useState, useEffect, useRef } from 'react';
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
    ScrollView,
    Image, // Added Image import
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { apiService } from '../../services/api';
import { playBookingRequestBuzzer, stopBuzzer, playSuccessSound, playErrorSound } from '../../utils/soundNotifications';
import { COLORS } from '../../utils/theme';

const { width, height } = Dimensions.get('window');

// Premium Palette - Aligned with App Theme
const THEME_STYLES = {
    primary: COLORS.primary, // #3B82F6
    secondary: COLORS.textSecondary,
    accent: COLORS.primary,
    success: COLORS.success,
    danger: COLORS.error,
    surface: COLORS.white,
    background: COLORS.background,
    border: COLORS.border,
};

interface BookingRequestData {
    bookingId: string;
    serviceName: string;
    customerName: string;
    customerProfileImage?: string; // Added field
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

const VIBRATION_PATTERN = [0, 1000, 1000, 1000, 1000, 1000, 1000]; // 1s vibrate, 1s pause loop
const VIBRATION_INTERVAL = 6000; // Repeat whole pattern every 6s

export const ProviderIncomingRequest: React.FC<ProviderIncomingRequestProps> = ({
    visible,
    requestData,
    providerId,
    onAccept,
    onReject,
    onDismiss,
}) => {
    // Strict Timer Initialization
    const [remainingSeconds, setRemainingSeconds] = useState(() => {
        if (requestData?.expiresAt) {
            const expires = new Date(requestData.expiresAt);
            const now = new Date();
            return Math.max(0, Math.floor((expires.getTime() - now.getTime()) / 1000));
        }
        return 180;
    });

    const [isAccepting, setIsAccepting] = useState(false);
    const [isRejecting, setIsRejecting] = useState(false);

    // Animations
    const slideAnim = useRef(new Animated.Value(500)).current; // Slide up
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const vibrationRef = useRef<NodeJS.Timeout | null>(null);
    const audioIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // 1. Timer Logic
    useEffect(() => {
        if (!visible || !requestData?.expiresAt) return;

        const stopAllEffects = async () => {
            try { await stopBuzzer(); } catch (e) { }

            // Cancel vibration
            if (Platform.OS !== 'web') {
                Vibration.cancel(); // Stops native loop on Android and current vibe on iOS
            }

            // Clear manual intervals
            if (vibrationRef.current) {
                clearInterval(vibrationRef.current);
                vibrationRef.current = null;
            }
            if (audioIntervalRef.current) {
                clearInterval(audioIntervalRef.current);
                audioIntervalRef.current = null;
            }
        };

        const expiresAt = new Date(requestData.expiresAt);

        const updateRemaining = () => {
            const now = new Date();
            const remaining = Math.max(0, Math.floor((expiresAt.getTime() - now.getTime()) / 1000));
            setRemainingSeconds(remaining);

            if (remaining <= 0) {
                if (timerRef.current) {
                    clearInterval(timerRef.current);
                    timerRef.current = null;
                }
                stopAllEffects();
                onDismiss();
            }
        };

        updateRemaining();
        timerRef.current = setInterval(updateRemaining, 1000);

        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
        };
    }, [visible, requestData?.expiresAt, onDismiss]);

    // 2. Sound & Haptics
    useEffect(() => {
        // Wrap async call in function
        const startEffects = async () => {
            if (visible && requestData) {
                await startBuzzerEffects();
                // Entrance Animation
                Animated.parallel([
                    Animated.spring(slideAnim, {
                        toValue: 0,
                        useNativeDriver: true,
                        damping: 20,
                        stiffness: 150,
                    }),
                    Animated.timing(fadeAnim, {
                        toValue: 1,
                        duration: 300,
                        useNativeDriver: true,
                    })
                ]).start();
            } else {
                await stopAllEffects();
                slideAnim.setValue(500);
                fadeAnim.setValue(0);
            }
        };

        startEffects();

        return () => { stopAllEffects(); };
    }, [visible, requestData]);

    const startBuzzerEffects = async () => {
        try {
            await playBookingRequestBuzzer();
        } catch (e) { console.log('Buzzer error', e); }

        if (Platform.OS === 'android') {
            // Android supports native looping: vibrate(pattern, repeatIndex)
            // repeatIndex is the index in pattern to start repeating from
            Vibration.vibrate([0, 1000, 1000], true);
        } else {
            // iOS manual loop
            Vibration.vibrate(1000);
            vibrationRef.current = setInterval(() => {
                Vibration.vibrate(1000);
            }, 2000);
        }

        // Start buzzer sound loop separately
        playBookingRequestBuzzer().catch(() => { });
        if (Platform.OS === 'android') {
            // Replay sound every 2 seconds matching the vibration cycle
            audioIntervalRef.current = setInterval(() => {
                playBookingRequestBuzzer().catch(() => { });
            }, 2000);
        }
    };

    const stopAllEffects = async () => {
        try { await stopBuzzer(); } catch (e) { }

        // Cancel vibration
        if (Platform.OS !== 'web') {
            Vibration.cancel(); // Stops native loop on Android and current vibe on iOS
        }

        // Clear manual intervals
        if (vibrationRef.current) {
            clearInterval(vibrationRef.current);
            vibrationRef.current = null;
        }
        if (audioIntervalRef.current) {
            clearInterval(audioIntervalRef.current);
            audioIntervalRef.current = null;
        }
    };

    const handleAction = async (type: 'accept' | 'reject') => {
        if (isAccepting || isRejecting || !requestData) return;

        if (type === 'accept') setIsAccepting(true);
        else setIsRejecting(true);

        stopAllEffects();

        try {
            if (type === 'accept') await playSuccessSound();
            else await playErrorSound();

            const response = await apiService.respondToBookingRequest(
                requestData.bookingId,
                providerId,
                type,
                type === 'reject' ? 'Provider declined' : undefined
            );

            if (response.success) {
                Haptics.notificationAsync(
                    type === 'accept'
                        ? Haptics.NotificationFeedbackType.Success
                        : Haptics.NotificationFeedbackType.Warning
                );
                type === 'accept' ? onAccept() : onReject();
            } else {
                throw new Error(response.message);
            }
        } catch (error) {
            console.error(`${type} failed:`, error);
            // Still close modal on error to prevent being stuck
            type === 'accept' ? onAccept() : onReject();
        } finally {
            setIsAccepting(false);
            setIsRejecting(false);
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return 'Today';
        const date = new Date(dateString);
        const today = new Date();
        const isToday = date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear();

        if (isToday) return 'Today';

        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric'
        });
    };

    if (!visible || !requestData) return null;

    return (
        <Modal
            visible={visible}
            transparent
            animationType="none"
            statusBarTranslucent
        >
            <BlurView intensity={50} tint="dark" style={styles.overlay}>
                <Animated.View
                    style={[
                        styles.container,
                        {
                            transform: [{ translateY: slideAnim }],
                            opacity: fadeAnim
                        }
                    ]}
                >
                    {/* Header Badge */}
                    <View style={styles.header}>
                        <LinearGradient
                            colors={[COLORS.primaryLight, '#EBF5FF']}
                            style={styles.badge}
                        >
                            <View style={[styles.badgeDot, { backgroundColor: COLORS.primary }]} />
                            <Text style={[styles.badgeText, { color: COLORS.primary }]}>NEW REQUEST</Text>
                        </LinearGradient>

                        <View style={[styles.timerContainer, remainingSeconds < 60 && styles.timerUrgent]}>
                            <Ionicons name="time-outline" size={14} color={remainingSeconds < 60 ? COLORS.error : COLORS.textSecondary} />
                            <Text style={[styles.timerText, remainingSeconds < 60 && styles.textUrgent]}>
                                {formatTime(remainingSeconds)}
                            </Text>
                        </View>
                    </View>

                    {/* Price Hero */}
                    <View style={styles.heroSection}>
                        <Text style={styles.heroLabel}>Estimated Earning</Text>
                        <Text style={styles.heroPrice}>₹{requestData.totalPrice.toFixed(0)}</Text>
                        <Text style={styles.serviceName}>{requestData.serviceName}</Text>
                    </View>

                    {/* Divider */}
                    <View style={styles.divider} />

                    {/* Details List */}
                    <ScrollView
                        style={styles.detailsContainer}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ paddingBottom: 24 }}
                    >
                        {/* Customer */}
                        <View style={styles.row}>
                            <View style={[styles.iconBox, requestData.customerProfileImage && { backgroundColor: 'transparent', overflow: 'hidden' }]}>
                                {requestData.customerProfileImage ? (
                                    <Image
                                        source={{ uri: requestData.customerProfileImage }}
                                        style={{ width: '100%', height: '100%', borderRadius: 12 }}
                                    />
                                ) : (
                                    <Ionicons name="person" size={18} color={COLORS.primary} />
                                )}
                            </View>
                            <View style={styles.rowContent}>
                                <Text style={styles.rowLabel}>Customer</Text>
                                <Text style={styles.rowValue}>{requestData.customerName}</Text>
                            </View>
                        </View>

                        {/* Location */}
                        <View style={styles.row}>
                            <View style={styles.iconBox}>
                                <Ionicons name="location" size={18} color={COLORS.primary} />
                            </View>
                            <View style={styles.rowContent}>
                                <Text style={styles.rowLabel}>Location</Text>
                                <Text style={styles.rowValue} numberOfLines={2}>
                                    {requestData.customerAddress || 'No address provided'}
                                </Text>
                            </View>
                        </View>

                        {/* Time */}
                        <View style={styles.row}>
                            <View style={styles.iconBox}>
                                <Ionicons name="calendar" size={18} color={COLORS.primary} />
                            </View>
                            <View style={styles.rowContent}>
                                <Text style={styles.rowLabel}>Schedule</Text>
                                <Text style={styles.rowValue}>
                                    {formatDate(requestData.bookingDate)} • {requestData.bookingTime}
                                </Text>
                            </View>
                        </View>

                        {/* Notes */}
                        {requestData.notes && (
                            <View style={styles.noteBox}>
                                <Text style={styles.noteTitle}>Note from customer:</Text>
                                <Text style={styles.noteText}>{requestData.notes}</Text>
                            </View>
                        )}
                    </ScrollView>

                    {/* Actions - Fixed at Bottom */}
                    <View style={styles.actionContainer}>
                        <TouchableOpacity
                            style={styles.declineButton}
                            onPress={() => handleAction('reject')}
                            disabled={isAccepting || isRejecting}
                        >
                            <Ionicons name="close" size={24} color={COLORS.textSecondary} />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.acceptButtonWrapper}
                            onPress={() => handleAction('accept')}
                            disabled={isAccepting || isRejecting}
                            activeOpacity={0.9}
                        >
                            <LinearGradient
                                colors={['#3B82F6', '#2563EB']} // Primary Gradient
                                style={styles.acceptButton}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                            >
                                {isAccepting ? (
                                    <Text style={styles.acceptText}>Accepting...</Text>
                                ) : (
                                    <>
                                        <Text style={styles.acceptText}>Accept Job</Text>
                                        <Ionicons name="arrow-forward" size={20} color={COLORS.white} />
                                    </>
                                )}
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
        justifyContent: 'flex-end', // Bottom sheet style
        backgroundColor: 'rgba(0,0,0,0.6)',
    },
    container: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingTop: 24,
        paddingHorizontal: 20,
        paddingBottom: 40,
        maxHeight: height * 0.85,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 25,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.primaryLight,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 100,
        gap: 6,
        borderWidth: 1,
        borderColor: '#DBEAFE',
    },
    badgeDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: COLORS.primary,
    },
    badgeText: {
        fontSize: 12,
        fontWeight: '700',
        color: COLORS.primary,
        letterSpacing: 0.5,
    },
    timerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#F1F5F9', // Slate 100
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 100,
    },
    timerUrgent: {
        backgroundColor: '#FEF2F2',
    },
    timerText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#71717A',
        fontVariant: ['tabular-nums'],
    },
    textUrgent: {
        color: '#EF4444',
    },
    heroSection: {
        alignItems: 'center',
        marginBottom: 24,
    },
    heroLabel: {
        fontSize: 14,
        color: COLORS.textSecondary,
        marginBottom: 4,
        fontWeight: '500',
    },
    heroPrice: {
        fontSize: 48,
        fontWeight: '800',
        color: COLORS.text, // Slate 900
        letterSpacing: -1,
        marginBottom: 8,
    },
    serviceName: {
        fontSize: 18,
        fontWeight: '600',
        color: COLORS.primary,
        textAlign: 'center',
    },
    divider: {
        height: 1,
        backgroundColor: '#F3F4F6',
        marginBottom: 24,
    },
    detailsContainer: {
        flexGrow: 0,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center', // Changed from flex-start to align icons better
        marginBottom: 20,
        gap: 16,
    },
    iconBox: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: COLORS.primaryLight,
        alignItems: 'center',
        justifyContent: 'center',
    },
    rowContent: {
        flex: 1,
    },
    rowLabel: {
        fontSize: 12,
        color: COLORS.textSecondary,
        marginBottom: 2,
        fontWeight: '500',
    },
    rowValue: {
        fontSize: 16,
        color: COLORS.text,
        fontWeight: '600',
    },
    distanceText: {
        fontSize: 12,
        color: '#71717A',
        marginTop: 2,
    },
    ratingBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFBEB',
        alignSelf: 'flex-start',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        marginTop: 4,
        gap: 2,
    },
    ratingText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#B45309',
    },
    noteBox: {
        backgroundColor: '#FEFCE8', // Light yellow
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#FEF08A',
        marginBottom: 20,
    },
    noteTitle: {
        fontSize: 12,
        fontWeight: '700',
        color: '#854D0E',
        marginBottom: 4,
    },
    noteText: {
        fontSize: 14,
        color: '#854D0E',
    },
    actionContainer: {
        flexDirection: 'row',
        gap: 16,
        marginTop: 8,
    },
    declineButton: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#F1F5F9', // Slate 100
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    acceptButtonWrapper: {
        flex: 1,
        height: 64,
        borderRadius: 32,
        overflow: 'hidden',
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 8,
    },
    acceptButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
    },
    acceptText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#FFFFFF',
    },
});
