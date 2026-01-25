import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Animated, Image, Dimensions, Easing, Text, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as SplashScreen from 'expo-splash-screen';
import { BlurView } from 'expo-blur';
import { Sparkles, CloudRain as Droplets, Zap, Brush as Paintbrush, Wind, Leaf, Users, Shirt, Home, Wrench, Key } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

// App Theme Blue Gradient (aligned with src/utils/theme.ts)
const BG_GRADIENT = ['#1e3a8a', '#2563eb', '#3b82f6'];

// Icons to orbit
const ORBIT_ICONS_1 = [Sparkles, Zap, Home];
const ORBIT_ICONS_2 = [Leaf, Wrench, Shirt];


interface AnimatedSplashProps {
    onAnimationComplete: () => void;
    isReady: boolean;
}

SplashScreen.preventAutoHideAsync();

export const AnimatedSplash: React.FC<AnimatedSplashProps> = ({
    onAnimationComplete,
    isReady,
}) => {
    const insets = useSafeAreaInsets();


    // Animation Values
    const rotationAnim1 = useRef(new Animated.Value(0)).current;
    const rotationAnim2 = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0)).current;
    const opacityAnim = useRef(new Animated.Value(0)).current; // Controls background/content fade
    const logoPulse = useRef(new Animated.Value(1)).current;

    // Movement Animation (Progress 0 -> 1)
    const moveProgress = useRef(new Animated.Value(0)).current;

    // Staggered icon animations
    const iconsScale1 = useRef(ORBIT_ICONS_1.map(() => new Animated.Value(0))).current;
    const iconsScale2 = useRef(ORBIT_ICONS_2.map(() => new Animated.Value(0))).current;

    // Scale Animation (Restored)
    const logoScale = useRef(new Animated.Value(1)).current;

    // State for dynamic target coordinates
    const [moveTargets, setMoveTargets] = useState({ x: 0, y: 0 });

    useEffect(() => {
        const hideNativeSplash = async () => {
            await SplashScreen.hideAsync();
        };
        hideNativeSplash();

        // 1. Entrance Sequence
        Animated.sequence([
            // Fade in main container
            Animated.parallel([
                Animated.timing(opacityAnim, {
                    toValue: 1,
                    duration: 600,
                    useNativeDriver: true,
                    easing: Easing.out(Easing.cubic),
                }),
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    friction: 8,
                    tension: 40,
                    useNativeDriver: true,
                }),
            ]),
            // Staggered Icons Pop-in
            Animated.parallel([
                Animated.stagger(100, iconsScale1.map(anim =>
                    Animated.spring(anim, { toValue: 1, friction: 6, useNativeDriver: true })
                )),
                Animated.stagger(100, iconsScale2.map(anim =>
                    Animated.spring(anim, { toValue: 1, friction: 6, useNativeDriver: true })
                )),
            ])
        ]).start();

        // 2. Continuous Orbit Animations
        Animated.loop(
            Animated.timing(rotationAnim1, {
                toValue: 1,
                duration: 12000,
                easing: Easing.linear,
                useNativeDriver: true,
            })
        ).start();

        Animated.loop(
            Animated.timing(rotationAnim2, {
                toValue: 1,
                duration: 15000,
                easing: Easing.linear,
                useNativeDriver: true,
            })
        ).start();

        // 3. Logo Pulse Heartbeat
        Animated.loop(
            Animated.sequence([
                Animated.timing(logoPulse, {
                    toValue: 1.1,
                    duration: 1000,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(logoPulse, {
                    toValue: 1,
                    duration: 1000,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
            ])
        ).start();

    }, []);


    // Completion & Move Logic
    useEffect(() => {
        if (isReady) {
            // Calculate coordinates immediately
            const targetX = 40;
            const targetY = insets.top + 32;

            const startX = width / 2;
            const startY = height / 2;

            const moveX = targetX - startX;
            const moveY = targetY - startY;

            setMoveTargets({ x: moveX, y: moveY });

            const minTimer = setTimeout(() => {
                // Stop the pulse loop
                logoPulse.stopAnimation();
                logoPulse.setValue(1);

                Animated.parallel([
                    // 1. Fade out background
                    Animated.timing(opacityAnim, {
                        toValue: 0,
                        duration: 500,
                        useNativeDriver: true,
                    }),
                    // 2. Animate Progress (Curve Logic handles X/Y)
                    Animated.timing(moveProgress, {
                        toValue: 1,
                        duration: 500, // Faster (was 800)
                        easing: Easing.inOut(Easing.cubic),
                        useNativeDriver: true,
                    }),
                    // 3. Scale Logo down
                    Animated.timing(logoScale, {
                        toValue: 0.45,
                        duration: 500, // Faster
                        easing: Easing.inOut(Easing.cubic),
                        useNativeDriver: true,
                    })
                ]).start(() => {
                    onAnimationComplete();
                });
            }, 2500);

            return () => clearTimeout(minTimer);
        }
    }, [isReady]);


    // Interpolate Curve
    // X moves Linear (Starts early, consistent)
    const moveX = moveProgress.interpolate({
        inputRange: [0, 1],
        outputRange: [0, moveTargets.x],
    });

    // Y moves with Easing (Slow start, Fast end) -> Creates Curve
    // Deep swoop: Delay vertical movement until later in the progress
    const moveY = moveProgress.interpolate({
        inputRange: [0, 0.4, 0.7, 1], // Delay lift-off
        outputRange: [0, moveTargets.y * 0.1, moveTargets.y * 0.4, moveTargets.y],
    });

    // Interpolations
    const spin1 = rotationAnim1.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
    const spin2 = rotationAnim2.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '-360deg'] });

    return (
        <View style={styles.container} pointerEvents="none">
            {/* Background Layer - Fades out */}
            <Animated.View style={[StyleSheet.absoluteFill, { opacity: opacityAnim }]}>
                <LinearGradient
                    colors={BG_GRADIENT as any}
                    style={StyleSheet.absoluteFill}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                />
                <RisingBubbles />
                <ShootingStars />
                <FloatingShapes />
                <BackgroundParticles />
            </Animated.View>

            {/* Content Container - Orbits fade out with background */}
            <View style={styles.centerContainer}>

                {/* Ripples Layer - Fades out */}
                <Animated.View style={{
                    opacity: opacityAnim,
                    width: width,
                    height: width,
                    justifyContent: 'center',
                    alignItems: 'center'
                }}>
                    {/* Ripples */}
                    <PulseRipple delay={0} />
                    <PulseRipple delay={600} />
                    <PulseRipple delay={1200} />

                    {/* Orbit 1 */}
                    <Animated.View style={[
                        styles.orbitRingContainer,
                        {
                            width: 280, height: 280,
                            transform: [
                                { rotateZ: '45deg' },
                                { rotate: spin1 },
                                { scaleX: 0.6 }
                            ]
                        }
                    ]}>
                        <View style={styles.orbitLine} />
                        {ORBIT_ICONS_1.map((Icon, i) => {
                            const angle = (i / ORBIT_ICONS_1.length) * 2 * Math.PI;
                            const r = 140;
                            return (
                                <View key={i} style={{
                                    position: 'absolute',
                                    left: r + r * Math.cos(angle) - 20,
                                    top: r + r * Math.sin(angle) - 20,
                                }}>
                                    <Animated.View style={[styles.iconContainer, { transform: [{ scale: iconsScale1[i] }, { scaleX: 1 / 0.6 }] }]}>
                                        <Icon size={22} color="#fff" />
                                    </Animated.View>
                                </View>
                            )
                        })}
                    </Animated.View>

                    {/* Orbit 2 */}
                    <Animated.View style={[
                        styles.orbitRingContainer,
                        {
                            width: 280, height: 280,
                            transform: [
                                { rotateZ: '-45deg' },
                                { rotate: spin2 },
                                { scaleX: 0.6 }
                            ]
                        }
                    ]}>
                        <View style={styles.orbitLine} />
                        {ORBIT_ICONS_2.map((Icon, i) => {
                            const angle = (i / ORBIT_ICONS_2.length) * 2 * Math.PI;
                            const r = 140;
                            return (
                                <View key={i} style={{
                                    position: 'absolute',
                                    left: r + r * Math.cos(angle) - 20,
                                    top: r + r * Math.sin(angle) - 20,
                                }}>
                                    <Animated.View style={[styles.iconContainer, { transform: [{ scale: iconsScale2[i] }, { scaleX: 1 / 0.6 }] }]}>
                                        <Icon size={22} color="#fff" />
                                    </Animated.View>
                                </View>
                            )
                        })}
                    </Animated.View>
                </Animated.View>

                {/* Center Logo - Animates INDEPENDENTLY */}
                <Animated.View style={{
                    position: 'absolute',
                    transform: [
                        { translateX: moveX },
                        { translateY: moveY },
                        { scale: Animated.multiply(logoPulse, logoScale) }
                    ],
                    zIndex: 100
                }}>
                    <BlurView intensity={20} tint="light" style={styles.logoGlass}>
                        <Image
                            source={require('../../assets/Logo.jpg')}
                            style={styles.logo}
                            resizeMode="contain"
                        />
                    </BlurView>
                </Animated.View>

                {/* Footer Text - Fades out */}
                <Animated.View style={[styles.footer, { opacity: opacityAnim }]}>
                    <Text style={styles.tagline}>YANN HOME</Text>
                    <Text style={styles.subTagline}>Connecting Services</Text>
                </Animated.View>

            </View>
        </View>
    );
};

