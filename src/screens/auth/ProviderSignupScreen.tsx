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
import * as ImagePicker from 'expo-image-picker';
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
import { useResponsive } from '../../hooks/useResponsive';

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

export const ProviderSignupScreen: React.FC<Props> = ({ navigation }) => {
  const { width: screenWidth, height: screenHeight, isTablet } = useResponsive();
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
  const renderStepIndicator = () => (
    <View style={styles.segmentedProgressContainer}>
      {[1, 2, 3, 4].map((step) => {
        const isActive = currentStep === step;
        const isCompleted = currentStep > step;
        return (
          <View 
            key={step} 
            style={[
              styles.progressSegment,
              isActive && styles.progressSegmentActive,
              isCompleted && styles.progressSegmentCompleted
            ]} 
          />
        );
      })}
    </View>
  );

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
    licenseFrontImage: null as string | null,
    licenseBackImage: null as string | null,
  });

  const uploadDrivingLicenseImage = async (side: 'front' | 'back') => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow access to your photos.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        setIsLoading(true);
        const asset = result.assets[0];
        let base64Image = asset.base64;

        if (!base64Image && asset.uri) {
           const response = await fetch(asset.uri);
           const blob = await response.blob();
           base64Image = await new Promise<string>((resolve, reject) => {
             const reader = new FileReader();
             reader.onloadend = () => {
               resolve(reader.result as string);
             };
             reader.onerror = reject;
             reader.readAsDataURL(blob);
           });
        } else if (base64Image) {
           const mimeType = asset.mimeType || 'image/jpeg';
           if (!base64Image.startsWith('data:')) {
             base64Image = `data:${mimeType};base64,${base64Image}`;
           }
        }

        if (base64Image) {
          setFormData(prev => ({
            ...prev,
            [side === 'front' ? 'licenseFrontImage' : 'licenseBackImage']: base64Image
          }));
          Alert.alert('Success', `Driving license ${side} photo selected successfully!`);
        }
      }
    } catch (error) {
       console.log('Image picker error:', error);
       Alert.alert('Error', 'Failed to pick or upload image');
    } finally {
       setIsLoading(false);
    }
  };

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
      let newServices = [...prev.services];
      const category = dynamicServiceCategories.find(c => c.services.includes(service));
      const isDriverService = category?.id.toLowerCase() === 'driver';

      if (prev.services.includes(service)) {
        newServices = prev.services.filter(s => s !== service);
      } else {
        // Enforce exclusivity
        if (isDriverService) {
           const hasOtherServices = prev.services.some(s => {
             const cat = dynamicServiceCategories.find(c => c.services.includes(s));
             return cat?.id.toLowerCase() !== 'driver';
           });
           if (hasOtherServices) {
             Alert.alert('Constraint', 'Driver services cannot be combined with other service types. First, deselect other services.');
             return prev;
           }
           newServices.push(service);
        } else {
           const hasDriverServices = prev.services.some(s => {
             const cat = dynamicServiceCategories.find(c => c.services.includes(s));
             return cat?.id.toLowerCase() === 'driver';
           });
           if (hasDriverServices) {
             Alert.alert('Constraint', 'You cannot add other services. First, deselect the Driver services.');
             return prev;
           }
           newServices.push(service);
        }
      }

      const serviceRates = newServices.map(s => {
        const existing = prev.serviceRates.find(r => r.serviceName === s);
        return existing || { serviceName: s, price: '' };
      });

      return { ...prev, services: newServices, serviceRates };
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

    const hasDriverService = formData.services.some(s => {
      const cat = dynamicServiceCategories.find(c => c.services.includes(s));
      return cat?.id.toLowerCase() === 'driver';
    });

    if (hasDriverService) {
       if (!formData.licenseFrontImage || !formData.licenseBackImage) {
          Alert.alert('Error', 'Both front and back photos of your driving license are required for driver services.');
          return;
       }
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
          tripPreference: formData.tripPreference,
          licenseFrontImage: formData.licenseFrontImage,
          licenseBackImage: formData.licenseBackImage
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

  const renderStep = (step: number) => {
    switch (step) {
      case 1: return renderStep1();
      case 2: return renderStep2();
      case 3: return renderStep3();
      case 4: return renderStep4();
      default: return renderStep1();
    }
  };

  const renderBottomNav = () => (
    <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 16 }]}>
      <TouchableOpacity
        style={styles.nextButton}
        onPress={currentStep === 4 ? handleSubmit : handleNext}
        activeOpacity={0.8}
        disabled={isLoading}
      >
        <LinearGradient
          colors={GRADIENTS.primary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.buttonGradient}
        >
          {isLoading ? (
            <LoadingSpinner visible={true} />
          ) : (
            <>
              <Text style={styles.buttonText}>
                {currentStep === 4 ? 'COMPLETE REGISTRATION' : 'CONTINUE'}
              </Text>
              <Ionicons 
                name={currentStep === 4 ? 'checkmark-circle' : 'arrow-forward'} 
                size={20} 
                color="#FFF" 
              />
            </>
          )}
        </LinearGradient>
      </TouchableOpacity>
      {currentStep === 1 && (
        <View style={styles.partnerCtaContainer}>
          <Text style={styles.partnerCtaText}>Already a partner?</Text>
          <TouchableOpacity 
            style={styles.partnerLinkButton}
            onPress={() => navigation.navigate('PartnerLogin')}
          >
            <Text style={styles.partnerLinkText}>Sign In</Text>
            <Ionicons name="chevron-forward" size={14} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const renderStep1 = () => (
    <View style={styles.animatableContent}>
      <Text style={styles.stepTitle}>Profile Details</Text>
      <Text style={styles.stepSubtitle}>Let's get your professional profile set up</Text>

      <GlassCard intensity={80} style={styles.formCard} enableTilt glowColor="rgba(59, 130, 246, 0.05)">
      <View style={styles.form}>
        {/* Full Name */}
        <View style={[
          styles.fieldGlass,
          focusedField === 'name' && { backgroundColor: 'rgba(59, 130, 246, 0.03)' }
        ]}>
          <View style={styles.inputRow}>
            <View style={[styles.iconCircle, focusedField === 'name' && { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}>
              <Ionicons 
                name="person-outline" 
                size={18} 
                color={focusedField === 'name' ? COLORS.primary : COLORS.textTertiary} 
              />
            </View>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>FULL NAME</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your full name"
                placeholderTextColor={addAlpha(COLORS.textTertiary, 0.6)}
                value={formData.name}
                onChangeText={(value) => updateField('name', value)}
                autoCapitalize="words"
                editable={!isLoading}
                onFocus={() => setFocusedField('name')}
                onBlur={() => setFocusedField(null)}
              />
            </View>
            {validationState.name === 'valid' && (
              <View style={styles.validationIcon}>
                <Ionicons name="checkmark-circle" size={18} color={COLORS.success} />
              </View>
            )}
          </View>
        </View>

        <View style={styles.inputDivider} />

        {/* Mobile Number */}
        <View style={[
          styles.fieldGlass,
          focusedField === 'phone' && { backgroundColor: 'rgba(59, 130, 246, 0.03)' }
        ]}>
          <View style={styles.inputRow}>
            <View style={[styles.iconCircle, focusedField === 'phone' && { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}>
              <Ionicons 
                name="call-outline" 
                size={18} 
                color={focusedField === 'phone' ? COLORS.primary : COLORS.textTertiary} 
              />
            </View>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>MOBILE NUMBER</Text>
              <TextInput
                style={styles.input}
                placeholder="10-digit mobile number"
                placeholderTextColor={addAlpha(COLORS.textTertiary, 0.6)}
                value={formData.phone}
                onChangeText={(value) => updateField('phone', value)}
                keyboardType="phone-pad"
                maxLength={10}
                editable={!isLoading}
                onFocus={() => setFocusedField('phone')}
                onBlur={() => setFocusedField(null)}
              />
            </View>
            {validationState.phone === 'valid' && (
              <View style={styles.validationIcon}>
                <Ionicons name="checkmark-circle" size={18} color={COLORS.success} />
              </View>
            )}
          </View>
        </View>
        {validationState.phone === 'invalid' && (
          <Text style={styles.validationError}>Please enter a valid 10-digit number</Text>
        )}

        <View style={styles.inputDivider} />

        {/* Email Address */}
        <View style={[
          styles.fieldGlass,
          focusedField === 'email' && { backgroundColor: 'rgba(59, 130, 246, 0.03)' }
        ]}>
          <View style={styles.inputRow}>
            <View style={[styles.iconCircle, focusedField === 'email' && { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}>
              <Ionicons 
                name="mail-outline" 
                size={18} 
                color={focusedField === 'email' ? COLORS.primary : COLORS.textTertiary} 
              />
            </View>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>EMAIL ADDRESS</Text>
              <TextInput
                style={styles.input}
                placeholder="name@example.com"
                placeholderTextColor={addAlpha(COLORS.textTertiary, 0.6)}
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
            {validationState.email === 'valid' && (
              <View style={styles.validationIcon}>
                <Ionicons name="checkmark-circle" size={18} color={COLORS.success} />
              </View>
            )}
          </View>
        </View>
        {validationState.email === 'invalid' && (
          <Text style={styles.validationError}>Please enter a valid email address</Text>
        )}
      </View>
    </GlassCard>
  </View>
);

  const renderStep2 = () => (
    <View style={styles.animatableContent}>
      <Text style={styles.stepTitle}>Your Services</Text>
      <Text style={styles.stepSubtitle}>Tap a category, then pick what you offer</Text>

      {isLoadingServices ? (
        <LoadingSpinner visible={true} />
      ) : (
        <GlassCard intensity={80} style={styles.formCard} enableTilt glowColor="rgba(59, 130, 246, 0.05)">
          <View style={styles.form}>
            {dynamicServiceCategories.map((category, catIndex) => {
              const isOpen = openExperienceCategory === category.id;
              const selectedCount = category.services.filter(s => formData.services.includes(s)).length;
              const hasExperience = !!formData.categoryExperience[category.id];
              const isComplete = selectedCount > 0 && hasExperience;

              return (
                <React.Fragment key={category.id}>
                  {/* Category Header Row */}
                  <TouchableOpacity
                    style={styles.s2CategoryRow}
                    onPress={() => setOpenExperienceCategory(prev => prev === category.id ? null : category.id)}
                    activeOpacity={0.75}
                  >
                    <View style={[styles.iconCircle, selectedCount > 0 && { backgroundColor: addAlpha(COLORS.primary, 0.15) }]}>
                      <Ionicons
                        name={category.icon}
                        size={18}
                        color={selectedCount > 0 ? COLORS.primary : COLORS.textTertiary}
                      />
                    </View>
                    <View style={styles.s2CategoryInfo}>
                      <Text style={styles.s2CategoryName}>{category.name}</Text>
                      {selectedCount > 0 ? (
                        <Text style={styles.s2SelectedBadge}>{selectedCount} selected</Text>
                      ) : (
                        <Text style={styles.s2CategoryHint}>Tap to expand</Text>
                      )}
                    </View>
                    <View style={styles.s2CategoryRight}>
                      {isComplete && (
                        <Ionicons name="checkmark-circle" size={18} color={COLORS.success} style={{ marginRight: 8 }} />
                      )}
                      <Ionicons
                        name={isOpen ? 'chevron-up' : 'chevron-down'}
                        size={18}
                        color={COLORS.textTertiary}
                      />
                    </View>
                  </TouchableOpacity>

                  {/* Expanded Content */}
                  {isOpen && (
                    <View style={styles.s2ExpandedContainer}>
                      {/* Experience Selector */}
                      <View style={styles.s2ExperienceSection}>
                        <Text style={styles.label}>YEARS OF EXPERIENCE</Text>
                        <ScrollView
                          horizontal
                          showsHorizontalScrollIndicator={false}
                          contentContainerStyle={styles.s2ExperienceScroll}
                        >
                          {['0','1','2','3','5','7','10','15','20+'].map(opt => {
                            const isActive = formData.categoryExperience[category.id] === opt;
                            return (
                              <TouchableOpacity
                                key={opt}
                                style={[styles.s2ExperiencePill, isActive && styles.s2ExperiencePillActive]}
                                onPress={() => updateCategoryExperience(category.id, opt)}
                                activeOpacity={0.7}
                              >
                                <Text style={[styles.s2ExperiencePillText, isActive && styles.s2ExperiencePillTextActive]}>
                                  {opt}
                                </Text>
                              </TouchableOpacity>
                            );
                          })}
                        </ScrollView>
                      </View>

                      {/* Services List */}
                      <View style={styles.s2ServicesList}>
                        {category.services.map((service, svcIdx) => {
                          const isSelected = formData.services.includes(service);
                          return (
                            <React.Fragment key={service}>
                              <TouchableOpacity
                                style={styles.s2ServiceRow}
                                onPress={() => toggleService(service)}
                                activeOpacity={0.7}
                              >
                                <View style={[
                                  styles.s2ServiceCheckbox,
                                  isSelected && styles.s2ServiceCheckboxActive
                                ]}>
                                  {isSelected && <Ionicons name="checkmark" size={12} color="#FFF" />}
                                </View>
                                <Text style={[
                                  styles.s2ServiceName,
                                  isSelected && styles.s2ServiceNameActive
                                ]}>
                                  {service}
                                </Text>
                              </TouchableOpacity>
                              {svcIdx < category.services.length - 1 && (
                                <View style={styles.s2ServiceDivider} />
                              )}
                            </React.Fragment>
                          );
                        })}
                      </View>
                    </View>
                  )}

                  {catIndex < dynamicServiceCategories.length - 1 && (
                    <View style={styles.inputDivider} />
                  )}
                </React.Fragment>
              );
            })}
          </View>
        </GlassCard>
      )}

      {/* Driver Specific Options */}
      {formData.services.some(s => {
        const cat = dynamicServiceCategories.find(c => c.services.includes(s));
        return cat && cat.id.toLowerCase() === 'driver';
      }) && (
        <GlassCard intensity={60} style={[styles.formCard, { marginTop: 0 }]} enableTilt>
          <View style={styles.form}>
            {/* Vehicle Types */}
            <View style={styles.fieldGlass}>
              <Text style={styles.label}>VEHICLE TYPES</Text>
              <View style={styles.s2ChipGrid}>
                {VEHICLE_TYPES.map(type => {
                  const isActive = formData.vehicleTypes.includes(type.id);
                  return (
                    <TouchableOpacity
                      key={type.id}
                      style={[styles.s2SelectChip, isActive && styles.s2SelectChipActive]}
                      onPress={() => setFormData(prev => ({
                        ...prev,
                        vehicleTypes: prev.vehicleTypes.includes(type.id)
                          ? prev.vehicleTypes.filter(t => t !== type.id)
                          : [...prev.vehicleTypes, type.id]
                      }))}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.s2SelectChipText, isActive && styles.s2SelectChipTextActive]}>
                        {type.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={styles.inputDivider} />

            {/* Transmission */}
            <View style={styles.fieldGlass}>
              <Text style={styles.label}>TRANSMISSION</Text>
              <View style={styles.s2PillRow}>
                {TRANSMISSION_TYPES.map(type => {
                  const isActive = formData.transmissionTypes.includes(type.id);
                  return (
                    <TouchableOpacity
                      key={type.id}
                      style={[styles.s2ExperiencePill, isActive && styles.s2ExperiencePillActive, { flex: 1 }]}
                      onPress={() => setFormData(prev => ({
                        ...prev,
                        transmissionTypes: prev.transmissionTypes.includes(type.id)
                          ? prev.transmissionTypes.filter(t => t !== type.id)
                          : [...prev.transmissionTypes, type.id]
                      }))}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.s2ExperiencePillText, isActive && styles.s2ExperiencePillTextActive]}>
                        {type.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={styles.inputDivider} />

            {/* Trip Preference */}
            <View style={styles.fieldGlass}>
              <Text style={styles.label}>SERVICE AREA</Text>
              <View style={styles.s2PillRow}>
                {TRIP_PREFERENCES.map(pref => {
                  const isActive = formData.tripPreference === pref.id;
                  return (
                    <TouchableOpacity
                      key={pref.id}
                      style={[styles.s2ExperiencePill, isActive && styles.s2ExperiencePillActive, { flex: 1 }]}
                      onPress={() => setFormData(prev => ({ ...prev, tripPreference: pref.id }))}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.s2ExperiencePillText, isActive && styles.s2ExperiencePillTextActive]}>
                        {pref.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>
        </GlassCard>
      )}
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.animatableContent}>
      <Text style={styles.stepTitle}>Set Your Rates</Text>
      <Text style={styles.stepSubtitle}>Define fair pricing for your services</Text>

      <GlassCard intensity={80} style={styles.formCard} enableTilt glowColor="rgba(59, 130, 246, 0.05)">
        <View style={styles.form}>
          {formData.serviceRates.map((rate, index) => (
            <React.Fragment key={rate.serviceName}>
              <View style={styles.fieldGlass}>
                <View style={styles.inputRow}>
                  <View style={styles.iconCircle}>
                    <Ionicons name="pricetag-outline" size={18} color={COLORS.primary} />
                  </View>
                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>{rate.serviceName}</Text>
                    <View style={styles.priceInputWrapper}>
                      <Text style={styles.currencyPrefix}>₹</Text>
                      <TextInput
                        style={styles.priceInputField}
                        placeholder="0"
                        placeholderTextColor={addAlpha(COLORS.textTertiary, 0.6)}
                        value={rate.price}
                        onChangeText={(value) => updateServiceRate(rate.serviceName, value)}
                        keyboardType="numeric"
                      />
                    </View>
                  </View>
                </View>
              </View>
              {index !== formData.serviceRates.length - 1 && <View style={styles.inputDivider} />}
            </React.Fragment>
          ))}
        </View>
      </GlassCard>
    </View>
  );

  const renderStep4 = () => (
    <View style={styles.animatableContent}>
      <Text style={styles.stepTitle}>Availability & Wrap Up</Text>
      <Text style={styles.stepSubtitle}>Set your working hours and review</Text>
      <GlassCard intensity={80} style={styles.formCard} enableTilt glowColor="rgba(59, 130, 246, 0.05)">
        <View style={styles.form}>
          {/* Start Time */}
          <View style={styles.fieldGlass}>
            <View style={styles.inputRow}>
              <View style={styles.iconCircle}>
                <Ionicons name="time-outline" size={18} color={COLORS.primary} />
              </View>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>START TIME</Text>
                <TextInput
                  style={styles.input}
                  placeholder="09:00 AM"
                  placeholderTextColor={addAlpha(COLORS.textTertiary, 0.6)}
                  value={formData.workingHours.startTime}
                  onChangeText={(value) => updateField('workingHours', { ...formData.workingHours, startTime: value })}
                />
              </View>
            </View>
          </View>

          <View style={styles.inputDivider} />

          {/* End Time */}
          <View style={styles.fieldGlass}>
            <View style={styles.inputRow}>
              <View style={styles.iconCircle}>
                <Ionicons name="time-outline" size={18} color={COLORS.primary} />
              </View>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>END TIME</Text>
                <TextInput
                  style={styles.input}
                  placeholder="06:00 PM"
                  placeholderTextColor={addAlpha(COLORS.textTertiary, 0.6)}
                  value={formData.workingHours.endTime}
                  onChangeText={(value) => updateField('workingHours', { ...formData.workingHours, endTime: value })}
                />
              </View>
            </View>
          </View>

          <View style={styles.inputDivider} />

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
      </GlassCard>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      <LiquidBackground mode="light" />

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
            { paddingTop: insets.top + 20 }
          ]}
          showsVerticalScrollIndicator={false}
        >
            {/* Header / Branding */}
            <View style={styles.headerBranding}>
              <View style={styles.brandNameContainer}>
                {['Y', 'A', 'N', 'N'].map((letter, index) => (
                  <AnimatedLetter
                    key={index}
                    letter={letter}
                    index={index}
                    style={styles.brandLetter}
                  />
                ))}
              </View>
              <View style={styles.taglineRow}>
                <View style={styles.taglineLine} />
                <Text style={styles.tagline}>SIGNATURE LUXURY</Text>
                <View style={styles.taglineLine} />
              </View>
            </View>

            {renderStepIndicator()}

            <View style={{ marginTop: 10 }}>
              {renderStep(currentStep)}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>

        {renderBottomNav()}
      </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background, // Changed from #F8F9FC
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
  segmentedProgressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 40,
    marginBottom: 24,
  },
  progressSegment: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: addAlpha(COLORS.primary, 0.1),
  },
  progressSegmentActive: {
    backgroundColor: COLORS.primary,
    height: 6, // Keep it consistent
  },
  progressSegmentCompleted: {
    backgroundColor: addAlpha(COLORS.primary, 0.6),
  },
  stepIndicatorContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  stepIndicatorCard: {
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderRadius: 24,
    borderWidth: 0,
    overflow: 'hidden',
  },
  stepIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  stepIndicator: { // Deprecated
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.6)',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
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
    marginHorizontal: -10,
    zIndex: 1,
  },
  stepLineActive: {
    backgroundColor: COLORS.primary,
  },
  activeStepIndicator: {
    position: 'absolute',
    bottom: -10,
    width: 20,
    height: 3,
    backgroundColor: COLORS.primary,
    borderRadius: 2,
    alignSelf: 'center',
  },
  headerBranding: {
    alignItems: 'center',
    marginBottom: 12,
  },
  brandNameContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 4,
    gap: 8,
  },
  brandLetter: {
    fontSize: 42,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -1,
  },
  taglineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 16,
  },
  taglineLine: {
    height: 1,
    width: 30,
    backgroundColor: addAlpha(COLORS.primary, 0.3),
  },
  tagline: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: 3,
  },
  animatableContent: {
    paddingHorizontal: 20,
  },
  stepDotCompleted: {
    backgroundColor: COLORS.success,
    borderColor: COLORS.success,
  },
  stepLineCompleted: {
    backgroundColor: COLORS.success,
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  stepSubtitle: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
    fontWeight: '500',
  },
  formCard: {
    borderRadius: 32, // More rounded for Grand Form Panel
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 32,
    overflow: 'hidden',
  },
  form: {
    padding: 0,
    gap: 0,
  },
  fieldGlass: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  inputDivider: {
    height: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.05)',
    marginHorizontal: 20,
  },
  label: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.textTertiary,
    letterSpacing: 1.5,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: 'rgba(59, 130, 246, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  input: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
    height: 32,
    letterSpacing: 0.2,
    padding: 0,
  },
  validationIcon: {
    marginLeft: 8,
  },
  // ---- Step 2 Accordion Styles ----
  s2CategoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  s2CategoryInfo: {
    flex: 1,
  },
  s2CategoryName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: -0.2,
  },
  s2SelectedBadge: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
    marginTop: 2,
  },
  s2CategoryHint: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.textTertiary,
    marginTop: 2,
  },
  s2CategoryRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  s2ExpandedContainer: {
    backgroundColor: addAlpha(COLORS.primary, 0.02),
    borderTopWidth: 1,
    borderTopColor: 'rgba(15, 23, 42, 0.05)',
    paddingBottom: 8,
  },
  s2ExperienceSection: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 10,
  },
  s2ExperienceScroll: {
    flexDirection: 'row',
    gap: 8,
    paddingTop: 10,
    paddingBottom: 4,
  },
  s2ExperiencePill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 100,
    backgroundColor: addAlpha(COLORS.primary, 0.06),
    alignItems: 'center',
    justifyContent: 'center',
  },
  s2ExperiencePillActive: {
    backgroundColor: COLORS.primary,
  },
  s2ExperiencePillText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  s2ExperiencePillTextActive: {
    color: '#FFF',
  },
  s2ServicesList: {
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  s2ServiceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 12,
  },
  s2ServiceCheckbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  s2ServiceCheckboxActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  s2ServiceName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  s2ServiceNameActive: {
    color: COLORS.text,
    fontWeight: '600',
  },
  s2ServiceDivider: {
    height: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.04)',
  },
  s2ChipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  s2SelectChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 100,
    backgroundColor: addAlpha(COLORS.primary, 0.06),
    borderWidth: 1,
    borderColor: 'transparent',
  },
  s2SelectChipActive: {
    backgroundColor: addAlpha(COLORS.primary, 0.12),
    borderColor: COLORS.primary,
  },
  s2SelectChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  s2SelectChipTextActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  s2PillRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  validationError: {
    marginTop: 6,
    paddingHorizontal: 24,
    fontSize: 12,
    color: COLORS.error,
    fontWeight: '500',
  },
  categoryCard: {
    backgroundColor: 'transparent',
    marginBottom: SPACING.lg,
    padding: 16,
    borderRadius: RADIUS.xlarge,
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
    gap: 4,
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
    paddingHorizontal: 20,
    paddingVertical: 16,
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
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: RADIUS.medium,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: COLORS.primary,
    backgroundColor: addAlpha(COLORS.primary, 0.05),
  },
  uploadButtonSuccess: {
    borderColor: COLORS.success,
    backgroundColor: addAlpha(COLORS.success, 0.05),
    borderStyle: 'solid',
  },
  uploadButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
});
