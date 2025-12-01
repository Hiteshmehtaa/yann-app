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
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';

// Dark Editorial Theme
const THEME = {
  bg: '#0A0A0A',
  bgCard: '#1A1A1A',
  bgInput: '#141414',
  text: '#F5F0EB',
  textMuted: '#8A8A8A',
  textSubtle: '#555555',
  accent: '#FF6B35',
  accentSoft: 'rgba(255, 107, 53, 0.12)',
  border: '#2A2A2A',
};

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
      <StatusBar barStyle="light-content" backgroundColor={THEME.bg} />
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
            <Ionicons name="arrow-back" size={22} color={THEME.text} />
          </TouchableOpacity>

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Ionicons name="shield-checkmark" size={28} color={THEME.accent} />
            </View>
            <Text style={styles.title}>Verify Email</Text>
            <Text style={styles.subtitle}>
              We've sent a 6-digit code to
            </Text>
            <Text style={styles.email}>{email}</Text>
          </View>

          {/* OTP Input */}
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>VERIFICATION CODE</Text>
              <TextInput
                style={styles.input}
                placeholder="• • • • • •"
                placeholderTextColor={THEME.textSubtle}
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
              <Text style={styles.buttonText}>VERIFY</Text>
              <Ionicons name="checkmark" size={18} color="#FFF" />
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
    backgroundColor: THEME.bg,
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
    borderRadius: 14,
    backgroundColor: THEME.bgCard,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  header: {
    alignItems: 'center',
    marginTop: 48,
    marginBottom: 52,
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: THEME.accentSoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 28,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: THEME.text,
    marginBottom: 14,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 14,
    color: THEME.textMuted,
  },
  email: {
    fontSize: 15,
    fontWeight: '700',
    color: THEME.accent,
    marginTop: 6,
  },
  form: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: 28,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.textMuted,
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: 1.5,
  },
  input: {
    backgroundColor: THEME.bgInput,
    borderWidth: 1,
    borderColor: THEME.border,
    borderRadius: 16,
    paddingVertical: 22,
    fontSize: 28,
    color: THEME.text,
    textAlign: 'center',
    letterSpacing: 16,
    fontWeight: '700',
  },
  button: {
    flexDirection: 'row',
    backgroundColor: THEME.accent,
    borderRadius: 14,
    paddingVertical: 17,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 28,
  },
  resendText: {
    fontSize: 14,
    color: THEME.textMuted,
  },
  resendLink: {
    fontSize: 14,
    color: THEME.accent,
    fontWeight: '700',
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
    fontSize: 14,
    color: THEME.textSubtle,
    fontWeight: '500',
  },
});
