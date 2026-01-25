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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import LottieView from 'lottie-react-native';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { Toast } from '../../components/Toast';
import { useToast } from '../../hooks/useToast';
import { useAuth } from '../../contexts/AuthContext';
import { COLORS, SPACING, RADIUS, SHADOWS, LAYOUT } from '../../utils/theme';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useResponsive } from '../../hooks/useResponsive';

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

export const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const { width, height, isTablet } = useResponsive();
  const [identifier, setIdentifier] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [showEmailSent, setShowEmailSent] = useState(false);
  const { sendOTP } = useAuth();
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
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // ... (validation functions omitted for brevity if unchanged, but need to be careful with replace)
  // To avoid replacing logic, I will target the return statement mostly.

  // Wait, I need to keep the validation logic. I will only target the Top of the component return.

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone: string): boolean => {
    const cleaned = phone.replace(/\D/g, '');
    // Indian mobile: 10 digits starting with 6-9, or 12 digits with 91 prefix
    const phoneRegex = /^(91)?[6-9]\d{9}$/;
    return phoneRegex.test(cleaned);
  };

  const detectInputType = (input: string): 'email' | 'phone' | null => {
    if (!input) return null;
    const trimmed = input.trim();

    if (validateEmail(trimmed)) return 'email';
    if (validatePhone(trimmed)) return 'phone';

    return null;
  };

  const handleSendOTP = async () => {
    if (!identifier.trim()) {
      showError('Please enter your email or phone number');
      return;
    }

    const inputType = detectInputType(identifier);
    if (!inputType) {
      showError('Please enter a valid email address or 10-digit phone number');
      return;
    }

    setIsLoading(true);
    try {
      await sendOTP(identifier);
      setShowEmailSent(true);
      setTimeout(() => {
        setShowEmailSent(false);
        navigation.navigate('VerifyOTP', {
          identifier,
          identifierType: inputType
        });
      }, 1000);
    } catch (error: any) {
      showError(error.message || 'Failed to send OTP');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      {/* Toast Notification */}
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={hideToast}
      />

      {/* Email Sent Animation Overlay */}
      {showEmailSent && (
        <View style={styles.emailSentOverlay}>
          <View style={styles.emailSentContainer}>
            <LottieView
              source={require('../../../assets/lottie/Email-Sent.json')}
              autoPlay
              loop={false}
              style={styles.emailSentAnimation}
            />
            <Text style={styles.emailSentText}>OTP Sent!</Text>
          </View>
        </View>
      )}

      {/* Background pattern */}
      <View style={styles.bgPattern}>
        <View style={styles.patternCircle1} />
        <View style={styles.patternCircle2} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          bounces={true}
          alwaysBounceVertical={true}
        >
          {/* Back Button */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={22} color={COLORS.text} />
          </TouchableOpacity>

          <Animated.View
            style={[
              styles.content,
              { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
            ]}
          >
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.logoContainer}>
                <Image
                  source={require('../../../assets/Logo.jpg')}
                  style={styles.logoImage}
                  resizeMode="contain"
                />
              </View>
              <Text style={styles.brandName}>YANN</Text>

              {/* Welcome Animation - Restored */}
              <LottieView
                source={require('../../../assets/lottie/Campers-Welcome.json')}
                autoPlay
                loop
                style={styles.welcomeAnimation}
                resizeMode="contain"
              />

              <Text style={styles.title}>Welcome{'\n'}Back</Text>
              <Text style={styles.subtitle}>
                Sign in to manage your services
              </Text>
            </View>

            {/* Form */}
            <View style={styles.form}>
              <Text style={styles.label}>EMAIL OR PHONE</Text>
              <View style={[styles.inputContainer, isFocused && styles.inputFocused]}>
                <View style={styles.inputIcon}>
                  <Ionicons
                    name={detectInputType(identifier) === 'phone' ? 'call' : 'mail'}
                    size={20}
                    color={isFocused ? COLORS.primary : COLORS.textTertiary}
                  />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Email or phone number"
                  placeholderTextColor={COLORS.textTertiary}
                  value={identifier}
                  onChangeText={setIdentifier}
                  keyboardType="default"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isLoading}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                />
              </View>

              <TouchableOpacity
                style={[styles.button, isLoading && styles.buttonDisabled]}
                onPress={handleSendOTP}
                disabled={isLoading}
                activeOpacity={0.9}
              >
                <LinearGradient
                  colors={[COLORS.primary, COLORS.primaryGradientEnd]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.buttonGradient}
                >
                  <Text style={styles.buttonText}>Continue</Text>
                  <Ionicons name="arrow-forward" size={18} color={COLORS.white} />
                </LinearGradient>
              </TouchableOpacity>

              <Text style={styles.infoText}>
                We'll send a verification code to your email or phone
              </Text>
            </View>

            {/* Sign Up Link */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>New to YANN? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('RoleSelection')}>
                <Text style={styles.footerLink}>Create Account</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
      <LoadingSpinner visible={isLoading} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  bgPattern: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    overflow: 'hidden',
    zIndex: -1,
  },
  patternCircle1: {
    position: 'absolute',
    top: -100,
    right: -50,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: COLORS.primary,
    opacity: 0.04,
  },
  patternCircle2: {
    position: 'absolute',
    bottom: 50,
    left: -100,
    width: 350,
    height: 350,
    borderRadius: 175,
    backgroundColor: COLORS.accentOrange,
    opacity: 0.03,
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
    borderRadius: RADIUS.small,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 24,
    marginTop: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  content: {
    paddingHorizontal: 32,
    paddingTop: 32,
  },
  header: {
    marginBottom: 48,
    alignItems: 'center',
  },
  logoContainer: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    ...SHADOWS.sm,
  },
  logoImage: {
    width: 40,
    height: 40,
  },
  brandName: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
    letterSpacing: 4,
    marginBottom: 24,
  },
  welcomeAnimation: {
    width: 300,
    height: 220,
    marginVertical: 10,
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: -1,
    lineHeight: 44,
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    letterSpacing: 0.2,
    textAlign: 'center',
  },
  form: {
    marginBottom: 32,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textTertiary,
    letterSpacing: 1.5,
    marginBottom: 12,
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: RADIUS.medium,
    marginBottom: 24,
    overflow: 'hidden',
    height: 56,
  },
  inputFocused: {
    borderColor: COLORS.primary,
    backgroundColor: '#F8FAFF',
  },
  inputIcon: {
    width: 50,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    height: '100%',
    paddingRight: 16,
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.text,
  },
  button: {
    borderRadius: RADIUS.medium,
    overflow: 'hidden',
    marginBottom: 20,
    ...SHADOWS.md,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 10,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  infoText: {
    fontSize: 13,
    color: COLORS.textTertiary,
    textAlign: 'center',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 'auto',
    paddingBottom: 32,
  },
  footerText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  footerLink: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '700',
  },
  emailSentOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  emailSentContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    ...SHADOWS.lg,
  },
  emailSentAnimation: {
    width: 160,
    height: 160,
  },
  emailSentText: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 12,
  },
});
