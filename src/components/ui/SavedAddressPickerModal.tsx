import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY, SHADOWS } from '../../utils/theme';
import { RadioButton } from './RadioButton';
import { Button } from './Button';

interface Address {
  id: string;
  label: string;
  address: string;
  icon: keyof typeof Ionicons.glyphMap;
}

interface SavedAddressPickerProps {
  addresses?: Address[];
  onSelect: (address: Address) => void;
  onAddNew: () => void;
}

const DEFAULT_ADDRESSES: Address[] = [
  {
    id: '1',
    label: 'Home',
    address: '7401 Pacific Porson Blvd, Honolulu, Hawaii, 96824, USA',
    icon: 'home',
  },
  {
    id: '2',
    label: "Parents House",
    address: '7401 Pacific Porson Blvd, Honolulu, Hawaii, 96824, USA',
    icon: 'home-outline',
  },
  {
    id: '3',
    label: 'Farm House',
    address: '7401 Pacific Porson Blvd, Honolulu, Hawaii, 96824, USA',
    icon: 'business',
  },
];

export const SavedAddressPickerModal: React.FC<SavedAddressPickerProps> = ({
  addresses = DEFAULT_ADDRESSES,
  onSelect,
  onAddNew,
}) => {
  const [selectedId, setSelectedId] = useState<string>(addresses[0]?.id || '');

  const handleSelect = (address: Address) => {
    setSelectedId(address.id);
  };

  const handleContinue = () => {
    const selected = addresses.find((addr) => addr.id === selectedId);
    if (selected) {
      onSelect(selected);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Select Address</Text>
      </View>

      {/* Address List */}
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {addresses.map((address) => (
          <TouchableOpacity
            key={address.id}
            style={[
              styles.addressCard,
              selectedId === address.id && styles.addressCardSelected,
            ]}
            onPress={() => handleSelect(address)}
            activeOpacity={0.7}
          >
            {/* Icon */}
            <View style={styles.iconContainer}>
              <Ionicons
                name={address.icon}
                size={24}
                color={selectedId === address.id ? COLORS.primary : COLORS.textSecondary}
              />
            </View>

            {/* Address Details */}
            <View style={styles.addressContent}>
              <Text style={styles.addressLabel}>{address.label}</Text>
              <Text style={styles.addressText} numberOfLines={2}>
                {address.address}
              </Text>
            </View>

            {/* Radio Button */}
            <RadioButton selected={selectedId === address.id} />
          </TouchableOpacity>
        ))}

        {/* Add New Address Button */}
        <TouchableOpacity
          style={styles.addNewButton}
          onPress={onAddNew}
          activeOpacity={0.7}
        >
          <View style={styles.addNewIcon}>
            <Ionicons name="add" size={24} color={COLORS.primary} />
          </View>
          <Text style={styles.addNewText}>Add New Address</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Continue Button */}
      <View style={styles.footer}>
        <Button
          title="Continue"
          onPress={handleContinue}
          variant="primary"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.size.xl,
    fontWeight: TYPOGRAPHY.weight.bold,
    color: COLORS.text,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.lg,
  },
  addressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.medium,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 2,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  addressCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.medium,
    backgroundColor: COLORS.gray100,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  addressContent: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  addressLabel: {
    fontSize: TYPOGRAPHY.size.md,
    fontWeight: TYPOGRAPHY.weight.semibold,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  addressText: {
    fontSize: TYPOGRAPHY.size.sm,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  addNewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.medium,
    padding: SPACING.md,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
  },
  addNewIcon: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.medium,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  addNewText: {
    fontSize: TYPOGRAPHY.size.md,
    fontWeight: TYPOGRAPHY.weight.semibold,
    color: COLORS.primary,
  },
  footer: {
    padding: SPACING.lg,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
    ...SHADOWS.lg,
  },
});
