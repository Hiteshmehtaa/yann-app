/**
 * Language Settings Screen
 */

import React from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LanguageSelector } from '../../components/LanguageSelector';
import { useTheme } from '../../contexts/ThemeContext';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type Props = {
    navigation: NativeStackNavigationProp<any>;
};

export const LanguageSettingsScreen: React.FC<Props> = ({ navigation }) => {
    const { colors, isDark } = useTheme();

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
            <LanguageSelector />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});
