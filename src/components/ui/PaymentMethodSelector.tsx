import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY, SHADOWS } from '../../utils/theme';
import { RadioButton } from './RadioButton';
import { Button } from './Button';

interface PaymentMethod {
  id: string;
  type: 'cash' | 'card' | 'upi' | 'wallet';
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  details?: string;
}

interface PaymentMethodSelectorProps {
  onSelect: (method: PaymentMethod) => void;
  onAddCard?: () => void;
}

const PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: '1',
    type: 'cash',
    label: 'Cash',
    icon: 'cash',
  },
];

const MORE_OPTIONS: PaymentMethod[] = [
  {
    id: '2',
    type: 'upi',
    label: 'PayPal',
    icon: 'logo-paypal',
  },
  {
    id: '3',
    type: 'wallet',
    label: 'Google Pay',
    icon: 'logo-google',
  },
  {
    id: '4',
    type: 'card',
    label: 'Apple Pay',
    icon: 'logo-apple',
  },
];

export const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({
  onSelect,
  onAddCard,
}) => {
  const [selectedId, setSelectedId] = useState<string>('1');

  const handleSelect = (method: PaymentMethod) => {
    setSelectedId(method.id);
  };

  const handleContinue = () => {
    const allMethods = [...PAYMENT_METHODS, ...MORE_OPTIONS];
    const selected = allMethods.find((method) => method.id === selectedId);
    if (selected) {
      onSelect(selected);
    }
  };

  const renderMethodCard = (method: PaymentMethod, isSelected: boolean) => (
    <TouchableOpacity
      key={method.id}
      style={[
        styles.methodCard,
        isSelected && styles.methodCardSelected,
      ]}
      onPress={() => handleSelect(method)}
      activeOpacity={0.7}
    >
      {/* Icon */}
      <View style={[
        styles.methodIcon,
        isSelected && styles.methodIconSelected,
      ]}>
        <Ionicons
          name={method.icon}
          size={28}
          color={isSelected ? COLORS.primary : COLORS.textSecondary}
        />
      </View>

      {/* Label and Details */}
      <View style={styles.methodContent}>
        <Text style={styles.methodLabel}>{method.label}</Text>
        {method.details && (
          <Text style={styles.methodDetails}>{method.details}</Text>
        )}
      </View>

      {/* Radio Button */}
      <RadioButton selected={isSelected} />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Select Payment Methods</Text>
      </View>

      {/* Payment Methods List */}
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Cash Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cash</Text>
          {PAYMENT_METHODS.map((method) =>
            renderMethodCard(method, selectedId === method.id)
          )}
        </View>

        {/* More Payment Options */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>More Payment Options</Text>
          {MORE_OPTIONS.map((method) =>
            renderMethodCard(method, selectedId === method.id)
          )}

          {/* Add New Card Button */}
          {onAddCard && (
            <TouchableOpacity
              style={styles.addCardButton}
              onPress={onAddCard}
              activeOpacity={0.7}
            >
              <View style={styles.addCardIcon}>
                <Ionicons name="add" size={24} color={COLORS.primary} />
              </View>
              <Text style={styles.addCardText}>Add New Card</Text>
            </TouchableOpacity>
          )}
        </View>
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
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.size.md,
    fontWeight: TYPOGRAPHY.weight.bold,
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  methodCard: {
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
  methodCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  methodIcon: {
    width: 56,
    height: 56,
    borderRadius: RADIUS.medium,
    backgroundColor: COLORS.gray100,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  methodIconSelected: {
    backgroundColor: COLORS.white,
  },
  methodContent: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  methodLabel: {
    fontSize: TYPOGRAPHY.size.md,
    fontWeight: TYPOGRAPHY.weight.semibold,
    color: COLORS.text,
  },
  methodDetails: {
    fontSize: TYPOGRAPHY.size.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  addCardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.medium,
    padding: SPACING.md,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
  },
  addCardIcon: {
    width: 56,
    height: 56,
    borderRadius: RADIUS.medium,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  addCardText: {
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
