import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  Image,
  Animated,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';
import {
  COLORS,
  SPACING,
  TYPOGRAPHY,
  RADIUS,
  SHADOWS,
  GRADIENTS,
  addAlpha
} from '../../utils/theme';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';

const { width } = Dimensions.get('window');

type Props = {
  navigation: NativeStackNavigationProp<any>;
  route: RouteProp<{
    params: {
      identifier?: string;
      identifierType?: 'email' | 'phone';
      email?: string;
      isSignup?: boolean;
      isPartner?: boolean;
      signupData?: { name: string; phone?: string };
    }
  }, 'params'>;
};

export const VerifyOTPScreen: React.FC<Props> = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const identifier = route.params?.identifier || route.params?.email || '';
  const identifierType = route.params?.identifierType || 'email';
  const { isSignup, isPartner, signupData } = route.params;

  const [otp, setOTP] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const { login, loginAsProvider, sendOTP, sendProviderOTP } = useAuth();

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleVerifyOTP = async () => {
    if (!otp.trim() || otp.length < 4) {
      Alert.alert('Error', 'Please enter a valid OTP');
      return;
    }

    setIsLoading(true);
    try {
      if (isPartner) {
        await loginAsProvider(identifier, otp);
      } else {
        await login(identifier, otp, isSignup ? 'signup' : 'login');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Invalid OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setResending(true);
    try {
      if (isPartner) {
        await sendProviderOTP(identifier);
      } else if (isSignup && signupData) {
        await apiService.sendSignupOTP(identifier, signupData);
      } else {
        await sendOTP(identifier);
      }
      Alert.alert('Success', 'OTP has been resent');
      setOTP('');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to resend OTP');
    } finally {
      setResending(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      {/* Background Gradient Mesh */}
      <View style={StyleSheet.absoluteFill}>
        <LinearGradient
          colors={['#F0F9FF', '#F8FAFC', '#FFFFFF']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <View style={[styles.decorativeCircle, { top: -100, right: -50, backgroundColor: addAlpha(COLORS.primary, 0.05) }]} />
        <View style={[styles.decorativeCircle, { bottom: 100, left: -100, width: 300, height: 300, backgroundColor: addAlpha(COLORS.accentYellow, 0.05) }]} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: insets.top + SPACING.md, paddingBottom: Math.max(insets.bottom + SPACING.xl, 40) }
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          bounces={true}
        >
          {/* Back Button */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            disabled={isLoading}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>

          <Animated.View
            style={[
              styles.content,
              { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
            ]}
          >
            {/* Header */}
            <View style={styles.header}>
              <View style={[styles.logoContainer, SHADOWS.sm]}>
                <Ionicons name="shield-checkmark" size={32} color={COLORS.primary} />
              </View>
              <Text style={styles.title}>Verify Code</Text>
              <Text style={styles.subtitle}>
                We've sent a code to{' '}
                <Text style={styles.highlight}>{identifier}</Text>
              </Text>
            </View>

            {/* OTP Input Card */}
            <View style={[styles.formCard, SHADOWS.md]}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>ENTER VERIFICATION CODE</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    placeholder="000000"
                    placeholderTextColor={COLORS.textTertiary}
                    value={otp}
                    onChangeText={setOTP}
                    keyboardType="number-pad"
                    maxLength={6}
                    editable={!isLoading}
                    autoFocus
                  />
                  <View style={styles.inputIcon}>
                    <Ionicons name="keypad-outline" size={20} color={COLORS.textTertiary} />
                  </View>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.verifyButton, (isLoading || otp.length < 4) && styles.buttonDisabled]}
                onPress={handleVerifyOTP}
                disabled={isLoading || otp.length < 4}
                activeOpacity={0.8}
              >
                {isLoading ? (
                  <LoadingSpinner visible={true} size="small" color="#FFF" />
                ) : (
                  <>
                    <Text style={styles.buttonText}>Verify Account</Text>
                    <Ionicons name="arrow-forward" size={20} color="#FFF" />
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* Resend Options */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>Didn't receive code?</Text>
              <View style={styles.resendActions}>
                <TouchableOpacity
                  onPress={handleResendOTP}
                  disabled={resending || isLoading}
                  style={styles.resendButton}
                >
                  <Text style={[styles.resendLink, (resending || isLoading) && styles.disabledText]}>
                    {resending ? 'Sending...' : 'Resend SMS'}
                  </Text>
                </TouchableOpacity>

                <View style={styles.dotSeparator} />

                <TouchableOpacity
                  onPress={async () => {
                    try {
                      setIsLoading(true);
                      await apiService.requestCallOTP(identifier);
                      Alert.alert('Call Requested', 'You will receive a call shortly with your code.');
                    } catch (error: any) {
                      Alert.alert('Error', error.message || 'Failed to request call');
                    } finally {
                      setIsLoading(false);
                    }
                  }}
                  disabled={isLoading}
                  style={styles.resendButton}
                >
                  <Text style={[styles.resendLink, isLoading && styles.disabledText]}>
                    Get a Call
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  decorativeCircle: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: SPACING.lg,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xl,
    ...SHADOWS.sm,
    zIndex: 10,
  },
  content: {
    flex: 1,
    zIndex: 1,
  },
  header: {
    marginBottom: SPACING.xxl,
    alignItems: 'center',
  },
  logoContainer: {
    width: 64,
    height: 64,
    borderRadius: RADIUS.xlarge,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: TYPOGRAPHY.size.heading,
    fontWeight: TYPOGRAPHY.weight.heavy,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.size.md,
    fontWeight: TYPOGRAPHY.weight.medium,
    color: COLORS.textSecondary,
    textAlign: 'center',
    paddingHorizontal: SPACING.xl,
  },
  highlight: {
    fontWeight: TYPOGRAPHY.weight.bold,
    color: COLORS.primary,
  },
  formCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xlarge,
    padding: SPACING.xl,
    marginBottom: SPACING.xxl,
    ...SHADOWS.md,
  },
  inputGroup: {
    marginBottom: SPACING.xl,
  },
  label: {
    fontSize: TYPOGRAPHY.size.xs,
    fontWeight: TYPOGRAPHY.weight.semibold,
    color: COLORS.textTertiary,
    marginBottom: SPACING.sm,
    letterSpacing: 1,
  },
  inputContainer: {
    position: 'relative',
    height: 60,
  },
  inputIcon: {
    position: 'absolute',
    right: SPACING.lg,
    top: 20,
    zIndex: 2,
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.background, // F8F9FB
    borderRadius: RADIUS.large,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.lg,
    fontSize: 24, // Large text for OTP
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: 8,
    textAlign: 'center',
  },
  verifyButton: {
    backgroundColor: COLORS.primary,
    height: 56,
    borderRadius: RADIUS.medium,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    ...SHADOWS.md,
  },
  buttonDisabled: {
    opacity: 0.7,
    backgroundColor: COLORS.disabled,
  },
  buttonText: {
    fontSize: TYPOGRAPHY.size.lg,
    fontWeight: TYPOGRAPHY.weight.bold,
    color: COLORS.white,
  },
  footer: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  footerText: {
    fontSize: TYPOGRAPHY.size.md,
    fontWeight: TYPOGRAPHY.weight.medium,
    color: COLORS.textTertiary,
    marginBottom: SPACING.md,
  },
  resendActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.large,
    ...SHADOWS.sm,
  },
  resendButton: {
    paddingVertical: SPACING.xs,
  },
  resendLink: {
    fontSize: TYPOGRAPHY.size.md,
    fontWeight: TYPOGRAPHY.weight.semibold,
    color: COLORS.primary,
  },
  disabledText: {
    color: COLORS.textTertiary,
  },
  dotSeparator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.border,
    marginHorizontal: SPACING.md,
  },
});
