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
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { apiService } from '../../services/api';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

// YANN Official Website Color Palette
const THEME = {
  bg: '#F6F7FB',              // Background Light
  bgCard: '#FFFFFF',          // Card Background  
  bgInput: '#FFFFFF',         // Input Background
  bgElevated: '#FFFFFF',      // Elevated surfaces
  text: '#1A1C1E',            // Heading Text
  textMuted: '#4A4D52',       // Body Text
  textSubtle: '#9CA3AF',      // Muted text
  primary: '#2E59F3',         // Primary Blue
  accentOrange: '#FF8A3D',    // Accent Orange
  accent: '#2E59F3',          // Accent (same as primary)
  accentSoft: 'rgba(46, 89, 243, 0.12)',
  border: '#E5E7EB',          // Borders
  shadow: 'rgba(46, 89, 243, 0.08)',
};

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

// Service definitions with proper display names
const SERVICES = {
  cleaning: [
    'House Cleaning',
    'Deep House Cleaning',
    'Bathroom Cleaning',
    'Kitchen Cleaning',
    'Carpet Cleaning',
    'Window Cleaning',
    'Move-in/Move-out Cleaning',
  ],
  laundry: [
    'Laundry Service',
    'Dry Cleaning',
    'Ironing Service',
  ],
  pujari: [
    'Pujari Services',
    'Havan Ceremony',
    'Wedding Rituals',
    'Griha Pravesh',
  ],
  driver: [
    'Full-Day Personal Driver',
    'Half-Day Driver',
    'Airport Pickup/Drop',
  ],
  other: [
    'Plumbing',
    'Electrical Work',
    'Carpentry',
    'Painting',
    'Pest Control',
    'AC Repair',
    'Appliance Repair',
    'Garden & Landscaping',
    'Pet Care',
    'Baby Sitting',
    'Elder Care',
    'Personal Assistant',
    'Delivery Services',
  ],
};

const SERVICE_CATEGORIES = [
  {
    id: 'cleaning',
    name: 'Cleaning',
    icon: 'home-outline' as const,
    services: SERVICES.cleaning,
  },
  {
    id: 'laundry',
    name: 'Laundry',
    icon: 'shirt-outline' as const,
    services: SERVICES.laundry,
  },
  {
    id: 'pujari',
    name: 'Pujari',
    icon: 'flame-outline' as const,
    services: SERVICES.pujari,
  },
  {
    id: 'driver',
    name: 'Driver',
    icon: 'car-outline' as const,
    services: SERVICES.driver,
  },
  {
    id: 'other',
    name: 'Other Services',
    icon: 'construct-outline' as const,
    services: SERVICES.other,
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
      const missingPrices = formData.serviceRates.filter(r => !r.price || Number.parseFloat(r.price) <= 0);
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
    // Validation
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Please enter your full name');
      return;
    }
    if (!validatePhone(formData.phone)) {
      Alert.alert('Error', 'Please enter a valid 10-digit phone number');
      return;
    }
    if (!validateEmail(formData.email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }
    if (!formData.experience) {
      Alert.alert('Error', 'Please enter your years of experience');
      return;
    }
    if (formData.services.length === 0) {
      Alert.alert('Error', 'Please select at least one service');
      return;
    }
    
    // Check if all selected services have prices
    const servicesWithoutPrice = formData.services.filter(
      service => !formData.serviceRates.some(r => r.serviceName === service && r.price)
    );
    if (servicesWithoutPrice.length > 0) {
      Alert.alert('Error', 'Please set prices for all selected services');
      return;
    }

    try {
      setIsLoading(true);

      // Extract categories from selected services
      const selectedCategories: string[] = [];
      for (const category of SERVICE_CATEGORIES) {
        const hasServiceInCategory = formData.services.some(service => 
          category.services.includes(service)
        );
        if (hasServiceInCategory) {
          selectedCategories.push(category.id);
        }
      }

      // Match exact website format
      const payload = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        experience: Number(formData.experience),
        services: formData.services,
        serviceRates: formData.serviceRates.map(rate => ({
          serviceName: rate.serviceName,
          price: Number(rate.price)
        })),
        selectedCategories: selectedCategories,
        workingHours: formData.workingHours,
      };

      console.log('🔵 Sending Provider Registration:', JSON.stringify(payload, null, 2));

      await apiService.registerProvider(payload);
      
      console.log('✅ Provider Registration Success');

      Alert.alert(
        'Success! 🎉',
        'Your provider account has been created and is pending approval.',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('PartnerLogin'),
          },
        ]
      );
    } catch (error: any) {
      console.error('❌ Provider Registration Error:', error.response?.data || error.message);
      Alert.alert(
        'Registration Failed',
        error.response?.data?.message || 'Something went wrong. Please try again.'
      );
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
      <StatusBar barStyle="dark-content" backgroundColor={THEME.bg} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={true}
          alwaysBounceVertical={true}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={handleBack}>
              <Ionicons name="arrow-back" size={22} color={THEME.text} />
            </TouchableOpacity>
            <View style={styles.headerCenter}>
              <View style={styles.logoContainer}>
                <Image 
                  source={require('../../../public/download.png')} 
                  style={styles.logoImage}
                  resizeMode="contain"
                />
              </View>
              <Text style={styles.headerTitle}>PROVIDER REGISTRATION</Text>
            </View>
            <View style={{ width: 44 }} />
          </View>

          {renderStepIndicator()}

          {currentStep === 1 && renderStep1()}
          
          {/* Partner Sign-in Link - Below form */}
          {currentStep === 1 && (
            <View style={styles.partnerCtaContainer}>
              <Text style={styles.partnerCtaText}>Already a Partner?</Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('PartnerLogin')}
                activeOpacity={0.7}
                style={styles.partnerLinkButton}
              >
                <Text style={styles.partnerLinkText}>Sign in as Service Partner</Text>
                <Ionicons name="arrow-forward" size={16} color={THEME.primary} style={{ marginLeft: 4 }} />
              </TouchableOpacity>
            </View>
          )}
          
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
  headerCenter: {
    alignItems: 'center',
    gap: 8,
  },
  logoContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  logoImage: {
    width: 24,
    height: 24,
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
    flexShrink: 1,
  },
  serviceChipActive: {
    backgroundColor: THEME.accent,
    borderColor: THEME.accent,
  },
  serviceChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.textMuted,
    flexShrink: 1,
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
  // Partner CTA Styles (Simple Link)
  partnerCtaContainer: {
    marginTop: 24,
    marginBottom: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  partnerCtaText: {
    fontSize: 13,
    color: THEME.textMuted,
    marginBottom: 8,
  },
  partnerLinkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  partnerLinkText: {
    fontSize: 15,
    fontWeight: '600',
    color: THEME.primary,
    letterSpacing: 0.3,
  },
});
