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
import { GlassCard } from '../../components/ui/GlassCard';
import { NeoButton } from '../../components/ui/NeoButton';
import { LiquidBackground } from '../../components/ui/LiquidBackground';
import { Easing } from 'react-native-reanimated';
import Reanimated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';

const { width } = Dimensions.get('window');

type Props = {
  navigation: NativeStackNavigationProp<any>;
  route: RouteProp<{ params: { role?: 'customer' | 'provider' } }, 'params'>;
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
    marginBottom: 40,
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
  form: {
    marginBottom: 24,
    gap: 16,
  },
  fieldGlass: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  formCard: {
    borderRadius: 32,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 32,
  },
  inputDivider: {
    height: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.05)',
    marginHorizontal: 20,
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
    padding: 0, // Reset padding for cleaner alignment
  },
  hintContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    marginBottom: 24,
    gap: 8,
  },
  hintText: {
    flex: 1,
    fontSize: 12,
    color: COLORS.textTertiary,
    fontWeight: '500',
  },
  signUpButton: {
    marginTop: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
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
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginTop: 32,
    marginBottom: 40,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: 'rgba(15, 23, 42, 0.1)',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  checkboxChecked: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  termsText: {
    flex: 1,
    fontSize: 12,
    color: COLORS.textTertiary,
    lineHeight: 18,
    fontWeight: '500',
  },
  termsLink: {
    color: COLORS.textSecondary,
    fontWeight: '700',
  },
});

const AnimatedLetter = ({ letter, index }: { letter: string; index: number }) => {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(30);

  useEffect(() => {
    opacity.value = withDelay(index * 100, withTiming(1, { duration: 500 }));
    translateY.value = withDelay(
      index * 100,
      withSpring(0, { damping: 12, stiffness: 90 }, (finished) => {
        if (finished) {
          translateY.value = withDelay(
            index * 100,
            withRepeat(
              withSequence(
                withTiming(-5, { duration: 1500, easing: Easing.inOut(Easing.quad) }),
                withTiming(0, { duration: 1500, easing: Easing.inOut(Easing.quad) })
              ),
              -1,
              true
            )
          );
        }
      })
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [{ translateY: translateY.value }],
    };
  });

  return (
    <Reanimated.Text style={[styles.brandLetter, animatedStyle]}>
      {letter}
    </Reanimated.Text>
  );
};

