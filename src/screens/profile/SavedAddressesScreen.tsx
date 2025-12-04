import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Animated,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { COLORS, SPACING, RADIUS, SHADOWS, TYPOGRAPHY, ANIMATIONS } from '../../utils/theme';

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

interface Address {
  id: string;
  label: string;
  address: string;
  isDefault: boolean;
}

export const SavedAddressesScreen: React.FC<Props> = ({ navigation }) => {
  const { user } = useAuth();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newAddress, setNewAddress] = useState({ label: '', address: '' });

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: ANIMATIONS.slow,
      useNativeDriver: true,
    }).start();

    loadAddresses();
  }, []);

  const loadAddresses = () => {
    // Load from user's addressBook or use defaults
    const userAddresses = user?.addressBook || [];
    if (userAddresses.length > 0) {
      setAddresses(userAddresses.map((addr: any, index: number) => ({
        id: addr.id || `addr-${index}`,
        label: addr.label || 'Home',
        address: addr.address || addr,
        isDefault: index === 0,
      })));
    } else {
      // Demo addresses
      setAddresses([
        { id: '1', label: 'Home', address: '123 Main Street, Apartment 4B, City, State 12345', isDefault: true },
        { id: '2', label: 'Office', address: '456 Business Park, Tower A, City, State 67890', isDefault: false },
      ]);
    }
    setIsLoading(false);
  };

  const handleAddAddress = () => {
    if (!newAddress.label.trim() || !newAddress.address.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    const newAddr: Address = {
      id: `addr-${Date.now()}`,
      label: newAddress.label,
      address: newAddress.address,
      isDefault: addresses.length === 0,
    };

    setAddresses(prev => [...prev, newAddr]);
    setNewAddress({ label: '', address: '' });
    setShowAddForm(false);
    Alert.alert('Success', 'Address added successfully');
  };

  const handleDeleteAddress = (id: string) => {
    Alert.alert(
      'Delete Address',
      'Are you sure you want to delete this address?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setAddresses(prev => prev.filter(addr => addr.id !== id));
          },
        },
      ]
    );
  };

  const handleSetDefault = (id: string) => {
    setAddresses(prev =>
      prev.map(addr => ({
        ...addr,
        isDefault: addr.id === id,
      }))
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
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
        <Text style={styles.headerTitle}>Saved Addresses</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => setShowAddForm(true)}>
          <Ionicons name="add" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <Animated.View style={{ opacity: fadeAnim }}>
          {/* Add New Form */}
          {showAddForm && (
            <View style={styles.addForm}>
              <Text style={styles.formTitle}>Add New Address</Text>
              <TextInput
                style={styles.input}
                value={newAddress.label}
                onChangeText={(value) => setNewAddress(prev => ({ ...prev, label: value }))}
                placeholder="Label (e.g., Home, Office)"
                placeholderTextColor={COLORS.textTertiary}
              />
              <TextInput
                style={[styles.input, styles.textArea]}
                value={newAddress.address}
                onChangeText={(value) => setNewAddress(prev => ({ ...prev, address: value }))}
                placeholder="Full address with landmark"
                placeholderTextColor={COLORS.textTertiary}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
              <View style={styles.formActions}>
                <TouchableOpacity 
                  style={styles.cancelButton} 
                  onPress={() => setShowAddForm(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.saveFormButton} 
                  onPress={handleAddAddress}
                >
                  <Text style={styles.saveFormButtonText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Address List */}
          {addresses.length > 0 ? (
            <View style={styles.addressList}>
              {addresses.map((addr, index) => (
                <View 
                  key={addr.id} 
                  style={[
                    styles.addressCard,
                    index === addresses.length - 1 && styles.addressCardLast
                  ]}
                >
                  <View style={styles.addressMain}>
                    <View style={styles.addressHeader}>
                      <View style={styles.labelContainer}>
                        <Ionicons 
                          name={addr.label === 'Home' ? 'home-outline' : 'business-outline'} 
                          size={18} 
                          color={COLORS.primary} 
                        />
                        <Text style={styles.addressLabel}>{addr.label}</Text>
                        {addr.isDefault && (
                          <View style={styles.defaultBadge}>
                            <Text style={styles.defaultText}>DEFAULT</Text>
                          </View>
                        )}
                      </View>
                    </View>
                    <Text style={styles.addressText}>{addr.address}</Text>
                  </View>
                  <View style={styles.addressActions}>
                    {!addr.isDefault && (
                      <TouchableOpacity 
                        style={styles.actionButton}
                        onPress={() => handleSetDefault(addr.id)}
                      >
                        <Text style={styles.setDefaultText}>Set Default</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity 
                      style={styles.deleteButton}
                      onPress={() => handleDeleteAddress(addr.id)}
                    >
                      <Ionicons name="trash-outline" size={18} color={COLORS.error} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
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
});
