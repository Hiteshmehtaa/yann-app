import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS, SHADOWS } from '../../utils/theme';
import { CustomDialog } from '../../components/CustomDialog';
import { AnimatedButton } from '../../components/AnimatedButton';
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
  const [alertVisible, setAlertVisible] = useState(false);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleContinue = () => {
    if (!selectedType) {
      setAlertVisible(true);
      return;
    }

    if (selectedType === 'indian') {
      navigation.navigate('AadhaarVerification');
    } else {
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
        <Text style={styles.headerTitle}>Verify Identity</Text>
        <View style={{ width: 40 }} />
      </View>

      <Animated.View 
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}
      >
        {/* Icon */}
        <View style={styles.iconContainer}>
          <LinearGradient
            colors={[`${COLORS.primary}20`, `${COLORS.primary}05`]}
            style={styles.iconCircle}
          >
            <View style={styles.iconInner}>
              <Ionicons name="shield-checkmark" size={42} color={COLORS.primary} />
            </View>
          </LinearGradient>
        </View>

        {/* Title */}
        <Text style={styles.title}>Choose Identity Type</Text>
        <Text style={styles.subtitle}>
          Select the option that best describes your citizenship status to proceed.
        </Text>

        {/* Options */}
        <View style={styles.optionsContainer}>
          {identityOptions.map((option, index) => {
            const isSelected = selectedType === option.type;
            return (
              <AnimatedButton
                key={option.type}
                style={[
                  styles.optionCard,
                  isSelected && styles.optionCardSelected,
                ]}
                onPress={() => setSelectedType(option.type)}
              >
                <View style={[styles.optionIcon, { backgroundColor: isSelected ? option.color : `${option.color}15` }]}>
                  <Ionicons name={option.icon} size={28} color={isSelected ? COLORS.white : option.color} />
                </View>
                <View style={styles.optionContent}>
                  <Text style={[styles.optionTitle, isSelected && { color: COLORS.primary }]}>{option.title}</Text>
                  <Text style={styles.optionSubtitle}>{option.subtitle}</Text>
                </View>
                <View style={[styles.radioButton, isSelected && { borderColor: option.color }]}>
                  {isSelected && (
                    <View style={[styles.radioButtonInner, { backgroundColor: option.color }]} />
                  )}
                </View>
              </AnimatedButton>
            );
          })}
        </View>

        <View style={{ flex: 1 }} />

        {/* Info */}
        <View style={styles.infoCard}>
          <Ionicons name="lock-closed" size={18} color={COLORS.primary} />
          <Text style={styles.infoText}>
            Your information is end-to-end encrypted and used only for verification.
          </Text>
        </View>

        {/* Continue Button */}
        <AnimatedButton
          style={[styles.continueButton, !selectedType && styles.continueButtonDisabled]}
          onPress={handleContinue}
          disabled={!selectedType}
        >
          <Text style={styles.continueButtonText}>Continue securely</Text>
          <Ionicons name="arrow-forward" size={20} color={COLORS.white} />
        </AnimatedButton>
      </Animated.View>

      <CustomDialog
        visible={alertVisible}
        type="warning"
        title="Selection Required"
        message="Please select an identity type to continue with the verification process."
        onClose={() => setAlertVisible(false)}
        actions={[{ text: 'Got it', style: 'default' }]}
      />
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
    borderBottomColor: '#F1F5F9',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  content: {
    flex: 1,
    padding: SPACING.xl,
  },
  iconContainer: {
    alignItems: 'center',
    marginTop: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.md,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.15,
  },
  iconInner: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: SPACING.sm,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: SPACING.xxl,
    lineHeight: 22,
    paddingHorizontal: SPACING.md,
  },
  optionsContainer: {
    gap: SPACING.md,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xlarge,
    padding: SPACING.lg,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    ...SHADOWS.sm,
    shadowOpacity: 0.04,
  },
  optionCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: '#F0F9FF',
    ...SHADOWS.md,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.1,
  },
  optionIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  optionSubtitle: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    marginLeft: SPACING.sm,
  },
  radioButtonInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  continueButton: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.xlarge,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    ...SHADOWS.lg,
    shadowColor: COLORS.primary,
    marginTop: SPACING.xl,
  },
  continueButtonDisabled: {
    backgroundColor: '#94A3B8',
    shadowOpacity: 0,
    elevation: 0,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: RADIUS.large,
    padding: SPACING.md,
    gap: SPACING.sm,
    alignItems: 'center',
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: '#64748B',
    lineHeight: 18,
    fontWeight: '500',
  },
});
