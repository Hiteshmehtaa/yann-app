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
            {/* Search Section - Floating Glass Pill */}
            <View style={styles.searchRow}>
                <View style={[
                    styles.searchBarWrapper,
                    {
                        backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.7)',
                        borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.4)',
                    }
                ]}>
                    <SearchBar
                        value={searchQuery}
                        onChangeText={onSearchChange}
                        placeholder="Search services..."
                        style={{ backgroundColor: 'transparent', borderWidth: 0, height: 50 }}
                    />
                </View>
            </View>

            {/* Categories Scroller - Floating Chips */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoryScroll}
            >
                {categories.map((cat) => (
                    <TouchableOpacity
                        key={cat}
                        onPress={() => handleCategorySelect(cat)}
                        style={[
                            styles.categoryPill,
                            selectedCategory === cat
                                ? { backgroundColor: COLORS.primary, borderColor: COLORS.primary }
                                : {
                                    backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.5)',
                                    borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.2)'
                                }
                        ]}
                    >
                        <Text
                            style={[
                                styles.categoryText,
                                { color: selectedCategory === cat ? '#FFF' : colors.text }
                            ]}
                        >
                            {cat.charAt(0).toUpperCase() + cat.slice(1)}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 24,
        marginBottom: 24,
    },
    searchRow: {
        marginBottom: 20,
    },
    searchBarWrapper: {
        height: 52,
        borderRadius: 26,
        borderWidth: 1,
        overflow: 'hidden',
        justifyContent: 'center',
    },
    categoryScroll: {
        gap: 10,
        paddingRight: 24, // End padding
    },
    categoryPill: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
        borderWidth: 1,
    },
    categoryText: {
        fontSize: 14,
        fontWeight: '600',
        letterSpacing: 0.3,
    },
});
