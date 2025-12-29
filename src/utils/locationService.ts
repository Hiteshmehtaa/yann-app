import * as Location from 'expo-location';
import { Address } from '../types';

export interface LocationCoordinates {
    latitude: number;
    longitude: number;
}

export interface ReverseGeocodedAddress {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    fullAddress: string;
}

/**
 * Request location permissions from the user
 */
export const requestLocationPermission = async (): Promise<boolean> => {
    try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        return status === 'granted';
    } catch (error) {
        console.error('Error requesting location permission:', error);
        return false;
    }
};

/**
 * Check if location permissions are granted
 */
export const hasLocationPermission = async (): Promise<boolean> => {
    try {
        const { status } = await Location.getForegroundPermissionsAsync();
        return status === 'granted';
    } catch (error) {
        console.error('Error checking location permission:', error);
        return false;
    }
};

/**
 * Get the current location coordinates
 */
export const getCurrentLocation = async (): Promise<LocationCoordinates | null> => {
    try {
        const hasPermission = await hasLocationPermission();
        if (!hasPermission) {
            const granted = await requestLocationPermission();
            if (!granted) {
                console.log('Location permission denied');
                return null;
            }
        }

        const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
        });

        return {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
        };
    } catch (error) {
        console.error('Error getting current location:', error);
        return null;
    }
};

/**
 * Reverse geocode coordinates to get address
 */
export const reverseGeocode = async (
    coords: LocationCoordinates
): Promise<ReverseGeocodedAddress | null> => {
    try {
        const results = await Location.reverseGeocodeAsync({
            latitude: coords.latitude,
            longitude: coords.longitude,
        });

        if (results.length === 0) {
            return null;
        }

        const result = results[0];
        const street = [result.streetNumber, result.street].filter(Boolean).join(' ');
        const city = result.city || result.subregion || '';
        const state = result.region || '';
        const postalCode = result.postalCode || '';

        // Build full address
        const addressParts = [
            street,
            result.district,
            city,
            state,
            postalCode,
        ].filter(Boolean);

        return {
            street,
            city,
            state,
            postalCode,
            fullAddress: addressParts.join(', '),
        };
    } catch (error) {
        console.error('Error reverse geocoding:', error);
        return null;
    }
};

/**
 * Calculate distance between two coordinates in meters using Haversine formula
 */
export const calculateDistance = (
    coord1: LocationCoordinates,
    coord2: LocationCoordinates
): number => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (coord1.latitude * Math.PI) / 180;
    const φ2 = (coord2.latitude * Math.PI) / 180;
    const Δφ = ((coord2.latitude - coord1.latitude) * Math.PI) / 180;
    const Δλ = ((coord2.longitude - coord1.longitude) * Math.PI) / 180;

    const a =
        Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
};

/**
 * Find the closest saved address to current location
 * Returns the address if within threshold (default 100m), otherwise null
 */
export const findMatchingAddress = (
    currentLocation: LocationCoordinates,
    savedAddresses: Address[],
    thresholdMeters: number = 100
): Address | null => {
    if (!savedAddresses || savedAddresses.length === 0) {
        return null;
    }

    let closestAddress: Address | null = null;
    let closestDistance = Infinity;

    for (const address of savedAddresses) {
        if (!address.latitude || !address.longitude) {
            continue;
        }

        const distance = calculateDistance(currentLocation, {
            latitude: address.latitude,
            longitude: address.longitude,
        });

        if (distance < closestDistance && distance <= thresholdMeters) {
            closestDistance = distance;
            closestAddress = address;
        }
    }

    return closestAddress;
};

/**
 * Get current location and find matching saved address
 * Returns matched address, current location, or null
 */
export const getLocationWithAddress = async (
    savedAddresses: Address[]
): Promise<{
    currentLocation: LocationCoordinates | null;
    matchedAddress: Address | null;
    currentAddress: ReverseGeocodedAddress | null;
}> => {
    try {
        const currentLocation = await getCurrentLocation();

        if (!currentLocation) {
            return {
                currentLocation: null,
                matchedAddress: null,
                currentAddress: null,
            };
        }

        // Try to find matching saved address
        const matchedAddress = findMatchingAddress(currentLocation, savedAddresses);

        // If no match, reverse geocode current location
        let currentAddress: ReverseGeocodedAddress | null = null;
        if (!matchedAddress) {
            currentAddress = await reverseGeocode(currentLocation);
        }

        return {
            currentLocation,
            matchedAddress,
            currentAddress,
        };
    } catch (error) {
        console.error('Error getting location with address:', error);
        return {
            currentLocation: null,
            matchedAddress: null,
            currentAddress: null,
        };
    }
};
