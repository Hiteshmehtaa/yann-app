/**
 * i18n Configuration
 * 
 * Multi-language support for English and Hindi
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

import en from './locales/en.json';
import hi from './locales/hi.json';

const LANGUAGE_KEY = '@yann_language';

// Get saved language
const getSavedLanguage = async () => {
    try {
        const saved = await AsyncStorage.getItem(LANGUAGE_KEY);
        return saved || 'en';
    } catch {
        return 'en';
    }
};

// Initialize i18n
i18n
    .use(initReactI18next)
    .init({
        resources: {
            en: { translation: en },
            hi: { translation: hi },
        },
        lng: 'en', // Will be updated from AsyncStorage
        fallbackLng: 'en',
        interpolation: {
            escapeValue: false,
        },
    });

// Load saved language
getSavedLanguage().then(lang => {
    i18n.changeLanguage(lang);
});

// Save language when changed
i18n.on('languageChanged', async (lng) => {
    try {
        await AsyncStorage.setItem(LANGUAGE_KEY, lng);
    } catch (error) {
        console.error('Failed to save language:', error);
    }
});

export default i18n;
