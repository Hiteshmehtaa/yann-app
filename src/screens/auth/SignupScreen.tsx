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
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';

const { width } = Dimensions.get('window');

type Props = {
  navigation: NativeStackNavigationProp<any>;
  route: RouteProp<{ params: { role?: 'customer' | 'provider' } }, 'params'>;
};

export const SignupScreen: React.FC<Props> = ({ navigation, route }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
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
              <View style={[styles.logoContainer, SHADOWS.sm]}>
                <Image
                  source={require('../../../assets/Logo.jpg')}
                  style={styles.logoImage}
                  resizeMode="contain"
                />
              </View>
              <View style={styles.brandContainer}>
                <Text style={styles.brandName}>YANN</Text>
              </View>

              <Text style={styles.title}>Create Account</Text>
              <Text style={styles.subtitle}>
                Start your journey with us
              </Text>
            </View>

            {/* Form */}
            <View style={styles.form}>
              <View style={styles.inputWrapper}>
                <Text style={styles.label}>FULL NAME</Text>
                <View style={[
                  styles.inputContainer,
                  focusedField === 'name' && styles.inputFocused
                ]}>
                  <View style={[styles.inputIcon, focusedField === 'name' && { backgroundColor: addAlpha(COLORS.primary, 0.1) }]}>
                    <Ionicons
                      name="person-outline"
                      size={20}
                      color={focusedField === 'name' ? COLORS.primary : COLORS.textTertiary}
                    />
                  </View>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your full name"
                    placeholderTextColor={COLORS.textTertiary}
                    value={formData.name}
                    onChangeText={(value) => updateField('name', value)}
                    autoCapitalize="words"
                    editable={!isLoading}
                    onFocus={() => setFocusedField('name')}
                    onBlur={() => setFocusedField(null)}
                  />
                  {formData.name.length > 2 && (
                    <View style={styles.validationIcon}>
                      <Ionicons name="checkmark-circle" size={18} color={COLORS.success} />
                    </View>
                  )}
                </View>
              </View>

              <View style={styles.inputWrapper}>
                <Text style={styles.label}>EMAIL ADDRESS (OPTIONAL)</Text>
                <View style={[
                  styles.inputContainer,
                  focusedField === 'email' && styles.inputFocused
                ]}>
                  <View style={[styles.inputIcon, focusedField === 'email' && { backgroundColor: addAlpha(COLORS.primary, 0.1) }]}>
                    <Ionicons
                      name="mail-outline"
                      size={20}
                      color={focusedField === 'email' ? COLORS.primary : COLORS.textTertiary}
                    />
                  </View>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your email"
                    placeholderTextColor={COLORS.textTertiary}
                    value={formData.email}
                    onChangeText={(value) => updateField('email', value)}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!isLoading}
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField(null)}
                  />
                  {formData.email.length > 0 && validateEmail(formData.email) && (
                    <View style={styles.validationIcon}>
                      <Ionicons name="checkmark-circle" size={18} color={COLORS.success} />
                    </View>
                  )}
                </View>
              </View>

              <View style={styles.inputWrapper}>
                <Text style={styles.label}>PHONE NUMBER (OPTIONAL)</Text>
                <View style={[
                  styles.inputContainer,
                  focusedField === 'phone' && styles.inputFocused
                ]}>
                  <View style={[styles.inputIcon, focusedField === 'phone' && { backgroundColor: addAlpha(COLORS.primary, 0.1) }]}>
                    <Ionicons
                      name="call-outline"
                      size={20}
                      color={focusedField === 'phone' ? COLORS.primary : COLORS.textTertiary}
                    />
                  </View>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter 10-digit phone"
                    placeholderTextColor={COLORS.textTertiary}
                    value={formData.phone}
                    onChangeText={(value) => updateField('phone', value)}
                    keyboardType="phone-pad"
                    maxLength={10}
                    editable={!isLoading}
                    onFocus={() => setFocusedField('phone')}
                    onBlur={() => setFocusedField(null)}
                  />
                  {formData.phone.length > 0 && validatePhone(formData.phone) && (
                    <View style={styles.validationIcon}>
                      <Ionicons name="checkmark-circle" size={18} color={COLORS.success} />
                    </View>
                  )}
                </View>
              </View>

              {/* Helpful message */}
              <View style={styles.hintContainer}>
                <Ionicons name="information-circle-outline" size={16} color={COLORS.info} />
                <Text style={styles.hintText}>
                  Provide at least one: email or phone number.
                </Text>
              </View>

              <TouchableOpacity
                style={[styles.buttonContainer, isLoading && styles.buttonDisabled]}
                onPress={handleSignup}
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
                    <Text style={styles.buttonText}>CREATING ACCOUNT...</Text>
                  ) : (
                    <>
                      <Text style={styles.buttonText}>SIGN UP</Text>
                      <View style={styles.buttonIcon}>
                        <Ionicons name="arrow-forward" size={16} color={COLORS.primary} />
                      </View>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              {/* Sign In Link */}
              <View style={styles.footer}>
                <Text style={styles.footerText}>Already have an account? </Text>
                <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                  <Text style={styles.footerLink}>Sign In</Text>
                </TouchableOpacity>
              </View>
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
  form: {
    marginBottom: SPACING.xl,
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
  hintContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: addAlpha(COLORS.info, 0.1),
    padding: SPACING.md,
    borderRadius: RADIUS.medium,
    marginBottom: SPACING.lg,
    gap: SPACING.sm,
  },
  hintText: {
    flex: 1,
    fontSize: TYPOGRAPHY.size.sm,
    color: COLORS.info,
    lineHeight: 18,
  },
  buttonContainer: {
    borderRadius: RADIUS.medium,
    overflow: 'hidden',
    marginBottom: SPACING.lg,
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
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xl,
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
  bottomTerms: {
    alignItems: 'center',
    paddingBottom: SPACING.lg,
  },
  termsText: {
    fontSize: TYPOGRAPHY.size.sm,
    color: COLORS.textTertiary,
    textAlign: 'center',
  },
  termsLink: {
    color: COLORS.textSecondary,
    fontWeight: '700',
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: COLORS.textTertiary,
    marginRight: SPACING.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
});
