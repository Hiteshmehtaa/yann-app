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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import LottieView from 'lottie-react-native';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { Toast } from '../../components/Toast';
import { useToast } from '../../hooks/useToast';
import { useAuth } from '../../contexts/AuthContext';
import {
  COLORS,
  SPACING,
  TYPOGRAPHY,
  RADIUS,
  SHADOWS,
  GRADIENTS,
  addAlpha
} from '../../utils/theme';
import { GlassCard } from '../../components/ui/GlassCard';
import { NeoButton } from '../../components/ui/NeoButton';
import { LiquidBackground } from '../../components/ui/LiquidBackground';
import { LottieAnimations } from '../../utils/lottieAnimations';
import Reanimated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useResponsive } from '../../hooks/useResponsive';

const { width } = Dimensions.get('window');

const AnimatedLetter = ({ letter, index, style }: { letter: string, index: number, style?: any }) => {
  const animatedValue = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withDelay(index * 100, withTiming(1, { duration: 600 }));
    animatedValue.value = withDelay(index * 100, withSpring(1, { damping: 12 }));
  }, [index]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [
        { translateY: interpolate(animatedValue.value, [0, 1], [20, 0]) },
      ],
    };
  });

  return (
    <Reanimated.View style={[animatedStyle, style]}>
      <Text style={styles.brandLetter}>{letter}</Text>
    </Reanimated.View>
  );
};

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

