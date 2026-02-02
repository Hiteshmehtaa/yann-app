import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
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
    Animated,
    Platform
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import * as Location from 'expo-location';

import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../../utils/theme';

const { width, height } = Dimensions.get('window');
const GOOGLE_MAPS_API_KEY = 'AIzaSyDuWW76Kch_KG5n9vxNwSq3GfJCSSZuBOg';

// Custom Map Style (Uber-like theme)
const customMapStyle = [
    {
        "featureType": "all",
        "elementType": "geometry",
        "stylers": [{ "color": "#f5f5f5" }]
    },
    {
        "featureType": "water",
        "elementType": "geometry",
        "stylers": [{ "color": "#c9e6ff" }]
    },
    {
        "featureType": "road",
        "elementType": "geometry",
        "stylers": [{ "color": "#ffffff" }]
    },
    {
        "featureType": "road.highway",
        "elementType": "geometry",
        "stylers": [{ "color": "#ffd666" }]
    },
    {
        "featureType": "poi",
        "elementType": "labels.text.fill",
        "stylers": [{ "color": "#757575" }]
    },
    {
        "featureType": "poi.park",
        "elementType": "geometry",
        "stylers": [{ "color": "#e5f5e0" }]
    }
];

// Types
type TripType = 'incity' | 'outstation';
type Transmission = 'manual' | 'automatic';
type VehicleType = 'hatchback' | 'sedan' | 'suv' | 'luxury';

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

    // Autocomplete State
    const [activeInput, setActiveInput] = useState<'pickup' | 'drop' | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
    const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);

    // Wizard State
    const [currentStep, setCurrentStep] = useState(1);
    const [tripType, setTripType] = useState<TripType | null>(null);
    const [vehicleType, setVehicleType] = useState<VehicleType | null>(null);
    const [transmission, setTransmission] = useState<Transmission | null>(null);

    // UI State
    const [isSearching, setIsSearching] = useState(false);
    const [mapRegion, setMapRegion] = useState<Region>({
        latitude: 28.6139,
        longitude: 77.2090,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
    });

    const slideAnim = useRef(new Animated.Value(0)).current;
    const snapPoints = useMemo(() => ['45%', '70%', '90%'], []);

    // Get current location on mount
    useEffect(() => {
        (async () => {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission Denied', 'Location access is required for booking');
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

            // Reverse geocode to get address
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

    // Calculate distance between two coordinates (Haversine formula)
    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
        const R = 6371; // Earth's radius in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    };

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
        if (coords) {
            if (activeInput === 'pickup') {
                setPickupAddress(suggestion.description);
                setPickupCoords(coords);
            } else {
                setDropAddress(suggestion.description);
                setDropCoords(coords);
            }

            // Update map region
            if (pickupCoords && dropCoords) {
                const p = activeInput === 'pickup' ? coords : pickupCoords;
                const d = activeInput === 'drop' ? coords : dropCoords;

                const midLat = (p.latitude + d.latitude) / 2;
                const midLng = (p.longitude + d.longitude) / 2;
                const latDelta = Math.abs(p.latitude - d.latitude) * 2.5;
                const lngDelta = Math.abs(p.longitude - d.longitude) * 2.5;

                mapRef.current?.animateToRegion({
                    latitude: midLat,
                    longitude: midLng,
                    latitudeDelta: Math.max(latDelta, 0.05),
                    longitudeDelta: Math.max(lngDelta, 0.05),
                }, 1000);
            } else {
                mapRef.current?.animateToRegion({
                    ...coords,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                }, 1000);
            }
        }

        setActiveInput(null);
        setSearchQuery('');
        setSuggestions([]);
        Keyboard.dismiss();
    };

    // Handle map press to set location
    const handleMapPress = async (event: any) => {
        const coords = event.nativeEvent.coordinate;
        const address = await reverseGeocode(coords);

        if (!pickupCoords) {
            setPickupCoords(coords);
            setPickupAddress(address);
        } else if (!dropCoords) {
            setDropCoords(coords);
            setDropAddress(address);
        } else {
            // Update drop location
            setDropCoords(coords);
            setDropAddress(address);
        }
    };

    // Animate to next step
    const goToNextStep = () => {
        if (currentStep < 3) {
            Animated.spring(slideAnim, {
                toValue: -width,
                useNativeDriver: true,
                tension: 50,
                friction: 8,
            }).start(() => {
                setCurrentStep(currentStep + 1);
                slideAnim.setValue(0);
            });
        }
    };

    // Go to previous step
    const goToPreviousStep = () => {
        if (currentStep > 1) {
            Animated.spring(slideAnim, {
                toValue: width,
                useNativeDriver: true,
                tension: 50,
                friction: 8,
            }).start(() => {
                setCurrentStep(currentStep - 1);
                slideAnim.setValue(0);
            });
        }
    };

    // Swipe gesture for navigation
    const swipeGesture = Gesture.Pan()
        .onEnd((event) => {
            if (event.translationX > 100 && currentStep > 1) {
                goToPreviousStep();
            } else if (event.translationX < -100 && currentStep < 3) {
                if (
                    (currentStep === 1 && tripType) ||
                    (currentStep === 2 && vehicleType)
                ) {
                    goToNextStep();
                }
            }
        });

    // Handle find drivers
    const handleFindDrivers = async () => {
        if (!tripType || !vehicleType || !transmission) {
            Alert.alert('Missing Details', 'Please complete all steps');
            return;
        }

        if (!pickupCoords || !dropCoords) {
            Alert.alert('Missing Locations', 'Please set both pickup and drop locations');
            return;
        }

        setIsSearching(true);
        try {
            const searchParams = {
                tripType,
                vehicleType,
                transmission,
                pickupLocation: pickupCoords,
                dropLocation: dropCoords,
                pickupAddress,
                dropAddress,
            };

            // Navigate to driver list screen
            navigation.navigate('DriverList', { searchParams });
        } catch (error) {
            Alert.alert('Error', 'Failed to search for drivers');
        } finally {
            setIsSearching(false);
        }
    };

    // Render location search modal
    const renderLocationSearch = () => {
        if (!activeInput) return null;

        return (
            <View style={styles.searchModal}>
                <View style={[styles.searchHeader, { paddingTop: insets.top + 10 }]}>
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
                        placeholder="Search for a location..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        autoFocus
                        placeholderTextColor={COLORS.textTertiary}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <Ionicons name="close-circle" size={20} color={COLORS.textTertiary} />
                        </TouchableOpacity>
                    )}
                </View>

                {isLoadingSuggestions && (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="small" color={COLORS.primary} />
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
                                <Ionicons name="location" size={20} color={COLORS.primary} />
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
                                            • {item.distance.toFixed(1)} km
                                        </Text>
                                    )}
                                </View>
                            </View>
                        </TouchableOpacity>
                    )}
                    ListEmptyComponent={
                        !isLoadingSuggestions && searchQuery.length >= 2 ? (
                            <View style={styles.emptyState}>
                                <Ionicons name="search-outline" size={48} color={COLORS.textTertiary} />
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
                            <Text style={styles.stepTitle}>Choose Trip Type</Text>
                            <Text style={styles.stepSubtitle}>Select your journey preference</Text>
                        </View>

                        <View style={styles.optionsRow}>
                            <TouchableOpacity
                                style={[styles.optionCard, tripType === 'incity' && styles.optionCardActive]}
                                onPress={() => {
                                    setTripType('incity');
                                    setTimeout(goToNextStep, 300);
                                }}
                                activeOpacity={0.8}
                            >
                                <LinearGradient
                                    colors={tripType === 'incity'
                                        ? [COLORS.primary, '#2563EB']
                                        : ['#F8FAFC', '#F1F5F9']}
                                    style={styles.optionGradient}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                >
                                    <View style={[styles.optionIconBg, tripType === 'incity' && styles.optionIconBgActive]}>
                                        <Ionicons
                                            name="business"
                                            size={28}
                                            color={tripType === 'incity' ? '#FFF' : COLORS.primary}
                                        />
                                    </View>
                                    <Text style={[styles.optionText, tripType === 'incity' && styles.optionTextActive]}>
                                        In-City
                                    </Text>
                                    <Text style={[styles.optionSubtext, tripType === 'incity' && styles.optionSubtextActive]}>
                                        Within city limits
                                    </Text>
                                </LinearGradient>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.optionCard, tripType === 'outstation' && styles.optionCardActive]}
                                onPress={() => {
                                    setTripType('outstation');
                                    setTimeout(goToNextStep, 300);
                                }}
                                activeOpacity={0.8}
                            >
                                <LinearGradient
                                    colors={tripType === 'outstation'
                                        ? ['#8B5CF6', '#7C3AED']
                                        : ['#F8FAFC', '#F1F5F9']}
                                    style={styles.optionGradient}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                >
                                    <View style={[styles.optionIconBg, tripType === 'outstation' && styles.optionIconBgActive]}>
                                        <Ionicons
                                            name="map"
                                            size={28}
                                            color={tripType === 'outstation' ? '#FFF' : '#8B5CF6'}
                                        />
                                    </View>
                                    <Text style={[styles.optionText, tripType === 'outstation' && styles.optionTextActive]}>
                                        Outstation
                                    </Text>
                                    <Text style={[styles.optionSubtext, tripType === 'outstation' && styles.optionSubtextActive]}>
                                        Long distance travel
                                    </Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    </View>
                );

            case 2:
                return (
                    <View style={styles.stepContainer}>
                        <View style={styles.stepHeader}>
                            <TouchableOpacity onPress={goToPreviousStep} style={styles.backBtn}>
                                <Ionicons name="chevron-back" size={20} color={COLORS.textSecondary} />
                            </TouchableOpacity>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.stepTitle}>Select Vehicle</Text>
                                <Text style={styles.stepSubtitle}>Choose your preferred car type</Text>
                            </View>
                        </View>

                        <View style={styles.vehicleGrid}>
                            {[
                                { type: 'hatchback', icon: 'car-sport', label: 'Hatchback', desc: 'Compact & economical' },
                                { type: 'sedan', icon: 'car', label: 'Sedan', desc: 'Comfortable & spacious' },
                                { type: 'suv', icon: 'car-sport-outline', label: 'SUV', desc: 'Premium & roomy' },
                                { type: 'luxury', icon: 'diamond', label: 'Luxury', desc: 'Elite experience' },
                            ].map((vehicle) => (
                                <TouchableOpacity
                                    key={vehicle.type}
                                    style={[
                                        styles.vehicleCard,
                                        vehicleType === vehicle.type && styles.vehicleCardActive
                                    ]}
                                    onPress={() => {
                                        setVehicleType(vehicle.type as VehicleType);
                                        setTimeout(goToNextStep, 300);
                                    }}
                                    activeOpacity={0.8}
                                >
                                    <View style={[
                                        styles.vehicleIconBg,
                                        vehicleType === vehicle.type && styles.vehicleIconBgActive
                                    ]}>
                                        <Ionicons
                                            name={vehicle.icon as any}
                                            size={24}
                                            color={vehicleType === vehicle.type ? COLORS.primary : '#64748B'}
                                        />
                                    </View>
                                    <Text style={[styles.vehicleText, vehicleType === vehicle.type && styles.vehicleTextActive]}>
                                        {vehicle.label}
                                    </Text>
                                    <Text style={[styles.vehicleDesc, vehicleType === vehicle.type && styles.vehicleDescActive]}>
                                        {vehicle.desc}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                );

            case 3:
                return (
                    <View style={styles.stepContainer}>
                        <View style={styles.stepHeader}>
                            <TouchableOpacity onPress={goToPreviousStep} style={styles.backBtn}>
                                <Ionicons name="chevron-back" size={20} color={COLORS.textSecondary} />
                            </TouchableOpacity>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.stepTitle}>Transmission</Text>
                                <Text style={styles.stepSubtitle}>Select gear type preference</Text>
                            </View>
                        </View>

                        <View style={styles.optionsRow}>
                            <TouchableOpacity
                                style={[styles.optionCard, transmission === 'manual' && styles.optionCardActive]}
                                onPress={() => setTransmission('manual')}
                                activeOpacity={0.8}
                            >
                                <LinearGradient
                                    colors={transmission === 'manual'
                                        ? ['#10B981', '#059669']
                                        : ['#F8FAFC', '#F1F5F9']}
                                    style={styles.optionGradient}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                >
                                    <View style={[styles.optionIconBg, transmission === 'manual' && styles.optionIconBgActive]}>
                                        <Ionicons
                                            name="settings"
                                            size={28}
                                            color={transmission === 'manual' ? '#FFF' : '#10B981'}
                                        />
                                    </View>
                                    <Text style={[styles.optionText, transmission === 'manual' && styles.optionTextActive]}>
                                        Manual
                                    </Text>
                                    <Text style={[styles.optionSubtext, transmission === 'manual' && styles.optionSubtextActive]}>
                                        Traditional control
                                    </Text>
                                </LinearGradient>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.optionCard, transmission === 'automatic' && styles.optionCardActive]}
                                onPress={() => setTransmission('automatic')}
                                activeOpacity={0.8}
                            >
                                <LinearGradient
                                    colors={transmission === 'automatic'
                                        ? ['#F59E0B', '#D97706']
                                        : ['#F8FAFC', '#F1F5F9']}
                                    style={styles.optionGradient}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                >
                                    <View style={[styles.optionIconBg, transmission === 'automatic' && styles.optionIconBgActive]}>
                                        <Ionicons
                                            name="flash"
                                            size={28}
                                            color={transmission === 'automatic' ? '#FFF' : '#F59E0B'}
                                        />
                                    </View>
                                    <Text style={[styles.optionText, transmission === 'automatic' && styles.optionTextActive]}>
                                        Automatic
                                    </Text>
                                    <Text style={[styles.optionSubtext, transmission === 'automatic' && styles.optionSubtextActive]}>
                                        Effortless driving
                                    </Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>

                        {transmission && (
                            <TouchableOpacity
                                style={styles.findDriversButton}
                                onPress={handleFindDrivers}
                                disabled={isSearching}
                                activeOpacity={0.8}
                            >
                                <LinearGradient
                                    colors={['#10B981', '#059669']}
                                    style={styles.findDriversGradient}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                >
                                    {isSearching ? (
                                        <ActivityIndicator color="#FFF" />
                                    ) : (
                                        <>
                                            <Ionicons name="search" size={22} color="#FFF" />
                                            <Text style={styles.findDriversText}>Find Drivers</Text>
                                        </>
                                    )}
                                </LinearGradient>
                            </TouchableOpacity>
                        )}
                    </View>
                );

            default:
                return null;
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />

            {/* Map Background */}
            <MapView
                ref={mapRef}
                style={styles.map}
                provider={PROVIDER_GOOGLE}
                initialRegion={mapRegion}
                showsUserLocation
                showsMyLocationButton={false}
                onPress={handleMapPress}
                customMapStyle={customMapStyle}
            >
                {pickupCoords && (
                    <Marker
                        coordinate={pickupCoords}
                        pinColor={COLORS.success}
                    >
                        <View style={styles.customMarker}>
                            <View style={[styles.markerDot, { backgroundColor: COLORS.success }]} />
                            <View style={[styles.markerPulse, { borderColor: COLORS.success }]} />
                        </View>
                    </Marker>
                )}
                {dropCoords && (
                    <Marker
                        coordinate={dropCoords}
                        pinColor={COLORS.error}
                    >
                        <View style={styles.customMarker}>
                            <View style={[styles.markerDot, { backgroundColor: COLORS.error }]} />
                            <View style={[styles.markerPulse, { borderColor: COLORS.error }]} />
                        </View>
                    </Marker>
                )}
                {pickupCoords && dropCoords && (
                    <Polyline
                        coordinates={[pickupCoords, dropCoords]}
                        strokeColor={COLORS.primary}
                        strokeWidth={4}
                        lineDashPattern={[1]}
                    />
                )}
            </MapView>

            {/* Floating Header */}
            <View style={[styles.header, { top: insets.top + 10 }]}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.text} />
                </TouchableOpacity>

                <View style={styles.locationInputsContainer}>
                    <TouchableOpacity
                        style={styles.locationInputRow}
                        onPress={() => setActiveInput('pickup')}
                    >
                        <View style={[styles.locationDot, { backgroundColor: COLORS.success }]} />
                        <Text
                            style={[styles.locationInputText, !pickupAddress && styles.locationInputPlaceholder]}
                            numberOfLines={1}
                        >
                            {pickupAddress || 'Set pickup location'}
                        </Text>
                        <Ionicons name="chevron-forward" size={16} color={COLORS.textTertiary} />
                    </TouchableOpacity>

                    <View style={styles.locationDivider} />

                    <TouchableOpacity
                        style={styles.locationInputRow}
                        onPress={() => setActiveInput('drop')}
                    >
                        <View style={[styles.locationDot, { backgroundColor: COLORS.error }]} />
                        <Text
                            style={[styles.locationInputText, !dropAddress && styles.locationInputPlaceholder]}
                            numberOfLines={1}
                        >
                            {dropAddress || 'Set drop location'}
                        </Text>
                        <Ionicons name="chevron-forward" size={16} color={COLORS.textTertiary} />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Bottom Sheet Wizard */}
            <BottomSheet
                ref={bottomSheetRef}
                index={0}
                snapPoints={snapPoints}
                backgroundStyle={styles.bottomSheetBackground}
                handleIndicatorStyle={styles.bottomSheetIndicator}
                enablePanDownToClose={false}
            >
                <BottomSheetScrollView
                    contentContainerStyle={styles.bottomSheetContent}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Step Indicator */}
                    <View style={styles.stepIndicator}>
                        {[1, 2, 3].map((step) => (
                            <View key={step} style={styles.stepIndicatorItem}>
                                <View
                                    style={[
                                        styles.stepDot,
                                        currentStep >= step && styles.stepDotActive,
                                    ]}
                                >
                                    {currentStep > step && (
                                        <Ionicons name="checkmark" size={12} color="#FFF" />
                                    )}
                                </View>
                                {step < 3 && (
                                    <View style={[
                                        styles.stepLine,
                                        currentStep > step && styles.stepLineActive
                                    ]} />
                                )}
                            </View>
                        ))}
                    </View>

                    {/* Wizard Content with Swipe Gesture */}
                    <GestureDetector gesture={swipeGesture}>
                        <Animated.View style={{ transform: [{ translateX: slideAnim }] }}>
                            {renderWizardStep()}
                        </Animated.View>
                    </GestureDetector>
                </BottomSheetScrollView>
            </BottomSheet>

            {/* Location Search Modal */}
            {renderLocationSearch()}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    map: {
        width: width,
        height: height,
    },
    customMarker: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    markerDot: {
        width: 16,
        height: 16,
        borderRadius: 8,
        borderWidth: 3,
        borderColor: '#FFF',
        ...SHADOWS.md,
    },
    markerPulse: {
        position: 'absolute',
        width: 32,
        height: 32,
        borderRadius: 16,
        borderWidth: 2,
        opacity: 0.3,
    },
    header: {
        position: 'absolute',
        left: 20,
        right: 20,
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
        zIndex: 10,
    },
    backButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#FFF',
        justifyContent: 'center',
        alignItems: 'center',
        ...SHADOWS.lg,
    },
    locationInputsContainer: {
        flex: 1,
        backgroundColor: '#FFF',
        borderRadius: 20,
        padding: 8,
        ...SHADOWS.lg,
    },
    locationInputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 12,
        gap: 12,
    },
    locationDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    locationInputText: {
        flex: 1,
        fontSize: 14,
        color: COLORS.text,
        fontWeight: '600',
    },
    locationInputPlaceholder: {
        color: COLORS.textTertiary,
        fontWeight: '400',
    },
    locationDivider: {
        height: 1,
        backgroundColor: '#F1F5F9',
        marginHorizontal: 14,
    },
    searchModal: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: '#FFF',
        zIndex: 100,
    },
    searchHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingBottom: 16,
        gap: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    searchHeaderTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.text,
    },
    searchInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        marginHorizontal: 20,
        marginVertical: 16,
        paddingHorizontal: 16,
        height: 52,
        borderRadius: 16,
        gap: 12,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: COLORS.text,
    },
    suggestionsList: {
        paddingHorizontal: 20,
    },
    suggestionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        gap: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#F8FAFC',
    },
    suggestionIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#EFF6FF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    suggestionTextContainer: {
        flex: 1,
    },
    suggestionMainText: {
        fontSize: 15,
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: 4,
    },
    suggestionSecondaryRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    suggestionSecondaryText: {
        fontSize: 13,
        color: COLORS.textSecondary,
        flex: 1,
    },
    distanceText: {
        fontSize: 12,
        color: COLORS.primary,
        fontWeight: '700',
    },
    loadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        gap: 12,
    },
    loadingText: {
        fontSize: 14,
        color: COLORS.textSecondary,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    emptyText: {
        fontSize: 16,
        color: COLORS.textSecondary,
        marginTop: 12,
    },
    bottomSheetBackground: {
        backgroundColor: '#FFF',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        ...SHADOWS.xl,
    },
    bottomSheetIndicator: {
        backgroundColor: '#E2E8F0',
        width: 48,
        height: 5,
    },
    bottomSheetContent: {
        paddingHorizontal: 24,
        paddingTop: 8,
        paddingBottom: 40,
    },
    stepIndicator: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 32,
        paddingHorizontal: 40,
    },
    stepIndicatorItem: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    stepDot: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#E2E8F0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    stepDotActive: {
        backgroundColor: COLORS.primary,
    },
    stepLine: {
        flex: 1,
        height: 2,
        backgroundColor: '#E2E8F0',
        marginHorizontal: 8,
    },
    stepLineActive: {
        backgroundColor: COLORS.primary,
    },
    stepContainer: {
        flex: 1,
    },
    stepHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
        gap: 12,
    },
    backBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#F8FAFC',
        justifyContent: 'center',
        alignItems: 'center',
    },
    stepTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: COLORS.text,
        letterSpacing: -0.5,
    },
    stepSubtitle: {
        fontSize: 14,
        color: COLORS.textSecondary,
        marginTop: 4,
    },
    optionsRow: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 24,
    },
    optionCard: {
        flex: 1,
        height: 180,
        borderRadius: 24,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: 'transparent',
    },
    optionCardActive: {
        borderColor: COLORS.primary,
        ...SHADOWS.lg,
    },
    optionGradient: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 12,
        padding: 20,
    },
    optionIconBg: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    optionIconBgActive: {
        backgroundColor: 'rgba(255,255,255,0.25)',
    },
    optionText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#64748B',
        marginTop: 4,
    },
    optionTextActive: {
        color: '#FFF',
    },
    optionSubtext: {
        fontSize: 12,
        color: '#94A3B8',
        fontWeight: '500',
    },
    optionSubtextActive: {
        color: 'rgba(255,255,255,0.9)',
    },
    vehicleGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 16,
        marginBottom: 24,
    },
    vehicleCard: {
        width: (width - 72) / 2,
        height: 140,
        backgroundColor: '#F8FAFC',
        borderRadius: 20,
        padding: 16,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    vehicleCardActive: {
        borderColor: COLORS.primary,
        backgroundColor: '#EFF6FF',
        ...SHADOWS.md,
    },
    vehicleIconBg: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#FFF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    vehicleIconBgActive: {
        backgroundColor: '#DBEAFE',
    },
    vehicleText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#64748B',
        marginTop: 4,
    },
    vehicleTextActive: {
        color: COLORS.primary,
    },
    vehicleDesc: {
        fontSize: 11,
        color: '#94A3B8',
        textAlign: 'center',
    },
    vehicleDescActive: {
        color: COLORS.textSecondary,
    },
    findDriversButton: {
        height: 60,
        borderRadius: 20,
        overflow: 'hidden',
        ...SHADOWS.lg,
    },
    findDriversGradient: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
    },
    findDriversText: {
        fontSize: 18,
        fontWeight: '800',
        color: '#FFF',
        letterSpacing: 0.5,
    },
});
