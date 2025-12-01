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
import { apiService } from '../../services/api';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

// Dark Editorial Theme
const THEME = {
  bg: '#0A0A0A',
  bgCard: '#1A1A1A',
  bgInput: '#141414',
  bgElevated: '#242424',
  text: '#F5F0EB',
  textMuted: '#8A8A8A',
  textSubtle: '#555555',
  accent: '#FF6B35',
  accentSoft: 'rgba(255, 107, 53, 0.12)',
  border: '#2A2A2A',
};

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

const SERVICE_CATEGORIES = [
  {
    id: 'cleaning',
    name: 'Cleaning',
    icon: 'home-outline' as const,
    services: ['deep-clean', 'bathroom', 'kitchen', 'laundry', 'carpet', 'window', 'move'],
  },
  {
    id: 'laundry',
    name: 'Laundry',
    icon: 'shirt-outline' as const,
    services: ['laundry'],
  },
  {
    id: 'pujari',
    name: 'Pujari',
    icon: 'flame-outline' as const,
    services: ['pujari', 'specialty'],
  },
  {
    id: 'driver',
    name: 'Driver',
    icon: 'car-outline' as const,
    services: ['driver'],
  },
  {
    id: 'other',
    name: 'Other',
    icon: 'construct-outline' as const,
    services: ['general'],
  },
];

