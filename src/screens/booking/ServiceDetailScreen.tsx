import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    Dimensions,
    TouchableOpacity,
    StatusBar,
    ScrollView,
    Platform,
} from 'react-native';
import Animated, {
    useAnimatedScrollHandler,
    useAnimatedStyle,
    useSharedValue,
    interpolate,
    Extrapolation,
    FadeIn,
    FadeInDown,
    withSpring,
    withTiming,
    runOnJS
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';

import { apiService } from '../../services/api';
import { getServiceIconImage } from '../../utils/serviceImages';
import { COLORS, SPACING, RADIUS, SHADOWS, TYPOGRAPHY } from '../../utils/theme';
import { useTheme } from '../../contexts/ThemeContext';
import { SkeletonLoader } from '../../components/ui/SkeletonLoader';
import type { Service, ServiceProvider } from '../../types';

// Types
type Props = {
    navigation: NativeStackNavigationProp<any>;
    route: RouteProp<{ params: { service: Service } }, 'params'>;
};

const { width, height } = Dimensions.get('window');
const HERO_HEIGHT = height * 0.42;
const HEADER_HEIGHT_EXPANDED = 100;
const HEADER_HEIGHT_COLLAPSED = 60;
const STICKY_BOTTOM_BAR_HEIGHT = 100;

// --- Components ---

/**
 * Modern Trust Badge Strip
 * Minimal, horizontal scrollable, subtle backgrounds
 */
const TrustBadgeStrip = ({ isDark }: { isDark: boolean }) => {
    const badges = [
        { icon: 'shield-check', text: 'Verified Pro', color: COLORS.primary },
        { icon: 'lock', text: 'Secure Pay', color: COLORS.success }, // Green for trust
        { icon: 'clock', text: 'On-Time', color: COLORS.warning },   // Amber for time
        { icon: 'headphones', text: '24/7 Support', color: COLORS.info }, // Blue for support
    ];

    return (
        <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.badgeContainer}
            style={{ flexGrow: 0 }}
        >
            {badges.map((item, index) => (
                <View key={index} style={[
                    styles.badgeItem,
                    {
                        backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : COLORS.gray100,
                        borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'transparent',
                        borderWidth: isDark ? 1 : 0
                    }
                ]}>
                    <MaterialCommunityIcons name={item.icon as any} size={16} color={item.color} />
                    <Text style={[styles.badgeText, { color: isDark ? COLORS.gray200 : COLORS.textSecondary }]}>{item.text}</Text>
                </View>
            ))}
        </ScrollView>
    );
};

/**
 * Modern Provider Card
 * Clean, white/dark card, soft shadow, large avatar, clear pricing
 */
