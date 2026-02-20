import React, { useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, Dimensions } from 'react-native';
import { COLORS, TYPOGRAPHY, SHADOWS } from '../../utils/theme';
import { Ionicons } from '@expo/vector-icons';

interface CustomTimePickerWheelProps {
    visible: boolean;
    onClose: () => void;
    onConfirm: (date: Date) => void;
    initialDate?: Date;
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
    title = 'Select Time'
}) => {
    const [selectedHour, setSelectedHour] = useState(12);
    const [selectedMinute, setSelectedMinute] = useState(0);
    const [selectedPeriod, setSelectedPeriod] = useState('AM');

    useEffect(() => {
        if (visible) {
            let h = initialDate.getHours();
            const m = initialDate.getMinutes();
            const p = h >= 12 ? 'PM' : 'AM';

            h = h % 12;
            h = h ? h : 12; // the hour '0' should be '12'

            // Round minutes to nearest 5
            const roundedMinute = Math.round(m / 5) * 5;

            setSelectedHour(h);
            setSelectedMinute(roundedMinute === 60 ? 0 : roundedMinute); // Handle 60 as 00
            setSelectedPeriod(p);
        }
    }, [visible, initialDate]);

    // Helpers to render items
    const renderItem = ({ item, isSelected, onPress }: { item: any, isSelected: boolean, onPress: () => void }) => (
        <TouchableOpacity
            style={[styles.item, isSelected && styles.selectedItem]}
            onPress={onPress}
            activeOpacity={0.8}
        >
            <Text style={[styles.itemText, isSelected && styles.selectedItemText]}>{item.label}</Text>
        </TouchableOpacity>
    );

    const handleConfirm = () => {
        const date = new Date(initialDate);
        let h = selectedHour;
        if (selectedPeriod === 'PM' && h !== 12) h += 12;
        if (selectedPeriod === 'AM' && h === 12) h = 0;

        date.setHours(h);
        date.setMinutes(selectedMinute);
        onConfirm(date);
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
                        <TouchableOpacity onPress={handleConfirm}>
                            <Text style={styles.confirmText}>Done</Text>
                        </TouchableOpacity>
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
                                    onPress: () => setSelectedHour(item.value)
                                })}
                                showsVerticalScrollIndicator={false}
                                contentContainerStyle={{ paddingVertical: ITEM_HEIGHT }}
                                getItemLayout={(_, index) => ({ length: ITEM_HEIGHT, offset: ITEM_HEIGHT * index, index })}
                                initialScrollIndex={Math.max(0, HOURS.findIndex(h => h.value === selectedHour) - 1)}
                                onScrollToIndexFailed={() => {}}
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
                                    onPress: () => setSelectedMinute(item.value)
                                })}
                                showsVerticalScrollIndicator={false}
                                contentContainerStyle={{ paddingVertical: ITEM_HEIGHT }}
                                getItemLayout={(_, index) => ({ length: ITEM_HEIGHT, offset: ITEM_HEIGHT * index, index })}
                                initialScrollIndex={Math.max(0, MINUTES.findIndex(m => m.value === selectedMinute) - 1)}
                                onScrollToIndexFailed={() => {}}
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
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
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
    confirmText: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.primary,
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
});