export const SignupScreen: React.FC<Props> = ({ navigation, route }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    referralCode: '',
    agreedToTerms: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
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
    const phoneRegex = /^[6-9]\d{9}$/;
    return phoneRegex.test(phone);
  };

  const handleSignup = async () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Please enter your name');
      return;
    }

    if (!formData.agreedToTerms) {
      Alert.alert('Agreement Required', 'Please agree to the Terms & Conditions and EULA to continue.');
      return;
    }

    // Check if at least one identifier (email or phone) is provided
    const hasEmail = formData.email.trim().length > 0;
    const hasPhone = formData.phone.trim().length > 0;

    if (!hasEmail && !hasPhone) {
      Alert.alert('Error', 'Please enter your email address or phone number');
      return;
    }

    // Validate email if provided
    if (hasEmail && !validateEmail(formData.email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    // Validate phone if provided
    if (hasPhone && !validatePhone(formData.phone)) {
      Alert.alert('Error', 'Please enter a valid 10-digit phone number');
      return;
    }

    // Determine primary identifier for sending OTP
    const primaryIdentifier = hasEmail ? formData.email.trim() : formData.phone.trim();
    const identifierType = hasEmail ? 'email' : 'phone';

    setIsLoading(true);
    try {
      // Build metadata with both email and phone
      const metadata: any = { name: formData.name.trim() };
      if (hasEmail) metadata.email = formData.email.trim();
      if (hasPhone) metadata.phone = formData.phone.trim();
      if (formData.referralCode.trim()) metadata.referralCode = formData.referralCode.trim().toUpperCase();

      await apiService.sendSignupOTP(primaryIdentifier, metadata);

      const otpDestination = identifierType === 'email' ? 'email' : 'phone number';
      Alert.alert('Success', `OTP sent to your ${otpDestination}!`, [
        {
          text: 'OK',
          onPress: () => navigation.navigate('VerifyOTP', {
            identifier: primaryIdentifier,
            identifierType,
            isSignup: true,
            signupData: {
              name: formData.name.trim(),
              email: formData.email.trim() || undefined,
              phone: formData.phone.trim() || undefined,
            }
          }),
        },
      ]);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to send OTP';
      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

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
                  <AnimatedLetter key={"Signup-" + idx} letter={item} index={idx} />
                ))}
              </View>
              <View style={styles.taglineRow}>
                <View style={styles.taglineLine} />
                <Text style={styles.tagline}>SIGNATURE LUXURY</Text>
                <View style={styles.taglineLine} />
              </View>

              <Text style={styles.title}>Join the Circle</Text>
              <Text style={styles.subtitle}>
                Curated excellence at your fingertips
              </Text>
            </View>

            {/* Main Form Panel */}
            <GlassCard 
              intensity={80} 
              style={styles.formCard} 
              enableTilt 
              glowColor="rgba(59, 130, 246, 0.05)"
            >
              <View style={styles.form}>
                {/* Name Field */}
                <View style={[
                  styles.fieldGlass,
                  focusedField === 'name' && { backgroundColor: 'rgba(59, 130, 246, 0.03)' }
                ]}>
                  <View style={styles.inputRow}>
                    <View style={[styles.iconCircle, focusedField === 'name' && { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}>
                      <Ionicons name="person-outline" size={18} color={focusedField === 'name' ? COLORS.primary : COLORS.textTertiary} />
                    </View>
                    <View style={styles.inputContainer}>
                      <Text style={styles.label}>FULL NAME</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="Enter your full name"
                        placeholderTextColor={addAlpha(COLORS.textTertiary, 0.6)}
                        value={formData.name}
                        onChangeText={(value) => updateField('name', value)}
                        onFocus={() => setFocusedField('name')}
                        onBlur={() => setFocusedField(null)}
                        autoCapitalize="words"
                        editable={!isLoading}
                      />
                    </View>
                    {formData.name.length > 2 && (
                      <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />
                    )}
                  </View>
                </View>

                <View style={styles.inputDivider} />

                {/* Email Field */}
                <View style={[
                  styles.fieldGlass,
                  focusedField === 'email' && { backgroundColor: 'rgba(59, 130, 246, 0.03)' }
                ]}>
                  <View style={styles.inputRow}>
                    <View style={[styles.iconCircle, focusedField === 'email' && { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}>
                      <Ionicons name="mail-outline" size={18} color={focusedField === 'email' ? COLORS.primary : COLORS.textTertiary} />
                    </View>
                    <View style={styles.inputContainer}>
                      <Text style={styles.label}>EMAIL ADDRESS (OPTIONAL)</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="Enter your email"
                        placeholderTextColor={addAlpha(COLORS.textTertiary, 0.6)}
                        value={formData.email}
                        onChangeText={(value) => updateField('email', value)}
                        onFocus={() => setFocusedField('email')}
                        onBlur={() => setFocusedField(null)}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                        editable={!isLoading}
                      />
                    </View>
                    {formData.email.length > 0 && validateEmail(formData.email) && (
                      <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />
                    )}
                  </View>
                </View>

                <View style={styles.inputDivider} />

                {/* Phone Field */}
                <View style={[
                  styles.fieldGlass,
                  focusedField === 'phone' && { backgroundColor: 'rgba(59, 130, 246, 0.03)' }
                ]}>
                  <View style={styles.inputRow}>
                    <View style={[styles.iconCircle, focusedField === 'phone' && { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}>
                      <Ionicons name="call-outline" size={18} color={focusedField === 'phone' ? COLORS.primary : COLORS.textTertiary} />
                    </View>
                    <View style={styles.inputContainer}>
                      <Text style={styles.label}>PHONE NUMBER (OPTIONAL)</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="Enter 10-digit phone"
                        placeholderTextColor={addAlpha(COLORS.textTertiary, 0.6)}
                        value={formData.phone}
                        onChangeText={(value) => updateField('phone', value)}
                        onFocus={() => setFocusedField('phone')}
                        onBlur={() => setFocusedField(null)}
                        keyboardType="phone-pad"
                        maxLength={10}
                        editable={!isLoading}
                      />
                    </View>
                    {formData.phone.length > 0 && validatePhone(formData.phone) && (
                      <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />
                    )}
                  </View>
                </View>

                <View style={styles.inputDivider} />

                {/* Referral Code Field */}
                <View style={[
                  styles.fieldGlass,
                  focusedField === 'referralCode' && { backgroundColor: 'rgba(59, 130, 246, 0.03)' }
                ]}>
                  <View style={styles.inputRow}>
                    <View style={[styles.iconCircle, focusedField === 'referralCode' && { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}>
                      <Ionicons name="gift-outline" size={18} color={focusedField === 'referralCode' ? COLORS.primary : COLORS.textTertiary} />
                    </View>
                    <View style={styles.inputContainer}>
                      <Text style={styles.label}>REFERRAL CODE (OPTIONAL)</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="Have a code? Enter it here"
                        placeholderTextColor={addAlpha(COLORS.textTertiary, 0.6)}
                        value={formData.referralCode}
                        onChangeText={(value) => updateField('referralCode', value.toUpperCase())}
                        onFocus={() => setFocusedField('referralCode')}
                        onBlur={() => setFocusedField(null)}
                        autoCapitalize="characters"
                        editable={!isLoading}
                      />
                    </View>
                  </View>
                </View>
              </View>
            </GlassCard>

            {/* Hint and Button */}
            <View style={styles.hintContainer}>
              <Ionicons name="information-circle-outline" size={16} color={COLORS.info} />
              <Text style={styles.hintText}>
                Provide at least one: email or phone number.
              </Text>
            </View>

            <NeoButton
              title={isLoading ? "CREATING..." : "SIGN UP"}
              onPress={handleSignup}
              disabled={isLoading}
              variant="primary"
              size="large"
              style={styles.signUpButton}
              icon={!isLoading && <Ionicons name="chevron-forward" size={18} color="#fff" />}
            />

            {/* Sign In Link */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.footerLink}>Sign In</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.termsContainer}
              onPress={() => setFormData(prev => ({ ...prev, agreedToTerms: !prev.agreedToTerms }))}
              activeOpacity={0.8}
            >
              <View style={[styles.checkbox, formData.agreedToTerms && styles.checkboxChecked]}>
                {formData.agreedToTerms && <Ionicons name="checkmark" size={14} color={COLORS.white} />}
              </View>
              <Text style={styles.termsText}>
                I agree to the <Text style={styles.termsLink} onPress={() => navigation.navigate('Terms' as any)}>Terms</Text>, <Text style={styles.termsLink} onPress={() => navigation.navigate('Privacy' as any)}>Privacy Policy</Text> & EULA.
              </Text>
            </TouchableOpacity>

          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
      <LoadingSpinner visible={isLoading} />
    </View >
  );
};

