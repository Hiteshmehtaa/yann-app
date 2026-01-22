import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Animated } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY, SHADOWS } from '../utils/theme';

interface LogoutConfirmModalProps {
    visible: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

export const LogoutConfirmModal: React.FC<LogoutConfirmModalProps> = ({
    visible,
    onConfirm,
    onCancel,
}) => {
    const scaleAnim = React.useRef(new Animated.Value(0)).current;

    React.useEffect(() => {
        if (visible) {
            Animated.spring(scaleAnim, {
                toValue: 1,
                tension: 50,
                friction: 7,
                useNativeDriver: true,
            }).start();
        } else {
            scaleAnim.setValue(0);
        }
    }, [visible]);

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onCancel}
        >
            <View style={styles.overlay}>
                <BlurView intensity={20} style={StyleSheet.absoluteFill} />

                <Animated.View
                    style={[
                        styles.modalContainer,
                        {
                            transform: [{ scale: scaleAnim }],
                        },
                    ]}
                >
                    {/* Icon */}
                    <View style={styles.iconContainer}>
                        <LinearGradient
                            colors={['#FEE2E2', '#FEF2F2']}
                            style={styles.iconGradient}
                        >
                            <Ionicons name="log-out-outline" size={32} color={COLORS.error} />
                        </LinearGradient>
                    </View>

                    {/* Title */}
                    <Text style={styles.title}>Sign Out?</Text>

                    {/* Message */}
                    <Text style={styles.message}>
                        Are you sure you want to sign out? You'll need to log in again to access your account.
                    </Text>

                    {/* Buttons */}
                    <View style={styles.buttonContainer}>
                        {/* Cancel Button */}
                        <TouchableOpacity
                            style={styles.cancelButton}
                            onPress={onCancel}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                        </TouchableOpacity>

                        {/* Confirm Button */}
                        <TouchableOpacity
                            style={styles.confirmButton}
                            onPress={onConfirm}
                            activeOpacity={0.8}
                        >
                            <LinearGradient
                                colors={['#EF4444', '#DC2626']}
                                style={styles.confirmButtonGradient}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                            >
                                <Text style={styles.confirmButtonText}>Sign Out</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: SPACING.xl,
    },
    modalContainer: {
        backgroundColor: COLORS.white,
        borderRadius: RADIUS.large,
        padding: SPACING.xl,
        width: '100%',
        maxWidth: 340,
        alignItems: 'center',
        ...SHADOWS.lg,
    },
    iconContainer: {
        marginBottom: SPACING.lg,
    },
    iconGradient: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: TYPOGRAPHY.size.xxl,
        fontWeight: '700',
        color: COLORS.text,
        marginBottom: SPACING.sm,
        textAlign: 'center',
    },
    message: {
        fontSize: TYPOGRAPHY.size.md,
        color: COLORS.textSecondary,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: SPACING.xl,
    },
    buttonContainer: {
        flexDirection: 'row',
        gap: SPACING.md,
        width: '100%',
    },
    cancelButton: {
        flex: 1,
        paddingVertical: SPACING.md,
        borderRadius: RADIUS.medium,
        backgroundColor: COLORS.gray100,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelButtonText: {
        fontSize: TYPOGRAPHY.size.md,
        fontWeight: '600',
        color: COLORS.text,
    },
    confirmButton: {
        flex: 1,
        borderRadius: RADIUS.medium,
        overflow: 'hidden',
    },
    confirmButtonGradient: {
        paddingVertical: SPACING.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    confirmButtonText: {
        fontSize: TYPOGRAPHY.size.md,
        fontWeight: '600',
        color: COLORS.white,
    },
});