const ModernProviderCard = ({
    item,
    isSelected,
    onSelect,
    isDark
}: {
    item: ServiceProvider,
    isSelected: boolean,
    onSelect: () => void,
    isDark: boolean
}) => {
    const scale = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: withSpring(isSelected ? 1.02 : 1) }],
        borderColor: withTiming(isSelected ? COLORS.primary : 'transparent'),
        borderWidth: withTiming(isSelected ? 2 : 0),
    }));

    return (
        <Animated.View style={[
            styles.providerCard,
            {
                backgroundColor: isDark ? COLORS.cardBg : COLORS.white,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: isDark ? 0.3 : 0.05, // Softer shadow for light mode
                shadowRadius: 12,
                elevation: isDark ? 2 : 4,
            },
            animatedStyle
        ]}>
            <TouchableOpacity
                activeOpacity={0.9}
                onPress={onSelect}
                style={styles.providerCardInner}
            >
                {/* --- Left: Avatar --- */}
                <View style={styles.avatarContainer}>
                    <Image
                        source={item.profileImage ? { uri: item.profileImage } : require('../../../assets/icon.png')}
                        style={styles.avatar}
                    />
                    <View style={styles.verifiedBadge}>
                        <MaterialCommunityIcons name="check-decagram" size={14} color="#FFF" />
                    </View>
                </View>

                {/* --- Middle: Info --- */}
                <View style={styles.providerInfo}>
                    <View style={styles.nameRow}>
                        <Text style={[styles.providerName, { color: isDark ? COLORS.white : COLORS.text }]} numberOfLines={1}>
                            {item.name}
                        </Text>
                    </View>

                    <Text style={[styles.providerExp, { color: isDark ? COLORS.textSecondary : COLORS.textTertiary }]}>
                        {item.experience}+ Years Exp • {item.totalReviews} Jobs
                    </Text>

                    <View style={styles.ratingRow}>
                        <View style={styles.starContainer}>
                            <Ionicons name="star" size={12} color={COLORS.warning} />
                            <Text style={[styles.ratingVal, { color: isDark ? COLORS.gray50 : COLORS.gray100 }]}>{item.rating}</Text>
                        </View>
                        {/* Dot Separator */}
                        <View style={{ width: 3, height: 3, borderRadius: 1.5, backgroundColor: isDark ? '#475569' : '#CBD5E1', marginHorizontal: 6 }} />
                        <Text style={{ fontSize: 12, color: isDark ? '#94A3B8' : '#64748B' }}>Very Reliable</Text>
                    </View>
                </View>

                {/* --- Right: Price & Selection --- */}
                <View style={styles.providerRight}>
                    <View style={styles.priceTag}>
                        <Text style={[styles.priceAmount, { color: COLORS.primary }]}>₹{item.priceForService}</Text>
                        <Text style={[styles.priceLabel, { color: isDark ? '#64748B' : '#94A3B8' }]}>/hr</Text>
                    </View>

                    <View style={[
                        styles.selectRadio,
                        {
                            borderColor: isSelected ? COLORS.primary : (isDark ? '#475569' : '#CBD5E1'),
                            backgroundColor: isSelected ? COLORS.primary : 'transparent'
                        }
                    ]}>
                        {isSelected && <Ionicons name="checkmark" size={14} color="#FFF" />}
                    </View>
                </View>
            </TouchableOpacity>
        </Animated.View>
    );
};

// --- Main Screen ---