// ... keep PulseRipple and BackgroundParticles same ...
// I need to include them since I'm replacing the whole file content block or large chunk.
// I will include them to be safe.

// Pulse Ripple Component
const PulseRipple = ({ delay }: { delay: number }) => {
    const anim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.loop(
            Animated.timing(anim, {
                toValue: 1,
                duration: 2500,
                delay: delay,
                easing: Easing.out(Easing.ease),
                useNativeDriver: true,
            })
        ).start();
    }, []);

    return (
        <Animated.View style={[
            styles.pulseRing,
            {
                transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [1, 2.5] }) }],
                opacity: anim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0] })
            }
        ]} />
    );
};

const BackgroundParticles = () => (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {[...Array(8)].map((_, i) => (
            <Particle key={i} />
        ))}
    </View>
);

const Particle = () => {
    const anim = useRef(new Animated.Value(0)).current;
    const [pos] = useState({
        top: Math.random() * 100,
        left: Math.random() * 100,
        size: Math.random() * 4 + 2
    });

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(anim, { toValue: 1, duration: 2000 + Math.random() * 2000, useNativeDriver: true }),
                Animated.timing(anim, { toValue: 0, duration: 2000 + Math.random() * 2000, useNativeDriver: true })
            ])
        ).start();
    }, []);

    return (
        <Animated.View style={{
            position: 'absolute',
            top: `${pos.top}%`,
            left: `${pos.left}%`,
            width: pos.size,
            height: pos.size,
            borderRadius: pos.size / 2,
            backgroundColor: 'rgba(255,255,255,0.4)',
            opacity: anim,
        }} />
    )
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        zIndex: 9999, // High z-index
        justifyContent: 'center',
        alignItems: 'center',
    },
    centerContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        width: width,
        height: width,
    },
    orbitRingContainer: {
        position: 'absolute',
        justifyContent: 'center',
        alignItems: 'center',
    },
    orbitLine: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.15)',
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(59, 130, 246, 0.9)', // Brand Blue
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#fff',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.4)',
    },
    logoGlass: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.9)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.8)',
        overflow: 'hidden',
        // Glow
        shadowColor: '#fff',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 10,
    },
    logo: {
        width: 80,
        height: 80,
        borderRadius: 40,
    },
    pulseRing: {
        position: 'absolute',
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: 'rgba(255,255,255,0.2)',
        zIndex: 1,
    },
    footer: {
        position: 'absolute',
        bottom: -150, // Moved relative to center container
        alignItems: 'center',
    },
    tagline: {
        color: '#fff',
        fontSize: 20,
        fontWeight: '700',
        letterSpacing: 3,
        marginBottom: 4,
    },
    subTagline: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 12,
        letterSpacing: 1,
    }
});


