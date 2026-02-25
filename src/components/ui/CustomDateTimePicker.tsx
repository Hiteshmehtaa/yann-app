import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ViewStyle,
    Modal,
    Platform,
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import { CustomTimePickerWheel } from './CustomTimePickerWheel';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS, SHADOWS } from '../../utils/theme';

interface CustomDateTimePickerProps {
    label: string;
    value: Date | null;
    onChange: (date: Date) => void;
    mode: 'date' | 'time';
    error?: string;
    containerStyle?: ViewStyle;
    placeholder?: string;
    minimumDate?: Date;
    leftIcon?: keyof typeof Ionicons.glyphMap;
}

export const CustomDateTimePicker: React.FC<CustomDateTimePickerProps> = ({
    label,
    value,
    onChange,
    mode,
    error,
    containerStyle,
    placeholder,
    minimumDate,
    leftIcon = mode === 'date' ? 'calendar' : 'time',
}) => {
    const [open, setOpen] = useState(false);

    // For Date Mode: We use react-native-calendars in a custom Modal
    // For Time Mode: We use react-native-date-picker (which has its own modal prop)

    const handlePress = () => {
        setOpen(true);
    };

    const formatValue = () => {
        if (!value) return null;

        if (mode === 'date') {
            const day = value.getDate().toString().padStart(2, '0');
            const monthShort = value.toLocaleDateString('en-US', { month: 'short' });
            const year = value.getFullYear();
            const weekday = value.toLocaleDateString('en-US', { weekday: 'short' });
            return `${weekday}, ${day} ${monthShort} ${year}`;
        } else {
            const hours = value.getHours().toString().padStart(2, '0');
            const minutes = value.getMinutes().toString().padStart(2, '0');
            return `${hours}:${minutes}`;
        }
    };

    const displayValue = formatValue();

    // iOS-style Calendar Theme
    const calendarTheme = {
        backgroundColor: '#F2F2F7',
        calendarBackground: '#F2F2F7',
        textSectionTitleColor: '#8E8E93',
        selectedDayBackgroundColor: '#D1E3FF',
        selectedDayTextColor: COLORS.primary,
        todayTextColor: COLORS.primary,
        dayTextColor: '#1C1C1E',
        textDisabledColor: '#C7C7CC',
        dotColor: COLORS.primary,
        selectedDotColor: COLORS.primary,
        arrowColor: COLORS.primary,
        monthTextColor: '#1C1C1E',
        indicatorColor: COLORS.primary,
        textDayFontFamily: 'System',
        textMonthFontFamily: 'System',
        textDayHeaderFontFamily: 'System',
        textDayFontWeight: '400',
        textMonthFontWeight: '700',
        textDayHeaderFontWeight: '600',
        textDayFontSize: 17,
        textMonthFontSize: 17,
        textDayHeaderFontSize: 13,
    };

    return (
        <View style={[styles.container, containerStyle]}>
            {/* Label */}
            <Text style={styles.label}>{label}</Text>

            {/* Trigger Button (Same Premium UI) */}
            <TouchableOpacity
                style={[
                    styles.pickerButton,
                    error && styles.pickerButtonError,
                    open && { borderColor: COLORS.primary, backgroundColor: '#F8FAFC' },
                ]}
                onPress={handlePress}
                activeOpacity={0.8}
            >
                <View style={styles.iconContainer}>
                    <Ionicons name={leftIcon} size={22} color={COLORS.primary} />
                </View>

                <View style={styles.contentContainer}>
                    {displayValue ? (
                        <Text style={styles.valueText}>{displayValue}</Text>
                    ) : (
                        <Text style={styles.placeholderText}>
                            {placeholder || (mode === 'date' ? 'Select Date' : 'Select Time')}
                        </Text>
                    )}
                </View>

                <Ionicons name="chevron-down" size={18} color={COLORS.textTertiary} />
            </TouchableOpacity>

            {error && <Text style={styles.errorText}>{error}</Text>}

            {/* Date Picker Modal (iOS-style) */}
            {mode === 'date' && (
                <Modal
                    visible={open}
                    transparent
                    animationType="fade"
                    onRequestClose={() => setOpen(false)}
                >
                    <TouchableOpacity
                        style={styles.modalOverlay}
                        activeOpacity={1}
                        onPress={() => setOpen(false)}
                    >
                        <View
                            style={styles.calendarContainer}
                            onStartShouldSetResponder={() => true}
                        >
                            {/* iOS-style Header */}
                            <View style={styles.dateHeader}>
                                <Text style={styles.dateHeaderTitle}>Select Date</Text>
                            </View>
                            <View style={styles.dateHeaderDivider} />

                            <Calendar
                                current={value ? value.toISOString().split('T')[0] : new Date().toISOString().split('T')[0]}
                                minDate={minimumDate ? minimumDate.toISOString().split('T')[0] : undefined}
                                onDayPress={(day: { dateString: string; }) => {
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                    const newDate = new Date(day.dateString);
                                    if (value) {
                                        newDate.setHours(value.getHours(), value.getMinutes());
                                    } else {
                                        newDate.setHours(12, 0, 0, 0);
                                    }
                                    onChange(newDate);
                                    setOpen(false);
                                }}
                                markedDates={
                                    value
                                        ? {
                                            [value.toISOString().split('T')[0]]: {
                                                selected: true,
                                                disableTouchEvent: true,
                                                selectedColor: '#D1E3FF',
                                                selectedTextColor: COLORS.primary,
                                            },
                                        }
                                        : {}
                                }
                                theme={calendarTheme as any}
                                enableSwipeMonths
                                style={styles.calendarStyle}
                            />
                        </View>
                    </TouchableOpacity>
                </Modal>
            )}

            {/* Time Picker Modal (Custom Wheel) */}
            {mode === 'time' && (
                <CustomTimePickerWheel
                    visible={open}
                    onClose={() => setOpen(false)}
                    onConfirm={(date) => {
                        setOpen(false);
                        onChange(date);
                    }}
                    initialDate={value || new Date()}
                    minimumDate={minimumDate}
                    title="Select Time"
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: SPACING.md,
    },
    label: {
        fontSize: TYPOGRAPHY.size.sm,
        fontWeight: '600',
        color: COLORS.textSecondary,
        marginBottom: 8,
        marginLeft: 4,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    pickerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.white,
        borderRadius: 16,
        borderWidth: 1.5,
        borderColor: COLORS.gray200,
        height: 64,
        paddingHorizontal: 16,
        gap: 12,
        ...SHADOWS.sm,
    },
    pickerButtonError: {
        borderColor: COLORS.error,
        backgroundColor: '#FEF2F2',
    },
    iconContainer: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: '#EFF6FF',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#DBEAFE',
    },
    contentContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    valueText: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.text,
        marginTop: 2,
    },
    placeholderText: {
        fontSize: 16,
        color: COLORS.textTertiary,
        fontWeight: '500',
    },
    errorText: {
        fontSize: TYPOGRAPHY.size.xs,
        color: COLORS.error,
        marginTop: 6,
        marginLeft: 4,
        fontWeight: '600',
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.35)',
        justifyContent: 'center',
        padding: 24,
        alignItems: 'center',
    },
    calendarContainer: {
        backgroundColor: '#F2F2F7',
        borderRadius: 14,
        paddingBottom: 8,
        width: '100%',
        maxWidth: 360,
        overflow: 'hidden',
        ...SHADOWS.lg,
    },
    dateHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 12,
    },
    dateHeaderTitle: {
        fontSize: 17,
        fontWeight: '600',
        color: '#1C1C1E',
        letterSpacing: -0.4,
    },
    dateHeaderDivider: {
        height: StyleSheet.hairlineWidth,
        backgroundColor: '#C6C6C8',
        marginHorizontal: 0,
    },
    calendarStyle: {
        backgroundColor: '#F2F2F7',
        paddingHorizontal: 4,
    },
    closeButton: {
        marginTop: 12,
        marginHorizontal: 16,
        alignItems: 'center',
        padding: 12,
        backgroundColor: '#E5E5EA',
        borderRadius: 10,
    },
    closeButtonText: {
        fontSize: 17,
        fontWeight: '400',
        color: COLORS.primary,
        letterSpacing: -0.4,
    },
    // iOS DatePicker Styles
    iosDatePickerContainer: {
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 20,
        width: '100%',
        maxWidth: 360,
        alignItems: 'center',
        ...SHADOWS.lg,
    },
    iosDatePickerHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        marginBottom: 10,
        alignItems: 'center',
    },
    iosDatePickerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.text,
    },
    iosDatePickerDone: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.primary,
    },
});
