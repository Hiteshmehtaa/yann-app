import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
  StatusBar,
  Image,
  Dimensions,
} from 'react-native';
import { Toast } from '../../components/Toast';
import { useToast } from '../../hooks/useToast';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import LottieView from 'lottie-react-native';
import { useAuth } from '../../contexts/AuthContext';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  COLORS,
  SPACING,
  TYPOGRAPHY,
  RADIUS,
  SHADOWS,
  GRADIENTS,
  LAYOUT,
  addAlpha
} from '../../utils/theme';

const { width } = Dimensions.get('window');

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

export const PartnerLoginScreen: React.FC<Props> = ({ navigation }) => {
  const [identifier, setIdentifier] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [showEmailSent, setShowEmailSent] = useState(false);
  const { sendProviderOTP } = useAuth();
  const { toast, showSuccess, showError, hideToast } = useToast();
  const insets = useSafeAreaInsets();

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

  const validateInput = (input: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^[0-9]{10}$/; // 10 digit phone number
    return emailRegex.test(input) || phoneRegex.test(input);
  };

  const getInputType = (input: string): 'email' | 'phone' | 'unknown' => {
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input)) return 'email';
    if (/^[0-9]+$/.test(input)) return 'phone';
    return 'unknown';
  };

  const handleSendOTP = async () => {
    const trimmedIdentifier = identifier.trim();
    if (!trimmedIdentifier) {
      showError('Please enter your email or phone number');
      return;
    }

    if (!validateInput(trimmedIdentifier)) {
      showError('Please enter a valid email or 10-digit phone number');
      return;
    }

    setIsLoading(true);
    try {
      // Use provider-specific OTP endpoint
      await sendProviderOTP(trimmedIdentifier);
      setShowEmailSent(true);
      setTimeout(() => {
        setShowEmailSent(false);
        navigation.navigate('VerifyOTP', {
          identifier: trimmedIdentifier,
          isPartner: true,
          identifierType: getInputType(trimmedIdentifier) === 'email' ? 'email' : 'phone'
        });
      }, 2000);
    } catch (error: any) {
      showError(error.message || 'Failed to send OTP. Make sure you are registered as a partner.');
    } finally {
      setIsLoading(false);
    }
  };

  const inputType = getInputType(identifier);

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
        {/* Decorative Elements */}
        <View style={[styles.decorativeCircle, { top: -100, right: -50, backgroundColor: addAlpha(COLORS.primary, 0.05) }]} />
        <View style={[styles.decorativeCircle, { bottom: 100, left: -100, width: 300, height: 300, backgroundColor: addAlpha(COLORS.accentYellow, 0.05) }]} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: insets.top + SPACING.md, paddingBottom: insets.bottom + SPACING.lg }
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          bounces={true}
        >
          {/* Back Button */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
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
                <Image
                  source={require('../../../assets/Logo.jpg')}
                  style={styles.logoImage}
                  resizeMode="contain"
                />
              </View>
              <View style={styles.brandContainer}>
                <Text style={styles.brandName}>YANN</Text>
                <View style={styles.partnerBadge}>
                  <Text style={styles.partnerBadgeText}>PARTNER</Text>
                </View>
              </View>

              <Text style={styles.title}>Welcome Back</Text>
              <Text style={styles.subtitle}>
                Manage your services and grow your business
              </Text>
            </View>

            {/* Illustration */}
            <View style={styles.illustrationContainer}>
              <LottieView
                source={require('../../../assets/lottie/Campers-Welcome.json')}
                autoPlay
                loop
                style={styles.welcomeAnimation}
              />
            </View>

            {/* Input Form */}
            <View style={styles.form}>
              <View style={styles.inputWrapper}>
                <Text style={styles.label}>EMAIL OR PHONE</Text>
                <View
                  style={[
                    styles.inputContainer,
                    isFocused && styles.inputFocused,
                    identifier.length > 0 && !validateInput(identifier.trim()) && styles.inputError
                  ]}
                >
                  <View style={[styles.inputIcon, isFocused && { backgroundColor: addAlpha(COLORS.primary, 0.1) }]}>
                    <Ionicons
                      name={inputType === 'phone' ? "call-outline" : "mail-outline"}
                      size={20}
                      color={isFocused ? COLORS.primary : COLORS.textTertiary}
                    />
                  </View>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter email or phone number"
                    placeholderTextColor={COLORS.textTertiary}
                    value={identifier}
                    onChangeText={setIdentifier}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!isLoading}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    selectionColor={COLORS.primary}
                  />
                  {validateInput(identifier.trim()) && (
                    <View style={styles.validationIcon}>
                      <Ionicons name="checkmark-circle" size={18} color={COLORS.success} />
                    </View>
                  )}
                </View>
              </View>

              {/* Continue Button */}
              <TouchableOpacity
                style={[styles.buttonContainer, isLoading && styles.buttonDisabled]}
                onPress={handleSendOTP}
                disabled={isLoading}
                activeOpacity={0.9}
              >
                <LinearGradient
                  colors={GRADIENTS.primary}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.buttonGradient}
                >
                  {isLoading ? (
                    <Text style={styles.buttonText}>SENDING CODE...</Text>
                  ) : (
                    <>
                      <Text style={styles.buttonText}>CONTINUE</Text>
                      <View style={styles.buttonIcon}>
                        <Ionicons name="arrow-forward" size={16} color={COLORS.primary} />
                      </View>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              <Text style={styles.infoText}>
                We'll send a 6-digit verification code to your registered contact method.
              </Text>
            </View>

            {/* Sign Up Link */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>New to Yann Partner? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('ProviderSignup')}>
                <Text style={styles.footerLink}>Register Now</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={hideToast}
      />

      {/* OTP Sent Animation Overlay */}
      {showEmailSent && (
        <View style={styles.emailSentOverlay}>
          <View style={[styles.emailSentContainer, SHADOWS.xl]}>
            <LottieView
              source={require('../../../assets/lottie/Email-Sent.json')}
              autoPlay
              loop={false}
              style={styles.emailSentAnimation}
            />
            <Text style={styles.emailSentText}>Code Sent Successfully!</Text>
            <Text style={styles.emailSentSubText}>Check your inbox</Text>
          </View>
        </View>
      )}
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
    width: 400,
    height: 400,
    borderRadius: 200,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.medium,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: SPACING.lg,
    marginTop: SPACING.md,
    ...SHADOWS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  content: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: RADIUS.large,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  logoImage: {
    width: 56,
    height: 56,
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  brandName: {
    fontSize: TYPOGRAPHY.size.sm,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: 4,
    marginRight: SPACING.xs,
  },
  partnerBadge: {
    backgroundColor: addAlpha(COLORS.primary, 0.1),
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: addAlpha(COLORS.primary, 0.2),
  },
  partnerBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.primary,
    letterSpacing: 1,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: -1,
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: TYPOGRAPHY.size.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  illustrationContainer: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
    height: 180,
  },
  welcomeAnimation: {
    width: 240,
    height: 240,
  },
  form: {
    marginBottom: SPACING.xxl,
  },
  inputWrapper: {
    marginBottom: SPACING.lg,
  },
  label: {
    fontSize: TYPOGRAPHY.size.xs,
    fontWeight: '700',
    color: COLORS.textSecondary,
    letterSpacing: 1,
    marginBottom: SPACING.xs,
    marginLeft: SPACING.xs,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: RADIUS.medium,
    height: 56,
    overflow: 'hidden',
    ...SHADOWS.sm,
  },
  inputFocused: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.white,
    ...SHADOWS.md,
    shadowColor: addAlpha(COLORS.primary, 0.3),
  },
  inputError: {
    borderColor: COLORS.error,
  },
  inputIcon: {
    width: 50,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.gray50,
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
  },
  input: {
    flex: 1,
    paddingHorizontal: SPACING.md,
    fontSize: TYPOGRAPHY.size.md,
    fontWeight: '500',
    color: COLORS.text,
    height: '100%',
  },
  validationIcon: {
    paddingRight: SPACING.md,
  },
  buttonContainer: {
    borderRadius: RADIUS.medium,
    overflow: 'hidden',
    marginBottom: SPACING.md,
    ...SHADOWS.primary,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: SPACING.xl,
  },
  buttonText: {
    fontSize: TYPOGRAPHY.size.md,
    fontWeight: '700',
    color: COLORS.white,
    letterSpacing: 1,
  },
  buttonIcon: {
    marginLeft: SPACING.sm,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoText: {
    fontSize: TYPOGRAPHY.size.sm,
    color: COLORS.textTertiary,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: SPACING.md,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: SPACING.xxl,
  },
  footerText: {
    fontSize: TYPOGRAPHY.size.md,
    color: COLORS.textSecondary,
  },
  footerLink: {
    fontSize: TYPOGRAPHY.size.md,
    color: COLORS.primary,
    fontWeight: '700',
  },
  emailSentOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.7)', // Slate 900 with opacity
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  emailSentContainer: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xlarge,
    padding: SPACING.xl,
    alignItems: 'center',
    width: width * 0.85,
    maxWidth: 340,
  },
  emailSentAnimation: {
    width: 160,
    height: 160,
    marginBottom: SPACING.md,
  },
  emailSentText: {
    fontSize: TYPOGRAPHY.size.xl,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  emailSentSubText: {
    fontSize: TYPOGRAPHY.size.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});

