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

    useEffect(() => {
        // Entrance Fade
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
        }).start();
    }, []);

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 17) return 'Good Afternoon';
        return 'Good Evening';
    };

    return (
        <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
            <View style={styles.headerContent}>
                <View>
                    <Text style={[styles.greeting, { color: colors.textSecondary }]}>
                        {getGreeting()}
                    </Text>
                    <Text style={[styles.name, { color: colors.text }]}>
                        {userName.split(' ')[0]}
                    </Text>
                </View>

                {/* Dynamic Stats Pill - Replaces Pulse/Weather */}
                <View style={[
                    styles.statsPill,
                    {
                        backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.8)',
                        borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'
                    }
                ]}>
                    <Ionicons name="flash" size={12} color={COLORS.primary} style={{ marginRight: 6 }} />
                    <Text style={[styles.statsText, { color: colors.textSecondary }]}>
                        {activeServices} Services • {activeProviders} Providers active
                    </Text>
                </View>
            </View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 24,
        paddingTop: 30, // More breathing room
        paddingBottom: 20,
    },
    headerContent: {
        marginBottom: 8,
    },
    greeting: {
        fontSize: 18,
        fontWeight: '400', // Thinner, more elegant
        marginBottom: 2,
        letterSpacing: 0.5,
        opacity: 0.8,
    },
    name: {
        fontSize: 42, // Massive editorial size
        fontWeight: '300', // Light font weight for premium feel
        letterSpacing: -1.5,
        marginBottom: 16,
    },
    statsPill: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
    },
    statsText: {
        fontSize: 12,
        fontWeight: '600',
        letterSpacing: 0.2,
    },
});