export const ServiceDetailScreen: React.FC<Props> = ({ navigation, route }) => {
    const { service } = route.params;
    const { colors, isDark } = useTheme();
    const insets = useSafeAreaInsets();

    const [providers, setProviders] = useState<ServiceProvider[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedProvider, setSelectedProvider] = useState<ServiceProvider | null>(null);

    // Animations
    const scrollY = useSharedValue(0);
    const scrollHandler = useAnimatedScrollHandler(event => {
        scrollY.value = event.contentOffset.y;
    });

    // Fetch Data
    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await apiService.getProvidersByService(service.title);
                if (response.success && response.data) {
                    const mapped = response.data.map((p: any) => ({
                        _id: p.id || p._id,
                        name: p.name,
                        email: p.email || 'provider@yann.com',
                        phone: p.phone || '0000000000',
                        services: p.services || [],
                        serviceRates: p.serviceRates || [],
                        status: p.status || 'active',
                        rating: p.rating || 4.8,
                        totalReviews: p.totalReviews || 0,
                        profileImage: p.profileImage,
                        priceForService: p.price || service.price || 0,
                        experience: p.experience || 2,
                        bio: p.bio,
                        reviews: p.reviews || []
                    }));
                    setProviders(mapped);
                    // Pre-select the best rated or first provider
                    if (mapped.length > 0) {
                        const best = mapped.sort((a, b) => b.rating - a.rating)[0];
                        setSelectedProvider(best);
                    }
                }
            } catch (err) {
                console.error("Failed to load providers", err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [service.title]);

    // Animated Styles
    const heroImageStyle = useAnimatedStyle(() => {
        const scale = interpolate(scrollY.value, [-HERO_HEIGHT, 0, HERO_HEIGHT], [1.3, 1, 1.1], Extrapolation.CLAMP);
        const translateY = interpolate(scrollY.value, [-HERO_HEIGHT, 0, HERO_HEIGHT], [-HERO_HEIGHT / 4, 0, HERO_HEIGHT * 0.3]);
        return { transform: [{ scale }, { translateY }] };
    });

    const headerBlurStyle = useAnimatedStyle(() => {
        const opacity = interpolate(scrollY.value, [HERO_HEIGHT - 120, HERO_HEIGHT - 60], [0, 1], Extrapolation.CLAMP);
        return { opacity };
    });

    // Sticky Title in Header
    const headerTitleStyle = useAnimatedStyle(() => {
        const opacity = interpolate(scrollY.value, [HERO_HEIGHT - 80, HERO_HEIGHT - 40], [0, 1], Extrapolation.CLAMP);
        const translateY = interpolate(scrollY.value, [HERO_HEIGHT - 80, HERO_HEIGHT - 40], [10, 0], Extrapolation.CLAMP);
        return { opacity, transform: [{ translateY }] };
    });

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

            {/* --- Parallax Hero Section --- */}
            <View style={[styles.heroContainer, { height: HERO_HEIGHT }]}>
                <Animated.Image
                    source={getServiceIconImage(service.title)}
                    style={[styles.heroImage, heroImageStyle]}
                    resizeMode="cover"
                />

                {/* Gradient Overlay for Text Readability */}
                <LinearGradient
                    colors={['rgba(0,0,0,0.6)', 'transparent', 'transparent', isDark ? '#0F0F1A' : '#FAFAFA']}
                    // Top dark, middle clear, bottom matches background to blend
                    locations={[0, 0.3, 0.6, 1]}
                    style={StyleSheet.absoluteFill}
                />
            </View>

            {/* --- Sticky Header (Blur) --- */}
            <Animated.View style={[styles.stickyHeader, { height: insets.top + 60 }, headerBlurStyle]}>
                <BlurView intensity={90} tint={isDark ? "dark" : "light"} style={StyleSheet.absoluteFill} />
                <View style={[styles.stickyHeaderContent, { paddingTop: insets.top }]}>
                    {/* Centered Title */}
                    <Animated.Text style={[styles.stickyHeaderTitle, { color: isDark ? '#FFF' : '#000' }, headerTitleStyle]}>
                        {service.title}
                    </Animated.Text>
                </View>
            </Animated.View>

            {/* --- Back Button (Always Visible) --- */}
            <TouchableOpacity
                style={[styles.backButton, { top: insets.top + 10 }]}
                onPress={() => navigation.goBack()}
            >
                <BlurView intensity={50} tint="dark" style={styles.backButtonBlur}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.white} />
                </BlurView>
            </TouchableOpacity>


            {/* --- Scoll Content --- */}
            <Animated.ScrollView
                onScroll={scrollHandler}
                scrollEventThrottle={16}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={[
                    styles.scrollContent,
                    { paddingTop: HERO_HEIGHT - 60, paddingBottom: STICKY_BOTTOM_BAR_HEIGHT + 20 }
                ]}
            >
                {/* --- Main Info Block --- */}
                <View style={styles.mainInfoBlock}>
                    <View style={styles.pillContainer}>
                        <View style={[styles.categoryPill, { backgroundColor: COLORS.primary }]}>
                            <Text style={styles.categoryText}>{service.category?.toUpperCase() || 'PREMIUM'}</Text>
                        </View>
                        <View style={[styles.ratingPill, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                            <Ionicons name="star" size={12} color={COLORS.warning} />
                            <Text style={styles.ratingTextHero}>4.8 (120+)</Text>
                        </View>
                    </View>

                    <Text style={styles.heroTitle}>{service.title}</Text>

                    <Text style={styles.heroDescription}>
                        {service.description || "Professional service delivered by verified experts. Quality guaranteed."}
                    </Text>
                </View>

                {/* --- Rest of Content (White/Dark Background) --- */}
                <View style={[styles.bodyContent, { backgroundColor: isDark ? '#0F0F1A' : '#FAFAFA' }]}>

                    {/* --- Trust Badge Strip --- */}
                    <View style={styles.sectionContainer}>
                        <TrustBadgeStrip isDark={isDark} />
                    </View>

                    {/* --- Providers Section --- */}
                    <View style={styles.sectionContainer}>
                        <Text style={[styles.sectionTitle, { color: isDark ? '#FFF' : '#1E293B' }]}>
                            Select Professional
                        </Text>

                        {isLoading ? (
                            <View style={{ gap: 16 }}>
                                <SkeletonLoader variant="rect" height={100} style={{ borderRadius: 16 }} />
                                <SkeletonLoader variant="rect" height={100} style={{ borderRadius: 16 }} />
                            </View>
                        ) : providers.length === 0 ? (
                            <View style={styles.emptyState}>
                                <Feather name="search" size={32} color={isDark ? '#475569' : '#94A3B8'} />
                                <Text style={[styles.emptyStateText, { color: isDark ? '#64748B' : '#94A3B8' }]}>
                                    No providers available nearby.
                                </Text>
                            </View>
                        ) : (
                            <View style={{ gap: 16 }}>
                                {providers.map((item, index) => (
                                    <ModernProviderCard
                                        key={item._id}
                                        item={item}
                                        isSelected={selectedProvider?._id === item._id}
                                        onSelect={() => {
                                            Haptics.selectionAsync();
                                            setSelectedProvider(item);
                                        }}
                                        isDark={isDark}
                                    />
                                ))}
                            </View>
                        )}
                    </View>

                    {/* Disclaimer */}
                    <Text style={styles.disclaimerText}>
                        By booking, you agree to our Terms of Service. Prices may vary based on specific requirements.
                    </Text>

                </View>
            </Animated.ScrollView>

            {/* --- Sticky Booking Bar --- */}
            {selectedProvider && (
                <Animated.View
                    entering={FadeInDown.springify()}
                    style={[styles.stickyFooter, { paddingBottom: insets.bottom + 12 }]}
                >
                    <BlurView intensity={90} tint={isDark ? "dark" : "light"} style={StyleSheet.absoluteFill} />
                    <View style={styles.footerContent}>
                        <View>
                            <Text style={styles.footerLabel}>Total Estimate</Text>
                            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
                                <Text style={[styles.footerPrice, { color: isDark ? '#FFF' : '#1E293B' }]}>
                                    ₹{selectedProvider.priceForService}
                                </Text>
                            </View>
                        </View>

                        <TouchableOpacity
                            style={styles.bookButton}
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                navigation.navigate('ProviderPublicProfile', {
                                    provider: selectedProvider,
                                    service: service
                                });
                            }}
                        >
                            <Text style={styles.bookButtonText}>Book Now</Text>
                            <Ionicons name="arrow-forward" size={18} color={COLORS.white} />
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            )}
        </View>
    );
};