// Rising Bubbles Component
const RisingBubbles = () => (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {[...Array(12)].map((_, i) => (
            <Bubble key={i} delay={i * 800} />
        ))}
    </View>
);

const Bubble = ({ delay }: { delay: number }) => {
    const anim = useRef(new Animated.Value(0)).current;
    const [config] = useState(() => ({
        left: Math.random() * 100, // Random horizontal position
        size: Math.random() * 30 + 10, // Size between 10 and 40
        speed: Math.random() * 4000 + 4000 // Speed between 4s and 8s
    }));

    useEffect(() => {
        const runAnimation = () => {
            anim.setValue(0);
            Animated.timing(anim, {
                toValue: 1,
                duration: config.speed,
                easing: Easing.inOut(Easing.linear),
                useNativeDriver: true,
                delay: Math.random() * 1000 // Random start delay on repeats
            }).start(() => runAnimation());
        };

        // Initial start
        setTimeout(runAnimation, delay);
    }, []);

    const translateY = anim.interpolate({
        inputRange: [0, 1],
        outputRange: [height * 1.2, -100] // Start below screen, float up past rising
    });

    return (
        <Animated.View style={{
            position: 'absolute',
            left: `${config.left}%`,
            width: config.size,
            height: config.size,
            borderRadius: config.size / 2,
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            transform: [
                { translateY }
            ]
        }} />
    );
};


// Shooting Star Component
const ShootingStars = () => (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {[...Array(5)].map((_, i) => (
            <Star key={i} delay={i * 1500} />
        ))}
    </View>
);

