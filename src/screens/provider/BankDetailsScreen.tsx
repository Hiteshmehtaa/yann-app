import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Animated,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { COLORS, SPACING, RADIUS, SHADOWS, TYPOGRAPHY } from '../../utils/theme';
import { apiService } from '../../services/api';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

export const BankDetailsScreen: React.FC<Props> = ({ navigation }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasBankDetails, setHasBankDetails] = useState(false);

  const [formData, setFormData] = useState({
    accountNumber: '',
    confirmAccountNumber: '',
    ifscCode: '',
    bankName: '',
  });

  const [existingDetails, setExistingDetails] = useState({
    accountNumber: '',
    ifscCode: '',
    bankName: '',
    verified: false,
  });

  useEffect(() => {
    loadBankDetails();
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  const loadBankDetails = async () => {
    try {
      const response = await apiService.getBankDetails();
      if (response.success && response.data) {
        setHasBankDetails(response.data.hasBankDetails);
        if (response.data.hasBankDetails) {
          setExistingDetails({
            accountNumber: response.data.accountNumber || '',
            ifscCode: response.data.ifscCode || '',
            bankName: response.data.bankName || '',
            verified: response.data.verified || false,
          });
        }
      }
    } catch (error) {
      console.error('Failed to load bank details:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.accountNumber.trim() || !formData.confirmAccountNumber.trim() || !formData.ifscCode.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (formData.accountNumber !== formData.confirmAccountNumber) {
      Alert.alert('Error', 'Account numbers do not match');
      return;
    }

    if (!/^\d{9,18}$/.test(formData.accountNumber)) {
      Alert.alert('Error', 'Account number must be 9-18 digits');
      return;
    }

    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/i.test(formData.ifscCode)) {
      Alert.alert('Error', 'Invalid IFSC code format (e.g., SBIN0001234)');
      return;
    }

    setIsSaving(true);
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const response = await apiService.updateBankDetails({
        accountNumber: formData.accountNumber,
        ifscCode: formData.ifscCode.toUpperCase(),
        bankName: formData.bankName || 'Not Specified',
      });

      if (response.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert(
          'Success',
          'Bank details updated successfully. You can now withdraw your earnings.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      }
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', error.message || 'Failed to update bank details');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
        <LoadingSpinner visible />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.backgroundContainer}>
        {/* Primary Gradient Background */}
        <LinearGradient
          colors={[COLORS.primary, '#2563EB']} // Standard Blue Gradient
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        {/* Decorative Blobs */}
        <View style={styles.blobContainer} pointerEvents="none">
          <View style={styles.blobTopRight} />
          <View style={styles.blobBottomLeft} />
        </View>
      </View>

      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Bank Details</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <Animated.View style={{ opacity: fadeAnim }}>
            {/* Existing Details Card (if any) */}
            {hasBankDetails && (
              <View style={styles.existingCard}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                  <Ionicons name="checkmark-circle" size={20} color="#059669" />
                  <Text style={{ fontSize: 14, fontWeight: '600', color: '#065F46', marginLeft: 8 }}>
                    Current Bank Account
                  </Text>
                  {existingDetails.verified && (
                    <View style={{ marginLeft: 'auto', flexDirection: 'row', alignItems: 'center' }}>
                      <Ionicons name="shield-checkmark" size={16} color="#059669" />
                      <Text style={{ fontSize: 12, color: '#059669', marginLeft: 4 }}>Verified</Text>
                    </View>
                  )}
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Account Number</Text>
                  <Text style={styles.detailValue}>{existingDetails.accountNumber}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>IFSC Code</Text>
                  <Text style={styles.detailValue}>{existingDetails.ifscCode}</Text>
                </View>
                {existingDetails.bankName && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Bank Name</Text>
                    <Text style={styles.detailValue}>{existingDetails.bankName}</Text>
                  </View>
                )}
              </View>
            )}

            {/* Info Card */}
            <View style={styles.infoCard}>
              <Ionicons name="information-circle-outline" size={20} color="#3B82F6" />
              <Text style={styles.infoText}>
                {hasBankDetails
                  ? 'Update your bank account details below. Changes will be reviewed by our team.'
                  : 'Add your bank account details to start withdrawing your earnings.'}
              </Text>
            </View>

            {/* Form Card */}
            <View style={styles.formCard}>
              <Text style={styles.formTitle}>
                {hasBankDetails ? 'Update' : 'Add'} Bank Account
              </Text>

              {/* Account Number */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Account Number *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.accountNumber}
                  onChangeText={(value) => setFormData(prev => ({ ...prev, accountNumber: value.replace(/\D/g, '') }))}
                  placeholder="Enter account number"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="number-pad"
                  maxLength={18}
                />
              </View>

              {/* Confirm Account Number */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Confirm Account Number *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.confirmAccountNumber}
                  onChangeText={(value) => setFormData(prev => ({ ...prev, confirmAccountNumber: value.replace(/\D/g, '') }))}
                  placeholder="Re-enter account number"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="number-pad"
                  maxLength={18}
                />
              </View>

              {/* IFSC Code */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>IFSC Code *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.ifscCode}
                  onChangeText={(value) => setFormData(prev => ({ ...prev, ifscCode: value.toUpperCase() }))}
                  placeholder="e.g., SBIN0001234"
                  placeholderTextColor="#9CA3AF"
                  autoCapitalize="characters"
                  maxLength={11}
                />
                <Text style={styles.inputHint}>11 characters (e.g., SBIN0001234)</Text>
              </View>

              {/* Bank Name */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Bank Name (Optional)</Text>
                <TextInput
                  style={styles.input}
                  value={formData.bankName}
                  onChangeText={(value) => setFormData(prev => ({ ...prev, bankName: value }))}
                  placeholder="e.g., State Bank of India"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              {/* Save Button */}
              <TouchableOpacity
                style={[styles.saveButton, isSaving && { opacity: 0.6 }]}
                onPress={handleSave}
                disabled={isSaving}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={[COLORS.primary, '#2563EB']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.saveButtonGradient}
                >
                  <Ionicons name={isSaving ? "hourglass-outline" : "checkmark-circle-outline"} size={20} color="#FFF" />
                  <Text style={styles.saveButtonText}>
                    {isSaving ? 'Saving...' : hasBankDetails ? 'Update Details' : 'Save Details'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {/* Security Note */}
            <View style={styles.securityCard}>
              <Ionicons name="shield-checkmark-outline" size={18} color="#6B7280" />
              <Text style={styles.securityText}>
                Your bank details are encrypted and secure. We never share your information with third parties.
              </Text>
            </View>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>

      <LoadingSpinner visible={isSaving} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: 40,
  },
  existingCard: {
    backgroundColor: '#ECFDF5',
    borderRadius: RADIUS.medium,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#D1FAE5',
  },
  detailLabel: {
    fontSize: 13,
    color: '#047857',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: '#065F46',
    fontWeight: '600',
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#EFF6FF',
    borderRadius: RADIUS.medium,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#1E40AF',
    marginLeft: 10,
    lineHeight: 18,
  },
  formCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.large,
    padding: SPACING.lg,
    ...SHADOWS.md,
    marginBottom: SPACING.lg,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.lg,
  },
  inputGroup: {
    marginBottom: SPACING.lg,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  input: {
    backgroundColor: COLORS.gray50,
    borderRadius: RADIUS.medium,
    padding: SPACING.md,
    fontSize: 15,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.gray200,
  },
  inputHint: {
    fontSize: 12,
    color: COLORS.textTertiary,
    marginTop: 4,
  },
  saveButton: {
    marginTop: SPACING.md,
    borderRadius: RADIUS.medium,
    overflow: 'hidden',
    ...SHADOWS.sm,
  },
  saveButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
    backgroundColor: COLORS.primary, // Fallback
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
  securityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.gray100,
    borderRadius: RADIUS.medium,
    padding: SPACING.md,
    gap: 10,
  },
  securityText: {
    flex: 1,
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 16,
  },
  backgroundContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  blobContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  blobTopRight: {
    position: 'absolute',
    top: -100,
    right: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  blobBottomLeft: {
    position: 'absolute',
    bottom: -50,
    left: -50,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
});
