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
import DatePicker from 'react-native-date-picker';
import { Ionicons } from '@expo/vector-icons';
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

    // Calendar Theme
    const calendarTheme = {
        backgroundColor: '#ffffff',
        calendarBackground: '#ffffff',
        textSectionTitleColor: '#b6c1cd',
        selectedDayBackgroundColor: COLORS.primary,
        selectedDayTextColor: '#ffffff',
        todayTextColor: COLORS.primary,
        dayTextColor: '#2d4150',
        textDisabledColor: '#d9e1e8',
        dotColor: COLORS.primary,
        selectedDotColor: '#ffffff',
        arrowColor: COLORS.primary,
        monthTextColor: COLORS.text,
        indicatorColor: COLORS.primary,
        textDayFontFamily: 'System',
        textMonthFontFamily: 'System',
        textDayHeaderFontFamily: 'System',
        textDayFontWeight: '400',
        textMonthFontWeight: '700',
        textDayHeaderFontWeight: '400',
        textDayFontSize: 16,
        textMonthFontSize: 18,
        textDayHeaderFontSize: 14,
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

            {/* Date Picker Modal (react-native-calendars) */}
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
                        <TouchableOpacity activeOpacity={1} style={styles.calendarContainer}>
                            <Calendar
                                current={value ? value.toISOString().split('T')[0] : new Date().toISOString().split('T')[0]}
                                minDate={minimumDate ? minimumDate.toISOString().split('T')[0] : undefined}
                                onDayPress={(day: { dateString: string; }) => {
                                    const newDate = new Date(day.dateString);
                                    // Keep existing time if set, otherwise default to noon to avoid timezone shifts
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
                                                selectedColor: COLORS.primary,
                                            },
                                        }
                                        : {}
                                }
                                theme={calendarTheme as any}
                                enableSwipeMonths
                            />
                            <TouchableOpacity style={styles.closeButton} onPress={() => setOpen(false)}>
                                <Text style={styles.closeButtonText}>Cancel</Text>
                            </TouchableOpacity>
                        </TouchableOpacity>
                    </TouchableOpacity>
                </Modal>
            )}

            {/* Time Picker Modal (react-native-date-picker) */}
            {mode === 'time' && (
                <DatePicker
                    modal
                    open={open}
                    date={value || new Date()}
                    mode="time"
                    onConfirm={(date) => {
                        setOpen(false);
                        onChange(date);
                    }}
                    onCancel={() => {
                        setOpen(false);
                    }}
                    theme="light" // 'light', 'dark' or 'auto'
                    confirmText="Confirm"
                    cancelText="Cancel"
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
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: 20,
        alignItems: 'center',
    },
    calendarContainer: {
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 16,
        width: '100%',
        maxWidth: 360,
        ...SHADOWS.lg,
    },
    closeButton: {
        marginTop: 16,
        alignItems: 'center',
        padding: 12,
        backgroundColor: COLORS.gray100,
        borderRadius: 12,
    },
    closeButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.text,
    },
});
