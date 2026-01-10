/**
 * Ambient Hero Animation
 * 
 * A premium, text-free animation container that serves as the visual anchor
 * for the home screen. Uses cinematic cross-dissolves and subtle scaling
 * to create a living, breathing interface element.
 */

import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions, Animated, Easing, Pressable } from 'react-native';
import LottieView from 'lottie-react-native';

const { width } = Dimensions.get('window');
    },
{
    id: 'meditating-mechanic',
        source: require('../../../assets/lottie/Meditating Mechanic.json'),
            title: 'Expert Mechanics',
                subtitle: 'Quick Fixes Anywhere',
    },
{
    id: 'puja-thali',
        source: require('../../../assets/lottie/puja ki thali.json'),
            title: 'Pujari Services',
                subtitle: 'Divine Rituals at Home',
    },
{
    id: 'taxi-booking',
        source: require('../../../assets/lottie/taxi booking.json'),
            title: 'Instant Rides',
                subtitle: 'Book Taxis in Minutes',
                    colorFilters: [
                        {
                            keypath: 'BG',
                            color: '#FFFFFF',
                        },
                        {
                            keypath: 'BG_SHAPES',
                            color: '#FFFFFF',
                        },
                        {
                            keypath: 'BG_shape_*',
                            color: '#FFFFFF',
                        },
                    ],
    },
{
    id: 'plumber',
        source: require('../../../assets/lottie/Plumbers.json'),
            title: 'Expert Plumbers',
                subtitle: 'Fixing Leaks Instantly',
    },
{
    id: 'sweeping-floor',
        source: require('../../../assets/lottie/Sweeping Floor.json'),
            title: 'Home Cleaning',
                subtitle: 'Sparkling Clean Floors',
    },
{
    id: 'car-cleaning',
        source: require('../../../assets/lottie/Car Cleaning.json'),
            title: 'Car Cleaning',
                subtitle: 'Professional Car Wash',
    },
{
    id: 'wallet-payment',
        source: require('../../../assets/lottie/Payment Success.json'),
            title: 'Secure Payments',
                subtitle: 'Pay via Yann Wallet',
    },
];

// Shuffle array function
const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
};

export const RotatingLottieBanner: React.FC = () => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [animations, setAnimations] = useState(LOTTIE_ANIMATIONS);
    const fadeAnim = useRef(new Animated.Value(1)).current;
    const lottieRef = useRef<LottieView>(null);

    // Shuffle animations on mount
    useEffect(() => {
        setAnimations(shuffleArray(LOTTIE_ANIMATIONS));
    }, []);

    // Rotate animations every 8 seconds (longer duration for taxi booking)
    useEffect(() => {
        const interval = setInterval(() => {
            // Fade out
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 400,
                useNativeDriver: true,
            }).start(() => {
                // Change animation
                setCurrentIndex((prev) => (prev + 1) % animations.length);

                // Fade in
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 400,
                    useNativeDriver: true,
                }).start();
            });
        }, 8000); // Changed to 8 seconds for longer playback

        return () => clearInterval(interval);
    }, [animations.length]);

    // Restart animation when index changes
    useEffect(() => {
        lottieRef.current?.play();
    }, [currentIndex]);

    const currentItem = animations[currentIndex];

    return (
        <View style={styles.container}>
            <Animated.View style={[styles.contentContainer, { opacity: fadeAnim }]}>
                {/* White background layer */}
                <View style={styles.whiteBackground} />

                {/* Animation */}
                <View style={styles.lottieWrapper}>
                    <LottieView
                        ref={lottieRef}
                        source={currentItem.source}
                        autoPlay
                        loop
                        style={styles.lottie}
                        resizeMode="contain"
                        colorFilters={currentItem.colorFilters}
                    />
                </View>

                {/* Text Overlay */}
                <View style={styles.textOverlay}>
                    <Text style={styles.title}>{currentItem.title}</Text>
                    <Text style={styles.subtitle}>{currentItem.subtitle}</Text>
                </View>
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: width - 40,
        height: 200, // Increased height for better text spacing
        marginHorizontal: 20,
        marginBottom: 24,
        borderRadius: 20,
        backgroundColor: '#FFFFFF',
        // Premium Soft Colored Shadow
        shadowColor: '#4F46E5', // Indigo shadow
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
        elevation: 8,
    },
    contentContainer: {
        flex: 1,
        overflow: 'hidden',
        borderRadius: 20,
    },
    whiteBackground: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#FFFFFF',
        zIndex: -1,
    },
    lottieWrapper: {
        flex: 1,
        width: '100%',
        height: '100%',
        position: 'absolute',
    },
    lottie: {
        width: '100%',
        height: '100%',
    },
    textOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 20,
        paddingTop: 40, // More space for gradient effect if added later
        justifyContent: 'flex-end',
        // Subtle gradient background for text readability if needed, for now keeping it clean
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        color: '#1E293B',
        marginBottom: 4,
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 14,
        fontWeight: '500',
        color: '#64748B',
        letterSpacing: 0.2,
    },
});
