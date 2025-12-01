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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';
import { COLORS } from '../../utils/theme';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';

type Props = {
  navigation: NativeStackNavigationProp<any>;
  route: RouteProp<{ params: { 
    email: string; 
    isSignup?: boolean;
    signupData?: { name: string; phone?: string };
  } }, 'params'>;
};

export const VerifyOTPScreen: React.FC<Props> = ({ navigation, route }) => {
  const { email, isSignup, signupData } = route.params;
  const [otp, setOTP] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const { login, sendOTP } = useAuth();

  const handleVerifyOTP = async () => {
    if (!otp.trim() || otp.length < 4) {
      Alert.alert('Error', 'Please enter a valid OTP');
      return;
    }

    setIsLoading(true);
    try {
      await login(email, otp, isSignup ? 'signup' : 'login');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Invalid OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setResending(true);
    try {
      if (isSignup && signupData) {
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
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Back Button */}
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            disabled={isLoading}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Ionicons name="shield-checkmark" size={32} color={COLORS.primary} />
            </View>
            <Text style={styles.title}>Verify Your Email</Text>
            <Text style={styles.subtitle}>
              We've sent a 6-digit code to
            </Text>
            <Text style={styles.email}>{email}</Text>
          </View>

          {/* OTP Input */}
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Enter verification code</Text>
              <TextInput
                style={styles.input}
                placeholder="------"
                placeholderTextColor={COLORS.textMuted}
                value={otp}
                onChangeText={setOTP}
                keyboardType="number-pad"
                maxLength={6}
                editable={!isLoading}
                autoFocus
              />
            </View>

            <TouchableOpacity
              style={[styles.button, isLoading && styles.buttonDisabled]}
              onPress={handleVerifyOTP}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              <Text style={styles.buttonText}>Verify</Text>
              <Ionicons name="checkmark" size={20} color={COLORS.white} />
            </TouchableOpacity>

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

          {/* Change Email */}
          <TouchableOpacity
            style={styles.changeEmailButton}
            onPress={() => navigation.goBack()}
            disabled={isLoading}
          >
            <Text style={styles.changeEmailText}>Change email address</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
      <LoadingSpinner visible={isLoading || resending} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  header: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 48,
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.textSecondary,
  },
  email: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.primary,
    marginTop: 4,
  },
  form: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  input: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingVertical: 20,
    fontSize: 28,
    color: COLORS.text,
    textAlign: 'center',
    letterSpacing: 16,
    fontWeight: '600',
  },
  button: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  resendText: {
    fontSize: 15,
    color: COLORS.textSecondary,
  },
  resendLink: {
    fontSize: 15,
    color: COLORS.primary,
    fontWeight: '600',
  },
  resendLinkDisabled: {
    opacity: 0.5,
  },
  changeEmailButton: {
    alignItems: 'center',
    paddingVertical: 16,
    marginTop: 'auto',
  },
  changeEmailText: {
    fontSize: 15,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
});
