import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    Image,
    ActivityIndicator,
    Animated,
    Dimensions,
    StatusBar,
    Platform,
    ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { apiService } from '../../services/api';
import { COLORS, SPACING, RADIUS, SHADOWS, TYPOGRAPHY } from '../../utils/theme';
import * as Haptics from 'expo-haptics';
import LottieView from 'lottie-react-native';
import { LottieAnimations } from '../../utils/lottieAnimations';

const { width, height } = Dimensions.get('window');

type RouteParams = {
    params: {
        service: any;
        tripType: 'incity' | 'outstation';
        tripDirection: 'oneway' | 'roundtrip';
        vehicleType: 'hatchback' | 'sedan' | 'suv' | 'luxury';
        transmission: 'manual' | 'automatic';
        pickupAddress: string;
        dropAddress: string;
        pickupCoords: { latitude: number; longitude: number } | null;
        dropCoords: { latitude: number; longitude: number } | null;
        routeDistanceKm: number;
        driverReturnFare: number;
    };
};

type Props = {
    navigation: NativeStackNavigationProp<any>;
    route: RouteProp<RouteParams, 'params'>;
};

interface DriverResult {
    _id: string;
    id?: string;
    name: string;
    phone?: string;
    email?: string;
    profileImage?: string;
    experience: number;
    rating: number;
    totalReviews: number;
    services: string[];
    serviceRates: Array<{ serviceName: string; price: number }>;
    vehicleTypes?: string[];
    transmissionTypes?: string[];
    tripPreferences?: string[];
    workingHours?: { startTime: string; endTime: string } | null;
    status?: string;
    bio?: string;
    priceForService?: number;
}

// Fade in wrapper
const FadeInView = ({ children, delay = 0, style }: any) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;
    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 500, delay, useNativeDriver: true }),
            Animated.timing(slideAnim, { toValue: 0, duration: 500, delay, useNativeDriver: true }),
        ]).start();
    }, []);
    return (
        <Animated.View style={[{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }, style]}>
            {children}
        </Animated.View>
    );
};