const Star = ({ delay }: { delay: number }) => {
    const anim = useRef(new Animated.Value(0)).current;

    // Random Start Position (Top half, mostly right side to shoot left-down)
    const [config] = useState(() => ({
        top: Math.random() * height * 0.5,
        right: Math.random() * width,
        scale: Math.random() * 0.5 + 0.5,
    }));

    useEffect(() => {
        const loop = () => {
            anim.setValue(0);
            Animated.timing(anim, {
                toValue: 1,
                duration: 1000 + Math.random() * 1000, // 1-2s duration
                easing: Easing.in(Easing.exp), // Accelerate
                useNativeDriver: true,
                delay: Math.random() * 3000 + 1000 // Random delay between stars
            }).start(loop);
        };
        setTimeout(loop, delay);
    }, []);

    const translateX = anim.interpolate({ inputRange: [0, 1], outputRange: [0, -width * 1.8] });
    const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [0, width * 1.8] });

    return (
        <Animated.View style={{
            position: 'absolute',
            top: config.top,
            right: config.right,
            width: 140, // Longer
            height: 4, // Thicker
            backgroundColor: 'rgba(255,255,255,0.8)',
            opacity: anim.interpolate({ inputRange: [0, 0.1, 0.8, 1], outputRange: [0, 1, 1, 0] }),
            transform: [
                { rotate: '-45deg' },
                { translateX },
                { translateY },
                { scale: config.scale }
            ],
            shadowColor: '#fff',
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 1,
            shadowRadius: 15,
        }} >
            {/* Glowing Head */}
            <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: '#fff', position: 'absolute', right: 0, top: -1, shadowColor: '#fff', shadowRadius: 10, shadowOpacity: 1 }} />
        </Animated.View>
    );
};

// Rotating Sun Rays (Background Glow)
const SunRays = () => {
    const rotate = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.loop(
            Animated.timing(rotate, {
                toValue: 1,
                duration: 20000, // Slow rotation
                easing: Easing.linear,
                useNativeDriver: true,
            })
        ).start();
    }, []);

    const spin = rotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

    return (
        <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]} pointerEvents="none">
            <Animated.View style={{
                width: width * 1.5,
                height: width * 1.5,
                opacity: 0.15, // Subtle
                transform: [{ rotate: spin }]
            }}>
                {/* Simulate Rays using multiple rotated rectangles or a simpler gradient ring */}
                {[...Array(8)].map((_, i) => (
                    <View key={i} style={{
                        position: 'absolute',
                        top: '50%', left: '50%',
                        width: width * 1.5, height: 40,
                        marginLeft: -(width * 1.5) / 2,
                        marginTop: -20,
                        backgroundColor: '#fff',
                        transform: [{ rotate: `${i * 45}deg` }],
                        shadowColor: '#fff', shadowRadius: 50, shadowOpacity: 0.5
                    }} />
                ))}
                {/* Soft central glow to blend rays */}
                <View style={{
                    position: 'absolute',
                    top: '10%', left: '10%', right: '10%', bottom: '10%',
                    borderRadius: 999,
                    backgroundColor: 'rgba(59, 130, 246, 0.5)',
                    shadowColor: '#fff', shadowRadius: 100, shadowOpacity: 0.5
                }} />
            </Animated.View>
        </View>
    );

};

// 3D Floating Shapes (Geometric background)
const FloatingShapes = () => (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Shape type="square" startX={10} startY={20} size={40} />
        <Shape type="square" startX={80} startY={70} size={50} />
        <Shape type="triangle" startX={20} startY={80} size={60} />
        <Shape type="triangle" startX={70} startY={15} size={30} />
        <Shape type="circle" startX={50} startY={50} size={150} opacity={0.05} />
    </View>
);

const Shape = ({ type, startX, startY, size, opacity = 0.15 }: any) => {
    const anim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(anim, { toValue: 1, duration: 8000 + Math.random() * 4000, useNativeDriver: true }),
                Animated.timing(anim, { toValue: 0, duration: 8000 + Math.random() * 4000, useNativeDriver: true })
            ])
        ).start();
    }, []);

    const rotate = anim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '45deg'] });
    const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [0, -30] });

    return (
        <Animated.View style={{
            position: 'absolute',
            left: `${startX}%`,
            top: `${startY}%`,
            width: size,
            height: size,
            borderWidth: 2,
            borderColor: `rgba(255,255,255,${opacity})`,
            borderRadius: type === 'circle' ? size / 2 : (type === 'square' ? 5 : 0),
            transform: [
                { translateY },
                { rotate },
                { rotateX: type === 'triangle' ? '30deg' : '0deg' }
            ],
            // Triangle CSS hack if needed, but keeping simple square/circle outlines is cleaner for "tech"
            backgroundColor: 'transparent'
        }} />
    );
};

