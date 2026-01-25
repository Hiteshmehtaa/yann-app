import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  Alert,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS, SHADOWS } from '../../utils/theme';
import { useResponsive } from '../../hooks/useResponsive';

interface MapLocationPickerProps {
  visible: boolean;
  onClose: () => void;
  onSelectLocation: (location: {
    latitude: number;
    longitude: number;
    address?: string;
  }) => void;
  initialLocation?: {
    latitude: number;
    longitude: number;
  };
}

export const MapLocationPicker: React.FC<MapLocationPickerProps> = ({
  visible,
  onClose,
  onSelectLocation,
  initialLocation,
}) => {
  const { width, height } = useResponsive();
  const [latitude, setLatitude] = useState(initialLocation?.latitude?.toString() || '28.6139');
  const [longitude, setLongitude] = useState(initialLocation?.longitude?.toString() || '77.209');

  const slideAnim = useRef(new Animated.Value(height)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          damping: 20,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          damping: 15,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: height,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.9,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleConfirm = () => {
    const lat = Number.parseFloat(latitude);
    const lng = Number.parseFloat(longitude);

    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      Alert.alert('Invalid Coordinates', 'Please enter valid latitude and longitude');
      return;
    }

    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      Alert.alert('Invalid Range', 'Latitude must be between -90 and 90, Longitude between -180 and 180');
      return;
    }

    onSelectLocation({ latitude: lat, longitude: lng });
    onClose();
  };

  const handleCurrentLocation = () => {
    // Default Delhi location
    setLatitude('28.6139');
    setLongitude('77.209');
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Animated.View style={[styles.overlay, { opacity: opacityAnim }]}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onClose}
        />
      </Animated.View>

      <Animated.View
        style={[
          styles.container,
          {
            transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
          },
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color={COLORS.text} />
            </TouchableOpacity>
            <View>
              <Text style={styles.headerTitle}>Select Location</Text>
              <Text style={styles.headerSubtitle}>Enter GPS coordinates</Text>
            </View>
          </View>
        </View>

        {/* Coordinate Input Form */}
        <View style={styles.formContainer}>
          <View style={styles.infoCard}>
            <Ionicons name="information-circle" size={24} color={COLORS.info} />
            <Text style={styles.infoText}>
              Enter coordinates or use current location button below
            </Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Latitude</Text>
            <TextInput
              style={styles.input}
              value={latitude}
              onChangeText={setLatitude}
              placeholder="28.6139"
              keyboardType="numeric"
              placeholderTextColor={COLORS.textTertiary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Longitude</Text>
            <TextInput
              style={styles.input}
              value={longitude}
              onChangeText={setLongitude}
              placeholder="77.209"
              keyboardType="numeric"
              placeholderTextColor={COLORS.textTertiary}
            />
          </View>

          {/* Current Location Button */}
          <TouchableOpacity
            style={styles.currentLocationButton}
            onPress={handleCurrentLocation}
          >
            <Ionicons name="locate" size={20} color={COLORS.primary} />
            <Text style={styles.currentLocationText}>Use Current Location (Delhi)</Text>
          </TouchableOpacity>

          {/* Preview */}
          {latitude && longitude && !Number.isNaN(Number.parseFloat(latitude)) && !Number.isNaN(Number.parseFloat(longitude)) && (
            <View style={styles.previewCard}>
              <Ionicons name="map" size={20} color={COLORS.success} />
              <View style={styles.previewTextContainer}>
                <Text style={styles.previewLabel}>Selected Coordinates</Text>
                <Text style={styles.previewCoords}>
                  {Number.parseFloat(latitude).toFixed(6)}, {Number.parseFloat(longitude).toFixed(6)}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Bottom Action */}
        <View style={styles.bottomContainer}>
          <TouchableOpacity
            style={styles.confirmButton}
            onPress={handleConfirm}
            activeOpacity={0.8}
          >
            <Text style={styles.confirmButtonText}>Confirm Location</Text>
            <Ionicons name="checkmark-circle" size={24} color={COLORS.white} />
          </TouchableOpacity>
        </View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '85%',
    backgroundColor: COLORS.background,
    borderTopLeftRadius: RADIUS.xlarge,
    borderTopRightRadius: RADIUS.xlarge,
    overflow: 'hidden',
    ...SHADOWS.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
    paddingTop: SPACING.xl,
    backgroundColor: COLORS.cardBg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.elevated,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.size.lg,
    fontWeight: '700',
    color: COLORS.text,
  },
  headerSubtitle: {
    fontSize: TYPOGRAPHY.size.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  formContainer: {
    flex: 1,
    padding: SPACING.lg,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${COLORS.info}10`,
    padding: SPACING.md,
    borderRadius: RADIUS.medium,
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  infoText: {
    flex: 1,
    fontSize: TYPOGRAPHY.size.sm,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  inputGroup: {
    marginBottom: SPACING.lg,
  },
  inputLabel: {
    fontSize: TYPOGRAPHY.size.sm,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  input: {
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.medium,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    fontSize: TYPOGRAPHY.size.md,
    color: COLORS.text,
    fontWeight: '500',
  },
  currentLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${COLORS.primary}10`,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.medium,
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  currentLocationText: {
    fontSize: TYPOGRAPHY.size.md,
    fontWeight: '600',
    color: COLORS.primary,
  },
  previewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${COLORS.success}10`,
    padding: SPACING.md,
    borderRadius: RADIUS.medium,
    gap: SPACING.sm,
  },
  previewTextContainer: {
    flex: 1,
  },
  previewLabel: {
    fontSize: TYPOGRAPHY.size.xs,
    fontWeight: '600',
    color: COLORS.success,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  previewCoords: {
    fontSize: TYPOGRAPHY.size.sm,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  bottomContainer: {
    padding: SPACING.lg,
    backgroundColor: COLORS.cardBg,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
  },
  confirmButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.medium,
    gap: SPACING.sm,
    ...SHADOWS.md,
  },
  confirmButtonText: {
    fontSize: TYPOGRAPHY.size.md,
    fontWeight: '700',
    color: COLORS.white,
  },
});
