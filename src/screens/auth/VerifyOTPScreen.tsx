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
import { GlassCard } from '../../components/ui/GlassCard';
import { NeoButton } from '../../components/ui/NeoButton';
import { LiquidBackground } from '../../components/ui/LiquidBackground';
import { LottieAnimations } from '../../utils/lottieAnimations';
import Reanimated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withSpring,
  withTiming,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { useResponsive } from '../../hooks/useResponsive';

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

export const VerifyOTPScreen: React.FC<Props> = ({ navigation, route }) => {
  const { width: screenWidth, height: screenHeight, isTablet } = useResponsive();
  const insets = useSafeAreaInsets();
  const params = route.params || {};
  const identifier = params.identifier || params.email || '';
  const identifierType = params.identifierType || 'email';
  const isSignup = params.isSignup;
  const isPartner = params.isPartner;
  const signupData = params.signupData;

  const [otp, setOTP] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
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

      <LiquidBackground mode="light" />

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
              <View style={styles.brandNameContainer}>
                {"YANN".split('').map((item, idx) => (
                  <AnimatedLetter key={"Verify-" + idx} letter={item} index={idx} />
                ))}
              </View>
              <View style={styles.taglineRow}>
                <View style={styles.taglineLine} />
                <Text style={styles.tagline}>SIGNATURE LUXURY</Text>
                <View style={styles.taglineLine} />
              </View>

              <Text style={styles.title}>Security Verification</Text>
              <Text style={styles.subtitle}>
                A premium code has been sent to{"\n"}
                <Text style={styles.highlight}>{identifier}</Text>
              </Text>
            </View>

            {/* OTP Form Panel */}
            <GlassCard 
              intensity={85} 
              style={styles.formCard} 
              enableTilt 
              glowColor="rgba(59, 130, 246, 0.05)"
            >
              <View style={styles.formContainer}>
                <View style={[
                  styles.fieldGlass,
                  focusedField === 'otp' && { backgroundColor: 'rgba(59, 130, 246, 0.03)' }
                ]}>
                  <Text style={styles.inputLabel}>VERIFICATION CODE</Text>
                  <View style={styles.inputRow}>
                    <View style={[styles.iconCircle, focusedField === 'otp' && { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}>
                      <Ionicons 
                        name="shield-checkmark-outline" 
                        size={18} 
                        color={focusedField === 'otp' ? COLORS.primary : COLORS.textTertiary} 
                      />
                    </View>
                    <View style={styles.inputContainer}>
                      <TextInput
                        style={styles.input}
                        placeholder="000 000"
                        placeholderTextColor={addAlpha(COLORS.textTertiary, 0.4)}
                        value={otp}
                        onChangeText={setOTP}
                        keyboardType="number-pad"
                        maxLength={6}
                        editable={!isLoading}
                        autoFocus
                        onFocus={() => setFocusedField('otp')}
                        onBlur={() => setFocusedField(null)}
                        textContentType={identifierType === 'phone' ? 'oneTimeCode' : 'none'}
                        autoComplete={identifierType === 'phone' ? 'sms-otp' : 'off'}
                      />
                    </View>
                  </View>
                </View>

                <NeoButton
                  title={isLoading ? "VERIFYING..." : "VERIFY ACCOUNT"}
                  onPress={handleVerifyOTP}
                  disabled={isLoading || otp.length < 4}
                  variant="primary"
                  size="large"
                  style={styles.verifyButton}
                  icon={!isLoading && <Ionicons name="checkmark-circle" size={18} color="#fff" />}
                />
              </View>
            </GlassCard>

            {/* Resend Options */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>Haven't received the code?</Text>
              <View style={styles.resendActions}>
                <TouchableOpacity
                  onPress={handleResendOTP}
                  disabled={resending || isLoading}
                  style={styles.resendButton}
                >
                  <Text style={[styles.resendLink, (resending || isLoading) && styles.disabledText]}>
                    {resending ? 'SENDING...' : 'RESEND SMS'}
                  </Text>
                </TouchableOpacity>

                <View style={styles.dotSeparator} />

                <TouchableOpacity
                  onPress={async () => {
                    try {
                      setIsLoading(true);
                      await apiService.requestCallOTP(identifier);
                      Alert.alert('Call Requested', 'Our concierge will call you shortly with your code.');
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
                    GET A CALL
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
    backgroundColor: '#F6F8FC',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.1)',
  },
  content: {
    flex: 1,
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
    lineHeight: 20,
  },
  highlight: {
    fontWeight: '700',
    color: COLORS.primary,
  },
  formContainer: {
    padding: 4,
  },
  formCard: {
    borderRadius: 32,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 40,
  },
  fieldGlass: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderRadius: 28,
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.textTertiary,
    letterSpacing: 1.5,
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: 'rgba(59, 130, 246, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  input: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0F172A',
    height: 44,
    letterSpacing: 10,
    padding: 0,
  },
  verifyButton: {
    marginTop: 8,
  },
  footer: {
    alignItems: 'center',
    paddingBottom: 20,
  },
  footerText: {
    fontSize: 14,
    color: COLORS.textTertiary,
    fontWeight: '500',
    marginBottom: 16,
  },
  resendActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  resendButton: {
    paddingVertical: 8,
  },
  resendLink: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: 1,
  },
  disabledText: {
    color: COLORS.textTertiary,
    opacity: 0.5,
  },
  dotSeparator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(15, 23, 42, 0.1)',
  },
});