export const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const { width: screenWidth, height, isTablet } = useResponsive();
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
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone: string): boolean => {
    // Indian mobile: 10 digits starting with 6-9
    const cleaned = phone.replace(/\D/g, '');
    const phoneRegex = /^[6-9]\d{9}$/;
    return phoneRegex.test(cleaned);
  };

  const detectInputType = (input: string): 'email' | 'phone' | null => {
    if (!input) return null;
    const trimmed = input.trim();
    if (validateEmail(trimmed)) return 'email';
    if (validatePhone(trimmed)) return 'phone';
    // Start typing check
    if (/^\d+$/.test(trimmed)) return 'phone';
    return 'email';
  };

  const isValidInput = (input: string) => {
    const trimmed = input.trim();
    return validateEmail(trimmed) || validatePhone(trimmed);
  };

  const handleSendOTP = async () => {
    const trimmedIdentifier = identifier.trim();
    if (!trimmedIdentifier) {
      showError('Please enter your email or phone number');
      return;
    }

    const inputType = detectInputType(trimmedIdentifier);
    // Explicit validation check before sending
    if (!validateEmail(trimmedIdentifier) && !validatePhone(trimmedIdentifier)) {
      showError('Please enter a valid email address or 10-digit phone number');
      return;
    }

    setIsLoading(true);
    try {
      await sendOTP(trimmedIdentifier);
      setShowEmailSent(true);
      setTimeout(() => {
        setShowEmailSent(false);
        navigation.navigate('VerifyOTP', {
          identifier: trimmedIdentifier,
          identifierType: inputType === 'phone' ? 'phone' : 'email'
        });
      }, 1500);
    } catch (error: any) {
      showError(error.message || 'Failed to send OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const inputType = detectInputType(identifier);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      <LiquidBackground mode="light" />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <ScrollView
          style={{ flex: 1 }}
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
              <View style={styles.brandNameContainer}>
                {"YANN".split('').map((item, idx) => (
                  <AnimatedLetter key={"Login-" + idx} letter={item} index={idx} />
                ))}
              </View>
              <View style={styles.taglineRow}>
                <View style={styles.taglineLine} />
                <Text style={styles.tagline}>SIGNATURE LUXURY</Text>
                <View style={styles.taglineLine} />
              </View>

              <Text style={styles.title}>Welcome Back</Text>
              <Text style={styles.subtitle}>
                Curated excellence awaits you
              </Text>
            </View>

            {/* Illustration - Camper's Welcome */}
            <View style={styles.illustrationContainer}>
              <LottieView
                source={LottieAnimations.campersWelcome}
                autoPlay
                loop
                style={styles.welcomeAnimation}
              />
            </View>

            {/* Main Form Panel */}
            <GlassCard 
              intensity={80} 
              style={styles.formCard} 
              enableTilt 
              glowColor="rgba(59, 130, 246, 0.05)"
            >
              <View style={styles.formContainer}>
                {/* Identifier Field */}
                <View style={[
                  styles.fieldGlass,
                  focusedField === 'identifier' && { backgroundColor: 'rgba(59, 130, 246, 0.03)' }
                ]}>
                  <View style={styles.inputRow}>
                    <View style={[styles.iconCircle, focusedField === 'identifier' && { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}>
                      <Ionicons 
                        name={inputType === 'phone' ? 'call-outline' : 'mail-outline'} 
                        size={18} 
                        color={focusedField === 'identifier' ? COLORS.primary : COLORS.textTertiary} 
                      />
                    </View>
                    <View style={styles.inputContainer}>
                      <Text style={styles.label}>EMAIL OR PHONE</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="Enter email or phone"
                        placeholderTextColor={addAlpha(COLORS.textTertiary, 0.6)}
                        value={identifier}
                        onChangeText={setIdentifier}
                        onFocus={() => setFocusedField('identifier')}
                        onBlur={() => setFocusedField(null)}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                        editable={!isLoading}
                      />
                    </View>
                    {isValidInput(identifier) && (
                      <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />
                    )}
                  </View>
                </View>
              </View>
            </GlassCard>

            <NeoButton
              title={isLoading ? "SENDING..." : "CONTINUE"}
              onPress={handleSendOTP}
              disabled={isLoading}
              variant="primary"
              size="large"
              style={styles.continueButton}
              icon={!isLoading && <Ionicons name="chevron-forward" size={18} color="#fff" />}
            />

            {/* Hint Text */}
            <Text style={styles.infoText}>
              We'll send a premium verification code to your device.
            </Text>

            {/* Footer Links */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>New here? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('RoleSelection')}>
                <Text style={styles.footerLink}>Become a Member</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.guestButton}
              onPress={async () => {
                try {
                  await useAuth().continueAsGuest();
                } catch (e) {
                  console.error(e);
                }
              }}
            >
              <Text style={styles.guestButtonText}>Explore as Guest</Text>
            </TouchableOpacity>
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
          <GlassCard 
            intensity={95} 
            style={styles.emailSentCard}
            glowColor="rgba(59, 130, 246, 0.2)"
          >
            <LottieView
              source={LottieAnimations.emailSent}
              autoPlay
              loop={false}
              style={styles.emailSentAnimation}
            />
            <Text style={styles.emailSentText}>Code Sent Successfully!</Text>
            <Text style={styles.emailSentSubText}>Check your inbox for the premium code</Text>
          </GlassCard>
        </View>
      )}

      <LoadingSpinner visible={isLoading} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F8FC',
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
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 20,
    marginTop: 10,
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.1)',
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 10,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  brandNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 8,
  },
  brandLetter: {
    fontSize: 48,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -1,
  },
  taglineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 12,
  },
  taglineLine: {
    width: 24,
    height: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.2)',
  },
  tagline: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textTertiary,
    letterSpacing: 2,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    fontWeight: '500',
  },
  illustrationContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 140,
    marginBottom: 24,
  },
  welcomeAnimation: {
    width: 200,
    height: 200,
  },
  formContainer: {
    padding: 4,
  },
  formCard: {
    borderRadius: 32,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 32,
  },
  fieldGlass: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 28,
  },
  label: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.textTertiary,
    letterSpacing: 1.5,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: 'rgba(59, 130, 246, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  input: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
    height: 32,
    letterSpacing: 0.2,
    padding: 0,
  },
  continueButton: {
    marginBottom: 20,
  },
  infoText: {
    fontSize: 12,
    color: COLORS.textTertiary,
    textAlign: 'center',
    marginBottom: 32,
    paddingHorizontal: 20,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  footerText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  footerLink: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '700',
  },
  guestButton: {
    alignSelf: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  guestButtonText: {
    fontSize: 14,
    color: COLORS.textTertiary,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  emailSentOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
    padding: 24,
  },
  emailSentCard: {
    width: width * 0.85,
    maxWidth: 340,
    paddingVertical: 40,
    paddingHorizontal: 24,
    alignItems: 'center',
    borderRadius: 32,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  emailSentAnimation: {
    width: 140,
    height: 140,
    marginBottom: 20,
  },
  emailSentText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  emailSentSubText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    fontWeight: '500',
    lineHeight: 20,
  },
});
