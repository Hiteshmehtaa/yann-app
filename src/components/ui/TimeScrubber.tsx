import React, { useRef, useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Dimensions,
    Vibration,
    Platform,
    NativeSyntheticEvent,
    NativeScrollEvent,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SHADOWS } from '../../utils/theme';

interface TimeScrubberProps {
    selectedTime: Date | null;
    onSelectTime: (date: Date) => void;
    minTime?: string; // "09:00"
    maxTime?: string; // "20:00"
    step?: number; // minutes, default 60
}

const { width } = Dimensions.get('window');
const ITEM_WIDTH = 70; // Width of one time slot mark
const ITEM_SPACING = 0; // Continuous ruler
const SNAP_INTERVAL = ITEM_WIDTH;

export const TimeScrubber: React.FC<TimeScrubberProps> = ({
    selectedTime,
    onSelectTime,
    minTime = "09:00",
    maxTime = "20:00",
    step = 60,
}) => {
    const scrollViewRef = useRef<ScrollView>(null);
    const [generatedSlots, setGeneratedSlots] = useState<Date[]>([]);

    // Calculate padding to center the first and last items
    const paddingHorizontal = (width - ITEM_WIDTH) / 2;

    // Generate time slots
    useEffect(() => {
        const slots: Date[] = [];
        const [startH, startM] = minTime.split(':').map(Number);
        const [endH, endM] = maxTime.split(':').map(Number);

        let current = new Date();
        current.setHours(startH, startM, 0, 0);

        const end = new Date();
        end.setHours(endH, endM, 0, 0);

        while (current <= end) {
            slots.push(new Date(current));
            current.setMinutes(current.getMinutes() + step);
        }
        setGeneratedSlots(slots);
    }, [minTime, maxTime, step]);

    // Handle Scroll End to select time
    const handleMomentumScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const offsetX = event.nativeEvent.contentOffset.x;
        const index = Math.round(offsetX / SNAP_INTERVAL);

        if (index >= 0 && index < generatedSlots.length) {
            const selected = generatedSlots[index];
            onSelectTime(selected);
            Haptics.selectionAsync();
        }
    };

    // Auto-scroll to selected time on mount/update (only if significant change)
    useEffect(() => {
        if (selectedTime && generatedSlots.length > 0) {
            const selectedTimeStr = selectedTime.toTimeString().substring(0, 5);
            const index = generatedSlots.findIndex(d => d.toTimeString().substring(0, 5) === selectedTimeStr);

            if (index !== -1 && scrollViewRef.current) {
                // We only scroll if the view isn't already roughly there (to prevent fighting user scroll)
                // For simplicity in this "controlled" component, we might just snap.
                // But to avoid loops, let's just trigger this when `selectedTime` changes FROM OUTSIDE
                // In a real bidirectional sync, be careful.
                // Here we'll trust the parent or init.
                // Let's protect it: if the parent passes a time, snap to it.

                setTimeout(() => {
                    scrollViewRef.current?.scrollTo({ x: index * SNAP_INTERVAL, animated: true });
                }, 500);
            }
        }
    }, [selectedTime, generatedSlots]); // Be careful with loops here if onSelectTime updates selectedTime

    return (
        <View style={styles.container}>
            {/* Needle / Center Indicator */}
            <View style={styles.needleContainer} pointerEvents="none">
                <View style={styles.needle} />
                <View style={styles.needleDot} />
            </View>

            {/* Background Track/Ruler Line */}
            <View style={styles.rulerLine} pointerEvents="none" />

            <ScrollView
                ref={scrollViewRef}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: paddingHorizontal }}
                snapToInterval={SNAP_INTERVAL}
                decelerationRate="fast"
                onMomentumScrollEnd={handleMomentumScrollEnd}
                // Also update on drag end for snap effect
                onScrollEndDrag={handleMomentumScrollEnd}
                scrollEventThrottle={16}
            >
                {generatedSlots.map((date, index) => {
                    const timeLabel = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
                    const isSelected = selectedTime && date.toTimeString().substring(0, 5) === selectedTime.toTimeString().substring(0, 5);

                    return (
                        <View key={index} style={styles.slotContainer}>
                            {/* Tick Mark */}
                            <View style={[
                                styles.tickMark,
                                isSelected && styles.tickMarkSelected
                            ]} />

                            {/* Time Label */}
                            <Text style={[
                                styles.timeText,
                                isSelected && styles.timeTextSelected
                            ]}>
                                {timeLabel}
                            </Text>
                        </View>
                    );
                })}
            </ScrollView>

            {/* Gradients for fade effect on edges */}
            <LinearGradient
                colors={[COLORS.gray50, 'transparent']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={styles.leftFade}
                pointerEvents="none"
            />
            <LinearGradient
                colors={['transparent', COLORS.gray50]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={styles.rightFade}
                pointerEvents="none"
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        height: 100,
        marginTop: 20,
        marginBottom: 20,
        position: 'relative',
        backgroundColor: COLORS.gray50,
        justifyContent: 'center',
    },
    slotContainer: {
        width: ITEM_WIDTH,
        alignItems: 'center',
        justifyContent: 'center',
        height: 80,
    },
    rulerLine: {
        position: 'absolute',
        top: 40, // Middle of the slot height roughly
        left: 0,
        right: 0,
        height: 2,
        backgroundColor: COLORS.gray200,
        zIndex: 0,
    },
    tickMark: {
        width: 2,
        height: 10,
        backgroundColor: COLORS.gray200,
        marginBottom: 12,
        borderRadius: 1,
    },
    tickMarkSelected: {
        backgroundColor: COLORS.primary,
        height: 16,
        width: 3,
    },
    timeText: {
        fontSize: 14,
        color: COLORS.textTertiary,
        fontWeight: '500',
    },
    timeTextSelected: {
        color: COLORS.primary,
        fontWeight: '700',
        fontSize: 16,
        transform: [{ scale: 1.1 }]
    },

    // Center Needle
    needleContainer: {
        position: 'absolute',
        left: 0, right: 0, top: 0, bottom: 0,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10,
    },
    needle: {
        width: 2,
        height: 50,
        backgroundColor: COLORS.primary,
        borderRadius: 2,
    },
    needleDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: COLORS.primary,
        position: 'absolute',
        top: 36, // Adjust to center on line
    },

    // Fades
    leftFade: {
        position: 'absolute',
        left: 0, top: 0, bottom: 0,
        width: 60,
        zIndex: 5,
    },
    rightFade: {
        position: 'absolute',
        right: 0, top: 0, bottom: 0,
        width: 60,
        zIndex: 5,
    }
});
