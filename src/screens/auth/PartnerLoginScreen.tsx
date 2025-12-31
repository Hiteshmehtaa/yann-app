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
import { Toast } from '../../components/Toast';
import { useToast } from '../../hooks/useToast';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import LottieView from 'lottie-react-native';
import { AnimatedButton } from '../../components/AnimatedButton';
// inline activity indicator used for button loading
import { useAuth } from '../../contexts/AuthContext';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

// YANN Official Website Color Palette
const THEME = {
  bg: '#F6F7FB',
  bgCard: '#FFFFFF',
  bgElevated: '#FFFFFF',
  primary: '#2E59F3',
  primaryLight: '#4362FF',
  accent: '#2E59F3',
  text: '#1A1C1E',
  textMuted: '#4A4D52',
  textSubtle: '#9CA3AF',
  border: '#E5E7EB',
  shadow: 'rgba(46, 89, 243, 0.08)',
};

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
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 700,
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
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor={THEME.bg} />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
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
            <Ionicons name="arrow-back" size={22} color={THEME.text} />
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
                  source={require('../../../public/Logo.jpg')} 
                  style={styles.logoImage}
                  resizeMode="contain"
                />
              </View>
              <Text style={styles.brandName}>YANN</Text>
              <View style={styles.divider} />
              
              {/* Welcome Animation */}
              <LottieView
                source={require('../../../assets/lottie/Campers-Welcome.json')}
                autoPlay
                loop
                style={styles.welcomeAnimation}
              />

              <Text style={styles.title}>Welcome Back</Text>
              <Text style={styles.subtitle}>
                Continue your partner experience
              </Text>
            </View>

            {/* Input Form */}
            <View style={styles.form}>
              <Text style={styles.label}>EMAIL OR PHONE NUMBER</Text>
              <View style={[styles.inputContainer, isFocused && styles.inputFocused]}>
                <View style={styles.inputIcon}>
                  <Ionicons 
                    name={inputType === 'phone' ? "call" : "mail"} 
                    size={20} 
                    color={isFocused ? THEME.primary : THEME.textMuted} 
                  />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Email or Phone Number"
                  placeholderTextColor={THEME.textSubtle}
                  value={identifier}
                  onChangeText={setIdentifier}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isLoading}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                />
              </View>

              {/* Continue Button */}
              <TouchableOpacity
                style={[styles.button, isLoading && styles.buttonDisabled]}
                onPress={handleSendOTP}
                disabled={isLoading}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={[THEME.primary, THEME.primaryLight]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.buttonGradient}
                >
                  <Text style={styles.buttonText}>CONTINUE</Text>
                  <View style={styles.buttonIcon}>
                    <Ionicons name="arrow-forward" size={18} color="#FFF" />
                  </View>
                </LinearGradient>
              </TouchableOpacity>

              <Text style={styles.infoText}>
                We'll send a verification code to your email or phone
              </Text>
            </View>

            {/* Sign Up Link */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>New to YANN? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('ProviderSignup')}>
                <Text style={styles.footerLink}>Create Partner Account</Text>
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
          <View style={styles.emailSentContainer}>
            <LottieView
              source={require('../../../assets/lottie/Email-Sent.json')}
              autoPlay
              loop={false}
              style={styles.emailSentAnimation}
            />
            <Text style={styles.emailSentText}>Code Sent!</Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.bg,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  backButton: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: THEME.bgCard,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 20,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  content: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 20,
  },
  header: {
    marginBottom: 48,
  },
  logoContainer: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: THEME.bgCard,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  logoImage: {
    width: 50,
    height: 50,
  },
  brandName: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.accent,
    letterSpacing: 4,
    marginBottom: 20,
  },
  divider: {
    width: 40,
    height: 3,
    backgroundColor: THEME.primary,
    borderRadius: 2,
    marginBottom: 24,
  },
  welcomeAnimation: {
    width: 180,
    height: 180,
    alignSelf: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 40,
    fontWeight: '800',
    color: THEME.text,
    letterSpacing: -1.5,
    lineHeight: 46,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: THEME.textMuted,
    lineHeight: 24,
    marginBottom: 8,
  },
  form: {
    marginBottom: 32,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.text,
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.bgCard,
    borderWidth: 2,
    borderColor: THEME.border,
    borderRadius: 16,
    marginBottom: 28,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  inputFocused: {
    borderColor: THEME.primary,
    shadowColor: THEME.primary,
    shadowOpacity: 0.12,
  },
  inputIcon: {
    width: 52,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: THEME.bgElevated,
  },
  input: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 18,
    fontSize: 16,
    color: THEME.text,
    letterSpacing: 0.3,
  },
  button: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: THEME.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 32,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 1.5,
  },
  buttonIcon: {
    marginLeft: 12,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoText: {
    fontSize: 14,
    color: THEME.textSubtle,
    textAlign: 'center',
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 24,
    paddingBottom: 32,
  },
  footerText: {
    fontSize: 15,
    color: THEME.textMuted,
  },
  footerLink: {
    fontSize: 15,
    color: THEME.primary,
    fontWeight: '700',
  },
  emailSentOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  emailSentContainer: {
    backgroundColor: THEME.bgCard,
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  emailSentAnimation: {
    width: 200,
    height: 200,
  },
  emailSentText: {
    fontSize: 20,
    fontWeight: '700',
    color: THEME.text,
    marginTop: 16,
  },
});
