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
                    style={styles.driverCard}
                    onPress={() => handleSelectDriver(item)}
                    activeOpacity={0.7}
                >
                    {/* Top section: Avatar + Info */}
                    <View style={styles.driverCardTop}>
                        {/* Avatar */}
                        <View style={styles.avatarContainer}>
                            {item.profileImage ? (
                                <Image source={{ uri: item.profileImage }} style={styles.avatar} />
                            ) : (
                                <LinearGradient
                                    colors={['#6366F1', '#8B5CF6']}
                                    style={styles.avatarPlaceholder}
                                >
                                    <Text style={styles.avatarText}>
                                        {item.name?.charAt(0)?.toUpperCase() || 'D'}
                                    </Text>
                                </LinearGradient>
                            )}
                            {/* Online indicator */}
                            <View style={[styles.onlineBadge, { backgroundColor: isOnline ? '#10B981' : '#94A3B8' }]} />
                        </View>

                        {/* Info */}
                        <View style={styles.driverInfo}>
                            <Text style={styles.driverName} numberOfLines={1}>{item.name}</Text>

                            {/* Rating & Experience */}
                            <View style={styles.driverMeta}>
                                <View style={styles.ratingBadge}>
                                    <Ionicons name="star" size={12} color="#F59E0B" />
                                    <Text style={styles.ratingText}>
                                        {item.rating > 0 ? item.rating.toFixed(1) : 'New'}
                                    </Text>
                                </View>
                                <View style={styles.metaDot} />
                                <Text style={styles.experienceText}>
                                    {item.experience} yr{item.experience !== 1 ? 's' : ''} exp
                                </Text>
                                {item.totalReviews > 0 && (
                                    <>
                                        <View style={styles.metaDot} />
                                        <Text style={styles.reviewsText}>{item.totalReviews} reviews</Text>
                                    </>
                                )}
                            </View>
                        </View>

                        {/* Price */}
                        <View style={styles.priceSection}>
                            <Text style={styles.priceAmount}>₹{rate}</Text>
                            <Text style={styles.priceUnit}>/hr</Text>
                        </View>
                    </View>

                    {/* Tags section */}
                    <View style={styles.tagsRow}>
                        {item.vehicleTypes && item.vehicleTypes.length > 0 && (
                            <View style={styles.matchTag}>
                                <Ionicons name="car-sport-outline" size={12} color="#4F46E5" />
                                <Text style={styles.tagText}>
                                    {item.vehicleTypes.map(v => v.charAt(0).toUpperCase() + v.slice(1)).join(', ')}
                                </Text>
                            </View>
                        )}
                        {item.transmissionTypes && item.transmissionTypes.length > 0 && (
                            <View style={styles.matchTag}>
                                <Ionicons name="settings-outline" size={12} color="#4F46E5" />
                                <Text style={styles.tagText}>
                                    {item.transmissionTypes.map(t => t.charAt(0).toUpperCase() + t.slice(1)).join(', ')}
                                </Text>
                            </View>
                        )}
                        {item.tripPreferences && item.tripPreferences.length > 0 && (
                            <View style={styles.matchTag}>
                                <Ionicons name="navigate-outline" size={12} color="#4F46E5" />
                                <Text style={styles.tagText}>
                                    {item.tripPreferences.map(t => t.charAt(0).toUpperCase() + t.slice(1)).join(', ')}
                                </Text>
                            </View>
                        )}
                    </View>

                    {/* Bio */}
                    {item.bio && (
                        <Text style={styles.bioText} numberOfLines={2}>
                            {item.bio}
                        </Text>
                    )}

                    {/* Bottom CTA */}
                    <View style={styles.cardFooter}>
                        <View style={styles.statusRow}>
                            <View style={[styles.statusDot, { backgroundColor: isOnline ? '#10B981' : '#94A3B8' }]} />
                            <Text style={[styles.statusText, { color: isOnline ? '#059669' : '#64748B' }]}>
                                {isOnline ? 'Available' : 'Offline'}
                            </Text>
                        </View>
                        <View style={styles.selectButton}>
                            <Text style={styles.selectButtonText}>Select</Text>
                            <Ionicons name="arrow-forward" size={16} color="#FFF" />
                        </View>
                    </View>
                </TouchableOpacity>
            </FadeInView>
        );
    };

    const renderSearching = () => (
        <View style={styles.searchingContainer}>
            <Animated.View style={[styles.searchIconContainer, { transform: [{ scale: pulseAnim }] }]}>
                <LinearGradient
                    colors={['#EEF2FF', '#E0E7FF']}
                    style={styles.searchIconBg}
                >
                    <Ionicons name="search" size={48} color="#6366F1" />
                </LinearGradient>
            </Animated.View>
            <Text style={styles.searchingTitle}>Finding Drivers</Text>
            <Text style={styles.searchingSubtitle}>
                Searching for {transmission} {vehicleType} drivers for{' '}
                {tripType === 'incity' ? 'in-city' : 'outstation'} {tripDirection === 'oneway' ? 'one-way' : 'round'} trip...
            </Text>
            <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 24 }} />
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
    // Driver Card
    driverCard: {
        backgroundColor: '#FFF',
        borderRadius: RADIUS.xlarge,
        padding: SPACING.lg,
        borderWidth: 1,
        borderColor: COLORS.borderLight,
        ...SHADOWS.md,
    },
    driverCardTop: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatarContainer: {
        position: 'relative',
    },
    avatar: {
        width: 56,
        height: 56,
        borderRadius: 18,
    },
    avatarPlaceholder: {
        width: 56,
        height: 56,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        fontSize: 22,
        fontWeight: '700' as any,
        color: '#FFF',
    },
    onlineBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 14,
        height: 14,
        borderRadius: 7,
        borderWidth: 2,
        borderColor: '#FFF',
    },
    driverInfo: {
        flex: 1,
        marginLeft: SPACING.md,
    },
    driverName: {
        fontSize: 16,
        fontWeight: '700' as any,
        color: COLORS.text,
        marginBottom: 4,
    },
    driverMeta: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    ratingBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
    },
    ratingText: {
        fontSize: 13,
        fontWeight: '600' as any,
        color: '#92400E',
    },
    metaDot: {
        width: 3,
        height: 3,
        borderRadius: 1.5,
        backgroundColor: '#CBD5E1',
        marginHorizontal: 8,
    },
    experienceText: {
        fontSize: 13,
        color: COLORS.textSecondary,
        fontWeight: '500' as any,
    },
    reviewsText: {
        fontSize: 13,
        color: COLORS.textSecondary,
        fontWeight: '500' as any,
    },
    priceSection: {
        alignItems: 'flex-end',
    },
    priceAmount: {
        fontSize: 20,
        fontWeight: '800' as any,
        color: COLORS.primary,
    },
    priceUnit: {
        fontSize: 12,
        color: COLORS.textSecondary,
        fontWeight: '500' as any,
    },
    tagsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: SPACING.md,
    },
    matchTag: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#EEF2FF',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
    },
    tagText: {
        fontSize: 11,
        fontWeight: '600' as any,
        color: '#4F46E5',
    },
    bioText: {
        fontSize: 13,
        color: '#64748B',
        lineHeight: 19,
        marginTop: SPACING.sm,
    },
    cardFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: SPACING.md,
        paddingTop: SPACING.md,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
    },
    statusRow: {
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
        fontSize: 13,
        fontWeight: '600' as any,
    },
    selectButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: COLORS.primary,
        paddingHorizontal: 18,
        paddingVertical: 10,
        borderRadius: RADIUS.medium,
        ...SHADOWS.sm,
    },
    selectButtonText: {
        fontSize: 14,
        fontWeight: '700' as any,
        color: '#FFF',
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
