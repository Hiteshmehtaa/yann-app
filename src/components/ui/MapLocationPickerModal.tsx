import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Dimensions,
  TextInput,
  Platform,
  Keyboard,
  Animated,
  Image,
  FlatList,
} from 'react-native';
import MapView, { Polygon, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../../utils/theme';

const { width, height } = Dimensions.get('window');

interface MapLocationPickerModalProps {
  visible: boolean;
  onClose: () => void;
  onLocationSelect: (location: {
    latitude: number;
    longitude: number;
    address: string;
    fullAddress: string;
    city: string;
    state: string;
    postalCode: string;
    district: string;
  }) => void;
  initialLocation?: {
    latitude: number;
    longitude: number;
  };
}

interface SearchSuggestion {
  description: string;
  latitude: number;
  longitude: number;
}

export const MapLocationPickerModal: React.FC<MapLocationPickerModalProps> = ({
  visible,
  onClose,
  onLocationSelect,
  initialLocation,
}) => {
  const [region, setRegion] = useState({
    latitude: initialLocation?.latitude || 28.6139,
    longitude: initialLocation?.longitude || 77.2090,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });
  const [address, setAddress] = useState('Fetching address...');
  const [fullAddress, setFullAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const searchTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Animation for pin bounce
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // Delivery area polygon
  const deliveryPolygon = [
    { latitude: 28.62, longitude: 77.20 },
    { latitude: 28.62, longitude: 77.22 },
    { latitude: 28.60, longitude: 77.22 },
    { latitude: 28.60, longitude: 77.20 },
  ];

  // Pin bounce animation when region changes
  const animatePin = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.15,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Get current location
  const getCurrentLocation = async () => {
    try {
      setIsGettingLocation(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        alert('Permission to access location was denied');
        setIsGettingLocation(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const newRegion = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
      
      setRegion(newRegion);
      await getAddressFromCoords({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
      setIsGettingLocation(false);
    } catch (error) {
      console.error('Error getting location:', error);
      setIsGettingLocation(false);
      alert('Could not get your location. Please try again.');
    }
  };

  // Search for address with suggestions
  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim() || query.length < 3) {
      setSearchSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    try {
      setIsSearching(true);
      const results = await Location.geocodeAsync(query);
      
      if (results.length > 0) {
        const suggestions: SearchSuggestion[] = results.slice(0, 5).map((result, index) => ({
          description: `${result.name || result.street || 'Location'} ${index + 1}`,
          latitude: result.latitude,
          longitude: result.longitude,
        }));
        
        setSearchSuggestions(suggestions);
        setShowSuggestions(true);
      } else {
        setSearchSuggestions([]);
        setShowSuggestions(false);
      }
      setIsSearching(false);
    } catch (error) {
      console.error('Search error:', error);
      setIsSearching(false);
      setSearchSuggestions([]);
      setShowSuggestions(false);
    }
  }, []);

  // Select suggestion
  const selectSuggestion = async (suggestion: SearchSuggestion) => {
    const newRegion = {
      latitude: suggestion.latitude,
      longitude: suggestion.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    };
    setRegion(newRegion);
    setSearchQuery(suggestion.description);
    setShowSuggestions(false);
    await getAddressFromCoords({
      latitude: suggestion.latitude,
      longitude: suggestion.longitude,
    });
    Keyboard.dismiss();
  };

  // Debounced search
  const handleSearchInput = (text: string) => {
    setSearchQuery(text);
    
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
    }
    
    if (text.trim().length > 2) {
      searchTimerRef.current = setTimeout(() => {
        handleSearch(text);
      }, 500);
    } else {
      setSearchSuggestions([]);
      setShowSuggestions(false);
    }
  };

  // Reverse geocode to get address
  const getAddressFromCoords = useCallback(async (coords: { latitude: number; longitude: number }) => {
    try {
      setIsLoading(true);
      const result = await Location.reverseGeocodeAsync(coords);
      
      if (result[0]) {
        const addr = result[0];
        
        const street = addr.street || addr.name || '';
        const district = addr.district || addr.subregion || '';
        const city = addr.city || addr.subregion || '';
        const state = addr.region || '';
        const postalCode = addr.postalCode || '';
        
        const shortAddress = `${street}, ${city}`.trim();
        const full = `${street}, ${district}, ${city}, ${state} ${postalCode}`.trim();
        
        setAddress(shortAddress || 'Address not found');
        setFullAddress(full || shortAddress || 'Address not found');
      } else {
        setAddress('Address not found');
        setFullAddress('Address not found');
      }
      setIsLoading(false);
    } catch (error) {
      console.error('Geocoding error:', error);
      setAddress('Could not fetch address');
      setFullAddress('Could not fetch address');
      setIsLoading(false);
    }
  }, []);

  // Debounced handler for map region change
  const handleRegionChangeComplete = useCallback((newRegion: typeof region) => {
    setRegion(newRegion);
    animatePin();
    
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    debounceTimerRef.current = setTimeout(() => {
      getAddressFromCoords({
        latitude: newRegion.latitude,
        longitude: newRegion.longitude,
      });
    }, 200);
  }, [getAddressFromCoords]);

  // Confirm location
  const handleConfirm = async () => {
    try {
      const result = await Location.reverseGeocodeAsync({
        latitude: region.latitude,
        longitude: region.longitude,
      });
      
      const addr = result[0];
      
      onLocationSelect({
        latitude: region.latitude,
        longitude: region.longitude,
        address,
        fullAddress,
        city: addr?.city || '',
        state: addr?.region || '',
        postalCode: addr?.postalCode || '',
        district: addr?.district || addr?.subregion || '',
      });
      onClose();
    } catch (error) {
      console.error('Error confirming location:', error);
      onLocationSelect({
        latitude: region.latitude,
        longitude: region.longitude,
        address,
        fullAddress,
        city: '',
        state: '',
        postalCode: '',
        district: '',
      });
      onClose();
    }
  };

  // Initialize
  useEffect(() => {
    if (visible && !initialLocation) {
      getCurrentLocation();
    } else if (visible && initialLocation) {
      getAddressFromCoords(initialLocation);
    }
    
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (searchTimerRef.current) {
        clearTimeout(searchTimerRef.current);
      }
    };
  }, [visible, initialLocation, getAddressFromCoords]);

  // Skeleton loader component
  const SkeletonLine = ({ width }: { width: string }) => (
    <View style={[styles.skeletonLine, { width }]} />
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Search Bar */}
        <View style={styles.searchBar}>
          <TouchableOpacity style={styles.backButton} onPress={onClose}>
            <Ionicons name="arrow-back" size={20} color="#000" />
          </TouchableOpacity>
          <View style={styles.searchInputContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search location"
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={handleSearchInput}
              returnKeyType="search"
              onSubmitEditing={() => handleSearch(searchQuery)}
            />
            {isSearching ? (
              <ActivityIndicator size="small" color={COLORS.primary} />
            ) : (
              <Ionicons name="search" size={18} color="#9CA3AF" />
            )}
          </View>
        </View>

        {/* Search Suggestions */}
        {showSuggestions && searchSuggestions.length > 0 && (
          <View style={styles.suggestionsContainer}>
            <FlatList
              data={searchSuggestions}
              keyExtractor={(item, index) => index.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.suggestionItem}
                  onPress={() => selectSuggestion(item)}
                >
                  <Ionicons name="location-outline" size={18} color={COLORS.primary} />
                  <Text style={styles.suggestionText} numberOfLines={1}>
                    {item.description}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        )}

        {/* Map with 3D buildings */}
        <MapView
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          region={region}
          onRegionChangeComplete={handleRegionChangeComplete}
          showsUserLocation={true}
          showsMyLocationButton={false}
          mapType="standard"
          pitchEnabled={true}
          rotateEnabled={true}
          showsBuildings={true}
          customMapStyle={[
            {
              "featureType": "all",
              "elementType": "geometry",
              "stylers": [{ "saturation": -100 }, { "lightness": 40 }]
            },
            {
              "featureType": "all",
              "elementType": "labels.text.fill",
              "stylers": [{ "color": "#8a8a8a" }]
            },
            {
              "featureType": "all",
              "elementType": "labels.text.stroke",
              "stylers": [{ "visibility": "off" }]
            },
            {
              "featureType": "water",
              "elementType": "geometry",
              "stylers": [{ "color": "#e8e8e8" }, { "lightness": 17 }]
            },
            {
              "featureType": "landscape",
              "elementType": "geometry",
              "stylers": [{ "color": "#f2f2f2" }]
            },
            {
              "featureType": "road",
              "elementType": "geometry",
              "stylers": [{ "color": "#ffffff" }, { "lightness": 18 }]
            },
            {
              "featureType": "poi",
              "elementType": "labels",
              "stylers": [{ "visibility": "off" }]
            },
            {
              "featureType": "transit",
              "elementType": "labels",
              "stylers": [{ "visibility": "off" }]
            },
            {
              "featureType": "administrative",
              "elementType": "geometry.fill",
              "stylers": [{ "color": "#fefefe" }, { "lightness": 20 }]
            }
          ]}
          userLocationAnnotationTitle=""
          showsCompass={false}
          showsScale={false}
          showsTraffic={false}
          showsIndoors={false}
          loadingEnabled={true}
          loadingIndicatorColor={COLORS.primary}
          loadingBackgroundColor="#FFFFFF"
        >
          {/* Delivery Area Polygon */}
          <Polygon
            coordinates={deliveryPolygon}
            fillColor="rgba(46, 89, 243, 0.08)"
            strokeColor={COLORS.primary}
            strokeWidth={1.5}
          />
        </MapView>

        {/* Static Pin with Shadow */}
        <View style={styles.centerMarker} pointerEvents="none">
          <Animated.View
            style={[
              styles.pinContainer,
              {
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            <Image
              source={require('../../../assets/pin-map.png')}
              style={styles.pinImage}
              resizeMode="contain"
            />
          </Animated.View>
        </View>

        {/* Current Location Button - Smaller */}
        <TouchableOpacity 
          style={styles.currentLocationButton}
          onPress={getCurrentLocation}
          disabled={isGettingLocation}
        >
          {isGettingLocation ? (
            <ActivityIndicator size="small" color={COLORS.primary} />
          ) : (
            <>
              <Ionicons name="navigate" size={16} color={COLORS.primary} />
              <Text style={styles.currentLocationText}>Current</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Bottom Sheet - Minimal */}
        <View style={styles.bottomSheet}>
          <View style={styles.dragHandle} />
          
          <Text style={styles.deliveryText}>Delivery location</Text>
          
          <View style={styles.addressContainer}>
            <Ionicons name="location" size={20} color={COLORS.primary} />
            <View style={styles.addressTextContainer}>
              {isLoading ? (
                <>
                  <SkeletonLine width="80%" />
                  <View style={{ height: 4 }} />
                  <SkeletonLine width="60%" />
                </>
              ) : (
                <>
                  <Text style={styles.addressTitle} numberOfLines={1}>
                    {address}
                  </Text>
                  <Text style={styles.addressSubtitle} numberOfLines={2}>
                    {fullAddress}
                  </Text>
                </>
              )}
            </View>
          </View>

          {/* Confirm Button - Minimal */}
          <TouchableOpacity
            style={styles.confirmButton}
            onPress={handleConfirm}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            <Text style={styles.confirmText}>Confirm</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  searchBar: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 20,
    left: 16,
    right: 16,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.md,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 10,
    ...SHADOWS.md,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#000',
  },
  suggestionsContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 100 : 70,
    left: 16,
    right: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    maxHeight: 200,
    zIndex: 11,
    ...SHADOWS.lg,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  suggestionText: {
    flex: 1,
    fontSize: 14,
    color: '#000',
  },
  map: {
    width,
    height,
  },
  centerMarker: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -25,
    marginTop: -50,
    zIndex: 1,
  },
  pinContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  pinImage: {
    width: 50,
    height: 50,
  },
  currentLocationButton: {
    position: 'absolute',
    bottom: 280,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    ...SHADOWS.md,
  },
  currentLocationText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 32 : 20,
    ...SHADOWS.lg,
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  deliveryText: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 12,
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    gap: 10,
  },
  addressTextContainer: {
    flex: 1,
  },
  addressTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  addressSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 16,
  },
  skeletonLine: {
    height: 12,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
  },
  confirmButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.md,
  },
  confirmText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
