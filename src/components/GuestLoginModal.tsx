import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, RADIUS, SHADOWS, TYPOGRAPHY } from '../utils/theme';
import { useAuth } from '../contexts/AuthContext';
import { BlurView } from 'expo-blur';

const { width } = Dimensions.get('window');

type Props = {
    visible: boolean;
    onClose: () => void;
    navigation: any;
    title?: string;
    message?: string;
};

export const GuestLoginModal: React.FC<Props> = ({
    visible,
    onClose,
    navigation,
    title = "Account Required",
    message = "Please sign in or create an account to access this feature."
}) => {
    const { logout } = useAuth();

    const handleSignIn = async () => {
        onClose();
        await logout(); // Resets isGuest, navigates to Auth Stack
        // Navigation is handled by AppNavigator switching stacks, 
        // but we can try to influence it if needed. 
        // For now, logout() effectively takes them to RoleSelection/Login logic.
    };

    const handleCreateAccount = async () => {
        onClose();
        await logout();
    };

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <TouchableOpacity
                    style={StyleSheet.absoluteFill}
                    activeOpacity={1}
                    onPress={onClose}
                >
                    <BlurView intensity={20} style={StyleSheet.absoluteFill} tint="dark" />
                </TouchableOpacity>

                <View style={styles.modalContainer}>
                    <LinearGradient
                        colors={[COLORS.white, '#F8FAFC']}
                        style={styles.content}
                    >
                        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                            <Ionicons name="close" size={24} color={COLORS.textTertiary} />
                        </TouchableOpacity>

                        <View style={styles.iconContainer}>
                            <LinearGradient
                                colors={['#E0E7FF', '#F0F9FF']}
                                style={styles.iconBackground}
                            >
                                <Ionicons name="person-add" size={32} color={COLORS.primary} />
                            </LinearGradient>
                        </View>

                        <Text style={styles.title}>{title}</Text>
                        <Text style={styles.message}>{message}</Text>

                        <View style={styles.actions}>
                            <TouchableOpacity style={styles.primaryButton} onPress={handleSignIn}>
                                <LinearGradient
                                    colors={[COLORS.primary, '#4F46E5']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={styles.gradientButton}
                                >
                                    <Text style={styles.primaryButtonText}>Sign In</Text>
                                    <Ionicons name="arrow-forward" size={20} color={COLORS.white} />
                                </LinearGradient>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.secondaryButton} onPress={handleCreateAccount}>
                                <Text style={styles.secondaryButtonText}>Create Account</Text>
                            </TouchableOpacity>
                        </View>
                    </LinearGradient>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: SPACING.xl,
    },
    modalContainer: {
        width: '100%',
        maxWidth: 340,
        borderRadius: RADIUS.xl,
        overflow: 'hidden',
        ...SHADOWS.lg,
    },
    content: {
        padding: SPACING.xl,
        alignItems: 'center',
    },
    closeButton: {
        position: 'absolute',
        top: SPACING.md,
        right: SPACING.md,
        padding: SPACING.xs,
        zIndex: 10,
    },
    iconContainer: {
        marginBottom: SPACING.lg,
    },
    iconBackground: {
        width: 72,
        height: 72,
        borderRadius: 36,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E0E7FF',
    },
    title: {
        fontSize: TYPOGRAPHY.size.xl,
        fontWeight: '800',
        color: COLORS.text,
        marginBottom: SPACING.sm,
        textAlign: 'center',
    },
    message: {
        fontSize: TYPOGRAPHY.size.md,
        color: COLORS.textSecondary,
        textAlign: 'center',
        marginBottom: SPACING.xl,
        lineHeight: 22,
    },
    actions: {
        width: '100%',
        gap: SPACING.md,
    },
    primaryButton: {
        width: '100%',
        borderRadius: RADIUS.large,
        overflow: 'hidden',
        ...SHADOWS.md,
    },
    gradientButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        gap: SPACING.xs,
    },
    primaryButtonText: {
        fontSize: TYPOGRAPHY.size.md,
        fontWeight: '700',
        color: COLORS.white,
    },
    secondaryButton: {
        width: '100%',
        paddingVertical: 16,
        borderRadius: RADIUS.large,
        borderWidth: 1.5,
        borderColor: COLORS.border,
        alignItems: 'center',
        backgroundColor: COLORS.white,
    },
    secondaryButtonText: {
        fontSize: TYPOGRAPHY.size.md,
        fontWeight: '700',
        color: COLORS.text,
    },
});
