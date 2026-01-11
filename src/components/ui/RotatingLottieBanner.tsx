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
const HEIGHT = 240;
const TRANSITION_DURATION = 1200; // Slower, more cinematic transition
const DISPLAY_DURATION = 9000;

// Curated list of high-quality animations
const HERO_ANIMATIONS = [
    {
        id: 'car-cleaning',
        source: require('../../../assets/lottie/Car Cleaning.json'),
        scale: 1.1, // Slight zoom for impact
    },
    {
        id: 'sweeping-floor',
        source: require('../../../assets/lottie/Sweeping Floor.json'),
        scale: 1.0,
    },
    {
        // Taxi booking has a white BG, so we handle it gracefully
        id: 'taxi-booking',
        source: require('../../../assets/lottie/taxi booking.json'),
        scale: 1.05,
        colorFilters: [
            { keypath: 'BG', color: '#FFFFFF' },
            { keypath: 'BG_SHAPES', color: '#FFFFFF' },
            { keypath: 'BG_shape_*', color: '#FFFFFF' },
        ],
    },
    {
        id: 'driving-car',
        source: require('../../../assets/lottie/Driving Car.json'),
        scale: 1.0,
    },
    {
        id: 'plumber',
        source: require('../../../assets/lottie/Plumbers.json'),
        scale: 1.0,
    },
    {
        id: 'wallet-payment',
        source: require('../../../assets/lottie/Payment Success.json'),
        scale: 1.0,
    },
    {
        id: 'meditating-mechanic',
        source: require('../../../assets/lottie/Meditating Mechanic.json'),
        scale: 1.0,
    },
    {
        id: 'puja-thali',
        source: require('../../../assets/lottie/puja ki thali.json'),
        scale: 1.0,
    },
];

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
    // Initialize with a shuffled array right away to avoid showing the default order first
    const [animations, setAnimations] = useState(() => shuffleArray(HERO_ANIMATIONS));
    const [isTransitioning, setIsTransitioning] = useState(false);

    // Animation values for the cross-dissolve effect
    const transitionAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const pressAnim = useRef(new Animated.Value(1)).current;

    // Refs for Lottie instances
    const currentLottieRef = useRef<LottieView>(null);

    // No need for a separate useEffect to shuffle on mount anymore

    // Visual Loop Logic
    // We removed the setInterval. Now we rely on onAnimationFinish of the Lottie component.

    const runTransition = (isCancelled: boolean) => {
        // Prevent double triggers or triggers from cancelled animations
        if (isCancelled || isTransitioning) return;

        setIsTransitioning(true);

        // Attempt to freeze the current animation on the last frame
        try {
            currentLottieRef.current?.pause();
        } catch (e) {
            // ignore
        }

        // 1. Reset transition state
        transitionAnim.setValue(0);

        // 2. Start the cinematic transition
        Animated.parallel([
            Animated.timing(transitionAnim, {
                toValue: 1,
                duration: 800,
                easing: Easing.bezier(0.4, 0.0, 0.2, 1),
                useNativeDriver: true,
            }),
            Animated.sequence([
                Animated.timing(scaleAnim, {
                    toValue: 0.98,
                    duration: 400,
                    useNativeDriver: true,
                }),
                Animated.timing(scaleAnim, {
                    toValue: 1,
                    duration: 400,
                    useNativeDriver: true,
                }),
            ]),
        ]).start(() => {
            // 3. Commit the state change
            setCurrentIndex((prev) => {
                const nextIndex = (prev + 1) % animations.length;
                // If we wrapped around to 0, shuffle the list again to keep it random
                if (nextIndex === 0) {
                    let newOrder = shuffleArray(HERO_ANIMATIONS);
                    if (newOrder[0].id === animations[animations.length - 1].id) {
                        newOrder = shuffleArray(HERO_ANIMATIONS);
                    }
                    setAnimations(newOrder);
                }
                return nextIndex;
            });
            transitionAnim.setValue(0);
            setIsTransitioning(false);
        });
    };

    // Fallback timer to prevent stuck animations if onAnimationFinish doesn't fire
    useEffect(() => {
        const timer = setTimeout(() => {
            if (!isTransitioning) {
                runTransition(false);
            }
        }, DISPLAY_DURATION); // 9000ms fallback

        return () => clearTimeout(timer);
    }, [currentIndex, isTransitioning]);

    // Touch Interaction
    const handlePressIn = () => {
        Animated.spring(pressAnim, {
            toValue: 0.96,
            useNativeDriver: true,
            speed: 20,
            bounciness: 4,
        }).start();
    };

    const handlePressOut = () => {
        Animated.spring(pressAnim, {
            toValue: 1,
            useNativeDriver: true,
            speed: 20,
            bounciness: 4,
        }).start();
    };

    const currentItem = animations[currentIndex];
    // Calculate next item for the "incoming" layer
    const nextItem = animations[(currentIndex + 1) % animations.length];

    return (
        <View style={styles.wrapper}>
            <Pressable
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                style={styles.touchable}
            >
                <Animated.View style={[
                    styles.container,
                    { transform: [{ scale: pressAnim }, { scale: scaleAnim }] }
                ]}>

                    {/* Layer 1: The "Next" Animation (Bottom/Incoming) */}
                    {/* We position absolute so it sits behind or blends */}
                    <Animated.View
                        style={[
                            styles.layer,
                            {
                                opacity: transitionAnim, // Fades IN
                                zIndex: 2, // Becomes top
                            }
                        ]}
                    >
                        <LottieView
                            key={`next-${nextItem?.id}`} // Key forces remount/reset
                            source={nextItem?.source}
                            autoPlay
                            loop={false}
                            style={styles.lottie}
                            resizeMode="contain"
                            colorFilters={nextItem?.colorFilters}
                        />
                    </Animated.View>

                    {/* Layer 2: The "Current" Animation (Top/Outgoing) */}
                    <Animated.View
                        style={[
                            styles.layer,
                            {
                                opacity: transitionAnim.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [1, 0] // Fades OUT
                                }),
                                zIndex: 1,
                            }
                        ]}
                    >
                        <LottieView
                            ref={currentLottieRef}
                            key={`current-${currentItem?.id}`}
                            source={currentItem?.source}
                            autoPlay
                            loop={false}
                            onAnimationFinish={runTransition}
                            style={styles.lottie}
                            resizeMode="contain"
                            colorFilters={currentItem?.colorFilters}
                        />
                    </Animated.View>


                </Animated.View>
            </Pressable>
        </View>
    );
};

const styles = StyleSheet.create({
    wrapper: {
        alignItems: 'center',
        marginBottom: 32,
        marginTop: 16,
    },
    touchable: {
        width: width - 32,
        height: HEIGHT,
    },
    container: {
        flex: 1,
        // Removed white background and shadows as per user request
        // backgroundColor: '#FFFFFF', 
        borderRadius: 24,
        overflow: 'hidden', // clipped to bounds
    },
    layer: {
        ...StyleSheet.absoluteFillObject,
        borderRadius: 24,
        overflow: 'hidden',
        // backgroundColor: '#FFFFFF', // Transparent
        justifyContent: 'center',
        alignItems: 'center',
    },
    lottie: {
        width: '100%',
        height: '100%',
    },
    // ambientGlow removed
});
