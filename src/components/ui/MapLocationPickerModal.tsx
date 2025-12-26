import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import MapView from 'react-native-maps';
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

  // Reverse geocode to get address
  const getAddressFromCoords = async (coords: { latitude: number; longitude: number }) => {
    try {
      setIsLoading(true);
      const result = await Location.reverseGeocodeAsync(coords);
      
      if (result[0]) {
        const addr = result[0];
        console.log('Geocode result:', addr); // Debug log
        
        // Correctly map the fields
        const street = addr.street || addr.name || '';
        const district = addr.district || addr.subregion || '';
        const city = addr.city || addr.subregion || ''; // city is the actual city
        const state = addr.region || ''; // region is the state
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
  };

  // Debounced handler for map region change
  const handleRegionChangeComplete = useCallback((newRegion: typeof region) => {
    setRegion(newRegion);
    getAddressFromCoords({
      latitude: newRegion.latitude,
      longitude: newRegion.longitude,
    });
  }, []);

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

  // Initialize with current location when modal opens
  useEffect(() => {
    if (visible && !initialLocation) {
      getCurrentLocation();
    } else if (visible && initialLocation) {
      getAddressFromCoords(initialLocation);
    }
  }, [visible]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Map with OpenStreetMap (Free, no API key needed) */}
        <MapView
          style={styles.map}
          region={region}
          onRegionChangeComplete={handleRegionChangeComplete}
          showsUserLocation
          showsMyLocationButton={false}
          mapType="standard"
        >
          {/* OpenStreetMap Tile Overlay - Free alternative to Google Maps */}
          <MapView.UrlTile
            urlTemplate="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
            maximumZ={19}
            flipY={false}
          />
        </MapView>

        {/* Center Pin (fixed in center) */}
        <View style={styles.centerMarker} pointerEvents="none">
          <Ionicons name="location-sharp" size={48} color="#EF4444" />
        </View>

        {/* Top Bar */}
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.topBarTitle}>Select Location</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Address Card */}
        <View style={styles.addressCard}>
          <View style={styles.addressHeader}>
            <Ionicons name="location" size={20} color={COLORS.primary} />
            <Text style={styles.addressLabel}>Delivery Location</Text>
          </View>
          {isLoading ? (
            <ActivityIndicator size="small" color={COLORS.primary} />
          ) : (
            <Text style={styles.addressText} numberOfLines={2}>
              {fullAddress}
            </Text>
          )}
        </View>

        {/* Bottom Actions */}
        <View style={styles.bottomActions}>
          {/* Use Current Location Button */}
          <TouchableOpacity
            style={styles.currentLocationButton}
            onPress={getCurrentLocation}
            disabled={isGettingLocation}
          >
            {isGettingLocation ? (
              <ActivityIndicator size="small" color={COLORS.primary} />
            ) : (
              <>
                <Ionicons name="navigate" size={20} color={COLORS.primary} />
                <Text style={styles.currentLocationText}>Use Current Location</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Confirm Button */}
          <TouchableOpacity
            style={styles.confirmButton}
            onPress={handleConfirm}
            disabled={isLoading}
          >
            <Text style={styles.confirmText}>Confirm Location</Text>
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
  map: {
    width,
    height,
  },
  mapPlaceholder: {
    width,
    height,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    paddingHorizontal: SPACING.xl,
  },
  placeholderTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: SPACING.md,
  },
  placeholderText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: SPACING.sm,
    textAlign: 'center',
  },
  placeholderSubtext: {
    fontSize: 12,
    color: '#D1D5DB',
    marginTop: SPACING.xs,
    textAlign: 'center',
  },
  centerMarker: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -24,
    marginTop: -48,
    zIndex: 1,
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
    backgroundColor: '#FFFFFF',
    ...SHADOWS.md,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  topBarTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },
  addressCard: {
    position: 'absolute',
    bottom: 180,
    left: SPACING.md,
    right: SPACING.md,
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.large,
    padding: SPACING.lg,
    ...SHADOWS.lg,
  },
  addressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    gap: 8,
  },
  addressLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  addressText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    lineHeight: 22,
  },
  bottomActions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: 40,
    ...SHADOWS.lg,
  },
  currentLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.medium,
    borderWidth: 1,
    borderColor: COLORS.primary,
    backgroundColor: '#FFFFFF',
    marginBottom: SPACING.md,
    gap: 8,
  },
  currentLocationText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
  },
  confirmButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md + 2,
    borderRadius: RADIUS.medium,
    alignItems: 'center',
    ...SHADOWS.md,
  },
  confirmText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
