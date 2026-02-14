/**
 * Onboarding Screen
 * 
 * First-time user tutorial
 */

import React, { useRef, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Dimensions,
    TouchableOpacity,
    FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import LottieView from 'lottie-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';
import { LottieAnimations } from '../../utils/lottieAnimations';

const { width } = Dimensions.get('window');

const ONBOARDING_KEY = '@yann_onboarding_completed';

interface OnboardingSlide {
    id: string;
    animation: any;
    titleKey: string;
    descriptionKey: string;
}

const slides: OnboardingSlide[] = [
    {
        id: '1',
        animation: LottieAnimations.campersWelcome,
        titleKey: 'onboarding.slide1.title',
        descriptionKey: 'onboarding.slide1.description',
    },
    {
        id: '2',
        animation: LottieAnimations.emailSent,
        titleKey: 'onboarding.slide2.title',
        descriptionKey: 'onboarding.slide2.description',
    },
    {
        id: '3',
        animation: LottieAnimations.success,
        titleKey: 'onboarding.slide3.title',
        descriptionKey: 'onboarding.slide3.description',
    },
];

interface OnboardingScreenProps {
    onComplete: () => void;
}

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onComplete }) => {
    const { t } = useTranslation();
    const [currentIndex, setCurrentIndex] = useState(0);
    const flatListRef = useRef<FlatList>(null);

    const handleNext = () => {
        if (currentIndex < slides.length - 1) {
            flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
        } else {
            handleComplete();
        }
    };

    const handleSkip = () => {
        handleComplete();
    };

    const handleComplete = async () => {
        try {
            await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
            onComplete();
        } catch (error) {
            console.error('Failed to save onboarding status:', error);
            onComplete();
        }
    };

    const renderSlide = ({ item }: { item: OnboardingSlide }) => (
        <View style={styles.slide}>
            <LottieView
                source={item.animation}
                autoPlay
                loop
                style={styles.animation}
            />
            <Text style={styles.title}>{t(item.titleKey)}</Text>
            <Text style={styles.description}>{t(item.descriptionKey)}</Text>
        </View>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
            <FlatList
                ref={flatListRef}
                data={slides}
                renderItem={renderSlide}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={(event) => {
                    const index = Math.round(event.nativeEvent.contentOffset.x / width);
                    setCurrentIndex(index);
                }}
                keyExtractor={(item) => item.id}
            />

            {/* Pagination Dots */}
            <View style={styles.pagination}>
                {slides.map((_, index) => (
                    <View
                        key={index}
                        style={[
                            styles.dot,
                            currentIndex === index && styles.dotActive,
                        ]}
                    />
                ))}
            </View>

            {/* Buttons */}
            <View style={styles.footer}>
                {currentIndex < slides.length - 1 && (
                    <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
                        <Text style={styles.skipText}>{t('common.skip')}</Text>
                    </TouchableOpacity>
                )}

                <TouchableOpacity
                    onPress={handleNext}
                    style={styles.nextButton}
                    activeOpacity={0.8}
                >
                    <LinearGradient
                        colors={['#2E59F3', '#4362FF']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.nextGradient}
                    >
                        <Text style={styles.nextText}>
                            {currentIndex === slides.length - 1
                                ? t('common.getStarted')
                                : t('common.continue')}
                        </Text>
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F6F7FB',
    },
    slide: {
        width,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 40,
    },
    animation: {
        width: 300,
        height: 300,
        marginBottom: 40,
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        color: '#1A1C1E',
        textAlign: 'center',
        marginBottom: 16,
        lineHeight: 36,
    },
    description: {
        fontSize: 16,
        color: '#4A4D52',
        textAlign: 'center',
        lineHeight: 24,
    },
    pagination: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 40,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#E5E7EB',
        marginHorizontal: 4,
    },
    dotActive: {
        width: 24,
        backgroundColor: '#2E59F3',
    },
    footer: {
        flexDirection: 'row',
        paddingHorizontal: 24,
        paddingBottom: 20,
        gap: 12,
    },
    skipButton: {
        flex: 1,
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    skipText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#4A4D52',
    },
    nextButton: {
        flex: 2,
        borderRadius: 12,
        overflow: 'hidden',
        shadowColor: '#2E59F3',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    nextGradient: {
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    nextText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFF',
    },
});

// Helper function to check if onboarding is completed
export async function isOnboardingCompleted(): Promise<boolean> {
    try {
        const value = await AsyncStorage.getItem(ONBOARDING_KEY);
        return value === 'true';
    } catch {
        return false;
    }
}