export const ProviderSignupScreen: React.FC<Props> = ({ navigation }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    experience: '',
    services: [] as string[],
    serviceRates: [] as { serviceName: string; price: string }[],
    workingHours: {
      startTime: '09:00',
      endTime: '17:00',
    },
  });

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone: string): boolean => {
    const phoneRegex = /^[6-9]\d{9}$/;
    return phoneRegex.test(phone);
  };

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleService = (service: string) => {
    setFormData(prev => {
      const services = prev.services.includes(service)
        ? prev.services.filter(s => s !== service)
        : [...prev.services, service];
      
      const serviceRates = services.map(s => {
        const existing = prev.serviceRates.find(r => r.serviceName === s);
        return existing || { serviceName: s, price: '' };
      });
      
      return { ...prev, services, serviceRates };
    });
  };

  const updateServiceRate = (serviceName: string, price: string) => {
    setFormData(prev => ({
      ...prev,
      serviceRates: prev.serviceRates.map(rate =>
        rate.serviceName === serviceName ? { ...rate, price } : rate
      ),
    }));
  };

  const handleNext = () => {
    if (currentStep === 1) {
      if (!formData.name.trim()) {
        Alert.alert('Error', 'Please enter your full name');
        return;
      }
      if (!formData.phone.trim() || !validatePhone(formData.phone)) {
        Alert.alert('Error', 'Please enter a valid 10-digit phone number');
        return;
      }
      if (!formData.email.trim() || !validateEmail(formData.email)) {
        Alert.alert('Error', 'Please enter a valid email address');
        return;
      }
      if (!formData.experience.trim()) {
        Alert.alert('Error', 'Please enter your years of experience');
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (formData.services.length === 0) {
        Alert.alert('Error', 'Please select at least one service');
        return;
      }
      setCurrentStep(3);
    } else if (currentStep === 3) {
      const missingPrices = formData.serviceRates.filter(r => !r.price || parseFloat(r.price) <= 0);
      if (missingPrices.length > 0) {
        Alert.alert('Error', 'Please enter valid prices for all selected services');
        return;
      }
      setCurrentStep(4);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      navigation.goBack();
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      const payload = {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        experience: parseInt(formData.experience),
        services: formData.services,
        serviceRates: formData.serviceRates.map(r => ({
          serviceName: r.serviceName,
          price: parseFloat(r.price),
        })),
        workingHours: formData.workingHours,
      };

      await apiService.registerProvider(payload);
      Alert.alert(
        'Registration Submitted',
        'Your provider account has been registered. Please wait for admin verification.',
        [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
      );
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Registration failed';
      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {[1, 2, 3, 4].map(step => (
        <View key={step} style={styles.stepItem}>
          <View style={[styles.stepDot, currentStep >= step && styles.stepDotActive]}>
            {currentStep > step ? (
              <Ionicons name="checkmark" size={14} color="#FFF" />
            ) : (
              <Text style={[styles.stepNumber, currentStep >= step && styles.stepNumberActive]}>
                {step}
              </Text>
            )}
          </View>
          {step < 4 && (
            <View style={[styles.stepLine, currentStep > step && styles.stepLineActive]} />
          )}
        </View>
      ))}
    </View>
  );

  const renderStep1 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Basic Info</Text>
      <Text style={styles.stepSubtitle}>Tell us about yourself</Text>
      
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Full name</Text>
        <View style={styles.inputContainer}>
          <Ionicons name="person-outline" size={18} color={THEME.textMuted} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Enter your full name"
            placeholderTextColor={THEME.textMuted}
            value={formData.name}
            onChangeText={(value) => updateField('name', value)}
            autoCapitalize="words"
            editable={!isLoading}
          />
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Phone number</Text>
        <View style={styles.inputContainer}>
          <Ionicons name="call-outline" size={18} color={THEME.textMuted} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="10-digit phone number"
            placeholderTextColor={THEME.textMuted}
            value={formData.phone}
            onChangeText={(value) => updateField('phone', value)}
            keyboardType="phone-pad"
            maxLength={10}
            editable={!isLoading}
          />
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Email address</Text>
        <View style={styles.inputContainer}>
          <Ionicons name="mail-outline" size={18} color={THEME.textMuted} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Enter email address"
            placeholderTextColor={THEME.textMuted}
            value={formData.email}
            onChangeText={(value) => updateField('email', value)}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!isLoading}
          />
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Years of experience</Text>
        <View style={styles.inputContainer}>
          <Ionicons name="briefcase-outline" size={18} color={THEME.textMuted} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Enter years of experience"
            placeholderTextColor={THEME.textMuted}
            value={formData.experience}
            onChangeText={(value) => updateField('experience', value)}
            keyboardType="numeric"
            editable={!isLoading}
          />
        </View>
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Services</Text>
      <Text style={styles.stepSubtitle}>Select services you can provide</Text>
      
      {SERVICE_CATEGORIES.map(category => (
        <View key={category.id} style={styles.categoryCard}>
          <View style={styles.categoryHeader}>
            <View style={styles.categoryIconContainer}>
              <Ionicons name={category.icon} size={18} color={THEME.accent} />
            </View>
            <Text style={styles.categoryName}>{category.name}</Text>
          </View>
          <View style={styles.servicesGrid}>
            {category.services.map(service => (
              <TouchableOpacity
                key={service}
                style={[
                  styles.serviceChip,
                  formData.services.includes(service) && styles.serviceChipActive,
                ]}
                onPress={() => toggleService(service)}
              >
                <Text
                  style={[
                    styles.serviceChipText,
                    formData.services.includes(service) && styles.serviceChipTextActive,
                  ]}
                >
                  {service}
                </Text>
                {formData.services.includes(service) && (
                  <Ionicons name="checkmark" size={12} color="#FFF" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ))}

      <View style={styles.selectedCount}>
        <Text style={styles.selectedCountText}>
          {formData.services.length} service{formData.services.length === 1 ? '' : 's'} selected
        </Text>
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Pricing</Text>
      <Text style={styles.stepSubtitle}>Set your rates for selected services</Text>
      
      {formData.serviceRates.map(rate => (
        <View key={rate.serviceName} style={styles.priceInputGroup}>
          <Text style={styles.priceLabel}>{rate.serviceName}</Text>
          <View style={styles.priceInputContainer}>
            <Text style={styles.currencySymbol}>₹</Text>
            <TextInput
              style={styles.priceInput}
              placeholder="0"
              placeholderTextColor={THEME.textMuted}
              value={rate.price}
              onChangeText={(value) => updateServiceRate(rate.serviceName, value)}
              keyboardType="numeric"
            />
            <Text style={styles.priceUnit}>per service</Text>
          </View>
        </View>
      ))}
    </View>
  );

  const renderStep4 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Availability</Text>
      <Text style={styles.stepSubtitle}>Set your working hours</Text>
      
      <View style={styles.row}>
        <View style={[styles.inputGroup, styles.halfWidth]}>
          <Text style={styles.label}>Start time</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="09:00"
              placeholderTextColor={THEME.textMuted}
              value={formData.workingHours.startTime}
              onChangeText={(value) => updateField('workingHours', { ...formData.workingHours, startTime: value })}
            />
          </View>
        </View>

        <View style={[styles.inputGroup, styles.halfWidth]}>
          <Text style={styles.label}>End time</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="17:00"
              placeholderTextColor={THEME.textMuted}
              value={formData.workingHours.endTime}
              onChangeText={(value) => updateField('workingHours', { ...formData.workingHours, endTime: value })}
            />
          </View>
        </View>
      </View>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>SUMMARY</Text>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Services</Text>
          <Text style={styles.summaryValue}>{formData.services.length}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Working hours</Text>
          <Text style={styles.summaryValue}>
            {formData.workingHours.startTime} - {formData.workingHours.endTime}
          </Text>
        </View>
      </View>
    </View>
  );

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
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={handleBack}>
              <Ionicons name="arrow-back" size={22} color={THEME.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>PROVIDER REGISTRATION</Text>
            <View style={{ width: 44 }} />
          </View>

          {renderStepIndicator()}

          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
          {currentStep === 4 && renderStep4()}
        </ScrollView>

        {/* Bottom Button */}
        <View style={styles.bottomBar}>
          {currentStep < 4 ? (
            <TouchableOpacity
              style={styles.nextButton}
              onPress={handleNext}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              <Text style={styles.buttonText}>CONTINUE</Text>
              <Ionicons name="arrow-forward" size={18} color="#FFF" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.nextButton}
              onPress={handleSubmit}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              <Text style={styles.buttonText}>COMPLETE REGISTRATION</Text>
              <Ionicons name="checkmark" size={18} color="#FFF" />
            </TouchableOpacity>
          )}
        </View>
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
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: THEME.border,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: THEME.bgCard,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: THEME.border,
  },
  headerTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.text,
    letterSpacing: 1.5,
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 28,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepDot: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: THEME.bgCard,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: THEME.border,
  },
  stepDotActive: {
    backgroundColor: THEME.accent,
    borderColor: THEME.accent,
  },
  stepNumber: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.textMuted,
  },
  stepNumberActive: {
    color: '#FFF',
  },
  stepLine: {
    width: 28,
    height: 2,
    backgroundColor: THEME.border,
    marginHorizontal: 4,
  },
  stepLineActive: {
    backgroundColor: THEME.accent,
  },
  stepContent: {
    paddingHorizontal: 20,
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: THEME.text,
    marginBottom: 6,
    letterSpacing: -1,
  },
  stepSubtitle: {
    fontSize: 14,
    color: THEME.textMuted,
    marginBottom: 28,
  },
  inputGroup: {
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.textMuted,
    marginBottom: 10,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.bgInput,
    borderWidth: 1,
    borderColor: THEME.border,
    borderRadius: 12,
    paddingHorizontal: 14,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
    color: THEME.text,
  },
  categoryCard: {
    backgroundColor: THEME.bgCard,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  categoryIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: THEME.accentSoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  categoryName: {
    fontSize: 15,
    fontWeight: '700',
    color: THEME.text,
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  serviceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: THEME.bgElevated,
    borderWidth: 1,
    borderColor: THEME.border,
    gap: 6,
  },
  serviceChipActive: {
    backgroundColor: THEME.accent,
    borderColor: THEME.accent,
  },
  serviceChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.textMuted,
    textTransform: 'capitalize',
  },
  serviceChipTextActive: {
    color: '#FFF',
  },
  selectedCount: {
    backgroundColor: THEME.accentSoft,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 53, 0.3)',
  },
  selectedCountText: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.accent,
  },
  priceInputGroup: {
    marginBottom: 16,
  },
  priceLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: THEME.text,
    marginBottom: 8,
    textTransform: 'capitalize',
  },
  priceInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.bgInput,
    borderWidth: 1,
    borderColor: THEME.border,
    borderRadius: 12,
    paddingHorizontal: 14,
  },
  currencySymbol: {
    fontSize: 16,
    fontWeight: '700',
    color: THEME.accent,
    marginRight: 4,
  },
  priceInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    fontWeight: '700',
    color: THEME.text,
  },
  priceUnit: {
    fontSize: 12,
    color: THEME.textMuted,
  },
  summaryCard: {
    backgroundColor: THEME.bgCard,
    padding: 20,
    borderRadius: 14,
    marginTop: 16,
    borderWidth: 1,
    borderColor: THEME.accent,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.text,
    marginBottom: 16,
    letterSpacing: 1,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 13,
    color: THEME.textMuted,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.accent,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: THEME.bg,
    borderTopWidth: 1,
    borderTopColor: THEME.border,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.accent,
    borderRadius: 14,
    paddingVertical: 17,
    gap: 10,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
  },
});
