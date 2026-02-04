import { Linking, Platform, Alert } from 'react-native';

/**
 * Opens the device's native maps app for navigation to a specific location
 * Works on both iOS (Apple Maps) and Android (Google Maps)
 * 
 * @param latitude - Destination latitude
 * @param longitude - Destination longitude
 * @param label - Optional label for the destination (e.g., customer name or address)
 */
export const openMapNavigation = async (
  latitude: number,
  longitude: number,
  label?: string
): Promise<void> => {
  if (!latitude || !longitude) {
    Alert.alert('Error', 'Location coordinates not available');
    return;
  }

  const destination = `${latitude},${longitude}`;
  const labelParam = label ? encodeURIComponent(label) : '';

  let url: string;

  if (Platform.OS === 'ios') {
    // Apple Maps URL scheme
    url = `maps:0,0?q=${labelParam}&ll=${destination}`;
  } else {
    // Google Maps URL scheme for Android
    url = `geo:0,0?q=${destination}(${labelParam})`;
  }

  try {
    const supported = await Linking.canOpenURL(url);

    if (supported) {
      await Linking.openURL(url);
    } else {
      // Fallback to Google Maps web version
      const webUrl = `https://www.google.com/maps/dir/?api=1&destination=${destination}`;
      await Linking.openURL(webUrl);
    }
  } catch (error) {
    console.error('Error opening maps:', error);
    Alert.alert(
      'Unable to Open Maps',
      'Please make sure you have a maps application installed.',
      [{ text: 'OK' }]
    );
  }
};

/**
 * Opens Google Maps (or Apple Maps on iOS) with a route from current location to destination
 * 
 * @param latitude - Destination latitude
 * @param longitude - Destination longitude
 * @param label - Optional label for the destination
 */
export const navigateToLocation = async (
  latitude: number,
  longitude: number,
  label?: string
): Promise<void> => {
  if (!latitude || !longitude) {
    Alert.alert('Error', 'Location coordinates not available');
    return;
  }

  const destination = `${latitude},${longitude}`;

  let url: string;

  if (Platform.OS === 'ios') {
    // Apple Maps with directions
    url = `maps:?daddr=${destination}&dirflg=d`;
  } else {
    // Google Maps with directions
    url = `google.navigation:q=${destination}`;
  }

  // Label parameter is optional and not used in direct navigation URLs
  console.log(label);

  try {
    const supported = await Linking.canOpenURL(url);

    if (supported) {
      await Linking.openURL(url);
    } else {
      // Fallback to Google Maps web with directions
      const webUrl = `https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=driving`;
      await Linking.openURL(webUrl);
    }
  } catch (error) {
    console.error('Error starting navigation:', error);
    Alert.alert(
      'Unable to Start Navigation',
      'Please make sure you have a maps application installed.',
      [{ text: 'OK' }]
    );
  }
};

/**
 * Opens location in maps app with a marker (no navigation)
 * 
 * @param latitude - Location latitude
 * @param longitude - Location longitude
 * @param label - Optional label for the location
 */
export const viewLocationOnMap = async (
  latitude: number,
  longitude: number,
  label?: string
): Promise<void> => {
  await openMapNavigation(latitude, longitude, label);
};

/**
 * Gets a Google Maps static image URL for displaying a map preview
 * Requires Google Maps Static API key
 * 
 * @param latitude - Location latitude
 * @param longitude - Location longitude
 * @param width - Image width in pixels
 * @param height - Image height in pixels
 * @param zoom - Map zoom level (1-20)
 * @param apiKey - Google Maps API key
 * @returns URL string for the static map image
 */
export const getStaticMapUrl = (
  latitude: number,
  longitude: number,
  apiKey: string,
  width: number = 400,
  height: number = 200,
  zoom: number = 15
): string => {
  const center = `${latitude},${longitude}`;
  const marker = `color:red|${center}`;

  return `https://maps.googleapis.com/maps/api/staticmap?center=${center}&zoom=${zoom}&size=${width}x${height}&markers=${marker}&key=${apiKey}`;
};

/**
 * Formats an address for display
 * 
 * @param street - Street address
 * @param city - City
 * @param state - State
 * @param postalCode - Postal/ZIP code
 * @returns Formatted address string
 */
export const formatAddress = (
  street: string,
  city?: string,
  state?: string,
  postalCode?: string
): string => {
  const parts = [street, city, state, postalCode].filter(Boolean);
  return parts.join(', ');
};

/**
 * Calculates distance between two coordinates using Haversine formula
 * Returns distance in kilometers
 * 
 * @param lat1 - First point latitude
 * @param lon1 - First point longitude
 * @param lat2 - Second point latitude
 * @param lon2 - Second point longitude
 * @returns Distance in kilometers
 */
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const toRad = (degrees: number): number => {
  return degrees * (Math.PI / 180);
};

/**
 * Formats distance for display
 * 
 * @param distanceKm - Distance in kilometers
 * @returns Formatted string (e.g., "2.5 km" or "500 m")
 */
export const formatDistance = (distanceKm: number): string => {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)} m`;
  }
  return `${distanceKm.toFixed(1)} km`;
};

/**
 * Decodes Google Maps encoded polyline string into an array of coordinates
 * 
 * @param encodedParams - Encoded string
 * @returns Array of {latitude, longitude} objects
 */
export const decodePolyline = (encoded: string): { latitude: number; longitude: number }[] => {
  const poly: { latitude: number; longitude: number }[] = [];
  let index = 0;
  const len = encoded.length;
  let lat = 0;
  let lng = 0;

  while (index < len) {
    let b;
    let shift = 0;
    let result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlat = (result & 1) !== 0 ? ~(result >> 1) : (result >> 1);
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlng = (result & 1) !== 0 ? ~(result >> 1) : (result >> 1);
    lng += dlng;

    const p = {
      latitude: lat / 1e5,
      longitude: lng / 1e5,
    };
    poly.push(p);
  }
  return poly;
};
