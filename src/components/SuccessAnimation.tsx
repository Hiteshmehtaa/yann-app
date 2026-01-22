import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY, SHADOWS } from '../utils/theme';

interface SuccessAnimationProps {
    visible: boolean;
    message?: string;
    onHide?: () => void;
    duration?: number;
}

const { width } = Dimensions.get('window');

export const SuccessAnimation: React.FC<SuccessAnimationProps> = ({
    visible,
    message = 'Success!',
    onHide,
    duration = 2000,
}) => {
    const scaleAnim = useRef(new Animated.Value(0)).current;
    const opacityAnim = useRef(new Animated.Value(0)).current;
    const checkmarkScale = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            // Trigger success haptic
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

            // Animate in
            Animated.parallel([
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    tension: 50,
                    friction: 7,
                    useNativeDriver: true,
                }),
                Animated.timing(opacityAnim, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true,
                }),
            ]).start();

            // Animate checkmark with delay
            setTimeout(() => {
                Animated.spring(checkmarkScale, {
                    toValue: 1,
                    tension: 100,
                    friction: 5,
                    useNativeDriver: true,
                }).start();
            }, 100);

            // Auto hide
            const timer = setTimeout(() => {
                Animated.parallel([
                    Animated.timing(scaleAnim, {
                        toValue: 0,
                        duration: 200,
                        useNativeDriver: true,
                    }),
                    Animated.timing(opacityAnim, {
                        toValue: 0,
                        duration: 200,
                        useNativeDriver: true,
                    }),
                ]).start(() => {
                    checkmarkScale.setValue(0);
                    onHide?.();
                });
            }, duration);

            return () => clearTimeout(timer);
        }
    }, [visible]);

    if (!visible) return null;

    return (
        <View style={styles.overlay}>
            <Animated.View
                style={[
                    styles.container,
                    {
                        transform: [{ scale: scaleAnim }],
                        opacity: opacityAnim,
                    },
                ]}
            >
                <View style={styles.iconContainer}>
                    <Animated.View
                        style={{
                            transform: [{ scale: checkmarkScale }],
                        }}
                    >
                        <Ionicons name="checkmark-circle" size={64} color={COLORS.success} />
                    </Animated.View>
                </View>
                <Text style={styles.message}>{message}</Text>
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    overlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        zIndex: 9999,
    },
    container: {
        backgroundColor: COLORS.white,
        borderRadius: RADIUS.large,
        padding: SPACING.xl,
        alignItems: 'center',
        minWidth: width * 0.6,
        maxWidth: width * 0.8,
        ...SHADOWS.lg,
    },
    iconContainer: {
        marginBottom: SPACING.md,
    },
    message: {
        fontSize: TYPOGRAPHY.size.lg,
        fontWeight: '600',
        color: COLORS.text,
        textAlign: 'center',
    },
});
