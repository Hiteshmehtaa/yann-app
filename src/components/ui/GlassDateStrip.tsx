import React, { useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Dimensions,
    Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { COLORS, SHADOWS } from '../../utils/theme';

interface GlassDateStripProps {
    selectedDate: Date | null;
    onSelectDate: (date: Date) => void;
    daysToRender?: number;
}

const { width } = Dimensions.get('window');
const ITEM_WIDTH = 60;
const ITEM_SPACING = 12;

export const GlassDateStrip: React.FC<GlassDateStripProps> = ({
    selectedDate,
    onSelectDate,
    daysToRender = 14,
}) => {
    const scrollViewRef = useRef<ScrollView>(null);

    // Generate dates array
    const dates = Array.from({ length: daysToRender }).map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() + i);
        return d;
    });

    // Scroll to selected date logic
    useEffect(() => {
        if (selectedDate && scrollViewRef.current) {
            // Find index
            const index = dates.findIndex(d =>
                d.getDate() === selectedDate.getDate() &&
                d.getMonth() === selectedDate.getMonth()
            );

            if (index >= 0) {
                // Center calculation: 
                // offset = (index * (item + gap)) - screenCenter + itemCenter + paddingOffset
                const x = (index * (ITEM_WIDTH + ITEM_SPACING)) - (width / 2) + (ITEM_WIDTH / 2) + 20;
                setTimeout(() => {
                    scrollViewRef.current?.scrollTo({ x: Math.max(0, x), animated: true });
                }, 500);
            }
        }
    }, [selectedDate]);

    return (
        <View style={styles.container}>
            <ScrollView
                ref={scrollViewRef}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                decelerationRate="fast"
                snapToInterval={ITEM_WIDTH + ITEM_SPACING}
            >
                {dates.map((date, index) => {
                    const isSelected = selectedDate &&
                        date.getDate() === selectedDate.getDate() &&
                        date.getMonth() === selectedDate.getMonth();

                    return (
                        <TouchableOpacity
                            key={index}
                            activeOpacity={0.7}
                            onPress={() => {
                                Haptics.selectionAsync();
                                onSelectDate(date);
                            }}
                            style={[
                                styles.dateCard,
                                isSelected && styles.dateCardSelected,
                                /* Add dynamic style for today/disabled if needed */
                            ]}
                        >
                            {isSelected ? (
                                <LinearGradient
                                    colors={[COLORS.primary, '#2563EB']}
                                    style={StyleSheet.absoluteFill}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                />
                            ) : null}

                            <Text style={[styles.dayText, isSelected && { color: 'rgba(255,255,255,0.8)' }]}>
                                {date.toLocaleDateString('en-US', { weekday: 'short' })}
                            </Text>
                            <Text style={[styles.dateText, isSelected && { color: '#FFF' }]}>
                                {date.getDate()}
                            </Text>

                            {/* Today indicator dot */}
                            {index === 0 && !isSelected && (
                                <View style={styles.todayDot} />
                            )}
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 20,
        marginTop: 10,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingVertical: 10,
    },
    dateCard: {
        width: ITEM_WIDTH,
        height: 76,
        borderRadius: 20,
        marginRight: ITEM_SPACING,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.white,
        borderWidth: 1,
        borderColor: COLORS.gray100,
        ...SHADOWS.sm,
        overflow: 'hidden',
    },
    dateCardSelected: {
        borderColor: COLORS.primary, // Or transparent if gradient covers border logic
        transform: [{ scale: 1.05 }],
        ...SHADOWS.md,
        shadowColor: COLORS.primary,
        shadowOpacity: 0.25,
        borderWidth: 0,
    },
    dayText: {
        fontSize: 12,
        fontWeight: '600',
        color: COLORS.textSecondary,
        marginBottom: 2,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        zIndex: 2,
    },
    dateText: {
        fontSize: 20,
        fontWeight: '800',
        color: COLORS.text,
        letterSpacing: -0.5,
        zIndex: 2,
    },
    todayDot: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: COLORS.primary,
        position: 'absolute',
        bottom: 8,
    }
});
