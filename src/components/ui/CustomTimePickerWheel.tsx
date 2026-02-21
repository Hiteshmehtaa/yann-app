import React, { useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, Dimensions } from 'react-native';
import { COLORS, TYPOGRAPHY, SHADOWS } from '../../utils/theme';
import { Ionicons } from '@expo/vector-icons';

interface CustomTimePickerWheelProps {
    visible: boolean;
    onClose: () => void;
    onConfirm: (date: Date) => void;
    initialDate?: Date;
    minimumDate?: Date;
    title?: string;
}

const ITEM_HEIGHT = 50;
const VISIBLE_ITEMS = 5;

// Generate Data
const HOURS = Array.from({ length: 12 }, (_, i) => ({ label: (i + 1).toString().padStart(2, '0'), value: i + 1 }));
const MINUTES = Array.from({ length: 12 }, (_, i) => ({ label: (i * 5).toString().padStart(2, '0'), value: i * 5 }));
const PERIODS = [{ label: 'AM', value: 'AM' }, { label: 'PM', value: 'PM' }];

export const CustomTimePickerWheel: React.FC<CustomTimePickerWheelProps> = ({
    visible,
    onClose,
    onConfirm,
    initialDate = new Date(),
    minimumDate,
    title = 'Select Time'
}) => {
    const [selectedHour, setSelectedHour] = useState(12);
    const [selectedMinute, setSelectedMinute] = useState(0);
    const [selectedPeriod, setSelectedPeriod] = useState('AM');

    useEffect(() => {
        if (visible) {
            // Determine the effective initial time (clamp to minimum if needed)
            let effectiveDate = initialDate;
            if (minimumDate && initialDate < minimumDate) {
                effectiveDate = minimumDate;
            }

            let h = effectiveDate.getHours();
            const m = effectiveDate.getMinutes();
            const p = h >= 12 ? 'PM' : 'AM';

            h = h % 12;
            h = h ? h : 12; // the hour '0' should be '12'

            // Round minutes UP to nearest 5 (for minimum enforcement)
            const roundedMinute = minimumDate ? Math.ceil(m / 5) * 5 : Math.round(m / 5) * 5;

            setSelectedHour(h);
            setSelectedMinute(roundedMinute >= 60 ? 0 : roundedMinute);
            setSelectedPeriod(p);
        }
    }, [visible, initialDate, minimumDate]);

    // Check if a given time (hour, minute, period) is before the minimum
    const isTimeDisabled = (hour: number, minute: number, period: string): boolean => {
        if (!minimumDate) return false;

        let h = hour;
        if (period === 'PM' && h !== 12) h += 12;
        if (period === 'AM' && h === 12) h = 0;

        const testDate = new Date(initialDate);
        testDate.setHours(h, minute, 0, 0);
        return testDate < minimumDate;
    };

    // Helpers to render items
    const renderItem = ({ item, isSelected, onPress, disabled }: { item: any, isSelected: boolean, onPress: () => void, disabled?: boolean }) => (
        <TouchableOpacity
            style={[styles.item, isSelected && styles.selectedItem, disabled && styles.disabledItem]}
            onPress={disabled ? undefined : onPress}
            activeOpacity={disabled ? 1 : 0.8}
        >
            <Text style={[styles.itemText, isSelected && styles.selectedItemText, disabled && styles.disabledItemText]}>{item.label}</Text>
        </TouchableOpacity>
    );

    const handleConfirm = () => {
        const date = new Date(initialDate);
        let h = selectedHour;
        if (selectedPeriod === 'PM' && h !== 12) h += 12;
        if (selectedPeriod === 'AM' && h === 12) h = 0;

        date.setHours(h);
        date.setMinutes(selectedMinute);

        // Clamp to minimum if needed
        if (minimumDate && date < minimumDate) {
            onConfirm(minimumDate);
        } else {
            onConfirm(date);
        }
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
                <View style={styles.container} onStartShouldSetResponder={() => true}>
                    <View style={styles.header}>
                        <Text style={styles.title}>{title}</Text>
                    </View>

                    <View style={styles.pickerContainer}>
                        {/* Hours */}
                        <View style={styles.column}>
                            <Text style={styles.columnLabel}>Hour</Text>
                            <FlatList
                                data={HOURS}
                                keyExtractor={item => item.label}
                                renderItem={({ item }) => renderItem({
                                    item,
                                    isSelected: item.value === selectedHour,
                                    onPress: () => setSelectedHour(item.value),
                                    disabled: MINUTES.every(m => isTimeDisabled(item.value, m.value, selectedPeriod))
                                })}
                                showsVerticalScrollIndicator={false}
                                contentContainerStyle={{ paddingVertical: ITEM_HEIGHT }}
                                getItemLayout={(_, index) => ({ length: ITEM_HEIGHT, offset: ITEM_HEIGHT * index, index })}
                                initialScrollIndex={Math.max(0, HOURS.findIndex(h => h.value === selectedHour) - 1)}
                                onScrollToIndexFailed={() => { }}
                            />
                        </View>

                        {/* Minutes */}
                        <View style={styles.column}>
                            <Text style={styles.columnLabel}>Minute</Text>
                            <FlatList
                                data={MINUTES}
                                keyExtractor={item => item.label}
                                renderItem={({ item }) => renderItem({
                                    item,
                                    isSelected: item.value === selectedMinute,
                                    onPress: () => setSelectedMinute(item.value),
                                    disabled: isTimeDisabled(selectedHour, item.value, selectedPeriod)
                                })}
                                showsVerticalScrollIndicator={false}
                                contentContainerStyle={{ paddingVertical: ITEM_HEIGHT }}
                                getItemLayout={(_, index) => ({ length: ITEM_HEIGHT, offset: ITEM_HEIGHT * index, index })}
                                initialScrollIndex={Math.max(0, MINUTES.findIndex(m => m.value === selectedMinute) - 1)}
                                onScrollToIndexFailed={() => { }}
                            />
                        </View>

                        {/* AM/PM */}
                        <View style={styles.column}>
                            <Text style={styles.columnLabel}>Period</Text>
                            <View style={{ marginTop: ITEM_HEIGHT }}>
                                {PERIODS.map(item => (
                                    <React.Fragment key={item.value}>
                                        {renderItem({
                                            item,
                                            isSelected: item.value === selectedPeriod,
                                            onPress: () => setSelectedPeriod(item.value)
                                        })}
                                    </React.Fragment>
                                ))}
                            </View>
                        </View>
                    </View>

                    {/* Footer with Cancel and Done buttons */}
                    <View style={styles.footer}>
                        <TouchableOpacity onPress={onClose} style={styles.cancelButton}>
                            <Text style={styles.cancelText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleConfirm} style={styles.doneButton}>
                            <Text style={styles.doneText}>Done</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Selection Highlight Bar */}
                    {/* Note: In a real wheel picker this would overlay. Here we just use highlighted text style for simplicity and better touch targets */}
                </View>
            </TouchableOpacity>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    container: {
        width: '100%',
        maxWidth: 340,
        backgroundColor: COLORS.white,
        borderRadius: 24,
        padding: 20,
        ...SHADOWS.lg,
    },
    header: {
        marginBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.gray100,
        paddingBottom: 16,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.text,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 20,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: COLORS.gray100,
    },
    cancelButton: {
        paddingVertical: 10,
        paddingHorizontal: 16,
    },
    cancelText: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.textSecondary,
    },
    doneButton: {
        backgroundColor: COLORS.primary,
        paddingVertical: 10,
        paddingHorizontal: 24,
        borderRadius: 12,
    },
    doneText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    pickerContainer: {
        flexDirection: 'row',
        height: 200,
        gap: 12,
    },
    column: {
        flex: 1,
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        overflow: 'hidden',
    },
    columnLabel: {
        fontSize: 12,
        color: COLORS.textTertiary,
        fontWeight: '600',
        textTransform: 'uppercase',
        marginTop: 8,
        marginBottom: 4,
    },
    item: {
        height: ITEM_HEIGHT,
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
    },
    selectedItem: {
        backgroundColor: '#EFF6FF',
    },
    itemText: {
        fontSize: 18,
        color: COLORS.textSecondary,
        fontWeight: '500',
    },
    selectedItemText: {
        fontSize: 22,
        color: COLORS.primary,
        fontWeight: '700',
    },
    disabledItem: {
        opacity: 0.35,
    },
    disabledItemText: {
        color: COLORS.textTertiary,
    },
});
