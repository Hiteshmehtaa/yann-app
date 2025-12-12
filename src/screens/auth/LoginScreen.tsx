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
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import LottieView from 'lottie-react-native';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { Toast } from '../../components/Toast';
import { useToast } from '../../hooks/useToast';
import { useAuth } from '../../contexts/AuthContext';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useResponsive } from '../../hooks/useResponsive';

// YANN Official Website Color Palette
const THEME = {
  bg: '#F6F7FB',              // Background Light
  bgCard: '#FFFFFF',          // Card Background
  bgElevated: '#FFFFFF',      // Elevated surfaces
  primary: '#2E59F3',         // Primary Blue
  primaryLight: '#4362FF',    // Gradient end
  accent: '#2E59F3',          // Accent (same as primary)
  accentOrange: '#FF8A3D',    // Accent Orange
  accentYellow: '#F7C948',    // Accent Yellow
  text: '#1A1C1E',            // Heading Text
  textMuted: '#4A4D52',       // Body Text
  textSubtle: '#9CA3AF',      // Muted text
  border: '#E5E7EB',          // Borders
  shadow: 'rgba(46, 89, 243, 0.08)',
};

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

export const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const { width, height, isTablet } = useResponsive();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const { sendOTP } = useAuth();
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

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSendOTP = async () => {
    if (!email.trim()) {
      showError('Please enter your email address');
      return;
    }

    if (!validateEmail(email)) {
      showError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    try {
      await sendOTP(email);
      showSuccess('OTP sent to your email!');
      setTimeout(() => {
        navigation.navigate('VerifyOTP', { email });
      }, 1500);
    } catch (error: any) {
      showError(error.message || 'Failed to send OTP');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor={THEME.bg} />
      
      {/* Toast Notification */}
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={hideToast}
      />
      
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
              
              <Text style={styles.title}>Welcome{'\n'}Back</Text>
              <Text style={styles.subtitle}>
                Continue your premium experience
              </Text>
            </View>

            {/* Form */}
            <View style={styles.form}>
              <Text style={styles.label}>EMAIL ADDRESS</Text>
              <View style={[styles.inputContainer, isFocused && styles.inputFocused]}>
                <View style={styles.inputIcon}>
                  <Ionicons name="mail" size={20} color={isFocused ? THEME.primary : THEME.textMuted} />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="you@example.com"
                  placeholderTextColor={THEME.textSubtle}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
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
                We'll send a verification code to your email
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.bg,
  },
  bgPattern: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  patternCircle1: {
    position: 'absolute',
    top: -100,
    right: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: THEME.accent,
    opacity: 0.03,
  },
  patternCircle2: {
    position: 'absolute',
    bottom: 100,
    left: -150,
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: THEME.accent,
    opacity: 0.02,
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
  logo: {
    width: 44,
    height: 44,
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
    backgroundColor: THEME.accent,
    marginBottom: 20,
    borderRadius: 2,
  },
  welcomeAnimation: {
    width: 180,
    height: 180,
    alignSelf: 'center',
    marginVertical: 10,
  },
  title: {
    fontSize: 42,
    fontWeight: '800',
    color: THEME.text,
    letterSpacing: -2,
    lineHeight: 46,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 15,
    color: THEME.textMuted,
    letterSpacing: 0.5,
  },
  form: {
    marginBottom: 32,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.textMuted,
    letterSpacing: 2,
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
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 20,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 12,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 2,
  },
  buttonIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoText: {
    fontSize: 13,
    color: THEME.textSubtle,
    textAlign: 'center',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 'auto',
    paddingBottom: 20,
  },
  footerText: {
    fontSize: 14,
    color: THEME.textMuted,
  },
  footerLink: {
    fontSize: 14,
    color: THEME.primary,
    fontWeight: '700',
  },
});
