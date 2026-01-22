import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as SplashScreen from 'expo-splash-screen';
import { COLORS } from '../utils/theme';

const { width, height } = Dimensions.get('window');

interface AnimatedSplashProps {
    onAnimationComplete: () => void;
    isReady: boolean;
}

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export const AnimatedSplash: React.FC<AnimatedSplashProps> = ({
    onAnimationComplete,
    isReady,
}) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.3)).current;
    const logoRotate = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (isReady) {
            // Hide the native splash screen
            SplashScreen.hideAsync();

            // Start animations
            Animated.parallel([
                // Fade in
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 800,
                    useNativeDriver: true,
                }),
                // Scale up with spring
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    tension: 20,
                    friction: 7,
                    useNativeDriver: true,
                }),
                // Subtle rotation
                Animated.timing(logoRotate, {
                    toValue: 1,
                    duration: 1200,
                    useNativeDriver: true,
                }),
            ]).start();

            // Auto-complete after animation
            const timer = setTimeout(() => {
                // Fade out
                Animated.parallel([
                    Animated.timing(fadeAnim, {
                        toValue: 0,
                        duration: 400,
                        useNativeDriver: true,
                    }),
                    Animated.timing(scaleAnim, {
                        toValue: 1.2,
                        duration: 400,
                        useNativeDriver: true,
                    }),
                ]).start(() => {
                    onAnimationComplete();
                });
            }, 2000); // Show for 2 seconds

            return () => clearTimeout(timer);
        }
    }, [isReady]);

    const rotate = logoRotate.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    if (!isReady) {
        return null; // Show native splash while loading
    }

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={[COLORS.primary, COLORS.secondary || '#764ba2']}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            />

            <Animated.View
                style={[
                    styles.logoContainer,
                    {
                        opacity: fadeAnim,
                        transform: [
                            { scale: scaleAnim },
                            { rotate },
                        ],
                    },
                ]}
            >
                {/* Logo Circle */}
                <View style={styles.logoCircle}>
                    <View style={styles.logoInner}>
                        {/* You can replace this with your actual logo */}
                        <Animated.Text style={styles.logoText}>Y</Animated.Text>
                    </View>
                </View>

                {/* App Name */}
                <Animated.Text style={[styles.appName, { opacity: fadeAnim }]}>
                    Yann
                </Animated.Text>
                <Animated.Text style={[styles.tagline, { opacity: fadeAnim }]}>
                    Home Services Made Easy
                </Animated.Text>
            </Animated.View>

            {/* Animated dots */}
            <Animated.View style={[styles.dotsContainer, { opacity: fadeAnim }]}>
                <View style={styles.dot} />
                <View style={[styles.dot, styles.dotDelay1]} />
                <View style={[styles.dot, styles.dotDelay2]} />
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.primary,
    },
    logoContainer: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    logoCircle: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    logoInner: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoText: {
        fontSize: 48,
        fontWeight: '800',
        color: COLORS.primary,
    },
    appName: {
        fontSize: 36,
        fontWeight: '800',
        color: '#FFFFFF',
        marginBottom: 8,
        letterSpacing: 2,
    },
    tagline: {
        fontSize: 14,
        fontWeight: '500',
        color: 'rgba(255, 255, 255, 0.9)',
        letterSpacing: 1,
    },
    dotsContainer: {
        flexDirection: 'row',
        position: 'absolute',
        bottom: 80,
        gap: 8,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: 'rgba(255, 255, 255, 0.6)',
    },
    dotDelay1: {
        opacity: 0.7,
    },
    dotDelay2: {
        opacity: 0.4,
    },
});
