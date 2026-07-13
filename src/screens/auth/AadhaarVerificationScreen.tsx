import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  Animated,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as WebBrowser from 'expo-web-browser';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS, SHADOWS } from '../../utils/theme';
import { CustomDialog } from '../../components/CustomDialog';
import { AnimatedButton } from '../../components/AnimatedButton';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

export const AadhaarVerificationScreen: React.FC<Props> = ({ navigation }) => {
  const { user, updateUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [dialogState, setDialogState] = useState<{
    visible: boolean;
    type: 'success' | 'error';
    title: string;
    message: string;
    onClose: () => void;
  }>({
    visible: false,
    type: 'success',
    title: '',
    message: '',
    onClose: () => {},
  });

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

  const showError = (title: string, message: string) => {
    setDialogState({
      visible: true,
      type: 'error',
      title,
      message,
      onClose: () => setDialogState(prev => ({ ...prev, visible: false }))
    });
  };

  const showSuccess = (title: string, message: string, onCloseAction: () => void) => {
    setDialogState({
      visible: true,
      type: 'success',
      title,
      message,
      onClose: () => {
        setDialogState(prev => ({ ...prev, visible: false }));
        onCloseAction();
      }
    });
  };

  const handleVerify = async () => {
    setIsLoading(true);
    try {
      const userId = (user?._id || user?.id) as string;
      const userType = user?.role === 'provider' ? 'provider' : 'homeowner';
      // Must match app.json's `expo.scheme` exactly - this is what the
      // backend's DigiLocker callback page redirects to on completion.
      const redirectUrl = 'yann://verification-success';

      // Call Meon Tech DigiLocker API
      const response = await apiService.verifyIdentity(userId, userType, redirectUrl);

      if (response.success && response.url) {
        const result = await WebBrowser.openAuthSessionAsync(
          response.url,
          redirectUrl,
          {
            presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
            controlsColor: COLORS.primary,
          }
        );

        // Don't infer success from the browser session's result type - it's
        // 'dismiss' just as often on a genuine success (user closes the tab
        // instead of tapping "Return to App") as on an actual failure/cancel.
        // The only thing that can be trusted is the provider/homeowner's
        // freshly-fetched aadhaarVerified flag, set server-side once
        // DigiLocker's callback actually reaches the backend.
        if (result.type === 'success' || result.type === 'dismiss') {
          const profileResponse = await apiService.getProfile(userType);
          const refreshedUser = profileResponse.user;
          if (refreshedUser) {
            updateUser(refreshedUser);
          }

          if (refreshedUser?.aadhaarVerified) {
            showSuccess(
              'Verification Submitted',
              userType === 'provider'
                ? 'Your Aadhaar verification is complete. Your profile is now under admin review.'
                : 'Your Aadhaar verification is complete. You can now book services!',
              () => navigation.goBack()
            );
          } else {
            showError(
              'Verification Not Completed',
              'We couldn\'t confirm your Aadhaar verification. If you completed the DigiLocker steps, please try again in a moment.'
            );
          }
        }
      } else {
        showError('Verification Failed', response.message || 'Failed to initiate verification. Please try again.');
      }
    } catch (error: any) {
      console.error('Aadhaar verification error:', error);
      showError('Error', error.message || 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAFAFA" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Aadhaar Verification</Text>
        <View style={{ width: 44 }} />
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
        <View style={styles.iconWrapper}>
          <View style={styles.iconInnerRing}>
            <Ionicons name="finger-print" size={40} color="#3B82F6" />
          </View>
        </View>

        <Text style={styles.title}>Verify with DigiLocker</Text>
        <Text style={styles.subtitle}>
          {user?.role === 'provider'
            ? 'Complete seamless Aadhaar verification via DigiLocker to start receiving bookings securely.'
            : 'Verify your Aadhaar via DigiLocker to unlock all platform features.'}
        </Text>

        {/* Steps */}
        <View style={styles.stepsContainer}>
          {[
            { icon: 'open-outline', text: 'You will be redirected safely to DigiLocker website' },
            { icon: 'key-outline', text: 'Log in with your Aadhaar number & OTP credentials' },
            { icon: 'checkmark-circle-outline', text: 'Your identity will be instantly securely verified' },
          ].map((step, i) => (
            <View key={i} style={styles.step}>
              <View style={styles.stepIconBox}>
                <Ionicons name={step.icon as any} size={22} color="#4B5563" />
              </View>
              <Text style={styles.stepText}>{step.text}</Text>
            </View>
          ))}
        </View>

        <View style={{ flex: 1 }} />

        {/* Info */}
        <View style={styles.infoRow}>
          <Ionicons name="shield-checkmark" size={18} color="#059669" />
          <Text style={styles.infoText}>
            Your data is encrypted and never stored on our servers.
          </Text>
        </View>

        {/* Button */}
        <AnimatedButton
          style={[styles.verifyButton, isLoading && styles.verifyButtonDisabled]}
          onPress={handleVerify}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.verifyButtonText}>Continue with DigiLocker  →</Text>
          )}
        </AnimatedButton>
      </Animated.View>

      <CustomDialog
        visible={dialogState.visible}
        type={dialogState.type}
        title={dialogState.title}
        message={dialogState.message}
        onClose={dialogState.onClose}
        actions={[{ text: 'Continue', style: 'default' }]}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 22,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 32,
    paddingTop: 24,
    alignItems: 'stretch',
  },
  iconWrapper: {
    alignItems: 'center',
    marginTop: 56,
    marginBottom: 36,
  },
  iconInnerRing: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
    letterSpacing: -0.5,
    textAlign: 'left',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'left',
    marginBottom: 40,
    lineHeight: 24,
    fontWeight: '400',
  },
  stepsContainer: {
    width: '100%',
  },
  step: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 28,
  },
  stepIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  stepText: {
    flex: 1,
    fontSize: 15,
    color: '#374151',
    lineHeight: 22,
    fontWeight: '500',
    marginTop: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  infoText: {
    marginLeft: 8,
    fontSize: 13,
    color: '#059669',
    lineHeight: 18,
    fontWeight: '500',
    textAlign: 'center',
  },
  verifyButton: {
    backgroundColor: '#3B82F6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    borderRadius: 28,
    width: '100%',
  },
  verifyButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  verifyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
