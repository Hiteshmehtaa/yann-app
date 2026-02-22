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
                <View style={styles.providerCard}>
                    <View style={styles.providerCardInner}>
                        {/* --- Left: Avatar --- */}
                        <View style={styles.avatarContainer}>
                            {item.profileImage ? (
                                <Image source={{ uri: item.profileImage }} style={styles.avatar} />
                            ) : (
                                <View style={[styles.avatarPlaceholder, { backgroundColor: '#6366F1' }]}>
                                    <Text style={styles.avatarText}>{item.name?.charAt(0)?.toUpperCase() || 'D'}</Text>
                                </View>
                            )}
                            <View style={[styles.verifiedBadge, { backgroundColor: isOnline ? '#10B981' : '#94A3B8' }]} />
                        </View>

                        {/* --- Middle & Right: Info + Price --- */}
                        <View style={styles.providerInfoRow}>
                            <View style={styles.providerInfo}>
                                <Text style={styles.providerName} numberOfLines={1}>{item.name}</Text>

                                <View style={styles.ratingRow}>
                                    <View style={styles.starContainer}>
                                        <Ionicons name="star" size={12} color="#F59E0B" />
                                        <Text style={styles.ratingVal}>{item.rating > 0 ? item.rating.toFixed(1) : 'New'}</Text>
                                    </View>
                                    <Text style={styles.metaDot}>•</Text>
                                    <Text style={styles.providerExp}>
                                        {item.experience} yr{item.experience !== 1 ? 's' : ''} exp
                                    </Text>
                                    {item.totalReviews > 0 && (
                                        <>
                                            <Text style={styles.metaDot}>•</Text>
                                            <Text style={styles.providerExp}>{item.totalReviews} reviews</Text>
                                        </>
                                    )}
                                </View>
                            </View>

                            <View style={styles.priceTag}>
                                <Text style={styles.priceAmount}>₹{rate}</Text>
                                <Text style={styles.priceLabel}>/hr</Text>
                            </View>
                        </View>
                    </View>

                    {/* Horizontal Divider */}
                    <View style={styles.cardDivider} />

                    {/* Bottom Status & CTA */}
                    <View style={styles.cardFooter}>
                        <View style={styles.statusGroup}>
                            <View style={[styles.statusDot, { backgroundColor: isOnline ? '#10B981' : '#94A3B8' }]} />
                            <Text style={[styles.statusText, { color: isOnline ? '#059669' : '#64748B' }]}>
                                {isOnline ? 'Available Now' : 'Offline'}
                            </Text>
                        </View>

                        <TouchableOpacity
                            style={styles.bookButton}
                            onPress={() => handleSelectDriver(item)}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.bookButtonText}>Book Driver</Text>
                            <Ionicons name="arrow-forward" size={16} color="#FFF" />
                        </TouchableOpacity>
                    </View>
                </View>
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
            <StatusBar barStyle="dark-content" backgroundColor="#FFF" />

            {/* Ambient Blobs */}
            <View style={StyleSheet.absoluteFill} pointerEvents="none">
                <View style={styles.blob1} />
                <View style={styles.blob2} />
            </View>

            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top }]}>
                {Platform.OS === 'ios' ? (
                    <BlurView intensity={80} tint="light" style={StyleSheet.absoluteFill} />
                ) : (
                    <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(255,255,255,0.97)' }]} />
                )}
                <View style={styles.headerContent}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                    >
                        <Ionicons name="arrow-back" size={22} color={COLORS.text} />
                    </TouchableOpacity>
                    <View style={styles.headerCenter}>
                        <Text style={styles.headerTitle}>Available Drivers</Text>
                        <Text style={styles.headerSubtitle}>
                            {drivers.length > 0 ? `${drivers.length} drivers found` : 'Searching...'}
                        </Text>
                    </View>
                    <View style={{ width: 44 }} />
                </View>
            </View>

            {/* Trip Summary Card */}
            {!isLoading && drivers.length > 0 && (
                <FadeInView style={styles.tripSummary}>
                    <View style={styles.tripSummaryCard}>
                        <View style={styles.tripRow}>
                            <View style={styles.tripDetail}>
                                <Ionicons name="navigate-outline" size={14} color="#6366F1" />
                                <Text style={styles.tripLabel}>
                                    {tripType === 'incity' ? 'In-City' : 'Outstation'} • {tripDirection === 'oneway' ? 'One Way' : 'Round Trip'}
                                </Text>
                            </View>
                            <View style={styles.tripDetail}>
                                <Ionicons name="car-sport-outline" size={14} color="#6366F1" />
                                <Text style={styles.tripLabel}>
                                    {vehicleType.charAt(0).toUpperCase() + vehicleType.slice(1)} • {transmission.charAt(0).toUpperCase() + transmission.slice(1)}
                                </Text>
                            </View>
                        </View>
                        {routeDistanceKm > 0 && (
                            <View style={styles.distanceRow}>
                                <Ionicons name="map-outline" size={14} color="#64748B" />
                                <Text style={styles.distanceText}>{routeDistanceKm.toFixed(1)} km</Text>
                                {driverReturnFare > 0 && (
                                    <Text style={styles.returnFareText}>+₹{driverReturnFare} return fare</Text>
                                )}
                            </View>
                        )}
                    </View>
                </FadeInView>
            )}

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
                        { paddingTop: insets.top + 110 + (routeDistanceKm > 0 ? 70 : 50) },
                    ]}
                    showsVerticalScrollIndicator={false}
                    ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    blob1: {
        position: 'absolute',
        top: -80,
        right: -80,
        width: 250,
        height: 250,
        borderRadius: 125,
        backgroundColor: '#6366F1',
        opacity: 0.04,
    },
    blob2: {
        position: 'absolute',
        bottom: 100,
        left: -60,
        width: 200,
        height: 200,
        borderRadius: 100,
        backgroundColor: '#F97316',
        opacity: 0.04,
    },
    header: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.md,
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: RADIUS.medium,
        backgroundColor: COLORS.surface,
        justifyContent: 'center',
        alignItems: 'center',
        ...SHADOWS.sm,
    },
    headerCenter: {
        flex: 1,
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: TYPOGRAPHY.size.lg,
        fontWeight: '700' as any,
        color: COLORS.text,
    },
    headerSubtitle: {
        fontSize: TYPOGRAPHY.size.xs,
        color: COLORS.textSecondary,
        marginTop: 2,
    },
    tripSummary: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        paddingHorizontal: SPACING.lg,
    },
    tripSummaryCard: {
        backgroundColor: '#FFF',
        borderRadius: RADIUS.large,
        padding: SPACING.md,
        borderWidth: 1,
        borderColor: COLORS.borderLight,
        ...SHADOWS.sm,
    },
    tripRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: SPACING.md,
    },
    tripDetail: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    tripLabel: {
        fontSize: 12,
        fontWeight: '600' as any,
        color: '#4F46E5',
    },
    distanceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 8,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
    },
    distanceText: {
        fontSize: 12,
        fontWeight: '600' as any,
        color: '#64748B',
    },
    returnFareText: {
        fontSize: 12,
        fontWeight: '600' as any,
        color: '#F97316',
        marginLeft: 'auto' as any,
    },
    listContent: {
        paddingHorizontal: SPACING.lg,
        paddingBottom: 40,
    },
    // Driver Card Implementation matching User Screenshot
    providerCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#F1F5F9', // Very subtle border
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
        padding: 16,
    },
    providerCardInner: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatarContainer: {
        position: 'relative',
        marginRight: 16,
    },
    avatar: {
        width: 65,
        height: 65,
        borderRadius: 20, // Squircle shape from screenshot
    },
    avatarPlaceholder: {
        width: 65,
        height: 65,
        borderRadius: 20, // Squircle shape from screenshot
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        fontSize: 26,
        fontWeight: '600' as any,
        color: '#FFF',
    },
    verifiedBadge: {
        position: 'absolute',
        bottom: -2,
        right: -2,
        width: 14,
        height: 14,
        borderRadius: 7,
        borderWidth: 2,
        borderColor: '#FFF',
    },
    providerInfoRow: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    providerInfo: {
        flex: 1,
        paddingRight: 8,
    },
    providerName: {
        fontSize: 18,
        fontWeight: '700' as any,
        color: '#1E293B',
        marginBottom: 8,
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
    },
    starContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        backgroundColor: '#FFFBEB', // Light yellow bg from screenshot
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: '#FEF3C7',
    },
    ratingVal: {
        fontSize: 12,
        fontWeight: '700' as any,
        color: '#D97706',
    },
    metaDot: {
        fontSize: 16,
        color: '#CBD5E1',
        marginHorizontal: 6,
        lineHeight: 16,
    },
    providerExp: {
        fontSize: 13,
        color: '#64748B',
        fontWeight: '500' as any,
    },
    priceTag: {
        alignItems: 'flex-end',
    },
    priceAmount: {
        fontSize: 24,
        fontWeight: '800' as any,
        color: '#1E293B',
        letterSpacing: -0.5,
    },
    priceLabel: {
        fontSize: 12,
        color: '#64748B',
        marginTop: 2,
    },
    cardDivider: {
        height: 1,
        backgroundColor: '#F1F5F9', // Light gray divider line
        marginVertical: 16,
    },
    cardFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    statusGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    statusText: {
        fontSize: 14,
        fontWeight: '600' as any,
    },
    bookButton: {
        backgroundColor: '#4F46E5', // Solid purple button matching screenshot
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12, // Pill shape
        gap: 6,
    },
    bookButtonText: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '600' as any,
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
