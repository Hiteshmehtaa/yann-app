import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SHADOWS, RADIUS } from '../../utils/theme';
import { useTheme } from '../../contexts/ThemeContext';

interface SmartHeroProps {
    userName?: string;
    activeServices?: number;
    activeProviders?: number;
}

export const SmartHero: React.FC<SmartHeroProps> = ({
    userName = 'Guest',
    activeServices = 12,
    activeProviders = 45
}) => {
    const { colors, isDark } = useTheme();

    // Animation values
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;

    useEffect(() => {
        // Entrance Animation - Staggered
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
                easing: Easing.out(Easing.cubic),
            }),
            Animated.spring(slideAnim, {
                toValue: 0,
                tension: 40,
                friction: 8,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 17) return 'Good Afternoon';
        return 'Good Evening';
    };

    return (
        <Animated.View style={[styles.container, { 
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
        }]}>
            {/* Main Header */}
            <View style={styles.headerContent}>
                <View style={styles.textContainer}>
                    <Text style={[styles.greeting, { color: colors.textSecondary }]}>
                        {getGreeting()}
                    </Text>
                    <Text style={[styles.name, { color: colors.text }]}>
                        {userName.split(' ')[0]}
                    </Text>
                </View>

                {/* Enhanced Stats Card - Premium Glass Design */}
                <View style={[
                    styles.statsPill,
                    {
                        backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.9)',
                        borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
                        shadowColor: isDark ? '#000' : COLORS.primary,
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: isDark ? 0.3 : 0.08,
                        shadowRadius: 12,
                        elevation: 4,
                    }
                ]}>
                    <View style={[styles.statsIconContainer, { backgroundColor: COLORS.primary + '15' }]}>
                        <Ionicons name=\"flash\" size={14} color={COLORS.primary} />
                    </View>
                    <View style={styles.statsContent}>
                        <Text style={[styles.statsValue, { color: colors.text }]}>
                            {activeServices} Services
                        </Text>
                        <Text style={[styles.statsSeparator, { color: colors.textTertiary }]}> • </Text>
                        <Text style={[styles.statsLabel, { color: colors.textSecondary }]}>
                            {activeProviders} Active
                        </Text>
                    </View>
                </View>
            </View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 24,
        paddingTop: 24,
        paddingBottom: 24,
    },
    headerContent: {
        gap: 20,
    },
    textContainer: {
        gap: 4,
    },
    greeting: {
        fontSize: 15,
        fontWeight: '500',
        letterSpacing: 0.3,
        opacity: 0.8,
        textTransform: 'capitalize',
    },
    name: {
        fontSize: 36,
        fontWeight: '700',
        letterSpacing: -1.2,
        lineHeight: 42,
    },
    statsPill: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 16,
        borderWidth: 1,
        gap: 10,
    },
    statsIconContainer: {
        width: 24,
        height: 24,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    statsContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statsValue: {
        fontSize: 13,
        fontWeight: '700',
        letterSpacing: 0.1,
    },
    statsSeparator: {
        fontSize: 12,
        fontWeight: '600',
    },
    statsLabel: {
        fontSize: 13,
        fontWeight: '500',
        letterSpacing: 0.1,
    },
});
