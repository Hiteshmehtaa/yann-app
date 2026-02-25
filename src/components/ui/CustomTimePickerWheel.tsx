import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Modal,
    Dimensions,
    NativeSyntheticEvent,
    NativeScrollEvent,
    Platform,
} from 'react-native';
import { ScrollView } from 'react-native';
import * as Haptics from 'expo-haptics';
import { COLORS, TYPOGRAPHY, SHADOWS } from '../../utils/theme';

interface CustomTimePickerWheelProps {
    visible: boolean;
    onClose: () => void;
    onConfirm: (date: Date) => void;
    initialDate?: Date;
    minimumDate?: Date;
    title?: string;
}

const ITEM_HEIGHT = 44;
const VISIBLE_ITEMS = 5;
const PICKER_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;
const PADDING_ITEMS = Math.floor(VISIBLE_ITEMS / 2);

// Generate Data
const HOURS = Array.from({ length: 12 }, (_, i) => ({ label: (i + 1).toString(), value: i + 1 }));
const MINUTES = Array.from({ length: 12 }, (_, i) => ({ label: (i * 5).toString().padStart(2, '0'), value: i * 5 }));
const PERIODS = [{ label: 'AM', value: 'AM' }, { label: 'PM', value: 'PM' }];

// ─── Wheel Column Component ────────────────────────────────────────────
interface WheelColumnProps {
    data: { label: string; value: any }[];
    selectedValue: any;
    onValueChange: (value: any) => void;
    isDisabled?: (value: any) => boolean;
    width?: number;
}

