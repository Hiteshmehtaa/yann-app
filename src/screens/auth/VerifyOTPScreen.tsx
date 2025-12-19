import React, { useState } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import LottieView from 'lottie-react-native';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { AnimatedButton } from '../../components/AnimatedButton';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';

type Props = {
  navigation: NativeStackNavigationProp<any>;
  route: RouteProp<{ params: { 
    email: string; 
    isSignup?: boolean;
    isPartner?: boolean;
    signupData?: { name: string; phone?: string };
  } }, 'params'>;
};

export const VerifyOTPScreen: React.FC<Props> = ({ navigation, route }) => {
  const { email, isSignup, isPartner, signupData } = route.params;
  const [otp, setOTP] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const { login, loginAsProvider, sendOTP, sendProviderOTP } = useAuth();

  const handleVerifyOTP = async () => {
    if (!otp.trim() || otp.length < 4) {
      Alert.alert('Error', 'Please enter a valid OTP');
      return;
    }

    setIsLoading(true);
    try {
      if (isPartner) {
        // Use provider-specific login
        await loginAsProvider(email, otp);
      } else {
        // Use homeowner login
        await login(email, otp, isSignup ? 'signup' : 'login');
      }
      // Navigation will be handled by the auth state change
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
        await sendProviderOTP(email);
      } else if (isSignup && signupData) {
        await apiService.sendSignupOTP(email, signupData);
      } else {
        await sendOTP(email);
      }
      Alert.alert('Success', 'OTP has been resent to your email');
      setOTP('');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to resend OTP');
    } finally {
      setResending(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F9FB" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
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
            disabled={isLoading}
          >
            <Ionicons name="arrow-back" size={22} color="#1A1D29" />
          </TouchableOpacity>

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Ionicons name="shield-checkmark" size={40} color="#2E59F3" />
            </View>
            <Text style={styles.title}>Verify Your Code</Text>
            <Text style={styles.subtitle}>
              We've sent a 6-digit code to
            </Text>
            <Text style={styles.email}>{email}</Text>
          </View>

          {/* OTP Input */}
          <View style={styles.formCard}>
            <Text style={styles.label}>ENTER CODE</Text>
            <TextInput
              style={styles.input}
              placeholder="000000"
              placeholderTextColor="#D1D5DB"
              value={otp}
              onChangeText={setOTP}
              keyboardType="number-pad"
              maxLength={6}
              editable={!isLoading}
              autoFocus
            />

            {/* Resend OTP */}
            <View style={styles.resendContainer}>
              <Text style={styles.resendText}>Didn't receive the code? </Text>
              <TouchableOpacity
                onPress={handleResendOTP}
                disabled={resending || isLoading}
              >
                <Text
                  style={[
                    styles.resendLink,
                    (resending || isLoading) && styles.resendLinkDisabled,
                  ]}
                >
                  {resending ? 'Sending...' : 'Resend'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Verify Button */}
          <AnimatedButton
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleVerifyOTP}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>Verify & Continue</Text>
            <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
          </AnimatedButton>
        </ScrollView>
      </KeyboardAvoidingView>
      <LoadingSpinner visible={isLoading || resending} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FB',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconContainer: {
    width: 88,
    height: 88,
    borderRadius: 16,
    backgroundColor: '#E8EEFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#2E59F3',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1A1D29',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 6,
  },
  email: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2E59F3',
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6B7280',
    letterSpacing: 1,
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#F8F9FB',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    paddingVertical: 18,
    fontSize: 28,
    color: '#1A1D29',
    marginBottom: 20,
    textAlign: 'center',
    letterSpacing: 8,
    fontWeight: '700',
  },
  emailAnimation: {
    width: 150,
    height: 150,
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resendText: {
    fontSize: 14,
    color: '#6B7280',
  },
  resendLink: {
    fontSize: 14,
    color: '#2E59F3',
    fontWeight: '700',
  },
  resendLinkDisabled: {
    opacity: 0.5,
  },
  button: {
    flexDirection: 'row',
    backgroundColor: '#2E59F3',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#2E59F3',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
});