export const DriverSearchResultsScreen: React.FC<Props> = ({ navigation, route }) => {
    const {
        service,
        tripType,
        tripDirection,
        vehicleType,
        transmission,
        pickupAddress,
        dropAddress,
        pickupCoords,
        dropCoords,
        routeDistanceKm,
        driverReturnFare,
    } = route.params;

    const insets = useSafeAreaInsets();
    const [drivers, setDrivers] = useState<DriverResult[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const searchAnim = useRef(new Animated.Value(0)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;

    // Search animation
    useEffect(() => {
        const pulse = Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 1.15, duration: 800, useNativeDriver: true }),
                Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
            ])
        );
        pulse.start();
        return () => pulse.stop();
    }, []);

    // Fetch drivers
    useEffect(() => {
        fetchMatchingDrivers();
    }, []);

    // Map raw provider data to DriverResult
    const mapProviderToDriver = (d: any): DriverResult => {
        // driverServiceDetails can be nested — extract vehicle/transmission/trip data
        const dsd = d.driverServiceDetails || {};
        return {
            _id: d.id || d._id,
            id: d.id || d._id,
            name: d.name,
            phone: d.phone,
            email: d.email,
            profileImage: d.profileImage,
            experience: d.experience || 0,
            rating: d.rating || 0,
            totalReviews: d.totalReviews || 0,
            services: d.services || [],
            serviceRates: d.serviceRates || [],
            vehicleTypes: d.vehicleTypes || dsd.vehicleTypes || [],
            transmissionTypes: d.transmissionTypes || dsd.transmissionTypes || [],
            // Handle both 'tripPreference' (singular from signup) and 'tripPreferences' (plural)
            tripPreferences: d.tripPreferences || dsd.tripPreferences || (dsd.tripPreference ? [dsd.tripPreference] : []),
            workingHours: d.workingHours,
            status: d.status,
            bio: d.bio,
            priceForService: d.price || d.priceForService || 0,
        };
    };

    // Client-side filter: check if a driver matches user's selected criteria
    const driverMatchesCriteria = (driver: DriverResult): boolean => {
        const vTypes = (driver.vehicleTypes || []).map(v => v.toLowerCase());
        const tTypes = (driver.transmissionTypes || []).map(t => t.toLowerCase());
        const trips = (driver.tripPreferences || []).map(t => t.toLowerCase());

        const matchesVehicle = vTypes.length === 0 || vTypes.includes(vehicleType.toLowerCase());
        const matchesTransmission = tTypes.length === 0 || tTypes.includes(transmission.toLowerCase());
        const matchesTrip = trips.length === 0 || trips.includes(tripType.toLowerCase()) || trips.includes('both');

        return matchesVehicle && matchesTransmission && matchesTrip;
    };

    const fetchMatchingDrivers = async () => {
        setIsLoading(true);
        setError(null);
        try {
            let allDrivers: DriverResult[] = [];

            // Strategy 1: Try the search endpoint first
            try {
                const response = await apiService.searchProviders({
                    service: 'Personal Driver',
                    vehicleType,
                    transmission,
                    tripType,
                });
                if (response.success && response.data && response.data.length > 0) {
                    allDrivers = response.data.map(mapProviderToDriver);
                    console.log(`✅ searchProviders returned ${allDrivers.length} drivers`);
                }
            } catch (searchErr) {
                console.log('⚠️ searchProviders failed, trying fallback:', searchErr);
            }

            // Strategy 2: If search returned nothing, fetch all driver providers and filter client-side
            if (allDrivers.length === 0) {
                console.log('🔄 Falling back to getProvidersByService + client-side filtering');
                const fallbackResponse = await apiService.getProvidersByService('Personal Driver');
                if (fallbackResponse.success && fallbackResponse.data && fallbackResponse.data.length > 0) {
                    const allMapped = fallbackResponse.data.map(mapProviderToDriver);
                    // Apply client-side filtering
                    const filtered = allMapped.filter(driverMatchesCriteria);
                    console.log(`📊 Fallback: ${allMapped.length} total drivers → ${filtered.length} matching criteria`);
                    allDrivers = filtered.length > 0 ? filtered : allMapped; // Show all if none match filters exactly
                }
            }

            // Strategy 3: If still nothing, try fetching ALL providers with driver service
            if (allDrivers.length === 0) {
                console.log('🔄 Trying getAllProviders with service filter');
                const allResponse = await apiService.getAllProviders({ service: 'Personal Driver' });
                if (allResponse.success && allResponse.data && allResponse.data.length > 0) {
                    const allMapped = allResponse.data.map(mapProviderToDriver);
                    const filtered = allMapped.filter(driverMatchesCriteria);
                    console.log(`📊 getAllProviders: ${allMapped.length} total → ${filtered.length} matching`);
                    allDrivers = filtered.length > 0 ? filtered : allMapped;
                }
            }

            // Strategy 4: Last resort — get ALL providers and filter by service name containing 'driver'
            if (allDrivers.length === 0) {
                console.log('🔄 Last resort: fetching all providers');
                const lastResponse = await apiService.getAllProviders({});
                if (lastResponse.success && lastResponse.data && lastResponse.data.length > 0) {
                    const driverProviders = lastResponse.data.filter((p: any) =>
                        (p.services || []).some((s: string) => s.toLowerCase().includes('driver'))
                    );
                    if (driverProviders.length > 0) {
                        const allMapped = driverProviders.map(mapProviderToDriver);
                        const filtered = allMapped.filter(driverMatchesCriteria);
                        console.log(`📊 All providers: ${driverProviders.length} drivers → ${filtered.length} matching`);
                        allDrivers = filtered.length > 0 ? filtered : allMapped;
                    }
                }
            }

            setDrivers(allDrivers);
        } catch (err: any) {
            console.error('Error fetching drivers:', err);
            setError(err.message || 'Failed to find drivers');
        } finally {
            setIsLoading(false);
        }
    };

    // Get driver's hourly rate for the service
    const getDriverRate = (driver: DriverResult): number => {
        if (driver.serviceRates && Array.isArray(driver.serviceRates)) {
            const rate = driver.serviceRates.find(
                (r) => r.serviceName?.toLowerCase().includes('driver') || r.serviceName === 'Personal Driver'
            );
            if (rate?.price) return rate.price;
        }
        if (driver.priceForService) return driver.priceForService;
        return 0;
    };

    const handleSelectDriver = (driver: DriverResult) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        navigation.navigate('DriverBookingForm', {
            service,
            selectedDriver: driver,
            tripType,
            tripDirection,
            vehicleType,
            transmission,
            pickupAddress,
            dropAddress,
            pickupCoords,
            dropCoords,
            routeDistanceKm,
            driverReturnFare,
            driverRate: getDriverRate(driver),
        });
    };

    const renderDriverCard = ({ item, index }: { item: DriverResult; index: number }) => {
        const rate = getDriverRate(item);
        const isOnline = item.status === 'active';

        return (
            <FadeInView delay={index * 100}>
                <TouchableOpacity
                    style={styles.premiumCard}
                    onPress={() => handleSelectDriver(item)}
                    activeOpacity={0.9}
                >
                    <View style={styles.cardLayout}>
                        {/* Avatar */}
                        <View style={styles.avatarSection}>
                            {item.profileImage ? (
                                <Image source={{ uri: item.profileImage }} style={styles.squircleAvatar} />
                            ) : (
                                <View style={[styles.squircleAvatar, styles.avatarPlaceholder]}>
                                    <Text style={styles.avatarLetter}>{item.name?.charAt(0)?.toUpperCase() || 'D'}</Text>
                                </View>
                            )}
                            <View style={[styles.onlineIndicator, { backgroundColor: isOnline ? COLORS.success : COLORS.textTertiary }]} />
                        </View>

                        {/* Mid Info */}
                        <View style={styles.infoSection}>
                            <Text style={styles.driverName} numberOfLines={1}>{item.name}</Text>

                            <View style={styles.metaRow}>
                                <Ionicons name="star" size={14} color={COLORS.warning} />
                                <Text style={styles.ratingText}>{item.rating > 0 ? item.rating.toFixed(1) : 'New'}</Text>
                                <Text style={styles.dot}>•</Text>
                                <Text style={styles.metaText}>{item.experience} yrs exp</Text>
                            </View>

                            <View style={styles.logisticsRow}>
                                <Text style={styles.metaText}>{transmission === 'automatic' ? 'Auto' : 'Manual'} {vehicleType.charAt(0).toUpperCase() + vehicleType.slice(1)}</Text>
                            </View>
                        </View>

                        {/* Right Price & Action */}
                        <View style={styles.priceActionSection}>
                            <View style={styles.priceContainer}>
                                <Text style={styles.priceValue}>₹{rate}</Text>
                                <Text style={styles.priceUnit}>/hr</Text>
                            </View>
                            <View style={styles.fabArrow}>
                                <Ionicons name="arrow-forward" size={16} color="#FFF" />
                            </View>
                        </View>
                    </View>
                </TouchableOpacity>
            </FadeInView>
        );
    };

    const renderSearching = () => (
        <View style={styles.searchingContainer}>
            <LottieView
                source={LottieAnimations.searchingProfile}
                autoPlay
                loop
                style={{ width: 200, height: 200, marginBottom: 16 }}
            />
            <Text style={styles.searchingTitle}>Finding Drivers</Text>
            <Text style={styles.searchingSubtitle}>
                Searching for {transmission} {vehicleType} drivers for{' '}
                {tripType === 'incity' ? 'in-city' : 'outstation'} {tripDirection === 'oneway' ? 'one-way' : 'round'} trip...
            </Text>
        </View>
    );

    const renderEmpty = () => (
        <View style={styles.emptyContainer}>
            <View style={styles.emptyIconBg}>
                <Ionicons name="car-outline" size={48} color="#94A3B8" />
            </View>
            <Text style={styles.emptyTitle}>No Drivers Found</Text>
            <Text style={styles.emptySubtitle}>
                No drivers matching your criteria are available right now. Try changing your preferences.
            </Text>
            <TouchableOpacity
                style={styles.retryButton}
                onPress={() => navigation.goBack()}
            >
                <Text style={styles.retryButtonText}>Change Preferences</Text>
            </TouchableOpacity>
            <TouchableOpacity
                style={styles.refreshButton}
                onPress={fetchMatchingDrivers}
            >
                <Ionicons name="refresh" size={18} color={COLORS.primary} />
                <Text style={styles.refreshButtonText}>Retry Search</Text>
            </TouchableOpacity>
        </View>
    );

    const renderError = () => (
        <View style={styles.emptyContainer}>
            <View style={[styles.emptyIconBg, { backgroundColor: '#FEE2E2' }]}>
                <Ionicons name="warning-outline" size={48} color="#EF4444" />
            </View>
            <Text style={styles.emptyTitle}>Something Went Wrong</Text>
            <Text style={styles.emptySubtitle}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={fetchMatchingDrivers}>
                <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top }]}>
                {Platform.OS === 'ios' ? (
                    <BlurView intensity={80} tint="light" style={StyleSheet.absoluteFill} />
                ) : (
                    <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(246, 248, 252, 0.95)' }]} /> // Matches COLORS.background basically
                )}
                <View style={styles.headerContent}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                    >
                        <Ionicons name="arrow-back" size={24} color={COLORS.text} />
                    </TouchableOpacity>
                    <View style={styles.headerCenter}>
                        <Text style={styles.headerTitle}>Available Drivers</Text>
                    </View>
                    <View style={{ width: 44 }} />
                </View>

                {/* Filter Strip */}
                {!isLoading && drivers.length > 0 && (
                    <View style={styles.tripSummaryStrip}>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.summaryPillScroll}>
                            <View style={styles.summaryPill}>
                                <Ionicons name="location-outline" size={14} color={COLORS.textSecondary} />
                                <Text style={styles.summaryPillText}>
                                    {tripType === 'incity' ? 'In-City' : 'Outstation'} • {tripDirection === 'oneway' ? 'One Way' : 'Round'}
                                </Text>
                            </View>
                            <View style={styles.summaryPill}>
                                <Ionicons name="car-outline" size={14} color={COLORS.textSecondary} />
                                <Text style={styles.summaryPillText}>
                                    {vehicleType.charAt(0).toUpperCase() + vehicleType.slice(1)} • {transmission === 'automatic' ? 'Auto' : 'Manual'}
                                </Text>
                            </View>
                            {routeDistanceKm > 0 && (
                                <View style={styles.summaryPill}>
                                    <Ionicons name="map-outline" size={14} color={COLORS.textSecondary} />
                                    <Text style={styles.summaryPillText}>{routeDistanceKm.toFixed(1)} km</Text>
                                </View>
                            )}
                        </ScrollView>
                    </View>
                )}
            </View>

            {/* Content */}
            {isLoading ? (
                renderSearching()
            ) : error ? (
                renderError()
            ) : drivers.length === 0 ? (
                renderEmpty()
            ) : (
                <FlatList
                    data={drivers}
                    keyExtractor={(item) => item._id}
                    renderItem={renderDriverCard}
                    contentContainerStyle={[
                        styles.listContent,
                        { paddingTop: insets.top + (routeDistanceKm > 0 ? 110 : 80) },
                    ]}
                    showsVerticalScrollIndicator={false}
                    ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background, // Global theme Cool Gray
    },
    header: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.02)',
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: SPACING.lg,
        paddingVertical: 12,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerCenter: {
        flex: 1,
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '600' as any,
        color: COLORS.text,
        letterSpacing: -0.4,
    },
    tripSummaryStrip: {
        paddingHorizontal: 20,
        paddingBottom: 16,
    },
    summaryPillScroll: {
        flexDirection: 'row',
        gap: 12,
        alignItems: 'center',
        paddingVertical: 4,
    },
    summaryPill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.cardBg,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 100,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 8,
        elevation: 2,
        gap: 6,
        borderWidth: 1,
        borderColor: COLORS.divider,
    },
    summaryPillText: {
        fontSize: 13,
        fontWeight: '600' as any,
        color: COLORS.text,
    },
    listContent: {
        paddingBottom: 60,
    },
    // Tactile Premium Design System Styles
    premiumCard: {
        backgroundColor: COLORS.cardBg,
        borderRadius: 24,
        padding: 16,
        marginHorizontal: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.04,
        shadowRadius: 24,
        elevation: 3,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.02)'
    },
    cardLayout: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatarSection: {
        position: 'relative',
        marginRight: 16,
    },
    squircleAvatar: {
        width: 60,
        height: 60,
        borderRadius: 20,
    },
    avatarPlaceholder: {
        backgroundColor: COLORS.primary, // Using primary blue instead of dark text
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarLetter: {
        fontSize: 24,
        fontWeight: '700' as any,
        color: COLORS.white,
    },
    onlineIndicator: {
        position: 'absolute',
        bottom: -2,
        right: -2,
        width: 14,
        height: 14,
        borderRadius: 7,
        borderWidth: 2,
        borderColor: '#FFF',
    },
    infoSection: {
        flex: 1,
        justifyContent: 'center',
    },
    driverName: {
        fontSize: 18,
        fontWeight: '700' as any,
        color: COLORS.text,
        letterSpacing: -0.3,
        marginBottom: 4,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    ratingText: {
        fontSize: 13,
        fontWeight: '700' as any,
        color: COLORS.text,
        marginLeft: 4,
    },
    dot: {
        fontSize: 14,
        color: COLORS.textTertiary,
        marginHorizontal: 6,
    },
    metaText: {
        fontSize: 13,
        fontWeight: '500' as any,
        color: COLORS.textSecondary,
    },
    logisticsRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    priceActionSection: {
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        height: 60,
    },
    priceContainer: {
        alignItems: 'flex-end',
    },
    priceValue: {
        fontSize: 20,
        fontWeight: '800' as any,
        color: COLORS.text,
        letterSpacing: -0.5,
    },
    priceUnit: {
        fontSize: 12,
        fontWeight: '500' as any,
        color: COLORS.textSecondary,
        marginTop: -2,
    },
    fabArrow: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: COLORS.primary, // Changed from text/black to primary blue for brand consistency
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 4,
    },
    // Searching State
    searchingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    searchIconContainer: {
        marginBottom: 24,
    },
    searchIconBg: {
        width: 120,
        height: 120,
        borderRadius: 60,
        justifyContent: 'center',
        alignItems: 'center',
    },
    searchingTitle: {
        fontSize: 22,
        fontWeight: '700' as any,
        color: COLORS.text,
        marginBottom: 8,
    },
    searchingSubtitle: {
        fontSize: 14,
        color: COLORS.textSecondary,
        textAlign: 'center',
        lineHeight: 22,
    },
    // Empty State
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    emptyIconBg: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#F1F5F9',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '700' as any,
        color: COLORS.text,
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 14,
        color: COLORS.textSecondary,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 24,
    },
    retryButton: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: 28,
        paddingVertical: 14,
        borderRadius: RADIUS.medium,
        marginBottom: 12,
        ...SHADOWS.sm,
    },
    retryButtonText: {
        fontSize: 15,
        fontWeight: '700' as any,
        color: '#FFF',
    },
    refreshButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 10,
    },
    refreshButtonText: {
        fontSize: 14,
        fontWeight: '600' as any,
        color: COLORS.primary,
    },
});