// --- Styles ---

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background, // Use theme background
    },
    heroContainer: {
        width: '100%',
        position: 'absolute',
        top: 0,
        left: 0,
        zIndex: 0,
        backgroundColor: COLORS.gray100, // Light gray placeholder for hero
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    heroImage: {
        width: '80%', // reduce width so icon doesn't look blown up
        height: '80%',
        resizeMode: 'contain', // keep aspect ratio for icons
    },
    stickyHeader: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        overflow: 'hidden',
        borderBottomWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
    },
    stickyHeaderContent: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    stickyHeaderTitle: {
        fontSize: 17,
        fontWeight: '600',
    },
    backButton: {
        position: 'absolute',
        left: 20,
        zIndex: 101, // Above header
        borderRadius: 20,
        overflow: 'hidden',
    },
    backButtonBlur: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.5)', // Visible on light bg
    },

    // Scroll Structure
    scrollContent: {
        // Padding top matches hero logic
    },
    mainInfoBlock: {
        paddingHorizontal: 24,
        paddingBottom: 32,
        justifyContent: 'flex-end',
        alignItems: 'center', // Center content for hero look
    },
    pillContainer: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 16,
    },
    categoryPill: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 100,
    },
    categoryText: {
        fontSize: 10,
        fontWeight: '700',
        color: COLORS.white,
        letterSpacing: 0.5,
    },
    ratingPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 100,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.1)',
        backgroundColor: 'rgba(255,255,255,0.8)',
    },
    ratingTextHero: {
        fontSize: 11,
        fontWeight: '600',
        color: '#334155',
    },
    heroTitle: {
        fontSize: 28,
        fontWeight: '800',
        color: '#1E293B', // Dark Slate
        marginBottom: 8,
        letterSpacing: -0.5,
        textAlign: 'center',
    },
    heroDescription: {
        fontSize: 15,
        color: '#64748B', // Slate 500
        lineHeight: 22,
        fontWeight: '400',
        textAlign: 'center',
        maxWidth: '90%',
    },

    // Body
    bodyContent: {
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        backgroundColor: COLORS.background, // Match container
        marginTop: 0, // No overlap needed if hero is clean
        paddingTop: 32,
        paddingHorizontal: 20,
        minHeight: 600,
    },
    sectionContainer: {
        marginBottom: 32,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 16,
        letterSpacing: -0.3,
    },

    // Badges
    badgeContainer: {
        gap: 12,
        paddingRight: 20,
    },
    badgeItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 16,
    },
    badgeText: {
        fontSize: 12,
        fontWeight: '600',
    },

    // Provider Card
    providerCard: {
        borderRadius: 20, // Rounded corners
        marginBottom: 12,
    },
    providerCardInner: {
        flexDirection: 'row',
        padding: 16,
        alignItems: 'center',
    },
    avatarContainer: {
        position: 'relative',
        marginRight: 16,
    },
    avatar: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: COLORS.gray200,
    },
    verifiedBadge: {
        position: 'absolute',
        bottom: -2,
        right: -2,
        backgroundColor: COLORS.primary,
        borderRadius: 8,
        width: 16,
        height: 16,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1.5,
        borderColor: COLORS.white,
    },
    providerInfo: {
        flex: 1,
        justifyContent: 'center',
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    providerName: {
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: -0.3,
    },
    providerExp: {
        fontSize: 12,
        marginBottom: 8,
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    starContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: 'rgba(245, 158, 11, 0.15)',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
    },
    ratingVal: {
        fontSize: 11,
        fontWeight: '700',
    },

    // Provider Right
    providerRight: {
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        height: 50, // Approx height to match avatar area
        paddingLeft: 12,
    },
    priceTag: {
        alignItems: 'flex-end',
    },
    priceAmount: {
        fontSize: 16,
        fontWeight: '700',
    },
    priceLabel: {
        fontSize: 11,
    },
    selectRadio: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
    },

    // Empty State
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
        gap: 12,
    },
    emptyStateText: {
        fontSize: 14,
    },
    disclaimerText: {
        fontSize: 12,
        color: '#94A3B8',
        textAlign: 'center',
        marginTop: 20,
        marginBottom: 40,
        lineHeight: 18,
    },

    // Sticky Footer
    stickyFooter: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.05)',
        overflow: 'hidden',
    },
    footerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        paddingTop: 16,
    },
    footerLabel: {
        fontSize: 12,
        color: '#64748B',
        marginBottom: 2,
    },
    footerPrice: {
        fontSize: 22,
        fontWeight: '800',
        letterSpacing: -0.5,
    },
    bookButton: {
        backgroundColor: COLORS.primary, // Brand blue
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 100, // Pill shape
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 6,
    },
    bookButtonText: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: '700',
    },
});
