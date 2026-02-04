import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  ScrollView,
  StatusBar,
  Image,
  LayoutAnimation,
  UIManager,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { apiService } from '../../services/api';
import { SERVICES as DB_SERVICES } from '../../utils/constants';
import {
  COLORS,
  SPACING,
  RADIUS,
  SHADOWS,
  LAYOUT,
  TYPOGRAPHY,
  GRADIENTS,
  addAlpha
} from '../../utils/theme';
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

  useEffect(() => {
    if (Platform.OS === 'android') {
      if (UIManager.setLayoutAnimationEnabledExperimental) {
        UIManager.setLayoutAnimationEnabledExperimental(true);
      }
    }
  }, []);

  const changeStep = (step: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setCurrentStep(step);
  };
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingServices, setIsLoadingServices] = useState(true);
  const [dynamicServiceCategories, setDynamicServiceCategories] = useState(SERVICE_CATEGORIES);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [openExperienceCategory, setOpenExperienceCategory] = useState<string | null>(null);
  const [serviceLimitMap, setServiceLimitMap] = useState<Record<string, any>>({});
  const [validationState, setValidationState] = useState<Record<string, 'valid' | 'invalid' | null>>({});

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
    // Driver specific fields
    vehicleTypes: [] as string[],
    transmissionTypes: [] as string[],
    tripPreference: 'both',
  });

  const VEHICLE_TYPES = [
    { id: 'hatchback', label: 'Hatchback (Swift, i20, Alto)' },
    { id: 'sedan', label: 'Sedan (Dzire, Etios, City)' },
    { id: 'suv', label: 'SUV (Innova, Ertiga, Scorpio)' },
    { id: 'luxury', label: 'Luxury (Mercedes, BMW, Audi)' },
    { id: 'van', label: 'Tempo / Van' }
  ];

  const TRANSMISSION_TYPES = [
    { id: 'manual', label: 'Manual' },
    { id: 'automatic', label: 'Automatic' }
  ];

  const TRIP_PREFERENCES = [
    { id: 'incity', label: 'In-City' },
    { id: 'outstation', label: 'Outstation' },
    { id: 'both', label: 'Both' }
  ];

  const EXPERIENCE_OPTIONS = Array.from({ length: 31 }, (_, i) => i.toString());
  const DEFAULT_MAX_BY_CATEGORY: Record<string, number> = {
    cleaning: 5000,
    laundry: 2000,
    pujari: 25000,
    driver: 2500,
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
          const category = (service.category || 'other').toLowerCase();
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
      console.log('Using fallback services from constants');

      // Fallback data from local constants (Database source of truth)
      const categoriesMap: Record<string, string[]> = {};
      const limitMap: Record<string, any> = {};

      DB_SERVICES.forEach((s: any) => {
        const service = s as any;
        const category = (service.category || 'other').toLowerCase();
        if (!categoriesMap[category]) {
          categoriesMap[category] = [];
        }
        categoriesMap[category].push(service.title);
        limitMap[service.title] = {
          category,
          experiencePriceLimits: service.experiencePriceLimits || [],
          maxPrice: service.maxPrice || 0,
        };
      });

      const fallbackCategories = Object.keys(categoriesMap).map((catKey) => ({
        id: catKey,
        name: catKey.charAt(0).toUpperCase() + catKey.slice(1),
        icon: getCategoryIcon(catKey),
        services: categoriesMap[catKey],
      }));

      setDynamicServiceCategories(fallbackCategories as any);
      setServiceLimitMap(limitMap);
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
    // Real-time validation
    if (field === 'email' && value) {
      setValidationState(prev => ({ ...prev, email: validateEmail(value) ? 'valid' : 'invalid' }));
    } else if (field === 'phone' && value) {
      setValidationState(prev => ({ ...prev, phone: validatePhone(value) ? 'valid' : 'invalid' }));
    } else if (field === 'name' && value) {
      setValidationState(prev => ({ ...prev, name: value.trim().length > 0 ? 'valid' : 'invalid' }));
    }
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
      changeStep(2);
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
      changeStep(3);
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
      changeStep(4);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      changeStep(currentStep - 1);
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
        driverServiceDetails: {
          vehicleTypes: formData.vehicleTypes,
          transmissionTypes: formData.transmissionTypes,
          tripPreference: formData.tripPreference
        }
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
    <View style={styles.stepIndicatorContainer}>
      <View style={styles.stepIndicator}>
        {[1, 2, 3, 4].map((step, index) => {
          const isActive = currentStep >= step;
          const isCurrent = currentStep === step;

          return (
            <React.Fragment key={step}>
              <View style={styles.stepItem}>
                <View style={[
                  styles.stepDot,
                  isActive && styles.stepDotActive,
                ]}>
                  {isActive ? (
                    isCurrent ? (
                      <Text style={[styles.stepNumber, styles.stepNumberActive]}>{step}</Text>
                    ) : (
                      <Ionicons name="checkmark" size={16} color="#FFF" />
                    )
                  ) : (
                    <Text style={styles.stepNumber}>{step}</Text>
                  )}
                </View>
                <Text style={[styles.stepLabel, isActive && styles.stepLabelActive]}>
                  {step === 1 ? 'Bio' : step === 2 ? 'Services' : step === 3 ? 'Rates' : 'Hours'}
                </Text>
              </View>
              {step < 4 && (
                <View style={[styles.stepLine, isActive && styles.stepLineActive]} />
              )}
            </React.Fragment>
          );
        })}
      </View>
    </View>
  );

  const renderStep1 = () => (
    <View style={styles.animatableContent}>
      <Text style={styles.stepTitle}>Profile Details</Text>
      <Text style={styles.stepSubtitle}>Let's get your professional profile set up</Text>

      <View style={styles.card}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>FULL NAME</Text>
          <View style={[
            styles.inputContainer,
            focusedField === 'name' && styles.inputFocused,
            validationState.name === 'invalid' && styles.inputError
          ]}>
            <View style={[styles.inputIcon, focusedField === 'name' && styles.inputIconFocused]}>
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
            {validationState.name === 'valid' && (
              <View style={styles.validationIcon}>
                <Ionicons name="checkmark-circle" size={18} color={COLORS.success} />
              </View>
            )}
          </View>
        </View>

        {/* Mobile Number */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>MOBILE NUMBER</Text>
          <View style={[
            styles.inputContainer,
            focusedField === 'phone' && styles.inputFocused,
            validationState.phone === 'invalid' && styles.inputError
          ]}>
            <View style={[styles.inputIcon, focusedField === 'phone' && styles.inputIconFocused]}>
              <Ionicons
                name="call-outline"
                size={20}
                color={focusedField === 'phone' ? COLORS.primary : COLORS.textTertiary}
              />
            </View>
            <TextInput
              style={styles.input}
              placeholder="10-digit mobile number"
              placeholderTextColor={COLORS.textTertiary}
              value={formData.phone}
              onChangeText={(value) => updateField('phone', value)}
              keyboardType="phone-pad"
              maxLength={10}
              editable={!isLoading}
              onFocus={() => setFocusedField('phone')}
              onBlur={() => setFocusedField(null)}
            />
            {validationState.phone === 'valid' && (
              <View style={styles.validationIcon}>
                <Ionicons name="checkmark-circle" size={18} color={COLORS.success} />
              </View>
            )}
          </View>
          {validationState.phone === 'invalid' && (
            <Text style={styles.validationError}>Please enter a valid 10-digit number</Text>
          )}
        </View>

        {/* Email Address */}
        <View style={[styles.inputGroup, { marginBottom: 0 }]}>
          <Text style={styles.label}>EMAIL ADDRESS</Text>
          <View style={[
            styles.inputContainer,
            focusedField === 'email' && styles.inputFocused,
            validationState.email === 'invalid' && styles.inputError
          ]}>
            <View style={[styles.inputIcon, focusedField === 'email' && styles.inputIconFocused]}>
              <Ionicons
                name="mail-outline"
                size={20}
                color={focusedField === 'email' ? COLORS.primary : COLORS.textTertiary}
              />
            </View>
            <TextInput
              style={styles.input}
              placeholder="name@example.com"
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
            {validationState.email === 'valid' && (
              <View style={styles.validationIcon}>
                <Ionicons name="checkmark-circle" size={18} color={COLORS.success} />
              </View>
            )}
          </View>
          {validationState.email === 'invalid' && (
            <Text style={styles.validationError}>Please enter a valid email address</Text>
          )}
        </View>
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.animatableContent}>
      <Text style={styles.stepTitle}>Select Services</Text>
      <Text style={styles.stepSubtitle}>Choose the services you want to provide</Text>

      {isLoadingServices ? (
        <LoadingSpinner visible={true} />
      ) : (
        <>
          {dynamicServiceCategories.map(category => (
            <View key={category.id} style={styles.categoryCard}>
              <View style={styles.categoryHeader}>
                <View style={styles.categoryHeaderLeft}>
                  <View style={styles.categoryIconContainer}>
                    <Ionicons name={category.icon} size={20} color={COLORS.primary} />
                  </View>
                  <Text style={styles.categoryName}>{category.name}</Text>
                </View>
                <TouchableOpacity
                  style={styles.experienceDropdown}
                  onPress={() =>
                    setOpenExperienceCategory(prev => (prev === category.id ? null : category.id))
                  }
                  activeOpacity={0.7}
                >
                  <Text style={styles.experienceDropdownText}>
                    {formData.categoryExperience[category.id]
                      ? `${formData.categoryExperience[category.id]} yrs exp`
                      : 'add experience'}
                  </Text>
                  <Ionicons
                    name={openExperienceCategory === category.id ? 'chevron-up' : 'chevron-down'}
                    size={16}
                    color={COLORS.primary}
                  />
                </TouchableOpacity>
              </View>

              {openExperienceCategory === category.id && (
                <View style={styles.experienceOptionsContainer}>
                  <Text style={styles.experienceLabel}>Years of Experience:</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.experienceScroll}>
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
                          {option}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}

              <View style={styles.servicesGrid}>
                {category.services.map(service => {
                  const isSelected = formData.services.includes(service);
                  return (
                    <TouchableOpacity
                      key={service}
                      style={[
                        styles.serviceChip,
                        isSelected && styles.serviceChipActive,
                      ]}
                      onPress={() => toggleService(service)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.serviceChipText,
                          isSelected && styles.serviceChipTextActive,
                        ]}
                      >
                        {service}
                      </Text>
                      {isSelected && (
                        <View style={styles.checkIconContainer}>
                          <Ionicons name="checkmark" size={10} color="#FFF" />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ))}
        </>
      )}

      {/* Driver Specific Options */}
      {formData.services.some(s => {
        const cat = dynamicServiceCategories.find(c => c.services.includes(s));
        return cat && cat.id.toLowerCase() === 'driver';
      }) && (
          <View style={styles.driverSectionCard}>
            <View style={styles.sectionHeaderContainer}>
              <View style={styles.sectionIcon}>
                <Ionicons name="car-sport" size={20} color={COLORS.primary} />
              </View>
              <Text style={styles.sectionHeaderTitle}>Driver Details</Text>
            </View>

            {/* Vehicle Types */}
            <View style={styles.driverOptionGroup}>
              <Text style={styles.subLabel}>What vehicles do you drive?</Text>
              <View style={styles.chipContainer}>
                {VEHICLE_TYPES.map(type => (
                  <TouchableOpacity
                    key={type.id}
                    style={[
                      styles.chip,
                      formData.vehicleTypes.includes(type.id) && styles.chipActive
                    ]}
                    onPress={() => {
                      setFormData(prev => ({
                        ...prev,
                        vehicleTypes: prev.vehicleTypes.includes(type.id)
                          ? prev.vehicleTypes.filter(t => t !== type.id)
                          : [...prev.vehicleTypes, type.id]
                      }));
                    }}
                  >
                    <Text style={[
                      styles.chipText,
                      formData.vehicleTypes.includes(type.id) && styles.chipTextActive
                    ]}>{type.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Transmission */}
            <View style={styles.driverOptionGroup}>
              <Text style={styles.subLabel}>What kind of vehicles do you drive?</Text>
              <View style={styles.chipContainer}>
                {TRANSMISSION_TYPES.map(type => (
                  <TouchableOpacity
                    key={type.id}
                    style={[
                      styles.chip,
                      formData.transmissionTypes.includes(type.id) && styles.chipActive
                    ]}
                    onPress={() => {
                      setFormData(prev => ({
                        ...prev,
                        transmissionTypes: prev.transmissionTypes.includes(type.id)
                          ? prev.transmissionTypes.filter(t => t !== type.id)
                          : [...prev.transmissionTypes, type.id]
                      }));
                    }}
                  >
                    <Text style={[
                      styles.chipText,
                      formData.transmissionTypes.includes(type.id) && styles.chipTextActive
                    ]}>{type.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Trip Preference */}
            <View style={styles.driverOptionGroup}>
              <Text style={styles.subLabel}>Where do you offer your services?</Text>
              <View style={styles.segmentContainer}>
                {TRIP_PREFERENCES.map(pref => (
                  <TouchableOpacity
                    key={pref.id}
                    style={[
                      styles.segment,
                      formData.tripPreference === pref.id && styles.segmentActive
                    ]}
                    onPress={() => setFormData(prev => ({ ...prev, tripPreference: pref.id }))}
                  >
                    <Text style={[
                      styles.segmentText,
                      formData.tripPreference === pref.id && styles.segmentTextActive
                    ]}>{pref.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        )}
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.animatableContent}>
      <Text style={styles.stepTitle}>Set Your Rates</Text>
      <Text style={styles.stepSubtitle}>Define fair pricing for your services</Text>

      <View style={styles.card}>
        {formData.serviceRates.map((rate, index) => (
          <View key={rate.serviceName} style={[styles.priceRow, index !== formData.serviceRates.length - 1 && styles.priceRowBorder]}>
            <View style={styles.priceInfo}>
              <Text style={styles.priceServiceName}>{rate.serviceName}</Text>
              {getMaxPriceForService(rate.serviceName) > 0 && (
                <Text style={styles.maxPriceText}>
                  Max: ₹{getMaxPriceForService(rate.serviceName)}
                </Text>
              )}
            </View>
            <View style={styles.priceInputWrapper}>
              <Text style={styles.currencyPrefix}>₹</Text>
              <TextInput
                style={styles.priceInputField}
                placeholder="0"
                placeholderTextColor={COLORS.textTertiary}
                value={rate.price}
                onChangeText={(value) => updateServiceRate(rate.serviceName, value)}
                keyboardType="numeric"
              />
            </View>
          </View>
        ))}
      </View>
    </View>
  );

  const renderStep4 = () => (
    <View style={styles.animatableContent}>
      <Text style={styles.stepTitle}>Availability & Wrap Up</Text>
      <Text style={styles.stepSubtitle}>Set your working hours and review</Text>

      <View style={styles.card}>
        <View style={styles.row}>
          <View style={[styles.inputGroup, styles.halfWidth]}>
            <Text style={styles.label}>START TIME</Text>
            <View style={styles.inputContainer}>
              <View style={styles.inputIcon}>
                <Ionicons name="time-outline" size={20} color={COLORS.textTertiary} />
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
                <Ionicons name="time-outline" size={20} color={COLORS.textTertiary} />
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

        <View style={styles.divider} />

        <View style={styles.summaryContainer}>
          <Text style={styles.summaryHeader}>SUMMARY</Text>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Total Services</Text>
            <Text style={styles.summaryValue}>{formData.services.length}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Working Hours</Text>
            <Text style={styles.summaryValue}>
              {formData.workingHours.startTime} - {formData.workingHours.endTime}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );

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

      {/* Back Button */}
      <TouchableOpacity
        style={[styles.backButton, { top: insets.top + 16 }]}
        onPress={handleBack}
        activeOpacity={0.7}
      >
        <Ionicons name="arrow-back" size={24} color={COLORS.text} />
      </TouchableOpacity>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: insets.top + 24 }
          ]}
          showsVerticalScrollIndicator={false}
          bounces={true}
          alwaysBounceVertical={true}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Image
                source={require('../../../assets/Logo.jpg')}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.brandName}>YANN</Text>
            <Text style={styles.title}>Become a Service Partner</Text>
            <Text style={styles.subtitle}>
              Join our verified network and grow your business with YANN
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

          {currentStep === 2 && (
            <View style={styles.animatableContent}>
              <Text style={styles.stepTitle}>Select Services</Text>
              <Text style={styles.stepSubtitle}>Choose the services you want to provide</Text>

              {isLoadingServices ? (
                <LoadingSpinner visible={true} />
              ) : (
                <>
                  {dynamicServiceCategories.map(category => (
                    <View key={category.id} style={styles.categoryCard}>
                      <View style={styles.categoryHeader}>
                        <View style={styles.categoryHeaderLeft}>
                          <View style={styles.categoryIconContainer}>
                            <Ionicons name={category.icon} size={20} color={COLORS.primary} />
                          </View>
                          <Text style={styles.categoryName}>{category.name}</Text>
                        </View>
                        <TouchableOpacity
                          style={styles.experienceDropdown}
                          onPress={() =>
                            setOpenExperienceCategory(prev => (prev === category.id ? null : category.id))
                          }
                          activeOpacity={0.7}
                        >
                          <Text style={styles.experienceDropdownText}>
                            {formData.categoryExperience[category.id]
                              ? `${formData.categoryExperience[category.id]} yrs exp`
                              : 'add experience'}
                          </Text>
                          <Ionicons
                            name={openExperienceCategory === category.id ? 'chevron-up' : 'chevron-down'}
                            size={16}
                            color={COLORS.primary}
                          />
                        </TouchableOpacity>
                      </View>

                      {openExperienceCategory === category.id && (
                        <View style={styles.experienceOptionsContainer}>
                          <Text style={styles.experienceLabel}>Years of Experience:</Text>
                          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.experienceScroll}>
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
                                  {option}
                                </Text>
                              </TouchableOpacity>
                            ))}
                          </ScrollView>
                        </View>
                      )}

                      <View style={styles.servicesGrid}>
                        {category.services.map(service => {
                          const isSelected = formData.services.includes(service);
                          return (
                            <TouchableOpacity
                              key={service}
                              style={[
                                styles.serviceChip,
                                isSelected && styles.serviceChipActive,
                              ]}
                              onPress={() => toggleService(service)}
                              activeOpacity={0.7}
                            >
                              <Text
                                style={[
                                  styles.serviceChipText,
                                  isSelected && styles.serviceChipTextActive,
                                ]}
                              >
                                {service}
                              </Text>
                              {isSelected && (
                                <View style={styles.checkIconContainer}>
                                  <Ionicons name="checkmark" size={10} color="#FFF" />
                                </View>
                              )}
                            </TouchableOpacity>
                          );
                        })}
                      </View>

                      {/* Driver Specific Options - Embed directly in Driver Category Card */}
                      {category.id.toLowerCase() === 'driver' && formData.services.some(s => category.services.includes(s)) && (
                        <View style={styles.driverSectionCard}>
                          <View style={styles.sectionHeaderContainer}>
                            <View style={styles.sectionIcon}>
                              <Ionicons name="car-sport" size={20} color={COLORS.white} />
                            </View>
                            <Text style={styles.sectionHeaderTitle}>Driver Details</Text>
                          </View>

                          {/* Vehicle Types */}
                          <View style={styles.driverOptionGroup}>
                            <Text style={styles.subLabel}>What vehicles do you drive?</Text>
                            <View style={styles.chipContainer}>
                              {VEHICLE_TYPES.map(type => (
                                <TouchableOpacity
                                  key={type.id}
                                  style={[
                                    styles.chip,
                                    formData.vehicleTypes.includes(type.id) && styles.chipActive
                                  ]}
                                  onPress={() => {
                                    setFormData(prev => ({
                                      ...prev,
                                      vehicleTypes: prev.vehicleTypes.includes(type.id)
                                        ? prev.vehicleTypes.filter(t => t !== type.id)
                                        : [...prev.vehicleTypes, type.id]
                                    }));
                                  }}
                                >
                                  <Text style={[
                                    styles.chipText,
                                    formData.vehicleTypes.includes(type.id) && styles.chipTextActive
                                  ]}>{type.label}</Text>
                                </TouchableOpacity>
                              ))}
                            </View>
                          </View>

                          {/* Transmission */}
                          <View style={styles.driverOptionGroup}>
                            <Text style={styles.subLabel}>What kind of vehicles do you drive?</Text>
                            <View style={styles.chipContainer}>
                              {TRANSMISSION_TYPES.map(type => (
                                <TouchableOpacity
                                  key={type.id}
                                  style={[
                                    styles.chip,
                                    formData.transmissionTypes.includes(type.id) && styles.chipActive
                                  ]}
                                  onPress={() => {
                                    setFormData(prev => ({
                                      ...prev,
                                      transmissionTypes: prev.transmissionTypes.includes(type.id)
                                        ? prev.transmissionTypes.filter(t => t !== type.id)
                                        : [...prev.transmissionTypes, type.id]
                                    }));
                                  }}
                                >
                                  <Text style={[
                                    styles.chipText,
                                    formData.transmissionTypes.includes(type.id) && styles.chipTextActive
                                  ]}>{type.label}</Text>
                                </TouchableOpacity>
                              ))}
                            </View>
                          </View>

                          {/* Trip Preference */}
                          <View style={styles.driverOptionGroup}>
                            <Text style={styles.subLabel}>Where do you offer your services?</Text>
                            <View style={styles.segmentContainer}>
                              {TRIP_PREFERENCES.map(pref => (
                                <TouchableOpacity
                                  key={pref.id}
                                  style={[
                                    styles.segment,
                                    formData.tripPreference === pref.id && styles.segmentActive
                                  ]}
                                  onPress={() => setFormData(prev => ({ ...prev, tripPreference: pref.id }))}
                                >
                                  <Text style={[
                                    styles.segmentText,
                                    formData.tripPreference === pref.id && styles.segmentTextActive
                                  ]}>{pref.label}</Text>
                                </TouchableOpacity>
                              ))}
                            </View>
                          </View>
                        </View>
                      )}

                    </View>
                  ))}
                </>
              )}
            </View>
          )}
          {currentStep === 3 && renderStep3()}
          {currentStep === 4 && renderStep4()}

          {/* Scrollable Bottom Button */}
          <View style={{ padding: 24, paddingBottom: 40 }}>
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
        </ScrollView>
      </KeyboardAvoidingView>
      <LoadingSpinner visible={isLoading} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background, // Changed from #F8F9FC
  },
  bgPattern: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    overflow: 'hidden',
    zIndex: -1,
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
    paddingBottom: 120,
  },
  backButton: {
    position: 'absolute',
    left: 20,
    width: 44,
    height: 44,
    borderRadius: RADIUS.medium,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    ...SHADOWS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  header: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: RADIUS.large,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    ...SHADOWS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  logoGradient: {
    width: '100%',
    height: '100%',
    borderRadius: RADIUS.large,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoImage: {
    width: 56,
    height: 56,
  },
  brandName: {
    fontSize: TYPOGRAPHY.size.sm,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: 4,
    marginBottom: 16,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.size.md,
    fontWeight: '500',
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: '80%',
  },
  benefitsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginTop: 20,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: addAlpha(COLORS.primary, 0.08),
    borderRadius: 20,
    borderWidth: 1,
    borderColor: addAlpha(COLORS.primary, 0.1),
  },
  benefitText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },
  stepIndicatorContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.6)',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 0,
  },
  stepItem: {
    alignItems: 'center',
    zIndex: 2,
    width: 60,
  },
  stepDot: {
    width: 36, // Larger
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.border,
    marginBottom: 6,
  },
  stepDotActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
    ...SHADOWS.md,
    shadowColor: addAlpha(COLORS.primary, 0.4),
  },
  stepDotShadow: {
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  stepNumber: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textTertiary,
  },
  stepNumberActive: {
    color: '#FFF',
  },
  stepLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  stepLabelActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: COLORS.border,
    marginBottom: 20, // Align with dots
    marginHorizontal: -10,
    zIndex: 1,
  },
  stepLineActive: {
    backgroundColor: COLORS.primary,
  },
  animatableContent: {
    paddingHorizontal: 20,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  card: {
    backgroundColor: 'transparent', // Transparent to match Member layout
    marginBottom: SPACING.lg,
    padding: 0,
    // borderRadius: 0,
    // ...SHADOWS.md, // Removed shadow
  },
  inputGroup: {
    marginBottom: SPACING.lg,
  },
  label: {
    fontSize: TYPOGRAPHY.size.xs,
    fontWeight: '700',
    color: COLORS.textTertiary,
    marginBottom: SPACING.xs,
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1.5, // Thicker border
    borderColor: COLORS.border,
    borderRadius: RADIUS.medium,
    height: 56, // 56px (Standard Member Signup Height)
    overflow: 'hidden',
    ...SHADOWS.sm,
  },
  inputFocused: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.white,
    ...SHADOWS.md,
    shadowColor: addAlpha(COLORS.primary, 0.3),
    borderWidth: 1.5,
  },
  inputIconFocused: {
    backgroundColor: addAlpha(COLORS.primary, 0.1),
    // opacity: 1, // Removed
  },
  inputError: {
    borderColor: COLORS.error,
    backgroundColor: addAlpha(COLORS.error, 0.02),
  },
  inputValid: {
    borderColor: COLORS.success,
    backgroundColor: addAlpha(COLORS.success, 0.02),
  },
  inputInvalid: {
    borderColor: COLORS.error,
    backgroundColor: addAlpha(COLORS.error, 0.02),
  },
  inputIcon: {
    width: 50,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.gray50,
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
  },
  input: {
    flex: 1,
    fontSize: 16, // Larger font
    fontWeight: '500',
    color: COLORS.text,
    height: '100%',
    paddingHorizontal: 16,
  },
  validationIcon: {
    marginRight: 16,
  },
  validationError: {
    marginTop: 6,
    marginLeft: 4,
    fontSize: 12,
    color: COLORS.error,
    fontWeight: '500',
  },
  categoryCard: {
    backgroundColor: 'transparent', // Transparent layout
    marginBottom: SPACING.lg,
    padding: 0,
    // borderRadius: 0,
    // ...SHADOWS.md,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  categoryHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryIconContainer: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.medium,
    backgroundColor: addAlpha(COLORS.primary, 0.1),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  categoryName: {
    fontSize: TYPOGRAPHY.size.lg,
    fontWeight: '700',
    color: COLORS.text,
  },
  experienceDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.gray50,
    gap: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  experienceDropdownText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },
  experienceOptionsContainer: {
    marginBottom: SPACING.md,
    marginTop: -4,
    backgroundColor: COLORS.gray50,
    padding: SPACING.md,
    borderRadius: RADIUS.medium,
  },
  experienceLabel: {
    fontSize: 11,
    color: COLORS.textTertiary,
    marginBottom: SPACING.xs,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  experienceScroll: {
    flexDirection: 'row',
  },
  experienceOption: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  experienceOptionActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
    ...SHADOWS.sm,
  },
  experienceOptionText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  experienceOptionTextActive: {
    color: COLORS.white,
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  serviceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: RADIUS.medium, // Match inputs
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    minHeight: 48,
    ...SHADOWS.sm,
  },
  serviceChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
    ...SHADOWS.sm,
  },
  serviceChipText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  serviceChipTextActive: {
    color: COLORS.white,
    fontWeight: '600',
    marginRight: 6,
  },
  checkIconContainer: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  driverSectionCard: {
    backgroundColor: COLORS.white, // Light theme
    borderRadius: RADIUS.xlarge,
    padding: SPACING.xl,
    marginTop: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.md,
  },
  sectionHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  sectionIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: addAlpha(COLORS.primary, 0.1), // Light primary bg
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  sectionHeaderTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text, // Dark text
  },
  driverOptionGroup: {
    marginBottom: SPACING.xl,
  },
  subLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textTertiary,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: RADIUS.medium,
    backgroundColor: COLORS.gray50,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  chipText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  chipTextActive: {
    color: COLORS.white,
    fontWeight: '700',
  },
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.gray50,
    borderRadius: RADIUS.medium,
    padding: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  segment: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: RADIUS.small,
  },
  segmentActive: {
    backgroundColor: COLORS.white,
    ...SHADOWS.sm,
  },
  segmentText: {
    fontSize: 13,
    color: COLORS.textTertiary,
    fontWeight: '500',
  },
  segmentTextActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  priceRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  priceInfo: {
    flex: 1,
    paddingRight: 16,
  },
  priceServiceName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  maxPriceText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  priceInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.medium,
    paddingHorizontal: 12,
    paddingVertical: 8,
    width: 120,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  currencyPrefix: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textTertiary,
    marginRight: 4,
  },
  priceInputField: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    padding: 0,
  },
  row: {
    flexDirection: 'row',
    gap: 16,
  },
  halfWidth: {
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 24,
  },
  summaryContainer: {
    marginTop: 0,
  },
  summaryHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 16,
  },
  summaryItem: {
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
    fontWeight: '700',
    color: COLORS.text,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: addAlpha(COLORS.white, 0.95), // Glass-ish
    paddingHorizontal: 20,
    paddingTop: 20,
    borderTopLeftRadius: RADIUS.xlarge,
    borderTopRightRadius: RADIUS.xlarge,
    ...SHADOWS.xl,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  nextButton: {
    borderRadius: RADIUS.medium,
    overflow: 'hidden',
    ...SHADOWS.lg,
    shadowColor: COLORS.primary,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 8,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  partnerCtaContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    gap: 8,
  },
  partnerCtaText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  partnerLinkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  partnerLinkText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
  },
});
