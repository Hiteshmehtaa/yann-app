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
      console.log('Using fallback services');
      // Fallback data
      setDynamicServiceCategories([
        {
          id: 'driver',
          name: 'Driver',
          icon: 'car-outline',
          services: ['Full-Day Personal Driver', 'Outstation Driving Service', 'Driver']
        },
        {
          id: 'pujari',
          name: 'Pujari',
          icon: 'flame-outline',
          services: ['Lakshmi Puja', 'Ganesh Puja at Home']
        },
        {
          id: 'cleaning',
          name: 'Cleaning',
          icon: 'home-outline',
          services: ['Deep House Cleaning', 'Regular House Cleaning']
        }
      ] as any);
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
          const isCompleted = currentStep > step;

          return (
            <React.Fragment key={step}>
              <View style={styles.stepItem}>
                <View style={[
                  styles.stepDot,
                  isActive && styles.stepDotActive,
                  isActive && styles.stepDotShadow
                ]}>
                  {isCompleted ? (
                    <Ionicons name="checkmark" size={12} color="#FFF" />
                  ) : (
                    <Text style={[styles.stepNumber, isActive && styles.stepNumberActive]}>
                      {step}
                    </Text>
                  )}
                </View>
                <Text style={[styles.stepLabel, isActive && styles.stepLabelActive]}>
                  {step === 1 ? 'Bio' : step === 2 ? 'Services' : step === 3 ? 'Rates' : 'Hours'}
                </Text>
              </View>
              {step < 4 && (
                <View style={[styles.stepLine, isCompleted && styles.stepLineActive]} />
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
            validationState.name === 'valid' && styles.inputValid,
            validationState.name === 'invalid' && styles.inputInvalid
          ]}>
            <View style={styles.inputIcon}>
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

        <View style={styles.inputGroup}>
          <Text style={styles.label}>PHONE NUMBER</Text>
          <View style={[
            styles.inputContainer,
            focusedField === 'phone' && styles.inputFocused,
            validationState.phone === 'valid' && styles.inputValid,
            validationState.phone === 'invalid' && styles.inputInvalid
          ]}>
            <View style={styles.inputIcon}>
              <Ionicons
                name="call-outline"
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
            {validationState.phone === 'valid' && (
              <View style={styles.validationIcon}>
                <Ionicons name="checkmark-circle" size={18} color={COLORS.success} />
              </View>
            )}
          </View>
          {validationState.phone === 'invalid' && formData.phone.length > 0 && (
            <Text style={styles.validationError}>Please enter a valid 10-digit phone number</Text>
          )}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>EMAIL ADDRESS</Text>
          <View style={[
            styles.inputContainer,
            focusedField === 'email' && styles.inputFocused,
            validationState.email === 'valid' && styles.inputValid,
            validationState.email === 'invalid' && styles.inputInvalid
          ]}>
            <View style={styles.inputIcon}>
              <Ionicons
                name="mail-outline"
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
            {validationState.email === 'valid' && (
              <View style={styles.validationIcon}>
                <Ionicons name="checkmark-circle" size={18} color={COLORS.success} />
              </View>
            )}
          </View>
          {validationState.email === 'invalid' && formData.email.length > 0 && (
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

      {/* Background pattern */}
      <View style={styles.bgPattern}>
        <View style={styles.patternCircle1} />
        <View style={styles.patternCircle2} />
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
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
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
              <LinearGradient
                colors={['#F0F4FF', '#E8EFFF']}
                style={styles.logoGradient}
              >
                <Image
                  source={require('../../../assets/Logo.jpg')}
                  style={styles.logoImage}
                  resizeMode="contain"
                />
              </LinearGradient>
            </View>
            <Text style={styles.brandName}>YANN</Text>
            <Text style={styles.title}>Become a Service Partner</Text>
            <Text style={styles.subtitle}>
              Join our verified network and grow your business with YANN
            </Text>
            <View style={styles.benefitsContainer}>
              <View style={styles.benefitItem}>
                <Ionicons name="checkmark-circle" size={16} color={COLORS.primary} />
                <Text style={styles.benefitText}>Verified Customers</Text>
              </View>
              <View style={styles.benefitItem}>
                <Ionicons name="checkmark-circle" size={16} color={COLORS.primary} />
                <Text style={styles.benefitText}>Regular Income</Text>
              </View>
              <View style={styles.benefitItem}>
                <Ionicons name="checkmark-circle" size={16} color={COLORS.primary} />
                <Text style={styles.benefitText}>Flexible Hours</Text>
              </View>
            </View>
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
    backgroundColor: '#F8F9FC',
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
  patternCircle1: {
    position: 'absolute',
    top: -100,
    right: -50,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: COLORS.primary,
    opacity: 0.05,
    transform: [{ scale: 1.2 }],
  },
  patternCircle2: {
    position: 'absolute',
    bottom: 50,
    left: -100,
    width: 350,
    height: 350,
    borderRadius: 175,
    backgroundColor: COLORS.accentOrange || '#FF9F43',
    opacity: 0.04,
    transform: [{ scale: 1.1 }],
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
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    ...SHADOWS.sm,
  },
  header: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  logoContainer: {
    width: 70,
    height: 70,
    borderRadius: 20,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    ...SHADOWS.md,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
  },
  logoGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoImage: {
    width: 40,
    height: 40,
  },
  brandName: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: 4,
    marginBottom: 16,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
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
    backgroundColor: 'rgba(74, 144, 226, 0.08)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(74, 144, 226, 0.1)',
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
    backgroundColor: '#FFF',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
    ...SHADOWS.sm,
  },
  stepItem: {
    alignItems: 'center',
    zIndex: 2,
    width: 60,
  },
  stepDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F5F7FA',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E4E7EB',
    marginBottom: 6,
  },
  stepDotActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  stepDotShadow: {
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  stepNumber: {
    fontSize: 13,
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
    backgroundColor: '#E4E7EB',
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
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 24,
    ...SHADOWS.sm,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textTertiary,
    marginBottom: 8,
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFC',
    borderWidth: 1.5,
    borderColor: '#EFF2F7',
    borderRadius: 14,
    height: 54,
    overflow: 'hidden',
  },
  inputFocused: {
    borderColor: COLORS.primary,
    backgroundColor: '#FFF',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  inputValid: {
    borderColor: COLORS.success,
    backgroundColor: '#F6FFFA',
  },
  inputInvalid: {
    borderColor: COLORS.error,
    backgroundColor: '#FFF5F5',
  },
  inputIcon: {
    width: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    height: '100%',
    paddingRight: 16,
  },
  validationIcon: {
    marginRight: 16,
  },
  validationError: {
    fontSize: 12,
    color: COLORS.error,
    marginTop: 6,
    marginLeft: 4,
    fontWeight: '500',
  },
  categoryCard: {
    backgroundColor: '#FFF',
    borderRadius: 18,
    marginBottom: 20,
    padding: 20,
    ...SHADOWS.sm,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  categoryHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(74, 144, 226, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  experienceDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 100,
    backgroundColor: '#F0F4FF',
    gap: 4,
  },
  experienceDropdownText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },
  experienceOptionsContainer: {
    marginBottom: 16,
    marginTop: -8,
  },
  experienceLabel: {
    fontSize: 11,
    color: COLORS.textTertiary,
    marginBottom: 8,
    marginLeft: 4,
    fontWeight: '600',
  },
  experienceScroll: {
    flexDirection: 'row',
  },
  experienceOption: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F5F7FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    marginBottom: 4,
  },
  experienceOptionActive: {
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
  },
  experienceOptionText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  experienceOptionTextActive: {
    color: '#FFF',
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  serviceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 100,
    backgroundColor: '#FAFBFC',
    borderWidth: 1,
    borderColor: '#E4E7EB',
  },
  serviceChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  serviceChipText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  serviceChipTextActive: {
    color: '#FFF',
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
    backgroundColor: COLORS.text, // Dark card for driver styles (premium look)
    borderRadius: 20,
    padding: 24,
    marginTop: 24,
    ...SHADOWS.md,
  },
  sectionHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  sectionIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  sectionHeaderTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
  },
  driverOptionGroup: {
    marginBottom: 24,
  },
  subLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.6)',
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
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  chipActive: {
    backgroundColor: '#FFF',
    borderColor: '#FFF',
  },
  chipText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
  },
  chipTextActive: {
    color: COLORS.text,
    fontWeight: '700',
  },
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 14,
    padding: 4,
  },
  segment: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  segmentActive: {
    backgroundColor: '#FFF',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  segmentText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '500',
  },
  segmentTextActive: {
    color: COLORS.text,
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
    borderBottomColor: '#F0F0F0',
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
    backgroundColor: '#F9FAFC',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    width: 110,
    borderWidth: 1,
    borderColor: '#EFF2F7',
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
    backgroundColor: '#F0F0F0',
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
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 20,
    paddingTop: 20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.03)',
  },
  nextButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 8,
  },
  buttonText: {
    color: '#FFF',
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