const WheelColumn: React.FC<WheelColumnProps> = React.memo(({
    data,
    selectedValue,
    onValueChange,
    isDisabled,
    width,
}) => {
    const scrollRef = useRef<ScrollView>(null);
    const isScrolling = useRef(false);
    const lastSelectedIndex = useRef(-1);
    const lastTickIndex = useRef(-1);

    const selectedIndex = data.findIndex(d => d.value === selectedValue);

    // Scroll to initial position when mounted or value changes externally
    useEffect(() => {
        if (selectedIndex >= 0 && !isScrolling.current) {
            const timer = setTimeout(() => {
                scrollRef.current?.scrollTo({
                    y: selectedIndex * ITEM_HEIGHT,
                    animated: false,
                });
                lastSelectedIndex.current = selectedIndex;
            }, 50);
            return () => clearTimeout(timer);
        }
    }, [selectedIndex, selectedValue]);

    const handleScrollEnd = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
        const offsetY = e.nativeEvent.contentOffset.y;
        let index = Math.round(offsetY / ITEM_HEIGHT);
        index = Math.max(0, Math.min(index, data.length - 1));

        // Skip disabled items — find nearest enabled
        if (isDisabled && isDisabled(data[index].value)) {
            let found = false;
            // Search forward
            for (let i = index + 1; i < data.length; i++) {
                if (!isDisabled(data[i].value)) { index = i; found = true; break; }
            }
            if (!found) {
                // Search backward
                for (let i = index - 1; i >= 0; i--) {
                    if (!isDisabled(data[i].value)) { index = i; found = true; break; }
                }
            }
        }

        // Snap to position
        scrollRef.current?.scrollTo({ y: index * ITEM_HEIGHT, animated: true });

        if (lastSelectedIndex.current !== index) {
            lastSelectedIndex.current = index;
            onValueChange(data[index].value);
        }
        isScrolling.current = false;
    }, [data, isDisabled, onValueChange]);

    const handleScrollBegin = useCallback(() => {
        isScrolling.current = true;
    }, []);

    const handleItemPress = useCallback((index: number) => {
        if (isDisabled && isDisabled(data[index].value)) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        scrollRef.current?.scrollTo({ y: index * ITEM_HEIGHT, animated: true });
        lastSelectedIndex.current = index;
        onValueChange(data[index].value);
    }, [data, isDisabled, onValueChange]);

    return (
        <View style={[wheelStyles.columnContainer, width ? { width } : { flex: 1 }]}>
            <ScrollView
                ref={scrollRef}
                showsVerticalScrollIndicator={false}
                snapToInterval={ITEM_HEIGHT}
                decelerationRate="fast"
                bounces={false}
                onScrollBeginDrag={handleScrollBegin}
                onScroll={(e) => {
                    // Haptic tick on each item boundary crossing
                    const offsetY = e.nativeEvent.contentOffset.y;
                    const currentTick = Math.round(offsetY / ITEM_HEIGHT);
                    if (currentTick !== lastTickIndex.current && currentTick >= 0 && currentTick < data.length) {
                        lastTickIndex.current = currentTick;
                        Haptics.selectionAsync();
                    }
                }}
                scrollEventThrottle={16}
                onMomentumScrollEnd={handleScrollEnd}
                onScrollEndDrag={(e) => {
                    // For cases where there's no momentum (gentle drag)
                    if (e.nativeEvent.velocity && Math.abs(e.nativeEvent.velocity.y) < 0.1) {
                        handleScrollEnd(e);
                    }
                }}
                contentContainerStyle={{
                    paddingTop: PADDING_ITEMS * ITEM_HEIGHT,
                    paddingBottom: PADDING_ITEMS * ITEM_HEIGHT,
                }}
                nestedScrollEnabled
            >
                {data.map((item, index) => {
                    const disabled = isDisabled ? isDisabled(item.value) : false;
                    const isSelected = item.value === selectedValue;
                    return (
                        <TouchableOpacity
                            key={`${item.value}`}
                            style={wheelStyles.item}
                            onPress={() => handleItemPress(index)}
                            activeOpacity={disabled ? 1 : 0.7}
                        >
                            <Text
                                style={[
                                    wheelStyles.itemText,
                                    isSelected && wheelStyles.selectedItemText,
                                    disabled && wheelStyles.disabledItemText,
                                ]}
                            >
                                {item.label}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>
        </View>
    );
});

const wheelStyles = StyleSheet.create({
    columnContainer: {
        height: PICKER_HEIGHT,
        overflow: 'hidden',
    },
    item: {
        height: ITEM_HEIGHT,
        justifyContent: 'center',
        alignItems: 'center',
    },
    itemText: {
        fontSize: 20,
        color: '#9CA3AF',
        fontWeight: '400',
    },
    selectedItemText: {
        fontSize: 22,
        color: '#1F2937',
        fontWeight: '600',
    },
    disabledItemText: {
        color: '#D1D5DB',
    },
});

// ─── Main Time Picker Component ────────────────────────────────────────
export const CustomTimePickerWheel: React.FC<CustomTimePickerWheelProps> = ({
    visible,
    onClose,
    onConfirm,
    initialDate = new Date(),
    minimumDate,
    title = 'Time'
}) => {
    const [selectedHour, setSelectedHour] = useState(12);
    const [selectedMinute, setSelectedMinute] = useState(0);
    const [selectedPeriod, setSelectedPeriod] = useState('AM');

    useEffect(() => {
        if (visible) {
            let effectiveDate = initialDate;
            if (minimumDate && initialDate < minimumDate) {
                effectiveDate = minimumDate;
            }

            let h = effectiveDate.getHours();
            const m = effectiveDate.getMinutes();
            const p = h >= 12 ? 'PM' : 'AM';

            h = h % 12;
            h = h ? h : 12;

            const roundedMinute = minimumDate ? Math.ceil(m / 5) * 5 : Math.round(m / 5) * 5;

            setSelectedHour(h);
            setSelectedMinute(roundedMinute >= 60 ? 0 : roundedMinute);
            setSelectedPeriod(p);
        }
    }, [visible, initialDate, minimumDate]);

    // Check if a given time is before the minimum
    const isTimeDisabled = useCallback((hour: number, minute: number, period: string): boolean => {
        if (!minimumDate) return false;

        let h = hour;
        if (period === 'PM' && h !== 12) h += 12;
        if (period === 'AM' && h === 12) h = 0;

        const testDate = new Date(initialDate);
        testDate.setHours(h, minute, 0, 0);
        return testDate < minimumDate;
    }, [minimumDate, initialDate]);

    const isHourDisabled = useCallback((hourValue: number) => {
        return MINUTES.every(m => isTimeDisabled(hourValue, m.value, selectedPeriod));
    }, [isTimeDisabled, selectedPeriod]);

    const isMinuteDisabled = useCallback((minuteValue: number) => {
        return isTimeDisabled(selectedHour, minuteValue, selectedPeriod);
    }, [isTimeDisabled, selectedHour, selectedPeriod]);

    const handleConfirm = useCallback(() => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        const date = new Date(initialDate);
        let h = selectedHour;
        if (selectedPeriod === 'PM' && h !== 12) h += 12;
        if (selectedPeriod === 'AM' && h === 12) h = 0;

        date.setHours(h);
        date.setMinutes(selectedMinute);

        if (minimumDate && date < minimumDate) {
            onConfirm(minimumDate);
        } else {
            onConfirm(date);
        }
    }, [initialDate, selectedHour, selectedMinute, selectedPeriod, minimumDate, onConfirm]);

    // Format selected time for the badge
    const formattedTime = `${selectedHour}:${selectedMinute.toString().padStart(2, '0')} ${selectedPeriod}`;

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
                <View style={styles.container} onStartShouldSetResponder={() => true}>
                    {/* Header: Title + Time Badge */}
                    <View style={styles.header}>
                        <Text style={styles.title}>{title}</Text>
                        <View style={styles.timeBadge}>
                            <Text style={styles.timeBadgeText}>{formattedTime}</Text>
                        </View>
                    </View>

                    <View style={styles.divider} />

                    {/* Wheel Picker Area */}
                    <View style={styles.pickerContainer}>
                        {/* Selection Highlight Bar */}
                        <View style={styles.selectionHighlight} pointerEvents="none" />

                        {/* Hour Wheel */}
                        <WheelColumn
                            data={HOURS}
                            selectedValue={selectedHour}
                            onValueChange={setSelectedHour}
                            isDisabled={isHourDisabled}
                        />

                        {/* Minute Wheel */}
                        <WheelColumn
                            data={MINUTES}
                            selectedValue={selectedMinute}
                            onValueChange={setSelectedMinute}
                            isDisabled={isMinuteDisabled}
                        />

                        {/* AM/PM Wheel */}
                        <WheelColumn
                            data={PERIODS}
                            selectedValue={selectedPeriod}
                            onValueChange={setSelectedPeriod}
                            width={80}
                        />
                    </View>

                    {/* Footer */}
                    <View style={styles.footer}>
                        <TouchableOpacity onPress={onClose} style={styles.cancelButton}>
                            <Text style={styles.cancelText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleConfirm} style={styles.doneButton}>
                            <Text style={styles.doneText}>Done</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </TouchableOpacity>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.35)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    container: {
        width: '100%',
        maxWidth: 360,
        backgroundColor: '#F2F2F7',
        borderRadius: 14,
        paddingVertical: 16,
        paddingHorizontal: 20,
        ...SHADOWS.lg,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingBottom: 12,
    },
    title: {
        fontSize: 17,
        fontWeight: '600',
        color: '#1C1C1E',
        letterSpacing: -0.4,
    },
    timeBadge: {
        backgroundColor: '#E8E8ED',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 6,
    },
    timeBadgeText: {
        fontSize: 17,
        fontWeight: '600',
        color: COLORS.primary,
        letterSpacing: -0.4,
    },
    divider: {
        height: StyleSheet.hairlineWidth,
        backgroundColor: '#C6C6C8',
        marginBottom: 8,
    },
    pickerContainer: {
        flexDirection: 'row',
        height: PICKER_HEIGHT,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    selectionHighlight: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: PADDING_ITEMS * ITEM_HEIGHT,
        height: ITEM_HEIGHT,
        backgroundColor: 'rgba(120,120,128,0.12)',
        borderRadius: 10,
        zIndex: 0,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: '#C6C6C8',
    },
    cancelButton: {
        paddingVertical: 10,
        paddingHorizontal: 16,
    },
    cancelText: {
        fontSize: 17,
        fontWeight: '400',
        color: COLORS.primary,
        letterSpacing: -0.4,
    },
    doneButton: {
        backgroundColor: COLORS.primary,
        paddingVertical: 10,
        paddingHorizontal: 24,
        borderRadius: 10,
    },
    doneText: {
        fontSize: 17,
        fontWeight: '600',
        color: '#FFFFFF',
        letterSpacing: -0.4,
    },
});
