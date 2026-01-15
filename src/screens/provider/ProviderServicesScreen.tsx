import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Animated,
  Switch,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';
import { SERVICES } from '../../utils/constants';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

const THEME = {
  colors: {
    background: '#F7F8FA',
    card: '#FFFFFF',
    primary: '#2E59F3',
    text: '#1A1C1E',
    textSecondary: '#6B7280',
    textTertiary: '#9CA3AF',
    border: '#E5E7EB',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
  },
  spacing: {
    xs: 8,
    sm: 12,
    md: 16,
    lg: 20,
    xl: 24,
    xxl: 32,
  },
  radius: {
    sm: 12,
    md: 16,
    lg: 20,
  },
  shadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
};

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

interface ServiceItem {
  id: number;
  title: string;
  icon: string;
  isActive: boolean;
  rate: number;
  isPending?: boolean; // Service awaiting admin approval
}

export const ProviderServicesScreen: React.FC<Props> = ({ navigation }) => {
  const { user, updateUser } = useAuth();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [isLoading, setIsLoading] = useState(true);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(null);
  const [priceInput, setPriceInput] = useState('');

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();

    loadServices();
  }, []);

  const loadServices = async () => {
    try {
      // Fetch services from backend API
      const response = await apiService.getAllServices();

      let backendServices = response.data || [];
      if (backendServices.length === 0) {
        backendServices = SERVICES;
      }

      const userServices = user?.services || [];
      const userRates: Record<string, number> = {};

      // Build service rates map from user.serviceRates if available
      if (user?.serviceRates && Array.isArray(user.serviceRates)) {
        for (const rate of user.serviceRates) {
          if (rate?.serviceName && rate?.price) {
            userRates[rate.serviceName] = rate.price;
          }
        }
      }

      // Map backend services to our ServiceItem format
      const mappedServices: ServiceItem[] = backendServices.map((service: any) => ({
        id: service._id || service.id || Math.random(),
        title: service.title || service.name,
        icon: service.icon || '✨',
        isActive: userServices.includes(service.title || service.name),
        rate: userRates[service.title || service.name] || service.price || 0,
      }));

      // Add any user services that are missing from backend response (hidden/legacy services)
      const mappedTitles = mappedServices.map(s => s.title);
      userServices.forEach(serviceTitle => {
        if (!mappedTitles.includes(serviceTitle)) {
          mappedServices.push({
            id: Math.random(), // Temporary ID since it's not in catalog
            title: serviceTitle,
            icon: '🔧', // Default icon for unknown services
            isActive: true, // It's in user.services, so it's active
            rate: userRates[serviceTitle] || 0,
            isPending: false
          });
        }
      });

      setServices(mappedServices);
    } catch (err) {
      console.error('Failed to load services from API, using fallback', err);
      // Fallback to hardcoded SERVICES
      const userServices = user?.services || [];
      const userRates: Record<string, number> = {};
      if (Array.isArray(user?.serviceRates)) {
        user?.serviceRates.forEach((rate: any) => {
          if (rate.serviceName && rate.price) userRates[rate.serviceName] = rate.price;
        });
      }

      const mappedServices = SERVICES.map((service) => ({
        id: service.id,
        title: service.title,
        icon: service.icon,
        isActive: userServices.includes(service.title),
        rate: userRates[service.title] || 0,
      }));

      setServices(mappedServices);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleService = async (serviceId: number) => {
    const service = services.find(s => s.id === serviceId);
    if (!service) return;

    // If turning ON, always show price modal to set/confirm price
    if (!service.isActive) {
      setSelectedService(service);
      setShowPriceModal(true);
      setPriceInput(service.rate > 0 ? service.rate.toString() : '');
      return;
    }

    // If turning OFF, proceed with toggle
    await performToggle(serviceId, service.rate);
  };

  const performToggle = async (serviceId: number, price: number = 0) => {
    try {
      const service = services.find(s => s.id === serviceId);
      if (!service) return;

      // If turning ON a new service, use the admin approval workflow
      if (!service.isActive) {
        // Validate price
        if (!price || price <= 0 || isNaN(price)) {
          Alert.alert('Invalid Price', 'Please enter a valid price greater than 0');
          return;
        }

        // Validate user ID
        const providerId = user?._id || user?.id;
        if (!providerId) {
          Alert.alert('Error', 'User ID not found. Please log in again.');
          return;
        }

        console.log('📤 Adding service:', {
          providerId,
          service: service.title,
          price
        });

        // Call the new add-service endpoint that requires admin approval
        const response = await apiService.addProviderService({
          providerId,
          services: [service.title],
          serviceRates: [{ serviceName: service.title, price: Number(price) }],
        });

        if (response.success) {
          // Update UI to show pending status
          setServices(prev =>
            prev.map(s =>
              s.id === serviceId ? { ...s, isActive: false, rate: price, isPending: true } : s
            )
          );

          Alert.alert(
            'Service Request Submitted!',
            'Your request to add this service has been sent to admin for approval. You will be notified once approved.',
            [{ text: 'OK' }]
          );
        }
      } else {
        // If turning OFF, use the regular update endpoint
        let activeServiceNames: string[] = [];
        let activeServiceRates: { serviceName: string; price: number }[] = [];

        // Update UI and capture the new state
        setServices(prev => {
          const updatedServices = prev.map(s =>
            s.id === serviceId ? { ...s, isActive: false } : s
          );

          // Calculate active services from the updated list
          activeServiceNames = updatedServices
            .filter(s => s.isActive)
            .map(s => s.title);

          activeServiceRates = updatedServices
            .filter(s => s.isActive && s.rate > 0)
            .map(s => ({ serviceName: s.title, price: s.rate }));

          return updatedServices;
        });

        // Update backend using provider-specific endpoint
        await apiService.updateProviderProfile({
          services: activeServiceNames,
          serviceRates: activeServiceRates,
        });

        // Update local user context
        if (user) {
          updateUser({
            services: activeServiceNames,
            serviceRates: activeServiceRates
          });
        }

        console.log('✅ Service removed successfully');
      }
    } catch (error: any) {
      console.error('❌ Failed to update service:', error);
      const errorMessage = error.response?.data?.message || 'Failed to update service. Please try again.';
      Alert.alert('Error', errorMessage);
      // Revert on error
      setServices(prev =>
        prev.map(s =>
          s.id === serviceId ? { ...s, isActive: !s.isActive } : s
        )
      );
    }
  };

  const activeServices = services.filter(s => s.isActive);
  const availableServices = services.filter(s => !s.isActive);

  if (isLoading) {
    return (
      <SafeAreaView edges={['top']} style={styles.container}>
        <LoadingSpinner visible={true} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={THEME.colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={THEME.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Services</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <Animated.View style={{ opacity: fadeAnim }}>
          {/* Summary Card */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{activeServices.length}</Text>
              <Text style={styles.summaryLabel}>Active</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{services.length}</Text>
              <Text style={styles.summaryLabel}>Total</Text>
            </View>
          </View>

          {/* Active Services */}
          {activeServices.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Active Services</Text>
              <View style={styles.serviceList}>
                {activeServices.map((service, index) => (
                  <View
                    key={service.id}
                    style={[
                      styles.serviceCard,
                      index === activeServices.length - 1 && styles.serviceCardLast
                    ]}
                  >
                    <View style={styles.serviceInfo}>
                      <Text style={styles.serviceIcon}>{service.icon}</Text>
                      <View style={styles.serviceDetails}>
                        <Text style={styles.serviceName}>{service.title}</Text>
                        {service.rate > 0 && (
                          <Text style={styles.serviceRate}>₹{service.rate}/hr</Text>
                        )}
                      </View>
                    </View>
                    
                    {/* Action Buttons */}
                    <View style={styles.actionButtons}>
                      {/* Update Rate Button */}
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => {
                          setSelectedService(service);
                          setPriceInput(service.rate.toString());
                          setShowPriceModal(true);
                        }}
                      >
                        <Ionicons name="create-outline" size={18} color={THEME.colors.primary} />
                      </TouchableOpacity>
                      
                      {/* Delete Service Button */}
                      <TouchableOpacity
                        style={[styles.actionButton, styles.deleteButton]}
                        onPress={() => toggleService(service.id)}
                      >
                        <Ionicons name="trash-outline" size={18} color={THEME.colors.error} />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Available Services */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Available Services</Text>
            <Text style={styles.sectionSubtitle}>
              Tap to add services you can provide
            </Text>
            <View style={styles.serviceList}>
              {availableServices.map((service, index) => (
                <TouchableOpacity
                  key={service.id}
                  style={[
                    styles.serviceCard,
                    index === availableServices.length - 1 && styles.serviceCardLast
                  ]}
                  onPress={() => toggleService(service.id)}
                >
                  <View style={styles.serviceInfo}>
                    <Text style={styles.serviceIcon}>{service.icon}</Text>
                    <View style={styles.serviceDetails}>
                      <Text style={styles.serviceName}>{service.title}</Text>
                    </View>
                  </View>
                  <View style={styles.addServiceButton}>
                    <Ionicons name="add-circle" size={28} color={THEME.colors.primary} />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Help Text */}
          <View style={styles.helpCard}>
            <Ionicons name="information-circle-outline" size={20} color={THEME.colors.primary} />
            <Text style={styles.helpText}>
              Enable services you can provide. Customers will see you in search results for active services.
            </Text>
          </View>

          <View style={{ height: 100 }} />
        </Animated.View>
      </ScrollView>

      {/* Price Input Modal */}
      {showPriceModal && selectedService && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Set Price for {selectedService.title}</Text>
            <Text style={styles.modalSubtitle}>Enter your hourly rate for this service</Text>

            <View style={styles.priceInputContainer}>
              <Text style={styles.currencySymbol}>₹</Text>
              <TextInput
                style={styles.priceInput}
                placeholder="0"
                keyboardType="numeric"
                value={priceInput}
                onChangeText={setPriceInput}
                autoFocus
              />
              <Text style={styles.perHourText}>/hr</Text>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowPriceModal(false);
                  setSelectedService(null);
                  setPriceInput('');
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={async () => {
                  const price = parseInt(priceInput);
                  if (price > 0) {
                    setShowPriceModal(false);
                    setPriceInput('');
                    await performToggle(selectedService.id, price);
                    setSelectedService(null);
                  }
                }}
              >
                <Text style={styles.confirmButtonText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: THEME.spacing.lg,
    paddingVertical: THEME.spacing.md,
    backgroundColor: THEME.colors.background,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: THEME.colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    ...THEME.shadow,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: THEME.colors.text,
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    padding: THEME.spacing.lg,
  },
  summaryCard: {
    flexDirection: 'row',
    backgroundColor: THEME.colors.card,
    borderRadius: THEME.radius.md,
    padding: THEME.spacing.lg,
    marginBottom: THEME.spacing.xl,
    ...THEME.shadow,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 32,
    fontWeight: '800',
    color: THEME.colors.primary,
  },
  summaryLabel: {
    fontSize: 13,
    color: THEME.colors.textSecondary,
    marginTop: THEME.spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  summaryDivider: {
    width: 1,
    backgroundColor: THEME.colors.border,
    marginHorizontal: THEME.spacing.lg,
  },
  section: {
    marginBottom: THEME.spacing.xl,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.colors.textSecondary,
    letterSpacing: 0.5,
    marginBottom: THEME.spacing.xs,
    textTransform: 'uppercase',
  },
  sectionSubtitle: {
    fontSize: 13,
    color: THEME.colors.textTertiary,
    marginBottom: THEME.spacing.md,
  },
  serviceList: {
    backgroundColor: THEME.colors.card,
    borderRadius: THEME.radius.md,
    ...THEME.shadow,
  },
  serviceCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: THEME.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
  },
  serviceCardLast: {
    borderBottomWidth: 0,
  },
  serviceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  serviceIcon: {
    fontSize: 24,
    marginRight: THEME.spacing.md,
  },
  serviceDetails: {
    flex: 1,
  },
  serviceName: {
    fontSize: 15,
    fontWeight: '600',
    color: THEME.colors.text,
  },
  serviceRate: {
    fontSize: 13,
    color: THEME.colors.success,
    marginTop: 2,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: `${THEME.colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButton: {
    backgroundColor: `${THEME.colors.error}15`,
  },
  addServiceButton: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  helpCard: {
    flexDirection: 'row',
    backgroundColor: `${THEME.colors.primary}10`,
    borderRadius: THEME.radius.md,
    padding: THEME.spacing.md,
    gap: THEME.spacing.sm,
  },
  helpText: {
    flex: 1,
    fontSize: 13,
    color: THEME.colors.textSecondary,
    lineHeight: 18,
  },
  // Modal Styles
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: THEME.spacing.lg,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: THEME.radius.lg,
    padding: THEME.spacing.xl,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: THEME.colors.text,
    marginBottom: THEME.spacing.xs,
  },
  modalSubtitle: {
    fontSize: 14,
    color: THEME.colors.textSecondary,
    marginBottom: THEME.spacing.lg,
  },
  priceInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: THEME.radius.md,
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: THEME.spacing.sm,
    marginBottom: THEME.spacing.lg,
  },
  currencySymbol: {
    fontSize: 24,
    fontWeight: '700',
    color: THEME.colors.text,
    marginRight: THEME.spacing.xs,
  },
  priceInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: '700',
    color: THEME.colors.text,
    padding: 0,
  },
  perHourText: {
    fontSize: 16,
    color: THEME.colors.textSecondary,
    marginLeft: THEME.spacing.xs,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: THEME.spacing.sm,
  },
  modalButton: {
    flex: 1,
    paddingVertical: THEME.spacing.md,
    borderRadius: THEME.radius.md,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: THEME.colors.text,
  },
  confirmButton: {
    backgroundColor: THEME.colors.primary,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
