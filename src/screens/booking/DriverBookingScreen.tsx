import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    StatusBar,
    Dimensions,
    TextInput,
    Alert,
    FlatList,
    Keyboard,
    ActivityIndicator,
    Platform,
    LayoutAnimation,
    UIManager
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import * as Location from 'expo-location';

import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';
import { COLORS, RADIUS, SHADOWS, SPACING, TYPOGRAPHY } from '../../utils/theme';
import { decodePolyline } from '../../utils/maps';

const { width } = Dimensions.get('window');

// Premium Map Style - 3D Buildings & Enhanced Visuals
const premiumMapStyle = [
    {
        "featureType": "all",
        "elementType": "geometry",
        "stylers": [{ "color": "#F1F5F9" }]
    },
    {
        "featureType": "all",
        "elementType": "labels.text.fill",
        "stylers": [{ "color": "#64748B" }]
    },
    {
        "featureType": "all",
        "elementType": "labels.text.stroke",
        "stylers": [{ "color": "#FFFFFF" }, { "lightness": 16 }]
    },
    {
        "featureType": "water",
        "elementType": "geometry",
        "stylers": [{ "color": "#DBEAFE" }]
    },
    {
        "featureType": "water",
        "elementType": "labels.text.fill",
        "stylers": [{ "color": "#60A5FA" }]
    },
    {
        "featureType": "road",
        "elementType": "geometry",
        "stylers": [{ "color": "#FFFFFF" }]
    },
    {
        "featureType": "road",
        "elementType": "geometry.stroke",
        "stylers": [{ "color": "#E2E8F0" }]
    },
    {
        "featureType": "road.highway",
        "elementType": "geometry",
        "stylers": [{ "color": "#FEF3C7" }]
    },
    {
        "featureType": "road.highway",
        "elementType": "geometry.stroke",
        "stylers": [{ "color": "#FCD34D" }]
    },
    {
        "featureType": "poi",
        "elementType": "geometry",
        "stylers": [{ "color": "#E0E7FF" }]
    },
    {
        "featureType": "poi.park",
        "elementType": "geometry",
        "stylers": [{ "color": "#D1FAE5" }]
    },
    {
        "featureType": "poi.business",
        "stylers": [{ "visibility": "simplified" }]
    },
    {
        "featureType": "transit",
        "elementType": "geometry",
        "stylers": [{ "color": "#E0E7FF" }]
    },
    {
        "featureType": "landscape.man_made",
        "elementType": "geometry",
        "stylers": [{ "color": "#F8FAFC" }]
    },
    {
        "featureType": "landscape.natural",
        "elementType": "geometry",
        "stylers": [{ "color": "#F0FDF4" }]
    }
];

// Types
type TripType = 'incity' | 'outstation';
type TripDirection = 'oneway' | 'roundtrip';
type Transmission = 'manual' | 'automatic';
type VehicleType = 'hatchback' | 'sedan' | 'suv' | 'luxury';

const DRIVER_RETURN_RATE_PER_KM = 2; // ₹2/km for driver's return in one-way trips

interface PlaceSuggestion {
    description: string;
    place_id: string;
    distance?: number;
    structured_formatting: {
        main_text: string;
        secondary_text: string;
    };
}

interface LocationCoords {
    latitude: number;
    longitude: number;
}

if (Platform.OS === 'android') {
    if (UIManager.setLayoutAnimationEnabledExperimental) {
        UIManager.setLayoutAnimationEnabledExperimental(true);
    }
}

