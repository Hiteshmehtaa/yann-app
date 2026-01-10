/**
 * Rotating Lottie Banner
 * 
 * Shows rotating Lottie animations in random order
 */

import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions, Animated } from 'react-native';
import LottieView from 'lottie-react-native';

const { width } = Dimensions.get('window');

const LOTTIE_ANIMATIONS = [
    {
        id: 'driving-car',
        source: require('../../../assets/lottie/Driving Car.json'),
    },
    {
        id: 'meditating-mechanic',
        source: require('../../../assets/lottie/Meditating Mechanic.json'),
    },
    {
        id: 'puja-thali',
        source: require('../../../assets/lottie/puja ki thali.json'),
    },
    {
        id: 'taxi-booking',
        source: require('../../../assets/lottie/taxi booking.json'),
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
                duration: 300,
                useNativeDriver: true,
            }).start(() => {
                // Change animation
                setCurrentIndex((prev) => (prev + 1) % animations.length);

                // Fade in
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 300,
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

    return (
        <View style={styles.container}>
            <Animated.View style={[styles.animationContainer, { opacity: fadeAnim }]}>
                <LottieView
                    ref={lottieRef}
                    source={animations[currentIndex].source}
                    autoPlay
                    loop
                    style={styles.lottie}
                    resizeMode="contain"
                    colorFilters={[
                        {
                            keypath: '*',
                            color: '#FFFFFF',
                        },
                    ]}
                />
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: width - 40,
        height: 180,
        marginHorizontal: 20,
        marginBottom: 24,
        borderRadius: 16,
        backgroundColor: '#FFFFFF',
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    animationContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    lottie: {
        width: '100%',
        height: '100%',
    },
});
