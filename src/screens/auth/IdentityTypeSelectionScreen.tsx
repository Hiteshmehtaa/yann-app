import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS, SHADOWS } from '../../utils/theme';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

type IdentityType = 'indian' | 'foreigner' | 'nri';

interface IdentityOption {
  type: IdentityType;
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

const identityOptions: IdentityOption[] = [
  {
    type: 'indian',
    title: 'Indian Citizen',
    subtitle: 'Verify with Aadhaar',
    icon: 'flag',
    color: COLORS.primary,
  },
  {
    type: 'foreigner',
    title: 'Foreign National',
    subtitle: 'Upload passport & visa',
    icon: 'airplane',
    color: '#FF6B6B',
  },
  {
    type: 'nri',
    title: 'NRI / OCI',
    subtitle: 'Upload relevant documents',
    icon: 'globe',
    color: '#4ECDC4',
  },
];

export const IdentityTypeSelectionScreen: React.FC<Props> = ({ navigation }) => {
  const [selectedType, setSelectedType] = useState<IdentityType | null>(null);

  const handleContinue = () => {
    if (!selectedType) {
      Alert.alert('Selection Required', 'Please select your identity type to continue');
      return;
    }

    if (selectedType === 'indian') {
      // Navigate to existing Aadhaar verification screen
      navigation.navigate('AadhaarVerification');
    } else {
      // Navigate to document upload screen for foreigners/NRI
      navigation.navigate('DocumentUpload', { identityType: selectedType });
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Verify Yourself</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        {/* Icon */}
        <View style={styles.iconContainer}>
          <View style={styles.iconCircle}>
            <Ionicons name="shield-checkmark" size={48} color={COLORS.primary} />
          </View>
        </View>

        {/* Title */}
        <Text style={styles.title}>Choose Your Identity Type</Text>
        <Text style={styles.subtitle}>
          Select the option that best describes your citizenship status
        </Text>

        {/* Options */}
        <View style={styles.optionsContainer}>
          {identityOptions.map((option) => (
            <TouchableOpacity
              key={option.type}
              style={[
                styles.optionCard,
                selectedType === option.type && styles.optionCardSelected,
              ]}
              onPress={() => setSelectedType(option.type)}
              activeOpacity={0.7}
            >
              <View style={[styles.optionIcon, { backgroundColor: `${option.color}15` }]}>
                <Ionicons name={option.icon} size={32} color={option.color} />
              </View>
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>{option.title}</Text>
                <Text style={styles.optionSubtitle}>{option.subtitle}</Text>
              </View>
              <View style={styles.radioButton}>
                {selectedType === option.type && (
                  <View style={[styles.radioButtonInner, { backgroundColor: option.color }]} />
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Continue Button */}
        <TouchableOpacity
          style={[styles.continueButton, !selectedType && styles.continueButtonDisabled]}
          onPress={handleContinue}
          disabled={!selectedType}
          activeOpacity={0.8}
        >
          <Text style={styles.continueButtonText}>Continue</Text>
          <Ionicons name="arrow-forward" size={20} color={COLORS.white} />
        </TouchableOpacity>

        {/* Info */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle-outline" size={20} color={COLORS.primary} />
          <Text style={styles.infoText}>
            Your information is secure and will only be used for verification purposes.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.gray100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.size.xl,
    fontWeight: TYPOGRAPHY.weight.bold,
    color: COLORS.text,
  },
  content: {
    flex: 1,
    padding: SPACING.xl,
  },
  iconContainer: {
    alignItems: 'center',
    marginTop: SPACING.xl,
    marginBottom: SPACING.lg,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: `${COLORS.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: TYPOGRAPHY.size.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.xxl,
    lineHeight: 22,
  },
  optionsContainer: {
    gap: SPACING.md,
    marginBottom: SPACING.xl,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.gray100,
    borderRadius: RADIUS.medium,
    padding: SPACING.lg,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: `${COLORS.primary}05`,
  },
  optionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: TYPOGRAPHY.size.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  optionSubtitle: {
    fontSize: TYPOGRAPHY.size.sm,
    color: COLORS.textSecondary,
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  continueButton: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.medium,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    ...SHADOWS.md,
  },
  continueButtonDisabled: {
    opacity: 0.5,
  },
  continueButtonText: {
    fontSize: TYPOGRAPHY.size.md,
    fontWeight: '600',
    color: COLORS.white,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: `${COLORS.primary}10`,
    borderRadius: RADIUS.medium,
    padding: SPACING.md,
    gap: SPACING.sm,
    marginTop: SPACING.xl,
  },
  infoText: {
    flex: 1,
    fontSize: TYPOGRAPHY.size.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
});
