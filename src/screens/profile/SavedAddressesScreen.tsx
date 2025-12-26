import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Animated,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { useAuth } from '../../contexts/AuthContext';
import { MapLocationPickerModal } from '../../components/ui/MapLocationPickerModal';
import { apiService } from '../../services/api';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { Address } from '../../types';
import { COLORS, SPACING, RADIUS, SHADOWS, TYPOGRAPHY, ANIMATIONS } from '../../utils/theme';

type AddressLabel = 'Home' | 'Work' | 'Other';

type Props = {
  navigation: NativeStackNavigationProp<any>;
  route: RouteProp<{ params: { fromBooking?: boolean } }, 'params'>;
};

export const SavedAddressesScreen: React.FC<Props> = ({ navigation, route }) => {
  const { fromBooking } = route.params || {};
  const { user, updateUser } = useAuth();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newAddress, setNewAddress] = useState({
    label: 'Home' as AddressLabel,
    name: '',
    phone: '',
    apartment: '',
    building: '',
    street: '',
    city: '',
    state: '',
    postalCode: '',
  });
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [selectedCoordinates, setSelectedCoordinates] = useState<{ latitude: number; longitude: number } | null>(null);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: ANIMATIONS.slow,
      useNativeDriver: true,
    }).start();

    loadAddresses();
  }, []);

  // Reload addresses when screen focuses
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadAddresses();
    });
    return unsubscribe;
  }, [navigation, user]);

  const loadAddresses = async () => {
    try {
      // Fetch addresses from database API
      const response = await apiService.getSavedAddresses();
      
      if (response.success && response.data) {
        const fetchedAddresses = response.data.map((addr: any, index: number) => ({
          id: addr._id || addr.id || `addr-${index}`,
          _id: addr._id || addr.id,
          label: addr.label || 'Home',
          name: addr.name || '',
          phone: addr.phone || '',
          apartment: addr.apartment || '',
          building: addr.building || '',
          street: addr.street || '',
          city: addr.city || '',
          state: addr.state || '',
          postalCode: addr.postalCode || '',
          fullAddress: addr.fullAddress || `${addr.street}, ${addr.city}`,
          latitude: addr.latitude,
          longitude: addr.longitude,
          isPrimary: addr.isPrimary || index === 0,
        }));
        setAddresses(fetchedAddresses);
        
        // Also update local user context for offline access
        updateUser({ addressBook: fetchedAddresses });
      } else {
        // Fallback to local storage if API fails
        const userAddresses = user?.addressBook || [];
        setAddresses(userAddresses);
      }
    } catch (error) {
      console.error('Error loading addresses:', error);
      // Fallback to local storage on error
      const userAddresses = user?.addressBook || [];
      if (userAddresses.length > 0) {
        setAddresses(userAddresses.map((addr: any, index: number) => ({
          id: addr._id || addr.id || `addr-${index}`,
          _id: addr._id || addr.id,
          label: addr.label || 'Home',
          name: addr.name || '',
          phone: addr.phone || '',
          apartment: addr.apartment || '',
          building: addr.building || '',
          street: addr.street || '',
          city: addr.city || '',
          state: addr.state || '',
          postalCode: addr.postalCode || '',
          fullAddress: addr.fullAddress || `${addr.street}, ${addr.city}`,
          latitude: addr.latitude,
          longitude: addr.longitude,
          isPrimary: addr.isPrimary || index === 0,
        })));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleLocationSelect = (location: { 
    latitude: number; 
    longitude: number; 
    address: string;
    fullAddress: string;
    city: string;
    state: string;
    postalCode: string;
    district: string;
  }) => {
    setSelectedCoordinates({ latitude: location.latitude, longitude: location.longitude });
    // Use the correctly mapped fields from the location picker
    setNewAddress(prev => ({
      ...prev,
      street: location.district || location.address, // Use district as street
      city: location.city, // Correct city field
      state: location.state, // Correct state field
      postalCode: location.postalCode, // Correct postal code
    }));
    setShowMapPicker(false);
  };

  const handleAddAddress = async () => {
    if (!newAddress.name.trim() || !newAddress.phone.trim() || !newAddress.street.trim()) {
      Alert.alert('Error', 'Please fill in name, phone, and address details');
      return;
    }

    if (newAddress.phone.length !== 10) {
      Alert.alert('Error', 'Phone number must be 10 digits');
      return;
    }

    // Build full address string
    const addressParts = [
      newAddress.apartment,
      newAddress.building,
      newAddress.street,
      newAddress.city,
      newAddress.state,
      newAddress.postalCode,
    ].filter(Boolean);

    const addressPayload = {
      label: newAddress.label,
      name: newAddress.name,
      phone: newAddress.phone,
      apartment: newAddress.apartment,
      building: newAddress.building,
      street: newAddress.street,
      city: newAddress.city,
      state: newAddress.state,
      postalCode: newAddress.postalCode,
      fullAddress: addressParts.join(', '),
      latitude: selectedCoordinates?.latitude,
      longitude: selectedCoordinates?.longitude,
      isPrimary: addresses.length === 0,
    };

    try {
      // Save to backend database
      const response = await apiService.addAddress(addressPayload);
      
      if (response.success && response.data) {
        const savedAddress = response.data;
        const updatedAddresses = [...addresses, savedAddress];
        setAddresses(updatedAddresses);
        
        // Also update local user context
        updateUser({ addressBook: updatedAddresses });
        
        setNewAddress({
          label: 'Home' as AddressLabel,
          name: '',
          phone: '',
          apartment: '',
          building: '',
          street: '',
          city: '',
          state: '',
          postalCode: '',
        });
        setSelectedCoordinates(null);
        setShowAddForm(false);
        Alert.alert('Success', 'Address saved to database successfully');
      } else {
        Alert.alert('Error', response.message || 'Failed to save address');
      }
    } catch (error: any) {
      console.error('Error saving address:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to save address. Please try again.';
      Alert.alert('Error', errorMessage);
    }
  };

  const handleDeleteAddress = (id: string) => {
    const performDelete = async () => {
      try {
        const response = await apiService.deleteAddress(id);

        if (response.success) {
          const updatedAddresses = addresses.filter(addr => addr.id !== id && addr._id !== id);
          setAddresses(updatedAddresses);
          updateUser({ addressBook: updatedAddresses });
          Alert.alert('Success', 'Address deleted successfully');
        } else {
          Alert.alert('Error', response.message || 'Failed to delete address');
        }
      } catch (error: any) {
        console.error('Error deleting address:', error);
        const errorMessage = error?.response?.data?.message || error?.message || 'Failed to delete address. Please try again.';
        Alert.alert('Error', errorMessage);
      }
    };

    Alert.alert(
      'Delete Address',
      'Are you sure you want to delete this address?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => { void performDelete(); },
        },
      ]
    );
  };

  const handleSetDefault = (id: string) => {
    const updatedAddresses = addresses.map(addr => ({
      ...addr,
      isPrimary: addr.id === id,
    }));
    setAddresses(updatedAddresses);
    
    // Persist to user context
    updateUser({ addressBook: updatedAddresses });
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <LoadingSpinner visible={true} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{fromBooking ? 'Select Address' : 'Saved Addresses'}</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => setShowAddForm(true)}>
          <Ionicons name="add" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <Animated.View style={{ opacity: fadeAnim }}>
          {/* Info message when selecting for booking */}
          {fromBooking && addresses.length > 0 && (
            <View style={styles.selectionHint}>
              <Ionicons name="information-circle" size={20} color={COLORS.primary} />
              <Text style={styles.selectionHintText}>Tap an address to select it for booking</Text>
            </View>
          )}

          {/* Add New Form */}
          {showAddForm && (
            <View style={styles.addForm}>
              <Text style={styles.formTitle}>Add New Address</Text>
              
              {/* Contact Details Section */}
              <Text style={styles.sectionLabel}>Contact Details</Text>
              <TextInput
                style={styles.input}
                value={newAddress.name}
                onChangeText={(value) => setNewAddress(prev => ({ ...prev, name: value }))}
                placeholder="Contact Name *"
                placeholderTextColor={COLORS.textTertiary}
              />
              <TextInput
                style={styles.input}
                value={newAddress.phone}
                onChangeText={(value) => setNewAddress(prev => ({ ...prev, phone: value.replaceAll(/\D/g, '') }))}
                placeholder="Phone Number (10 digits) *"
                placeholderTextColor={COLORS.textTertiary}
                keyboardType="phone-pad"
                maxLength={10}
              />
              
              {/* Address Label */}
              <Text style={styles.sectionLabel}>Address Type</Text>
              <View style={styles.labelSelector}>
                {['Home', 'Work', 'Other'].map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.labelOption,
                      newAddress.label === type && styles.labelOptionActive,
                    ]}
                    onPress={() => setNewAddress(prev => ({ ...prev, label: type as 'Home' | 'Work' | 'Other' }))}
                  >
                    <Text style={[
                      styles.labelOptionText,
                      newAddress.label === type && styles.labelOptionTextActive,
                    ]}>
                      {type}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              
              {/* Location Section */}
              <Text style={styles.sectionLabel}>Location</Text>
              <TouchableOpacity 
                style={styles.mapPickerButton}
                onPress={() => setShowMapPicker(true)}
              >
                <Ionicons name="location" size={20} color={COLORS.primary} />
                <Text style={styles.mapPickerButtonText}>Pick Location on Map (Optional)</Text>
              </TouchableOpacity>

              {/* Show coordinates if selected */}
              {selectedCoordinates && (
                <View style={styles.coordinatesDisplay}>
                  <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
                  <Text style={styles.coordinatesText}>
                    GPS: {selectedCoordinates.latitude.toFixed(6)}, {selectedCoordinates.longitude.toFixed(6)}
                  </Text>
                </View>
              )}
              
              {/* Address Details Section */}
              <Text style={styles.sectionLabel}>Address Details</Text>
              <TextInput
                style={styles.input}
                value={newAddress.apartment}
                onChangeText={(value) => setNewAddress(prev => ({ ...prev, apartment: value }))}
                placeholder="Apartment / Flat / Unit Number"
                placeholderTextColor={COLORS.textTertiary}
              />
              <TextInput
                style={styles.input}
                value={newAddress.building}
                onChangeText={(value) => setNewAddress(prev => ({ ...prev, building: value }))}
                placeholder="Building / Society Name"
                placeholderTextColor={COLORS.textTertiary}
              />
              <TextInput
                style={styles.input}
                value={newAddress.street}
                onChangeText={(value) => setNewAddress(prev => ({ ...prev, street: value }))}
                placeholder="Street Address *"
                placeholderTextColor={COLORS.textTertiary}
              />
              <View style={styles.rowInputs}>
                <TextInput
                  style={[styles.input, styles.halfInput]}
                  value={newAddress.city}
                  onChangeText={(value) => setNewAddress(prev => ({ ...prev, city: value }))}
                  placeholder="City"
                  placeholderTextColor={COLORS.textTertiary}
                />
                <TextInput
                  style={[styles.input, styles.halfInput]}
                  value={newAddress.state}
                  onChangeText={(value) => setNewAddress(prev => ({ ...prev, state: value }))}
                  placeholder="State"
                  placeholderTextColor={COLORS.textTertiary}
                />
              </View>
              <TextInput
                style={styles.input}
                value={newAddress.postalCode}
                onChangeText={(value) => setNewAddress(prev => ({ ...prev, postalCode: value.replaceAll(/\D/g, '') }))}
                placeholder="Postal Code"
                placeholderTextColor={COLORS.textTertiary}
                keyboardType="number-pad"
                maxLength={6}
              />
              
              <View style={styles.formActions}>
                <TouchableOpacity 
                  style={styles.cancelButton} 
                  onPress={() => {
                    setShowAddForm(false);
                    setSelectedCoordinates(null);
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.saveFormButton} 
                  onPress={handleAddAddress}
                >
                  <Text style={styles.saveFormButtonText}>Save Address</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Address List */}
          {addresses.length > 0 ? (
            <View style={styles.addressList}>
              {addresses.map((addr, index) => {
                let iconName: 'home-outline' | 'business-outline' | 'location-outline' = 'location-outline';

                if (addr.label === 'Home') {
                  iconName = 'home-outline';
                } else if (addr.label === 'Work') {
                  iconName = 'business-outline';
                }

                return (
                <TouchableOpacity
                  key={addr.id}
                  style={[
                    styles.addressCard,
                    index === addresses.length - 1 && styles.addressCardLast
                  ]}
                  onPress={() => {
                    if (fromBooking) {
                      // Set params on the previous screen before going back
                      const routes = navigation.getState().routes;
                      const currentIndex = navigation.getState().index;
                      
                      if (currentIndex > 0) {
                        const previousRoute = routes[currentIndex - 1];
                        // Set params on the previous screen before going back
                        navigation.navigate({
                          name: previousRoute.name,
                          params: { 
                            ...previousRoute.params,
                            selectedAddress: addr 
                          },
                          merge: true,
                        } as any);
                      } else {
                        // Fallback: just go back with the address
                        navigation.goBack();
                      }
                    }
                  }}
                  disabled={!fromBooking}
                  activeOpacity={fromBooking ? 0.7 : 1}
                >
                  <View style={styles.addressMain}>
                    <View style={styles.addressHeader}>
                      <View style={styles.labelContainer}>
                        <Ionicons 
                          name={iconName}
                          size={18} 
                          color={COLORS.primary} 
                        />
                        <Text style={styles.addressLabel}>{addr.label}</Text>
                        {addr.isPrimary && (
                          <View style={styles.defaultBadge}>
                            <Text style={styles.defaultText}>PRIMARY</Text>
                          </View>
                        )}
                      </View>
                    </View>
                    <Text style={styles.addressName}>{addr.name}</Text>
                    <Text style={styles.addressPhone}>📞 {addr.phone}</Text>
                    <Text style={styles.addressText}>{addr.fullAddress}</Text>
                  </View>
                  <View style={styles.addressActions}>
                    {!addr.isPrimary && (
                      <TouchableOpacity 
                        style={styles.actionButton}
                        onPress={() => handleSetDefault(addr.id || '')}
                      >
                        <Text style={styles.setDefaultText}>Set Primary</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity 
                      style={styles.deleteButton}
                      onPress={() => handleDeleteAddress(addr.id || addr._id || '')}
                    >
                      <Ionicons name="trash-outline" size={18} color={COLORS.error} />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="location-outline" size={48} color={COLORS.textTertiary} />
              <Text style={styles.emptyTitle}>No addresses saved</Text>
              <Text style={styles.emptySubtitle}>Add an address to make booking easier</Text>
              <TouchableOpacity 
                style={styles.addFirstButton}
                onPress={() => setShowAddForm(true)}
              >
                <Ionicons name="add" size={20} color={COLORS.white} />
                <Text style={styles.addFirstButtonText}>Add Address</Text>
              </TouchableOpacity>
            </View>
          )}
        </Animated.View>
      </ScrollView>

      {/* Map Picker Modal */}
      <MapLocationPickerModal
        visible={showMapPicker}
        onClose={() => setShowMapPicker(false)}
        onLocationSelect={handleLocationSelect}
        initialLocation={selectedCoordinates || undefined}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.cardBg,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.size.lg,
    fontWeight: '700',
    color: COLORS.text,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.full,
    backgroundColor: `${COLORS.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: SPACING.lg,
    paddingBottom: 100,
  },
  addForm: {
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.large,
    padding: SPACING.lg,
    marginBottom: SPACING.xl,
    ...SHADOWS.sm,
  },
  formTitle: {
    fontSize: TYPOGRAPHY.size.md,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  input: {
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.medium,
    padding: SPACING.md,
    fontSize: TYPOGRAPHY.size.md,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
  },
  textArea: {
    height: 80,
  },
  formActions: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.medium,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cancelButtonText: {
    fontSize: TYPOGRAPHY.size.md,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  saveFormButton: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.medium,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
  },
  saveFormButtonText: {
    fontSize: TYPOGRAPHY.size.md,
    fontWeight: '600',
    color: COLORS.white,
  },
  addressList: {
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.large,
    ...SHADOWS.sm,
  },
  addressCard: {
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  addressCardLast: {
    borderBottomWidth: 0,
  },
  addressMain: {
    marginBottom: SPACING.sm,
  },
  addressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  addressLabel: {
    fontSize: TYPOGRAPHY.size.md,
    fontWeight: '700',
    color: COLORS.text,
  },
  defaultBadge: {
    backgroundColor: `${COLORS.success}15`,
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: 4,
  },
  defaultText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.success,
    letterSpacing: 0.5,
  },
  addressText: {
    fontSize: TYPOGRAPHY.size.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  addressActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: SPACING.md,
  },
  actionButton: {
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
  },
  setDefaultText: {
    fontSize: TYPOGRAPHY.size.sm,
    fontWeight: '600',
    color: COLORS.primary,
  },
  deleteButton: {
    padding: SPACING.xs,
  },
  emptyState: {
    alignItems: 'center',
    padding: SPACING.xxl,
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.large,
    ...SHADOWS.sm,
  },
  emptyTitle: {
    fontSize: TYPOGRAPHY.size.lg,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: SPACING.md,
  },
  emptySubtitle: {
    fontSize: TYPOGRAPHY.size.sm,
    color: COLORS.textTertiary,
    textAlign: 'center',
    marginTop: SPACING.xs,
  },
  addFirstButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.medium,
    marginTop: SPACING.lg,
  },
  addFirstButtonText: {
    fontSize: TYPOGRAPHY.size.md,
    fontWeight: '600',
    color: COLORS.white,
  },
  mapPickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    backgroundColor: `${COLORS.primary}15`,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.medium,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: `${COLORS.primary}30`,
  },
  mapPickerButtonText: {
    fontSize: TYPOGRAPHY.size.sm,
    fontWeight: '600',
    color: COLORS.primary,
  },
  coordinatesDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: `${COLORS.success}10`,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    borderRadius: RADIUS.medium,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: `${COLORS.success}30`,
  },
  coordinatesText: {
    fontSize: TYPOGRAPHY.size.xs,
    color: COLORS.success,
    fontWeight: '500',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: TYPOGRAPHY.size.lg,
    fontWeight: '700',
    color: COLORS.text,
  },
  sectionLabel: {
    fontSize: TYPOGRAPHY.size.sm,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
    marginTop: SPACING.md,
  },
  labelSelector: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  labelOption: {
    flex: 1,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.medium,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
    alignItems: 'center',
  },
  labelOptionActive: {
    backgroundColor: `${COLORS.primary}15`,
    borderColor: COLORS.primary,
  },
  labelOptionText: {
    fontSize: TYPOGRAPHY.size.sm,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  labelOptionTextActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  rowInputs: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  halfInput: {
    flex: 1,
  },
  addressName: {
    fontSize: TYPOGRAPHY.size.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xxs,
  },
  addressPhone: {
    fontSize: TYPOGRAPHY.size.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  selectionHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: `${COLORS.primary}10`,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.medium,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: `${COLORS.primary}30`,
  },
  selectionHintText: {
    flex: 1,
    fontSize: TYPOGRAPHY.size.sm,
    fontWeight: '500',
    color: COLORS.primary,
  },
});
