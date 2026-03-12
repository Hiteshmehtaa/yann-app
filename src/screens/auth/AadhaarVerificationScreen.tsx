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
import { LinearGradient } from 'expo-linear-gradient';
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

      // Call Meon Tech DigiLocker API
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
          // Refresh user profile
          const profileResponse = await apiService.getProfile(userType);
          if (profileResponse.user) {
            updateUser(profileResponse.user);
          }
          
          showSuccess(
            'Verification Submitted',
            userType === 'provider'
              ? 'Your Aadhaar verification is complete. Your profile is now under admin review.'
              : 'Your Aadhaar verification is complete. You can now book services!',
            () => navigation.goBack()
          );
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
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
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
        <View style={styles.iconContainer}>
          <LinearGradient
            colors={['#E0F2FE', '#F0F9FF']}
            style={styles.iconCircle}
          >
            <View style={styles.iconInner}>
              <Ionicons name="finger-print" size={48} color={COLORS.primary} />
            </View>
          </LinearGradient>
        </View>

        <Text style={styles.title}>Verify with DigiLocker</Text>
        <Text style={styles.subtitle}>
          {user?.role === 'provider'
            ? 'Complete seamless Aadhaar verification via DigiLocker to start receiving bookings securely.'
            : 'Verify your Aadhaar via DigiLocker to unlock all platform features.'}
        </Text>

        {/* Steps */}
        <View style={styles.stepsCard}>
          {[
            { icon: 'open-outline', text: 'You will be redirected safely to DigiLocker website' },
            { icon: 'key-outline', text: 'Log in with your Aadhaar number & OTP credentials' },
            { icon: 'checkmark-done-circle-outline', text: 'Your identity will be instantly securely verified' },
          ].map((step, i) => (
            <View key={i} style={styles.step}>
              <View style={styles.stepIconBox}>
                <Ionicons name={step.icon as any} size={20} color={COLORS.primary} />
              </View>
              <Text style={styles.stepText}>{step.text}</Text>
            </View>
          ))}
        </View>

        <View style={{ flex: 1 }} />

        {/* Info */}
        <View style={styles.infoCard}>
          <Ionicons name="shield-checkmark" size={20} color={COLORS.success} />
          <Text style={styles.infoText}>
            Powered by Meon Tech. Your data is encrypted and never stored on our servers.
          </Text>
        </View>

        {/* Button */}
        <AnimatedButton
          style={[styles.verifyButton, isLoading && styles.verifyButtonDisabled]}
          onPress={handleVerify}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <>
              <Text style={styles.verifyButtonText}>Continue with DigiLocker</Text>
              <Ionicons name="arrow-forward" size={20} color={COLORS.white} />
            </>
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
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F3F5',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
  },
  content: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 32,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EEF2FF',
    ...Platform.select({
      ios: {
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.15,
        shadowRadius: 24,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  iconInner: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  stepsCard: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 24,
    width: '100%',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  stepIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F0F9FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  stepText: {
    flex: 1,
    fontSize: 15,
    color: '#4A4A4A',
    lineHeight: 22,
    fontWeight: '500',
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    padding: 16,
    borderRadius: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  infoText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 13,
    color: '#166534',
    lineHeight: 18,
    fontWeight: '500',
  },
  verifyButton: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 20,
    width: '100%',
    ...Platform.select({
      ios: {
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  verifyButtonDisabled: {
    backgroundColor: '#A0AEC0',
    shadowOpacity: 0,
    elevation: 0,
  },
  verifyButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
    marginRight: 8,
    letterSpacing: 0.5,
  },
});
