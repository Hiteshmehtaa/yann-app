import React, { useEffect, useRef } from 'react';
import { View, TouchableOpacity, StyleSheet, Platform, Dimensions, Animated } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS, SPACING, RADIUS, GRADIENTS } from '../../utils/theme';
import { haptics } from '../../utils/haptics';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');
// Calculate exact widths
const MARGIN_H = SPACING.md; // 16
const BAR_WIDTH = width - (MARGIN_H * 2);
// 5 tabs usually
const TAB_WIDTH = BAR_WIDTH / 5;

// Constants for the active pill
const ACTIVE_PILL_WIDTH = 64;
const ACTIVE_PILL_OFFSET = (TAB_WIDTH - ACTIVE_PILL_WIDTH) / 2;

export const FloatingTabBar: React.FC<BottomTabBarProps> = ({ state, descriptors, navigation, insets }) => {

    // Default to first tab (Home)
    const translateX = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Animate to the current tab position
        // current tab index * tab width + centering offset
        const targetX = (state.index * TAB_WIDTH) + ACTIVE_PILL_OFFSET;

        Animated.spring(translateX, {
            toValue: targetX,
            useNativeDriver: true,
            damping: 15,
            stiffness: 150,
            mass: 0.5
        }).start();
    }, [state.index]);

    return (
        <View style={styles.container}>
            {/* Shadow Layer */}
            <View style={styles.shadowLayer} />

            {/* Content Container */}
            {Platform.OS === 'ios' ? (
                <BlurView intensity={90} tint="light" style={styles.content}>
                    <View style={styles.innerContainer}>
                        {/* Animated Active Indicator (Background) */}
                        <Animated.View style={[styles.activeIndicator, { transform: [{ translateX }] }]}>
                            <LinearGradient
                                colors={GRADIENTS.primary}
                                style={[StyleSheet.absoluteFill, { borderRadius: 22 }]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                            />
                            {/* Inner Bevel */}
                            <View style={styles.bevel} />
                        </Animated.View>

                        {/* Tabs */}
                        <TabItems state={state} descriptors={descriptors} navigation={navigation} />
                    </View>
                </BlurView>
            ) : (
                <View style={[styles.content, styles.androidContent]}>
                    <View style={styles.innerContainer}>
                        <Animated.View style={[styles.activeIndicator, { transform: [{ translateX }] }]}>
                            <LinearGradient
                                colors={GRADIENTS.primary}
                                style={[StyleSheet.absoluteFill, { borderRadius: 22 }]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                            />
                        </Animated.View>
                        <TabItems state={state} descriptors={descriptors} navigation={navigation} />
                    </View>
                </View>
            )}
        </View>
    );
};

const TabItems = ({ state, descriptors, navigation }: { state: any, descriptors: any, navigation: any }) => {
    return (
        <View style={styles.tabRow}>
            {state.routes.map((route: any, index: number) => {
                const { options } = descriptors[route.key];
                const isFocused = state.index === index;

                const onPress = () => {
                    haptics.selection();
                    const event = navigation.emit({
                        type: 'tabPress',
                        target: route.key,
                        canPreventDefault: true,
                    });

                    if (!isFocused && !event.defaultPrevented) {
                        navigation.navigate(route.name);
                    }
                };

                const IconComponent = options.tabBarIcon
                    ? options.tabBarIcon({
                        focused: isFocused,
                        color: isFocused ? '#FFF' : COLORS.textSecondary,
                        size: 24
                    })
                    : null;

                return (
                    <TouchableOpacity
                        key={route.key}
                        accessibilityRole="button"
                        accessibilityState={isFocused ? { selected: true } : {}}
                        accessibilityLabel={options.tabBarAccessibilityLabel}
                        onPress={onPress}
                        style={styles.tabButton}
                        activeOpacity={1} // No opacity change on press, handled by animation
                    >
                        {/* Icon is rendered on top of the sliding indicator */}
                        <View style={{ zIndex: 2 }}>
                            {IconComponent}
                        </View>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: SPACING.lg,
        left: SPACING.md,
        right: SPACING.md,
        height: 72,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 0,
        zIndex: 9999, // Ensure highly visible
    },
    shadowLayer: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        borderRadius: 36,
        backgroundColor: '#000',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 10,
        opacity: 0.2, // Visual opacity of the black bg for shadow
        bottom: 2, top: 2, left: 2, right: 2,
    },
    content: {
        width: '100%',
        height: '100%',
        borderRadius: 36,
        overflow: 'hidden',
        backgroundColor: 'rgba(255,255,255,0.9)', // Solid-ish background
    },
    androidContent: {
        backgroundColor: '#FFF',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
        elevation: 5,
    },
    innerContainer: {
        flex: 1,
        flexDirection: 'row',
        position: 'relative', // For absolute positioning of indicator
    },
    // The animated pill
    activeIndicator: {
        position: 'absolute',
        width: 64, // Wider
        height: 44, // Shorter
        borderRadius: 22, // Fully rounded sides (Pill)
        top: (72 - 44) / 2, // Vertically centered
        left: 0,
        justifyContent: 'center',
        alignItems: 'center',
        // Shadow for the pill itself
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    bevel: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
        borderRadius: 22,
    },
    tabRow: {
        flex: 1,
        flexDirection: 'row',
    },
    tabButton: {
        flex: 1, // Distribute evenly
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
});
