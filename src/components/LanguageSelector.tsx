/**
 * Language Selector Component
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';

export const LanguageSelector: React.FC = () => {
    const { i18n } = useTranslation();
    const [selectedLanguage, setSelectedLanguage] = useState(i18n.language);

    const languages = [
        { code: 'en', name: 'English', nativeName: 'English' },
        { code: 'hi', name: 'Hindi', nativeName: 'हिंदी' },
    ];

    const handleApply = () => {
        if (selectedLanguage !== i18n.language) {
            i18n.changeLanguage(selectedLanguage);
            Alert.alert(
                'Language Changed',
                `App language changed to ${languages.find(l => l.code === selectedLanguage)?.nativeName}`,
                [{ text: 'OK' }]
            );
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Language / भाषा</Text>

            {languages.map((lang) => (
                <TouchableOpacity
                    key={lang.code}
                    style={[
                        styles.option,
                        selectedLanguage === lang.code && styles.optionActive,
                    ]}
                    onPress={() => setSelectedLanguage(lang.code)}
                >
                    <View>
                        <Text style={styles.languageName}>{lang.nativeName}</Text>
                        <Text style={styles.languageSubtext}>{lang.name}</Text>
                    </View>
                    {selectedLanguage === lang.code && (
                        <Ionicons name="checkmark-circle" size={24} color="#2E59F3" />
                    )}
                </TouchableOpacity>
            ))}

            {/* Apply Button */}
            <TouchableOpacity
                style={styles.applyButton}
                onPress={handleApply}
                activeOpacity={0.8}
            >
                <LinearGradient
                    colors={['#2E59F3', '#4362FF']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.applyGradient}
                >
                    <Text style={styles.applyText}>Apply Changes</Text>
                    <Ionicons name="checkmark" size={20} color="#FFF" style={{ marginLeft: 8 }} />
                </LinearGradient>
            </TouchableOpacity>
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
    applyButton: {
        marginTop: 24,
        borderRadius: 12,
        overflow: 'hidden',
        shadowColor: '#2E59F3',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    applyGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        paddingHorizontal: 32,
    },
    applyText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFF',
    },
});
