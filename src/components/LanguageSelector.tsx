/**
 * Language Selector Component
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

export const LanguageSelector: React.FC = () => {
    const { i18n } = useTranslation();
    const currentLanguage = i18n.language;

    const languages = [
        { code: 'en', name: 'English', nativeName: 'English' },
        { code: 'hi', name: 'Hindi', nativeName: 'हिंदी' },
    ];

    const changeLanguage = (code: string) => {
        i18n.changeLanguage(code);
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Language / भाषा</Text>
            {languages.map((lang) => (
                <TouchableOpacity
                    key={lang.code}
                    style={[
                        styles.option,
                        currentLanguage === lang.code && styles.optionActive,
                    ]}
                    onPress={() => changeLanguage(lang.code)}
                >
                    <View>
                        <Text style={styles.languageName}>{lang.nativeName}</Text>
                        <Text style={styles.languageSubtext}>{lang.name}</Text>
                    </View>
                    {currentLanguage === lang.code && (
                        <Ionicons name="checkmark-circle" size={24} color="#2E59F3" />
                    )}
                </TouchableOpacity>
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 16,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1A1C1E',
        marginBottom: 16,
    },
    option: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#FFF',
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 2,
        borderColor: '#E5E7EB',
    },
    optionActive: {
        borderColor: '#2E59F3',
        backgroundColor: '#F0F4FF',
    },
    languageName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1A1C1E',
    },
    languageSubtext: {
        fontSize: 14,
        color: '#9CA3AF',
        marginTop: 2,
    },
});