export const DriverBookingScreen = ({ navigation, route }: any) => {
    const { service } = route.params;
    const { user } = useAuth();
    const insets = useSafeAreaInsets();
    const mapRef = useRef<MapView>(null);
    const bottomSheetRef = useRef<BottomSheet>(null);

    // Location State
    const [pickupAddress, setPickupAddress] = useState('');
    const [dropAddress, setDropAddress] = useState('');
    const [pickupCoords, setPickupCoords] = useState<LocationCoords | null>(null);
    const [dropCoords, setDropCoords] = useState<LocationCoords | null>(null);
    const [currentLocation, setCurrentLocation] = useState<LocationCoords | null>(null);
    const [routeCoordinates, setRouteCoordinates] = useState<{ latitude: number; longitude: number }[]>([]);

    // Autocomplete State
    const [activeInput, setActiveInput] = useState<'pickup' | 'drop' | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
    const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);

    // Wizard State
    const [currentStep, setCurrentStep] = useState(1);
    const [tripType, setTripType] = useState<TripType | null>(null);
    const [tripDirection, setTripDirection] = useState<TripDirection | null>(null);
    const [vehicleType, setVehicleType] = useState<VehicleType | null>(null);
    const [transmission, setTransmission] = useState<Transmission | null>(null);
    const [routeDistanceKm, setRouteDistanceKm] = useState<number>(0);

    // Computed: driver return fare for one-way trips
    const driverReturnFare = tripDirection === 'oneway' ? Math.round(routeDistanceKm * DRIVER_RETURN_RATE_PER_KM) : 0;

    // UI State
    const [isSearching, setIsSearching] = useState(false);
    const [mapRegion, setMapRegion] = useState<Region>({
        latitude: 28.6139,
        longitude: 77.2090,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
    });

    const snapPoints = useMemo(() => ['50%', '75%', '95%'], []);

    // Get current location on mount
    useEffect(() => {
        (async () => {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission Required', 'Location access is required for booking drivers');
                return;
            }

            let location = await Location.getCurrentPositionAsync({});
            const coords = {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
            };
            setCurrentLocation(coords);
            setPickupCoords(coords);
            setMapRegion({
                ...coords,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
            });

            const address = await reverseGeocode(coords);
            setPickupAddress(address);
        })();
    }, []);

    // Debounced autocomplete search
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (searchQuery.length >= 2) {
                fetchPlaceSuggestions(searchQuery);
            } else {
                setSuggestions([]);
            }
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [searchQuery]);

    // Fetch directions when pickup and drop are set
    useEffect(() => {
        if (pickupCoords && dropCoords) {
            const fetchDirections = async () => {
                try {
                    const origin = `${pickupCoords.latitude},${pickupCoords.longitude}`;
                    const destination = `${dropCoords.latitude},${dropCoords.longitude}`;
                    const result = await apiService.getDirections(origin, destination);

                    if (result.success && result.data && result.data.length > 0) {
                        const route = result.data[0];
                        const points = decodePolyline(route.overview_polyline.points);
                        setRouteCoordinates(points);

                        // Extract route distance in km
                        const legs = route.legs;
                        if (legs && legs.length > 0) {
                            const totalMeters = legs.reduce((sum: number, leg: any) => sum + (leg.distance?.value || 0), 0);
                            setRouteDistanceKm(totalMeters / 1000);
                        }

                        // Fit map to route
                        if (mapRef.current) {
                            mapRef.current.fitToCoordinates(points, {
                                edgePadding: { top: 180, right: 50, bottom: 50, left: 50 },
                                animated: true,
                            });
                        }
                    }
                } catch (error) {
                    console.error("Directions error", error);
                }
            };
            fetchDirections();
        } else {
            setRouteCoordinates([]);
        }
    }, [pickupCoords, dropCoords]);

    // Fetch place suggestions using backend API proxy
    const fetchPlaceSuggestions = async (input: string) => {
        setIsLoadingSuggestions(true);
        try {
            const location = currentLocation || pickupCoords;
            const response = await apiService.searchPlaces(input, location || undefined);

            if (response.success && response.data) {
                setSuggestions(response.data);
            } else {
                setSuggestions([]);
            }
        } catch (error) {
            console.error('Error fetching suggestions:', error);
            setSuggestions([]);
        } finally {
            setIsLoadingSuggestions(false);
        }
    };

    // Get coordinates from place_id using backend API
    const getPlaceCoordinates = async (placeId: string): Promise<LocationCoords | null> => {
        try {
            const response = await apiService.getPlaceDetails(placeId);
            if (response.success && response.data?.geometry) {
                return {
                    latitude: response.data.geometry.location.lat,
                    longitude: response.data.geometry.location.lng,
                };
            }
        } catch (error) {
            console.error('Error getting place coordinates:', error);
        }
        return null;
    };

    // Reverse geocode coordinates to address using backend API
    const reverseGeocode = async (coords: LocationCoords): Promise<string> => {
        try {
            const response = await apiService.reverseGeocode(coords.latitude, coords.longitude);
            if (response.success && response.data) {
                return response.data;
            }
        } catch (error) {
            console.error('Error reverse geocoding:', error);
        }
        return 'Unknown location';
    };

    // Handle suggestion selection
    const handleSelectSuggestion = async (suggestion: PlaceSuggestion) => {
        const coords = await getPlaceCoordinates(suggestion.place_id);
        if (!coords) return;

        if (activeInput === 'pickup') {
            setPickupAddress(suggestion.description);
            setPickupCoords(coords);
        } else {
            setDropAddress(suggestion.description);
            setDropCoords(coords);
        }

        // Update map
        mapRef.current?.animateToRegion({
            ...coords,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
        }, 500);

        setActiveInput(null);
        setSearchQuery('');
        setSuggestions([]);
        Keyboard.dismiss();
    };

    // Handle map tap
    const handleMapPress = async (event: any) => {
        const coords = event.nativeEvent.coordinate;
        const address = await reverseGeocode(coords);

        if (!pickupCoords) {
            setPickupCoords(coords);
            setPickupAddress(address);
        } else if (!dropCoords) {
            setDropCoords(coords);
            setDropAddress(address);
        }
    };

    // Navigation
    const goToNextStep = () => {
        if (currentStep < 4) {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            setCurrentStep(currentStep + 1);
        }
    };

    const goToPreviousStep = () => {
        if (currentStep > 1) {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            setCurrentStep(currentStep - 1);
        }
    };

    // Handle find drivers
    const handleFindDrivers = () => {
        if (!pickupCoords || !dropCoords || !tripType || !tripDirection || !vehicleType || !transmission) {
            Alert.alert('Incomplete', 'Please complete all selections');
            return;
        }

        // Navigate to driver search results with all preferences
        navigation.navigate('DriverSearchResults', {
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
        });
    };

    // Render location search modal
    const renderSearchModal = () => {
        if (!activeInput) return null;

        return (
            <View style={[styles.searchModal, { paddingTop: insets.top }]}>
                <View style={styles.searchHeader}>
                    <TouchableOpacity onPress={() => {
                        setActiveInput(null);
                        setSearchQuery('');
                        setSuggestions([]);
                    }}>
                        <Ionicons name="arrow-back" size={24} color={COLORS.text} />
                    </TouchableOpacity>
                    <Text style={styles.searchHeaderTitle}>
                        {activeInput === 'pickup' ? 'Pickup Location' : 'Drop Location'}
                    </Text>
                </View>

                <View style={styles.searchInputContainer}>
                    <Ionicons name="search" size={20} color={COLORS.textSecondary} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search location..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        autoFocus
                        placeholderTextColor={COLORS.textTertiary}
                    />
                </View>

                {isLoadingSuggestions && (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="small" color={COLORS.accent} />
                        <Text style={styles.loadingText}>Searching...</Text>
                    </View>
                )}

                <FlatList
                    data={suggestions}
                    keyExtractor={(item) => item.place_id}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={styles.suggestionItem}
                            onPress={() => handleSelectSuggestion(item)}
                        >
                            <View style={styles.suggestionIcon}>
                                <Ionicons name="location-sharp" size={18} color={COLORS.accent} />
                            </View>
                            <View style={styles.suggestionTextContainer}>
                                <Text style={styles.suggestionMainText}>
                                    {item.structured_formatting.main_text}
                                </Text>
                                <View style={styles.suggestionSecondaryRow}>
                                    <Text style={styles.suggestionSecondaryText} numberOfLines={1}>
                                        {item.structured_formatting.secondary_text}
                                    </Text>
                                    {item.distance && (
                                        <Text style={styles.distanceText}>
                                            {item.distance.toFixed(1)} km
                                        </Text>
                                    )}
                                </View>
                            </View>
                        </TouchableOpacity>
                    )}
                    ListEmptyComponent={
                        !isLoadingSuggestions && searchQuery.length >= 2 ? (
                            <View style={styles.emptyState}>
                                <Ionicons name="search-outline" size={40} color={COLORS.textTertiary} />
                                <Text style={styles.emptyText}>No locations found</Text>
                            </View>
                        ) : null
                    }
                    contentContainerStyle={styles.suggestionsList}
                    keyboardShouldPersistTaps="handled"
                />
            </View>
        );
    };

    // Render wizard steps
    const renderWizardStep = () => {
        switch (currentStep) {
            case 1:
                return (
                    <View style={styles.stepContainer}>
                        <View style={styles.stepHeader}>
                            <Text style={styles.stepTitle}>Trip Type</Text>
                            <Text style={styles.stepSubtitle}>Select your journey preference</Text>
                        </View>

                        <View style={styles.optionsRow}>
                            <TouchableOpacity
                                style={[styles.optionCard, tripType === 'incity' && styles.optionCardActive]}
                                onPress={() => {
                                    setTripType('incity');
                                    setTimeout(goToNextStep, 200);
                                }}
                                activeOpacity={0.7}
                            >
                                <View style={[styles.optionIconBg, tripType === 'incity' && styles.optionIconBgActive]}>
                                    <Ionicons
                                        name="business-outline"
                                        size={24}
                                        color={tripType === 'incity' ? COLORS.primary : COLORS.textSecondary}
                                    />
                                </View>
                                <Text style={[styles.optionLabel, tripType === 'incity' && styles.optionLabelActive]}>
                                    In-City
                                </Text>
                                <Text style={[styles.optionDescription, tripType === 'incity' && styles.optionDescriptionActive]}>
                                    Within city limits
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.optionCard, tripType === 'outstation' && styles.optionCardActive]}
                                onPress={() => {
                                    setTripType('outstation');
                                    setTimeout(goToNextStep, 200);
                                }}
                                activeOpacity={0.7}
                            >
                                <View style={[styles.optionIconBg, tripType === 'outstation' && styles.optionIconBgActive]}>
                                    <Ionicons
                                        name="navigate-outline"
                                        size={24}
                                        color={tripType === 'outstation' ? COLORS.primary : COLORS.textSecondary}
                                    />
                                </View>
                                <Text style={[styles.optionLabel, tripType === 'outstation' && styles.optionLabelActive]}>
                                    Outstation
                                </Text>
                                <Text style={[styles.optionDescription, tripType === 'outstation' && styles.optionDescriptionActive]}>
                                    Intercity travel
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                );

            case 2:
                return (
                    <View style={styles.stepContainer}>
                        <View style={styles.stepHeader}>
                            <TouchableOpacity onPress={goToPreviousStep} style={styles.backButton}>
                                <Ionicons name="chevron-back" size={20} color={COLORS.text} />
                            </TouchableOpacity>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.stepTitle}>Trip Direction</Text>
                                <Text style={styles.stepSubtitle}>One way or round trip?</Text>
                            </View>
                        </View>

                        <View style={styles.optionsRow}>
                            <TouchableOpacity
                                style={[styles.optionCard, tripDirection === 'oneway' && styles.optionCardActive]}
                                onPress={() => {
                                    setTripDirection('oneway');
                                    setTimeout(goToNextStep, 200);
                                }}
                                activeOpacity={0.7}
                            >
                                <View style={[styles.optionIconBg, tripDirection === 'oneway' && styles.optionIconBgActive]}>
                                    <Ionicons
                                        name="arrow-forward-outline"
                                        size={24}
                                        color={tripDirection === 'oneway' ? COLORS.primary : COLORS.textSecondary}
                                    />
                                </View>
                                <Text style={[styles.optionLabel, tripDirection === 'oneway' && styles.optionLabelActive]}>
                                    One Way
                                </Text>
                                <Text style={[styles.optionDescription, tripDirection === 'oneway' && styles.optionDescriptionActive]}>
                                    Drop only
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.optionCard, tripDirection === 'roundtrip' && styles.optionCardActive]}
                                onPress={() => {
                                    setTripDirection('roundtrip');
                                    setTimeout(goToNextStep, 200);
                                }}
                                activeOpacity={0.7}
                            >
                                <View style={[styles.optionIconBg, tripDirection === 'roundtrip' && styles.optionIconBgActive]}>
                                    <Ionicons
                                        name="repeat-outline"
                                        size={24}
                                        color={tripDirection === 'roundtrip' ? COLORS.primary : COLORS.textSecondary}
                                    />
                                </View>
                                <Text style={[styles.optionLabel, tripDirection === 'roundtrip' && styles.optionLabelActive]}>
                                    Round Trip
                                </Text>
                                <Text style={[styles.optionDescription, tripDirection === 'roundtrip' && styles.optionDescriptionActive]}>
                                    Return included
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {tripDirection === 'oneway' && routeDistanceKm > 0 && (
                            <View style={styles.returnFareCard}>
                                <View style={styles.returnFareHeader}>
                                    <Ionicons name="information-circle" size={20} color={COLORS.accent} />
                                    <Text style={styles.returnFareTitle}>Driver Return Fare</Text>
                                </View>
                                <Text style={styles.returnFareDescription}>
                                    Since this is a one-way trip, a return fare for the driver will be charged at ₹{DRIVER_RETURN_RATE_PER_KM}/km.
                                </Text>
                                <View style={styles.returnFareRow}>
                                    <Text style={styles.returnFareLabel}>Distance: {routeDistanceKm.toFixed(1)} km</Text>
                                    <Text style={styles.returnFareAmount}>₹{driverReturnFare}</Text>
                                </View>
                                <Text style={styles.returnFareNote}>This amount will be added during booking.</Text>
                            </View>
                        )}
                    </View>
                );

            case 3:
                return (
                    <View style={styles.stepContainer}>
                        <View style={styles.stepHeader}>
                            <TouchableOpacity onPress={goToPreviousStep} style={styles.backButton}>
                                <Ionicons name="chevron-back" size={20} color={COLORS.text} />
                            </TouchableOpacity>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.stepTitle}>Vehicle Type</Text>
                                <Text style={styles.stepSubtitle}>Choose your preferred vehicle</Text>
                            </View>
                        </View>

                        <View style={styles.vehicleGrid}>
                            {[
                                { type: 'hatchback', label: 'Hatchback', icon: 'car-outline' },
                                { type: 'sedan', label: 'Sedan', icon: 'car-sport-outline' },
                                { type: 'suv', label: 'SUV', icon: 'car-outline' },
                                { type: 'luxury', label: 'Luxury', icon: 'car-sport-outline' },
                            ].map((vehicle) => (
                                <TouchableOpacity
                                    key={vehicle.type}
                                    style={[
                                        styles.vehicleCard,
                                        vehicleType === vehicle.type && styles.vehicleCardActive
                                    ]}
                                    onPress={() => {
                                        setVehicleType(vehicle.type as VehicleType);
                                        setTimeout(goToNextStep, 200);
                                    }}
                                    activeOpacity={0.7}
                                >
                                    <View style={[styles.vehicleIconBg, vehicleType === vehicle.type && styles.vehicleIconBgActive]}>
                                        <Ionicons
                                            name={vehicle.icon as any}
                                            size={20}
                                            color={vehicleType === vehicle.type ? COLORS.accent : COLORS.textSecondary}
                                        />
                                    </View>
                                    <Text style={[styles.vehicleLabel, vehicleType === vehicle.type && styles.vehicleLabelActive]}>
                                        {vehicle.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                );

            case 4:
                return (
                    <View style={styles.stepContainer}>
                        <View style={styles.stepHeader}>
                            <TouchableOpacity onPress={goToPreviousStep} style={styles.backButton}>
                                <Ionicons name="chevron-back" size={20} color={COLORS.text} />
                            </TouchableOpacity>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.stepTitle}>Transmission</Text>
                                <Text style={styles.stepSubtitle}>Select gear preference</Text>
                            </View>
                        </View>

                        <View style={styles.optionsRow}>
                            <TouchableOpacity
                                style={[styles.optionCard, transmission === 'manual' && styles.optionCardActive]}
                                onPress={() => setTransmission('manual')}
                                activeOpacity={0.7}
                            >
                                <View style={[styles.optionIconBg, transmission === 'manual' && styles.optionIconBgActive]}>
                                    <Ionicons
                                        name="settings-outline"
                                        size={24}
                                        color={transmission === 'manual' ? COLORS.primary : COLORS.textSecondary}
                                    />
                                </View>
                                <Text style={[styles.optionLabel, transmission === 'manual' && styles.optionLabelActive]}>
                                    Manual
                                </Text>
                                <Text style={[styles.optionDescription, transmission === 'manual' && styles.optionDescriptionActive]}>
                                    Traditional control
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.optionCard, transmission === 'automatic' && styles.optionCardActive]}
                                onPress={() => setTransmission('automatic')}
                                activeOpacity={0.7}
                            >
                                <View style={[styles.optionIconBg, transmission === 'automatic' && styles.optionIconBgActive]}>
                                    <Ionicons
                                        name="flash-outline"
                                        size={24}
                                        color={transmission === 'automatic' ? COLORS.primary : COLORS.textSecondary}
                                    />
                                </View>
                                <Text style={[styles.optionLabel, transmission === 'automatic' && styles.optionLabelActive]}>
                                    Automatic
                                </Text>
                                <Text style={[styles.optionDescription, transmission === 'automatic' && styles.optionDescriptionActive]}>
                                    Effortless driving
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {transmission && (
                            <>
                                {tripDirection === 'oneway' && driverReturnFare > 0 && (
                                    <View style={styles.returnFareSummary}>
                                        <Text style={styles.returnFareSummaryText}>
                                            Driver return fare: ₹{driverReturnFare} ({routeDistanceKm.toFixed(1)} km × ₹{DRIVER_RETURN_RATE_PER_KM}/km)
                                        </Text>
                                    </View>
                                )}
                                <TouchableOpacity
                                    style={styles.findDriversButton}
                                    onPress={handleFindDrivers}
                                    disabled={isSearching}
                                    activeOpacity={0.8}
                                >
                                    {isSearching ? (
                                        <ActivityIndicator color="#FFF" />
                                    ) : (
                                        <>
                                            <Text style={styles.findDriversText}>Find Drivers</Text>
                                            <Ionicons name="arrow-forward" size={20} color="#FFF" />
                                        </>
                                    )}
                                </TouchableOpacity>
                            </>
                        )}
                    </View>
                );

            default:
                return null;
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFF" />

            {/* Map Background */}
            <MapView
                ref={mapRef}
                style={styles.map}
                provider={PROVIDER_GOOGLE}
                initialRegion={mapRegion}
                showsUserLocation
                showsMyLocationButton={false}
                customMapStyle={premiumMapStyle}
                onPress={handleMapPress}
                showsBuildings={true}
                showsIndoors={true}
                showsTraffic={false}
                pitchEnabled={true}
                rotateEnabled={true}
                mapType="standard"
            >
                {/* Route Polyline */}
                {routeCoordinates.length > 0 && (
                    <Polyline
                        coordinates={routeCoordinates}
                        strokeColor={COLORS.primary}
                        strokeWidth={4}
                    />
                )}
                {pickupCoords && (
                    <Marker coordinate={pickupCoords} pinColor={COLORS.accent} />
                )}
                {dropCoords && (
                    <Marker coordinate={dropCoords} pinColor={COLORS.error} />
                )}
            </MapView>

            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + SPACING.md }]}>
                <TouchableOpacity
                    style={styles.headerButton}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="arrow-back" size={20} color={COLORS.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Book Driver</Text>
                <View style={styles.headerButton} />
            </View>

            {/* Location Input Card */}
            <View style={[styles.locationCard, { top: insets.top + 70 }]}>
                <TouchableOpacity
                    style={styles.locationInput}
                    onPress={() => setActiveInput('pickup')}
                >
                    <View style={styles.locationDot} />
                    <View style={styles.locationTextContainer}>
                        <Text style={styles.locationLabel}>PICKUP</Text>
                        <Text style={styles.locationValue} numberOfLines={1}>
                            {pickupAddress || 'Select pickup location'}
                        </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color={COLORS.textTertiary} />
                </TouchableOpacity>

                <View style={styles.locationDivider} />

                <TouchableOpacity
                    style={styles.locationInput}
                    onPress={() => setActiveInput('drop')}
                >
                    <View style={[styles.locationDot, { backgroundColor: COLORS.error }]} />
                    <View style={styles.locationTextContainer}>
                        <Text style={styles.locationLabel}>DROP</Text>
                        <Text style={styles.locationValue} numberOfLines={1}>
                            {dropAddress || 'Select drop location'}
                        </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color={COLORS.textTertiary} />
                </TouchableOpacity>
            </View>

            {/* Bottom Sheet */}
            <BottomSheet
                ref={bottomSheetRef}
                index={0}
                snapPoints={snapPoints}
                backgroundStyle={styles.bottomSheetBackground}
                handleIndicatorStyle={styles.bottomSheetIndicator}
            >
                <BottomSheetScrollView contentContainerStyle={styles.bottomSheetContent}>
                    {/* Step Progress */}
                    <View style={styles.stepProgress}>
                        {[1, 2, 3, 4].map((step) => (
                            <React.Fragment key={step}>
                                <View style={[
                                    styles.progressDot,
                                    currentStep >= step && styles.progressDotActive
                                ]} />
                                {step < 4 && (
                                    <View style={[
                                        styles.progressLine,
                                        currentStep > step && styles.progressLineActive
                                    ]} />
                                )}
                            </React.Fragment>
                        ))}
                    </View>

                    {renderWizardStep()}
                </BottomSheetScrollView>
            </BottomSheet>

            {/* Search Modal */}
            {renderSearchModal()}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    map: {
        ...StyleSheet.absoluteFillObject,
    },
    header: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: SPACING.lg,
        paddingBottom: SPACING.md,
        backgroundColor: COLORS.background,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    headerButton: {
        width: 40,
        height: 40,
        borderRadius: RADIUS.medium,
        backgroundColor: COLORS.surface,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: TYPOGRAPHY.size.lg,
        fontWeight: TYPOGRAPHY.weight.semibold,
        color: COLORS.text,
    },
    locationCard: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 120 : 100,
        left: SPACING.lg,
        right: SPACING.lg,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: RADIUS.xlarge,
        padding: SPACING.lg,
        borderWidth: 1,
        borderColor: COLORS.borderLight,
        ...SHADOWS.lg,
        shadowOpacity: 0.15,
        shadowRadius: 15,
        elevation: 10,
        zIndex: 10,
    },
    locationInput: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.md,
        paddingVertical: SPACING.sm,
    },
    locationDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: COLORS.accent,
    },
    locationTextContainer: {
        flex: 1,
    },
    locationLabel: {
        fontSize: TYPOGRAPHY.size.xs,
        fontWeight: TYPOGRAPHY.weight.semibold,
        color: COLORS.textTertiary,
        letterSpacing: TYPOGRAPHY.letterSpacing.wide,
        marginBottom: SPACING.xs,
    },
    locationValue: {
        fontSize: TYPOGRAPHY.size.md,
        fontWeight: TYPOGRAPHY.weight.medium,
        color: COLORS.text,
    },
    locationDivider: {
        height: 1,
        backgroundColor: COLORS.border,
        marginVertical: SPACING.sm,
    },
    searchModal: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: COLORS.background,
        zIndex: 100,
    },
    searchHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.lg,
        gap: SPACING.lg,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    searchHeaderTitle: {
        fontSize: TYPOGRAPHY.size.lg,
        fontWeight: TYPOGRAPHY.weight.semibold,
        color: COLORS.text,
    },
    searchInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.surface,
        marginHorizontal: SPACING.lg,
        marginVertical: SPACING.lg,
        paddingHorizontal: SPACING.lg,
        height: 48,
        borderRadius: RADIUS.medium,
        gap: SPACING.md,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    searchInput: {
        flex: 1,
        fontSize: TYPOGRAPHY.size.md,
        color: COLORS.text,
        fontWeight: TYPOGRAPHY.weight.medium,
    },
    suggestionsList: {
        paddingHorizontal: SPACING.lg,
    },
    suggestionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: SPACING.md,
        gap: SPACING.md,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.borderLight,
    },
    suggestionIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: COLORS.surface,
        justifyContent: 'center',
        alignItems: 'center',
    },
    suggestionTextContainer: {
        flex: 1,
    },
    suggestionMainText: {
        fontSize: TYPOGRAPHY.size.md,
        fontWeight: TYPOGRAPHY.weight.semibold,
        color: COLORS.text,
        marginBottom: SPACING.xs,
    },
    suggestionSecondaryRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
    },
    suggestionSecondaryText: {
        fontSize: TYPOGRAPHY.size.sm,
        color: COLORS.textSecondary,
        flex: 1,
    },
    distanceText: {
        fontSize: TYPOGRAPHY.size.sm,
        color: COLORS.accent,
        fontWeight: TYPOGRAPHY.weight.semibold,
    },
    loadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: SPACING.xl,
        gap: SPACING.md,
    },
    loadingText: {
        fontSize: TYPOGRAPHY.size.sm,
        color: COLORS.textSecondary,
        fontWeight: TYPOGRAPHY.weight.medium,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: SPACING.xxxl,
    },
    emptyText: {
        fontSize: TYPOGRAPHY.size.md,
        color: COLORS.textSecondary,
        marginTop: SPACING.md,
    },
    bottomSheetBackground: {
        backgroundColor: COLORS.background,
        borderTopLeftRadius: RADIUS.xlarge,
        borderTopRightRadius: RADIUS.xlarge,
        ...SHADOWS.lg,
    },
    bottomSheetIndicator: {
        backgroundColor: COLORS.disabled,
        width: 40,
        height: 4,
    },
    bottomSheetContent: {
        paddingHorizontal: SPACING.lg,
        paddingTop: SPACING.sm,
        paddingBottom: SPACING.xxxl,
    },
    stepProgress: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: SPACING.xxl,
        paddingHorizontal: SPACING.xxxl,
    },
    progressDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: COLORS.disabled,
    },
    progressDotActive: {
        backgroundColor: COLORS.primary,
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    progressLine: {
        flex: 1,
        height: 2,
        backgroundColor: COLORS.disabled,
        marginHorizontal: SPACING.sm,
    },
    progressLineActive: {
        backgroundColor: COLORS.primary,
    },
    stepContainer: {
        flex: 1,
    },
    stepHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: SPACING.xl,
        gap: SPACING.md,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: RADIUS.medium,
        backgroundColor: COLORS.surface,
        justifyContent: 'center',
        alignItems: 'center',
    },
    stepTitle: {
        fontSize: TYPOGRAPHY.size.xxl,
        fontWeight: TYPOGRAPHY.weight.bold,
        color: COLORS.text,
    },
    stepSubtitle: {
        fontSize: TYPOGRAPHY.size.sm,
        color: COLORS.textSecondary,
        marginTop: SPACING.xs,
        fontWeight: TYPOGRAPHY.weight.medium,
    },
    optionsRow: {
        flexDirection: 'row',
        gap: SPACING.lg,
        marginBottom: SPACING.xl,
    },
    optionCard: {
        flex: 1,
        backgroundColor: COLORS.surface,
        borderRadius: RADIUS.large,
        padding: SPACING.xl,
        alignItems: 'center',
        gap: SPACING.md,
        minHeight: 160,
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: COLORS.borderLight,
        ...SHADOWS.sm,
    },
    optionCardActive: {
        borderWidth: 2,
        borderColor: COLORS.primary,
        backgroundColor: COLORS.surface,
        ...SHADOWS.md,
    },
    optionIconBg: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: COLORS.surface,
        justifyContent: 'center',
        alignItems: 'center',
    },
    optionIconBgActive: {
        backgroundColor: COLORS.primary,
    },
    optionLabel: {
        fontSize: TYPOGRAPHY.size.lg,
        fontWeight: TYPOGRAPHY.weight.semibold,
        color: COLORS.text,
        marginTop: SPACING.xs,
    },
    optionLabelActive: {
        color: COLORS.primary,
    },
    optionDescription: {
        fontSize: TYPOGRAPHY.size.sm,
        color: COLORS.textSecondary,
        fontWeight: TYPOGRAPHY.weight.medium,
    },
    optionDescriptionActive: {
        color: COLORS.textSecondary,
    },
    vehicleGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: SPACING.md,
        marginBottom: SPACING.xl,
    },
    vehicleCard: {
        width: (width - SPACING.lg * 2 - SPACING.md) / 2,
        backgroundColor: COLORS.surface,
        borderRadius: RADIUS.large,
        padding: SPACING.xl,
        alignItems: 'center',
        gap: SPACING.sm,
        borderWidth: 1,
        borderColor: COLORS.borderLight,
        minHeight: 140,
        justifyContent: 'center',
        ...SHADOWS.sm,
    },
    vehicleCardActive: {
        borderWidth: 2,
        borderColor: COLORS.primary,
        backgroundColor: COLORS.surface,
        ...SHADOWS.md,
    },
    vehicleIconBg: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.surface,
        justifyContent: 'center',
        alignItems: 'center',
    },
    vehicleIconBgActive: {
        backgroundColor: COLORS.primary,
    },
    vehicleLabel: {
        fontSize: TYPOGRAPHY.size.md,
        fontWeight: TYPOGRAPHY.weight.semibold,
        color: COLORS.text,
        marginTop: SPACING.xs,
    },
    vehicleLabelActive: {
        color: COLORS.primary,
    },
    findDriversButton: {
        height: 48,
        borderRadius: RADIUS.medium,
        backgroundColor: COLORS.primary,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: SPACING.sm,
        marginTop: SPACING.sm,
        ...SHADOWS.md,
    },
    findDriversText: {
        fontSize: TYPOGRAPHY.size.md,
        fontWeight: TYPOGRAPHY.weight.semibold,
        color: COLORS.white,
    },
    returnFareCard: {
        backgroundColor: '#F0F9FF',
        borderRadius: RADIUS.large,
        padding: SPACING.lg,
        borderWidth: 1,
        borderColor: '#BAE6FD',
        marginTop: SPACING.md,
    },
    returnFareHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
        marginBottom: SPACING.sm,
    },
    returnFareTitle: {
        fontSize: TYPOGRAPHY.size.md,
        fontWeight: TYPOGRAPHY.weight.semibold,
        color: COLORS.text,
    },
    returnFareDescription: {
        fontSize: TYPOGRAPHY.size.sm,
        color: COLORS.textSecondary,
        marginBottom: SPACING.md,
        lineHeight: 20,
    },
    returnFareRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: RADIUS.medium,
        padding: SPACING.md,
        marginBottom: SPACING.sm,
    },
    returnFareLabel: {
        fontSize: TYPOGRAPHY.size.sm,
        color: COLORS.textSecondary,
        fontWeight: TYPOGRAPHY.weight.medium,
    },
    returnFareAmount: {
        fontSize: TYPOGRAPHY.size.xl,
        fontWeight: TYPOGRAPHY.weight.bold,
        color: COLORS.primary,
    },
    returnFareNote: {
        fontSize: TYPOGRAPHY.size.xs,
        color: COLORS.textTertiary,
        fontStyle: 'italic',
    },
    returnFareSummary: {
        backgroundColor: '#FFF7ED',
        borderRadius: RADIUS.medium,
        padding: SPACING.md,
        marginBottom: SPACING.md,
        borderWidth: 1,
        borderColor: '#FED7AA',
    },
    returnFareSummaryText: {
        fontSize: TYPOGRAPHY.size.sm,
        color: '#9A3412',
        fontWeight: TYPOGRAPHY.weight.medium,
        textAlign: 'center',
    },
});
