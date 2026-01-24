import React, { useState, useEffect } from 'react';
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
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { apiService } from '../../services/api';
import { COLORS, SPACING, RADIUS, SHADOWS, LAYOUT } from '../../utils/theme';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

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
  const insets = useSafeAreaInsets();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingServices, setIsLoadingServices] = useState(true);
  const [dynamicServiceCategories, setDynamicServiceCategories] = useState(SERVICE_CATEGORIES);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [openExperienceCategory, setOpenExperienceCategory] = useState<string | null>(null);
  const [serviceLimitMap, setServiceLimitMap] = useState<Record<string, any>>({});

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    services: [] as string[],
    serviceRates: [] as { serviceName: string; price: string }[],
    categoryExperience: {} as Record<string, string>,
    workingHours: {
      startTime: '09:00',
      endTime: '17:00',
    },
  });

  const EXPERIENCE_OPTIONS = Array.from({ length: 31 }, (_, i) => i.toString());
  const DEFAULT_MAX_BY_CATEGORY: Record<string, number> = {
    cleaning: 5000,
    laundry: 2000,
    pujari: 25000,
    driver: 2000,
    other: 10000,
  };

  // Load services from DB on mount
  useEffect(() => {
    loadServicesFromDB();
  }, []);

  const loadServicesFromDB = async () => {
    try {
      setIsLoadingServices(true);
      const response = await apiService.getAllServices();

      if (response.data && response.data.length > 0) {
        const limitMap: Record<string, any> = {};
        // Group services by category
        const categoriesMap: Record<string, string[]> = {};

        for (const service of response.data) {
          const category = service.category || 'other';
          if (!categoriesMap[category]) {
            categoriesMap[category] = [];
          }
          categoriesMap[category].push(service.title);
          limitMap[service.title] = {
            category,
            experiencePriceLimits: service.experiencePriceLimits || [],
            maxPrice: service.maxPrice || 0,
          };
        }

        // Build category structure
        const newCategories = Object.keys(categoriesMap).map((catKey) => ({
          id: catKey,
          name: catKey.charAt(0).toUpperCase() + catKey.slice(1),
          icon: getCategoryIcon(catKey),
          services: categoriesMap[catKey],
        }));

        setDynamicServiceCategories(newCategories as any);
        setServiceLimitMap(limitMap);
      }
    } catch (error) {
      console.log('Using fallback services');
    } finally {
      setIsLoadingServices(false);
    }
  };

  const getCategoryIcon = (category: string): keyof typeof Ionicons.glyphMap => {
    const iconMap: Record<string, keyof typeof Ionicons.glyphMap> = {
      cleaning: 'home-outline',
      laundry: 'shirt-outline',
      pujari: 'flame-outline',
      driver: 'car-outline',
      other: 'construct-outline',
    };
    return iconMap[category] || 'grid-outline';
  };

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

  const updateCategoryExperience = (categoryId: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      categoryExperience: {
        ...prev.categoryExperience,
        [categoryId]: value,
      }
    }));
  };

  const getMaxPriceForService = (serviceName: string) => {
    const meta = serviceLimitMap[serviceName] || {};
    const categoryId = meta.category ||
      dynamicServiceCategories.find(category => category.services.includes(serviceName))?.id ||
      'other';

    const expValue = formData.categoryExperience[categoryId];
    const years = Number(expValue || 0);

    const experienceLimits = meta.experiencePriceLimits || [];
    if (Array.isArray(experienceLimits) && experienceLimits.length > 0) {
      const matched = experienceLimits.find((limit: any) => {
        const min = Number(limit.minYears || 0);
        const max = limit.maxYears === null || limit.maxYears === undefined ? null : Number(limit.maxYears);
        return years >= min && (max === null || years < max);
      });
      if (matched && Number(matched.maxPrice) > 0) {
        return Number(matched.maxPrice);
      }
    }

    const configuredMax = Number(meta.maxPrice || 0);
    if (configuredMax > 0) return configuredMax;
    return DEFAULT_MAX_BY_CATEGORY[categoryId] || 0;
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
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (formData.services.length === 0) {
        Alert.alert('Error', 'Please select at least one service');
        return;
      }
      const missingCategoryExperience = dynamicServiceCategories.find(category => {
        const hasSelectedService = formData.services.some(service =>
          category.services.includes(service)
        );
        if (!hasSelectedService) return false;
        const value = formData.categoryExperience[category.id];
        return value === undefined || value === '';
      });
      if (missingCategoryExperience) {
        Alert.alert('Error', `Please select experience for ${missingCategoryExperience.name}`);
        return;
      }
      setCurrentStep(3);
    } else if (currentStep === 3) {
      const missingPrices = formData.serviceRates.filter(r => !r.price || Number.parseFloat(r.price) <= 0);
      if (missingPrices.length > 0) {
        Alert.alert('Error', 'Please enter valid prices for all selected services');
        return;
      }
      const overLimit = formData.serviceRates.find(rate => {
        const maxAllowed = getMaxPriceForService(rate.serviceName);
        const priceValue = Number(rate.price || 0);
        return maxAllowed > 0 && priceValue > maxAllowed;
      });
      if (overLimit) {
        const maxAllowed = getMaxPriceForService(overLimit.serviceName);
        Alert.alert('Error', `Maximum price for ${overLimit.serviceName} is ₹${maxAllowed}`);
        return;
      }
      setCurrentStep(4);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      // Navigate back to RoleSelection screen when on step 1
      navigation.navigate('RoleSelection');
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
    if (formData.services.length === 0) {
      Alert.alert('Error', 'Please select at least one service');
      return;
    }

    const missingCategoryExperience = dynamicServiceCategories.find(category => {
      const hasSelectedService = formData.services.some(service =>
        category.services.includes(service)
      );
      if (!hasSelectedService) return false;
      const value = formData.categoryExperience[category.id];
      return value === undefined || value === '';
    });
    if (missingCategoryExperience) {
      Alert.alert('Error', `Please select experience for ${missingCategoryExperience.name}`);
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

    const overLimit = formData.serviceRates.find(rate => {
      const maxAllowed = getMaxPriceForService(rate.serviceName);
      const priceValue = Number(rate.price || 0);
      return maxAllowed > 0 && priceValue > maxAllowed;
    });
    if (overLimit) {
      const maxAllowed = getMaxPriceForService(overLimit.serviceName);
      Alert.alert('Error', `Maximum price for ${overLimit.serviceName} is ₹${maxAllowed}`);
      return;
    }

    try {
      setIsLoading(true);

      // Extract categories from selected services
      const selectedCategories: string[] = [];
      for (const category of dynamicServiceCategories) {
        const hasServiceInCategory = formData.services.some(service =>
          category.services.includes(service)
        );
        if (hasServiceInCategory) {
          selectedCategories.push(category.id);
        }
      }

      const experienceByService = formData.services.map(serviceName => {
        const category = dynamicServiceCategories.find(cat => cat.services.includes(serviceName));
        const years = category ? Number(formData.categoryExperience[category.id] || 0) : 0;
        return { serviceName, years };
      });

      const derivedExperience = Math.max(
        0,
        ...selectedCategories.map(categoryId => Number(formData.categoryExperience[categoryId] || 0))
      );

      // Match exact website format
      const payload = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        experience: derivedExperience,
        services: formData.services,
        serviceRates: formData.serviceRates.map(rate => ({
          serviceName: rate.serviceName,
          price: Number(rate.price)
        })),
        serviceExperiences: experienceByService,
        selectedCategories: selectedCategories,
        workingHours: formData.workingHours,
      };

      await apiService.registerProvider(payload);

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
        <Text style={styles.label}>FULL NAME</Text>
        <View style={[
          styles.inputContainer,
          focusedField === 'name' && styles.inputFocused
        ]}>
          <View style={styles.inputIcon}>
            <Ionicons
              name="person"
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
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>PHONE NUMBER</Text>
        <View style={[
          styles.inputContainer,
          focusedField === 'phone' && styles.inputFocused
        ]}>
          <View style={styles.inputIcon}>
            <Ionicons
              name="call"
              size={20}
              color={focusedField === 'phone' ? COLORS.primary : COLORS.textTertiary}
            />
          </View>
          <TextInput
            style={styles.input}
            placeholder="10-digit phone number"
            placeholderTextColor={COLORS.textTertiary}
            value={formData.phone}
            onChangeText={(value) => updateField('phone', value)}
            keyboardType="phone-pad"
            maxLength={10}
            editable={!isLoading}
            onFocus={() => setFocusedField('phone')}
            onBlur={() => setFocusedField(null)}
          />
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>EMAIL ADDRESS</Text>
        <View style={[
          styles.inputContainer,
          focusedField === 'email' && styles.inputFocused
        ]}>
          <View style={styles.inputIcon}>
            <Ionicons
              name="mail"
              size={20}
              color={focusedField === 'email' ? COLORS.primary : COLORS.textTertiary}
            />
          </View>
          <TextInput
            style={styles.input}
            placeholder="Enter email address"
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
        </View>
      </View>

    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Services</Text>
      <Text style={styles.stepSubtitle}>Select services you can provide</Text>

      {isLoadingServices ? (
        <LoadingSpinner visible={true} />
      ) : (
        <>
          {dynamicServiceCategories.map(category => (
            <View key={category.id} style={styles.categoryCard}>
              <View style={styles.categoryHeader}>
                <View style={styles.categoryHeaderLeft}>
                  <View style={styles.categoryIconContainer}>
                    <Ionicons name={category.icon} size={18} color={COLORS.primary} />
                  </View>
                  <Text style={styles.categoryName}>{category.name}</Text>
                </View>
                <TouchableOpacity
                  style={styles.experienceDropdown}
                  onPress={() =>
                    setOpenExperienceCategory(prev => (prev === category.id ? null : category.id))
                  }
                  activeOpacity={0.8}
                >
                  <Text style={styles.experienceDropdownText}>
                    Exp: {formData.categoryExperience[category.id] ?? 'Select'}
                    {formData.categoryExperience[category.id] !== undefined && formData.categoryExperience[category.id] !== '' ? ' yrs' : ''}
                  </Text>
                  <Ionicons
                    name={openExperienceCategory === category.id ? 'chevron-up' : 'chevron-down'}
                    size={14}
                    color={COLORS.textSecondary}
                  />
                </TouchableOpacity>
              </View>
              {openExperienceCategory === category.id && (
                <View style={styles.experienceOptions}>
                  {EXPERIENCE_OPTIONS.map(option => (
                    <TouchableOpacity
                      key={option}
                      style={[
                        styles.experienceOption,
                        formData.categoryExperience[category.id] === option && styles.experienceOptionActive,
                      ]}
                      onPress={() => {
                        updateCategoryExperience(category.id, option);
                        setOpenExperienceCategory(null);
                      }}
                    >
                      <Text
                        style={[
                          styles.experienceOptionText,
                          formData.categoryExperience[category.id] === option && styles.experienceOptionTextActive,
                        ]}
                      >
                        {option} yrs
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
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
        </>
      )}

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
          <View style={[styles.inputContainer, styles.priceInputContainer]}>
            <Text style={styles.currencySymbol}>₹</Text>
            <TextInput
              style={styles.priceInput}
              placeholder="0"
              placeholderTextColor={COLORS.textTertiary}
              value={rate.price}
              onChangeText={(value) => updateServiceRate(rate.serviceName, value)}
              keyboardType="numeric"
            />
            <Text style={styles.priceUnit}>per service</Text>
          </View>
          {getMaxPriceForService(rate.serviceName) > 0 && (
            <Text style={styles.maxPriceInfo}>
              Max allowed: ₹{getMaxPriceForService(rate.serviceName)} (based on your experience)
            </Text>
          )}
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
          <Text style={styles.label}>START TIME</Text>
          <View style={styles.inputContainer}>
            <View style={styles.inputIcon}>
              <Ionicons name="time" size={20} color={COLORS.textTertiary} />
            </View>
            <TextInput
              style={styles.input}
              placeholder="09:00"
              placeholderTextColor={COLORS.textTertiary}
              value={formData.workingHours.startTime}
              onChangeText={(value) => updateField('workingHours', { ...formData.workingHours, startTime: value })}
            />
          </View>
        </View>

        <View style={[styles.inputGroup, styles.halfWidth]}>
          <Text style={styles.label}>END TIME</Text>
          <View style={styles.inputContainer}>
            <View style={styles.inputIcon}>
              <Ionicons name="time" size={20} color={COLORS.textTertiary} />
            </View>
            <TextInput
              style={styles.input}
              placeholder="17:00"
              placeholderTextColor={COLORS.textTertiary}
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
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      {/* Background pattern */}
      <View style={styles.bgPattern}>
        <View style={styles.patternCircle1} />
        <View style={styles.patternCircle2} />
      </View>

      {/* Back Button */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={handleBack}
        activeOpacity={0.7}
      >
        <Ionicons name="arrow-back" size={24} color={COLORS.text} />
      </TouchableOpacity>

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
            <View style={styles.logoContainer}>
              <Image
                source={require('../../../public/Logo.jpg')}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.brandName}>YANN</Text>
            <Text style={styles.title}>Provider Sign Up</Text>
            <Text style={styles.subtitle}>
              Join YANN as a service partner
            </Text>
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
                <Text style={styles.partnerLinkText}>Sign in</Text>
                <Ionicons name="arrow-forward" size={14} color={COLORS.primary} style={{ marginLeft: 4 }} />
              </TouchableOpacity>
            </View>
          )}

          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
          {currentStep === 4 && renderStep4()}
        </ScrollView>

        {/* Bottom Button */}
        <View style={[styles.bottomBar, { paddingBottom: Platform.OS === 'ios' ? insets.bottom : insets.bottom + 20 }]}>
          {currentStep < 4 ? (
            <TouchableOpacity
              style={styles.nextButton}
              onPress={handleNext}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[COLORS.primary, COLORS.primaryGradientEnd]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.buttonGradient}
              >
                <Text style={styles.buttonText}>CONTINUE</Text>
                <Ionicons name="arrow-forward" size={18} color="#FFF" />
              </LinearGradient>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.nextButton}
              onPress={handleSubmit}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[COLORS.primary, COLORS.primaryGradientEnd]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.buttonGradient}
              >
                <Text style={styles.buttonText}>COMPLETE REGISTRATION</Text>
                <Ionicons name="checkmark" size={18} color="#FFF" />
              </LinearGradient>
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
    backgroundColor: COLORS.background,
  },
  bgPattern: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    zIndex: -1,
  },
  patternCircle1: {
    position: 'absolute',
    top: -100,
    right: -50,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: COLORS.primary,
    opacity: 0.04,
  },
  patternCircle2: {
    position: 'absolute',
    bottom: 50,
    left: -100,
    width: 350,
    height: 350,
    borderRadius: 175,
    backgroundColor: COLORS.accentOrange,
    opacity: 0.03,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 120, // Space for bottom bar
  },
  backButton: {
    position: 'absolute',
    top: 16,
    left: 16,
    zIndex: 50,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.sm,
  },
  header: {
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 40,
  },
  logoContainer: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    ...SHADOWS.sm,
  },
  logoImage: {
    width: 40,
    height: 40,
  },
  brandName: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
    letterSpacing: 4,
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 8,
    letterSpacing: -1,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    letterSpacing: 0.2,
    textAlign: 'center',
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepDot: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  stepDotActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  stepNumber: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textTertiary,
  },
  stepNumberActive: {
    color: '#FFF',
  },
  stepLine: {
    width: 28,
    height: 2,
    backgroundColor: COLORS.border,
    marginHorizontal: 4,
  },
  stepLineActive: {
    backgroundColor: COLORS.primary,
  },
  stepContent: {
    paddingHorizontal: 28,
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 6,
    letterSpacing: -1,
    textAlign: 'center',
  },
  stepSubtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: 28,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  inputGroup: {
    marginBottom: 20,
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
    color: COLORS.textTertiary,
    marginBottom: 10,
    marginLeft: 4,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: RADIUS.medium,
    overflow: 'hidden',
    height: 56,
  },
  inputFocused: {
    borderColor: COLORS.primary,
    backgroundColor: '#F8FAFF',
  },
  inputIcon: {
    width: 50,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    height: '100%',
    paddingRight: 16,
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.text,
  },
  priceInputGroup: {
    marginBottom: 16,
  },
  priceLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  priceInputContainer: {
    paddingHorizontal: 16,
  },
  priceInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    paddingVertical: 10,
  },
  currencySymbol: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textTertiary,
    marginRight: 8,
  },
  priceUnit: {
    fontSize: 12,
    color: COLORS.textTertiary,
  },
  maxPriceInfo: {
    marginTop: 6,
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  categoryCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.medium,
    marginBottom: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  categoryHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#F0F4FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  categoryName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  experienceDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
    gap: 6,
  },
  experienceDropdownText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  experienceOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  experienceOption: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
    marginRight: 8,
    marginBottom: 8,
  },
  experienceOptionActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  experienceOptionText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  experienceOptionTextActive: {
    color: '#FFF',
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  serviceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  serviceChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  serviceChipText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginRight: 4,
  },
  serviceChipTextActive: {
    color: '#FFF',
    fontWeight: '600',
  },
  selectedCount: {
    alignItems: 'center',
    marginTop: 10,
  },
  selectedCountText: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '600',
  },
  summaryCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.medium,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  summaryTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textTertiary,
    letterSpacing: 1.5,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  partnerCtaContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 10,
    gap: 6,
  },
  partnerCtaText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  partnerLinkButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  partnerLinkText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '700',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    paddingHorizontal: 20,
    paddingTop: 20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 20,
  },
  nextButton: {
    borderRadius: RADIUS.medium,
    overflow: 'hidden',
    ...SHADOWS.md,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 10,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
