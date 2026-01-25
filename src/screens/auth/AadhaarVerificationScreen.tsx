import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as WebBrowser from 'expo-web-browser';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS, SHADOWS } from '../../utils/theme';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Linking from 'expo-linking';

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

export const AadhaarVerificationScreen: React.FC<Props> = ({ navigation }) => {
  const { user, updateUser } = useAuth();
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleVerify = async () => {
    // Validate Aadhaar number
    if (!/^\d{12}$/.test(aadhaarNumber)) {
      Alert.alert('Invalid Aadhaar', 'Please enter a valid 12-digit Aadhaar number');
      return;
    }

    setIsLoading(true);

    try {
      const redirectUrl = Linking.createURL('verification-success');
      const response = await apiService.initiateAadhaarVerification({
        userId: (user?._id || user?.id) as string,
        userType: user?.role === 'provider' ? 'provider' : 'homeowner',
        aadhaarNumber,
        redirectUrl,
      });

      if (response.success && response.data?.verificationUrl) {
        try {
          const result = await WebBrowser.openAuthSessionAsync(response.data.verificationUrl, redirectUrl, {
            presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
            controlsColor: COLORS.primary,
          });

          if (result.type === 'success') {
            const role = user?.role === 'provider' ? 'provider' : 'homeowner';
            const profileResponse = await apiService.getProfile(role);
            if (profileResponse.user) {
              updateUser(profileResponse.user);
            }
            Alert.alert(
              'Verified',
              role === 'provider'
                ? 'Verification completed. Your profile is now under admin review.'
                : 'Verification completed. You can now book services!',
              [{ text: 'OK', onPress: () => navigation.goBack() }]
            );
          }
        } catch (authError) {
          await WebBrowser.openBrowserAsync(response.data.verificationUrl, {
            presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
            controlsColor: COLORS.primary,
          });
        }
      } else {
        Alert.alert('Error', response.message || 'Failed to initiate verification');
      }
    } catch (error: any) {
      console.error('Aadhaar verification error:', error);
      Alert.alert('Error', error.message || 'Failed to initiate verification');
    } finally {
      setIsLoading(false);
    }
  };

  // Main screen
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
        <Text style={styles.headerTitle}>Verify Aadhaar</Text>
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
        <Text style={styles.title}>Verify Your Identity</Text>
        <Text style={styles.subtitle}>
          {user?.role === 'provider'
            ? 'Complete Aadhaar verification to start receiving bookings'
            : 'Verify your Aadhaar to book services'}
        </Text>

        {/* Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Aadhaar Number</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="card-outline" size={20} color={COLORS.textSecondary} />
            <TextInput
              style={styles.input}
              placeholder="Enter 12-digit Aadhaar number"
              placeholderTextColor={COLORS.textSecondary}
              value={aadhaarNumber}
              onChangeText={(text) => setAadhaarNumber(text.replace(/\D/g, ''))}
              keyboardType="number-pad"
              maxLength={12}
              editable={!isLoading}
            />
          </View>
        </View>

        {/* Info */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle-outline" size={20} color={COLORS.primary} />
          <Text style={styles.infoText}>
            You'll receive an OTP on your Aadhaar-linked mobile number to complete verification.
          </Text>
        </View>

        {/* Button */}
        <TouchableOpacity
          style={[styles.verifyButton, isLoading && styles.verifyButtonDisabled]}
          onPress={handleVerify}
          disabled={isLoading || aadhaarNumber.length !== 12}
          activeOpacity={0.8}
        >
          {isLoading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <>
              <Ionicons name="shield-checkmark-outline" size={20} color={COLORS.white} />
              <Text style={styles.verifyButtonText}>Verify Aadhaar</Text>
            </>
          )}
        </TouchableOpacity>
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
    alignItems: 'center',
  },
  iconContainer: {
    marginTop: SPACING.xxl,
    marginBottom: SPACING.xl,
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
  inputContainer: {
    width: '100%',
    marginBottom: SPACING.lg,
  },
  inputLabel: {
    fontSize: TYPOGRAPHY.size.sm,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.gray100,
    borderRadius: RADIUS.medium,
    paddingHorizontal: SPACING.md,
    gap: SPACING.sm,
  },
  input: {
    flex: 1,
    fontSize: TYPOGRAPHY.size.md,
    color: COLORS.text,
    paddingVertical: SPACING.md,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: `${COLORS.primary}10`,
    borderRadius: RADIUS.medium,
    padding: SPACING.md,
    gap: SPACING.sm,
    marginBottom: SPACING.xl,
  },
  infoText: {
    flex: 1,
    fontSize: TYPOGRAPHY.size.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  verifyButton: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.medium,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    alignItems: 'center',
    gap: SPACING.sm,
    ...SHADOWS.md,
    minWidth: 200,
    justifyContent: 'center',
  },
  verifyButtonDisabled: {
    opacity: 0.5,
  },
  verifyButtonText: {
    fontSize: TYPOGRAPHY.size.md,
    fontWeight: '600',
    color: COLORS.white,
  },
  // WebView styles
  webViewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  webViewTitle: {
    fontSize: TYPOGRAPHY.size.lg,
    fontWeight: '600',
    color: COLORS.text,
  },
  webView: {
    flex: 1,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white,
  },
});
