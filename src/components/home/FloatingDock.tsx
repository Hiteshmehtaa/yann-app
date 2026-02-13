import React from 'react';
import { View, StyleSheet, ScrollView, Text, TouchableOpacity, Dimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { SearchBar } from '../ui/SearchBar';
import { COLORS, SHADOWS, RADIUS } from '../../utils/theme';
import { useTheme } from '../../contexts/ThemeContext';

interface FloatingDockProps {
    searchQuery: string;
    onSearchChange: (text: string) => void;
    categories: string[];
    selectedCategory: string;
    onSelectCategory: (category: string) => void;
}

const { width } = Dimensions.get('window');

export const FloatingDock: React.FC<FloatingDockProps> = ({
    searchQuery,
    onSearchChange,
    categories,
    selectedCategory,
    onSelectCategory,
}) => {
    const { colors, isDark } = useTheme();

    const handleCategorySelect = (category: string) => {
        // Haptic feedback for category selection
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onSelectCategory(category);
    };

    return (
        <View style={styles.container}>
            {/* Premium Search Row with Enhanced Shadows */}
            <View style={styles.searchRow}>
                <View style={[
                    styles.searchBarWrapper,
                    {
                        backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.95)',
                        borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
                        shadowColor: isDark ? '#000' : COLORS.primary,
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: isDark ? 0.4 : 0.08,
                        shadowRadius: 16,
                        elevation: 8,
                    }
                ]}>
                    <Ionicons 
                        name="search" 
                        size={20} 
                        color={colors.textTertiary} 
                        style={styles.searchIcon}
                    />
                    <SearchBar
                        value={searchQuery}
                        onChangeText={onSearchChange}
                        placeholder="Search services, categories..."
                        style={styles.searchInput}
                    />
                </View>

                <TouchableOpacity 
                    style={[
                        styles.filterBtn, 
                        { 
                            backgroundColor: COLORS.primary,
                            shadowColor: COLORS.primary,
                            shadowOffset: { width: 0, height: 6 },
                            shadowOpacity: 0.35,
                            shadowRadius: 12,
                            elevation: 8,
                        }
                    ]}
                    onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)}
                    activeOpacity={0.85}
                >
                    <Ionicons name="options-outline" size={22} color="#FFF" />
                </TouchableOpacity>
            </View>

            {/* Premium Category Pills with Enhanced Design */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoryScroll}
                decelerationRate="fast"
                snapToInterval={100}
            >
                {categories.map((cat) => {
                    const isSelected = selectedCategory === cat;
                    return (
                        <TouchableOpacity
                            key={cat}
                            onPress={() => handleCategorySelect(cat)}
                            style={[
                                styles.categoryPill,
                                isSelected
                                    ? { 
                                        backgroundColor: COLORS.primary,
                                        borderColor: COLORS.primary,
                                        shadowColor: COLORS.primary,
                                        shadowOffset: { width: 0, height: 4 },
                                        shadowOpacity: 0.25,
                                        shadowRadius: 8,
                                        elevation: 4,
                                    }
                                    : {
                                        backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.6)',
                                        borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'
                                    }
                            ]}
                            activeOpacity={0.8}
                        >
                            <Text
                                style={[
                                    styles.categoryText,
                                    { color: isSelected ? '#FFF' : colors.text }
                                ]}
                            >
                                {cat.charAt(0).toUpperCase() + cat.slice(1)}
                            </Text>
                            {isSelected && (
                                <View style={styles.selectedIndicator} />
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
        paddingHorizontal: 24,
        marginBottom: 32,
        gap: 20,
    },
    searchRow: {
        flexDirection: 'row',
        gap: 12,
        alignItems: 'center',
    },
    searchBarWrapper: {
        flex: 1,
        height: 56,
        borderRadius: 16,
        borderWidth: 1,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        gap: 12,
    },
    searchIcon: {
        marginRight: -4,
    },
    searchInput: {
        flex: 1,
        backgroundColor: 'transparent',
        borderWidth: 0,
        height: 56,
        paddingHorizontal: 0,
    },
    filterBtn: {
        width: 56,
        height: 56,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    categoryScroll: {
        gap: 12,
        paddingRight: 24,
    },
    categoryPill: {
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 14,
        borderWidth: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    categoryText: {
        fontSize: 14,
        fontWeight: '600',
        letterSpacing: 0.2,
    },
    selectedIndicator: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#FFF',
        opacity: 0.8,
    },
});
