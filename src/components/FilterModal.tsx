/**
 * Filter Modal Component
 */

import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export interface FilterOptions {
    priceRange?: { min: number; max: number };
    rating?: number;
    sortBy?: 'price' | 'rating' | 'distance';
    sortOrder?: 'asc' | 'desc';
}

interface FilterModalProps {
    visible: boolean;
    onClose: () => void;
    onApply: (filters: FilterOptions) => void;
    initialFilters?: FilterOptions;
}

export const FilterModal: React.FC<FilterModalProps> = ({
    visible,
    onClose,
    onApply,
    initialFilters = {},
}) => {
    const [filters, setFilters] = useState<FilterOptions>(initialFilters);

    const handleApply = () => {
        onApply(filters);
        onClose();
    };

    const handleReset = () => {
        setFilters({});
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.container}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.title}>Filters</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={24} color="#1A1C1E" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.content}>
                        {/* Sort By */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>SORT BY</Text>
                            {['price', 'rating', 'distance'].map((option) => (
                                <TouchableOpacity
                                    key={option}
                                    style={styles.option}
                                    onPress={() => setFilters({ ...filters, sortBy: option as any })}
                                >
                                    <Text style={styles.optionText}>
                                        {option.charAt(0).toUpperCase() + option.slice(1)}
                                    </Text>
                                    {filters.sortBy === option && (
                                        <Ionicons name="checkmark" size={20} color="#2E59F3" />
                                    )}
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Rating */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>MINIMUM RATING</Text>
                            {[5, 4, 3, 2, 1].map((rating) => (
                                <TouchableOpacity
                                    key={rating}
                                    style={styles.option}
                                    onPress={() => setFilters({ ...filters, rating })}
                                >
                                    <View style={styles.ratingOption}>
                                        <Text style={styles.optionText}>{rating}</Text>
                                        <Ionicons name="star" size={16} color="#FFA500" style={{ marginLeft: 4 }} />
                                        <Text style={styles.optionText}> & above</Text>
                                    </View>
                                    {filters.rating === rating && (
                                        <Ionicons name="checkmark" size={20} color="#2E59F3" />
                                    )}
                                </TouchableOpacity>
                            ))}
                        </View>
                    </ScrollView>

                    {/* Footer */}
                    <View style={styles.footer}>
                        <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
                            <Text style={styles.resetText}>Reset</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
                            <LinearGradient
                                colors={['#2E59F3', '#4362FF']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.applyGradient}
                            >
                                <Text style={styles.applyText}>Apply Filters</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    container: {
        backgroundColor: '#FFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '80%',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1A1C1E',
    },
    content: {
        padding: 20,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: '700',
        color: '#1A1C1E',
        letterSpacing: 1,
        marginBottom: 12,
    },
    option: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    optionText: {
        fontSize: 16,
        color: '#4A4D52',
    },
    ratingOption: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    footer: {
        flexDirection: 'row',
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
        gap: 12,
    },
    resetButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        alignItems: 'center',
    },
    resetText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#4A4D52',
    },
    applyButton: {
        flex: 2,
        borderRadius: 12,
        overflow: 'hidden',
    },
    applyGradient: {
        paddingVertical: 14,
        alignItems: 'center',
    },
    applyText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#FFF',
    },
});
