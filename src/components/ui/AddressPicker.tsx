import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY, SHADOWS, ICON_SIZES } from '../../utils/theme';
import { Button } from './Button';
import { RadioButton } from './RadioButton';

interface AddressPickerProps {
  onLocationSelect: (location: {
    latitude: number;
    longitude: number;
    formattedAddress: string;
  }) => void;
  initialLocation?: {
    latitude: number;
    longitude: number;
  };
}

export const AddressPicker: React.FC<AddressPickerProps> = ({
  onLocationSelect,
  initialLocation,
}) => {
  const [location, setLocation] = useState(
    initialLocation || {
      latitude: 28.6139, // Default to Delhi
      longitude: 77.209,
    }
  );
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = async () => {
    try {
      setLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please enable location permissions to use this feature.',
          [{ text: 'OK' }]
        );
        setLoading(false);
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({});
      const newLocation = {
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      };
      
      setLocation(newLocation);
      await reverseGeocode(newLocation.latitude, newLocation.longitude);
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Error', 'Could not get your current location');
    } finally {
      setLoading(false);
    }
  };

  const reverseGeocode = async (latitude: number, longitude: number) => {
    try {
      const results = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      if (results && results.length > 0) {
        const result = results[0];
        const formattedAddress = [
          result.street,
          result.streetNumber,
          result.district,
          result.city,
          result.region,
          result.postalCode,
        ]
          .filter(Boolean)
          .join(', ');
        
        setAddress(formattedAddress);
      }
    } catch (error) {
      console.error('Error reverse geocoding:', error);
    }
  };

  const handleConfirm = () => {
    if (!address) {
      Alert.alert('Error', 'Please fetch your current location');
      return;
    }
    onLocationSelect({
      latitude: location.latitude,
      longitude: location.longitude,
      formattedAddress: address,
    });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <Ionicons name="location" size={28} color={COLORS.primary} />
        <Text style={styles.headerText}>Use Current Location</Text>
      </View>

      <View style={styles.placeholderContainer}>
        <View style={styles.mapPlaceholder}>
          <Ionicons name="map" size={80} color={COLORS.border} />
          <Text style={styles.placeholderTitle}>Map View</Text>
          <Text style={styles.placeholderSubtitle}>
            Interactive map requires development build
          </Text>
          <Text style={styles.placeholderNote}>
            Use the button below to get your current location
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.largeLocationButton, loading && styles.buttonDisabled]}
          onPress={getCurrentLocation}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.white} size="small" />
          ) : (
            <>
              <Ionicons name="locate" size={ICON_SIZES.large} color={COLORS.white} />
              <Text style={styles.largeButtonText}>Get My Current Location</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {address ? (
        <View style={styles.addressDisplay}>
          <Ionicons name="checkmark-circle" size={24} color={COLORS.success} />
          <View style={styles.addressTextContainer}>
            <Text style={styles.addressLabel}>Location Detected:</Text>
            <Text style={styles.addressText}>{address}</Text>
            <Text style={styles.coordinatesText}>
              {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
            </Text>
          </View>
        </View>
      ) : null}

      <Button
        title="Confirm Location"
        onPress={handleConfirm}
        disabled={!address || loading}
        style={styles.confirmButton}
      />

      <Text style={styles.helpText}>
        ℹ️ Map picker requires a development build. Use GPS to get your current location for now.
      </Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  headerText: {
    fontSize: TYPOGRAPHY.size.lg,
    fontWeight: '700',
    color: COLORS.text,
  },
  placeholderContainer: {
    marginBottom: SPACING.lg,
  },
  mapPlaceholder: {
    height: 300,
    borderRadius: RADIUS.medium,
    backgroundColor: COLORS.cardBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
    padding: SPACING.xl,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
  },
  placeholderTitle: {
    fontSize: TYPOGRAPHY.size.lg,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
  },
  placeholderSubtitle: {
    fontSize: TYPOGRAPHY.size.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.xs,
  },
  placeholderNote: {
    fontSize: TYPOGRAPHY.size.xs,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.sm,
    fontStyle: 'italic',
  },
  largeLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.primary,
    padding: SPACING.md,
    borderRadius: RADIUS.medium,
    ...SHADOWS.md,
    minHeight: 56,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  largeButtonText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.size.md,
    fontWeight: '600',
  },
  addressDisplay: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.md,
    backgroundColor: '#E8F5E9',
    padding: SPACING.md,
    borderRadius: RADIUS.medium,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.success,
  },
  addressTextContainer: {
    flex: 1,
  },
  addressLabel: {
    fontSize: TYPOGRAPHY.size.xs,
    fontWeight: '600',
    color: COLORS.success,
    marginBottom: SPACING.xs,
    textTransform: 'uppercase',
  },
  addressText: {
    fontSize: TYPOGRAPHY.size.sm,
    color: COLORS.text,
    lineHeight: 20,
    marginBottom: SPACING.xs,
  },
  coordinatesText: {
    fontSize: TYPOGRAPHY.size.xs,
    color: COLORS.textSecondary,
    fontFamily: 'monospace',
  },
  confirmButton: {
    marginTop: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  helpText: {
    fontSize: TYPOGRAPHY.size.xs,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
});
