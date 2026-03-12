import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
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

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

export const AadhaarVerificationScreen: React.FC<Props> = ({ navigation }) => {
  const { user, updateUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleVerify = async () => {
    setIsLoading(true);
    try {
      const userId = (user?._id || user?.id) as string;
      const userType = user?.role === 'provider' ? 'provider' : 'homeowner';

      // Call Meon Tech DigiLocker API — no Aadhaar number needed, DigiLocker handles auth
      const response = await apiService.verifyIdentity(userId, userType);

      if (response.success && response.url) {
        const result = await WebBrowser.openAuthSessionAsync(
          response.url,
          'yannapp://verification-success',
          {
            presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
            controlsColor: COLORS.primary,
          }
        );

        if (result.type === 'success' || result.type === 'dismiss') {
          // Refresh user profile to pick up updated verification status
          const profileResponse = await apiService.getProfile(userType);
          if (profileResponse.user) {
            updateUser(profileResponse.user);
          }
          Alert.alert(
            'Verification Submitted',
            userType === 'provider'
              ? 'Your Aadhaar verification is complete. Your profile is now under admin review.'
              : 'Your Aadhaar verification is complete. You can now book services!',
            [{ text: 'OK', onPress: () => navigation.goBack() }]
          );
        }
      } else {
        Alert.alert('Error', response.message || 'Failed to initiate verification. Please try again.');
      }
    } catch (error: any) {
      console.error('Aadhaar verification error:', error);
      Alert.alert('Error', error.message || 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Aadhaar Verification</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        {/* Icon */}
        <View style={styles.iconContainer}>
          <View style={styles.iconCircle}>
            <Ionicons name="shield-checkmark" size={52} color={COLORS.primary} />
          </View>
        </View>

        <Text style={styles.title}>Verify with DigiLocker</Text>
        <Text style={styles.subtitle}>
          {user?.role === 'provider'
            ? 'Complete Aadhaar verification via DigiLocker to start receiving bookings'
            : 'Verify your Aadhaar via DigiLocker to unlock all features'}
        </Text>

        {/* Steps */}
        <View style={styles.stepsCard}>
          {[
            { icon: 'phone-portrait-outline', text: 'You will be redirected to DigiLocker' },
            { icon: 'finger-print-outline', text: 'Log in with your Aadhaar credentials' },
            { icon: 'checkmark-circle-outline', text: 'Your identity will be instantly verified' },
          ].map((step, i) => (
            <View key={i} style={styles.step}>
              <View style={styles.stepIcon}>
                <Ionicons name={step.icon as any} size={20} color={COLORS.primary} />
              </View>
              <Text style={styles.stepText}>{step.text}</Text>
            </View>
          ))}
        </View>

        {/* Info */}
        <View style={styles.infoCard}>
          <Ionicons name="lock-closed-outline" size={18} color={COLORS.primary} />
          <Text style={styles.infoText}>
            Powered by Meon Tech. Your data is secure and never stored on our servers.
          </Text>
        </View>

        {/* Button */}
        <TouchableOpacity
          style={[styles.verifyButton, isLoading && styles.verifyButtonDisabled]}
          onPress={handleVerify}
          disabled={isLoading}
          activeOpacity={0.8}
        >
          {isLoading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <>
              <Ionicons name="shield-checkmark-outline" size={20} color={COLORS.white} />
              <Text style={styles.verifyButtonText}>Continue with DigiLocker</Text>
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
    marginBottom: SPACING.xl,
    lineHeight: 22,
  },
  stepsCard: {
    width: '100%',
    backgroundColor: COLORS.gray100,
    borderRadius: RADIUS.medium,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    gap: SPACING.md,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  stepIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: `${COLORS.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepText: {
    flex: 1,
    fontSize: TYPOGRAPHY.size.sm,
    color: COLORS.text,
    lineHeight: 20,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: `${COLORS.primary}10`,
    borderRadius: RADIUS.medium,
    padding: SPACING.md,
    gap: SPACING.sm,
    marginBottom: SPACING.xl,
    width: '100%',
    alignItems: 'flex-start',
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
    width: '100%',
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
});
