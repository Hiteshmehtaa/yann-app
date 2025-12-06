import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Animated,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';
import { SERVICES } from '../../utils/constants';
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
}

export const ProviderServicesScreen: React.FC<Props> = ({ navigation }) => {
  const { user } = useAuth();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [isLoading, setIsLoading] = useState(true);
  const [services, setServices] = useState<ServiceItem[]>([]);

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
      const mappedServices = backendServices.map((service: any) => ({
        id: service._id || service.id || Math.random(),
        title: service.title || service.name,
        icon: service.icon || '✨',
        isActive: userServices.includes(service.title || service.name),
        rate: userRates[service.title || service.name] || service.price || 0,
      }));

      setServices(mappedServices);
    } catch (err) {
      console.error('Failed to load services from API, using fallback', err);
      // Fallback to hardcoded SERVICES
      const userServices = user?.services || [];
      const userRates: Record<string, number> = user?.serviceRates || {};
      
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
    // Optimistically update UI
    setServices(prev => 
      prev.map(s => 
        s.id === serviceId ? { ...s, isActive: !s.isActive } : s
      )
    );

    try {
      // Get updated services list
      const updatedServices = services.map(s => 
        s.id === serviceId ? { ...s, isActive: !s.isActive } : s
      );
      
      const activeServiceNames = updatedServices
        .filter(s => s.isActive)
        .map(s => s.title);
      
      const activeServiceRates = updatedServices
        .filter(s => s.isActive && s.rate > 0)
        .map(s => ({ serviceName: s.title, price: s.rate }));

      // Update backend
      await apiService.updateProfile({
        services: activeServiceNames,
        serviceRates: activeServiceRates,
      });

      console.log('✅ Service toggled and saved to DB');
    } catch (error) {
      console.error('❌ Failed to update service:', error);
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
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={THEME.colors.primary} />
        </View>
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
                    <Switch
                      value={service.isActive}
                      onValueChange={() => toggleService(service.id)}
                      trackColor={{ false: THEME.colors.border, true: `${THEME.colors.success}50` }}
                      thumbColor={service.isActive ? THEME.colors.success : '#f4f3f4'}
                    />
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Available Services */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Available Services</Text>
            <Text style={styles.sectionSubtitle}>
              Toggle to add services you can provide
            </Text>
            <View style={styles.serviceList}>
              {availableServices.map((service, index) => (
                <View 
                  key={service.id} 
                  style={[
                    styles.serviceCard,
                    index === availableServices.length - 1 && styles.serviceCardLast
                  ]}
                >
                  <View style={styles.serviceInfo}>
                    <Text style={styles.serviceIcon}>{service.icon}</Text>
                    <View style={styles.serviceDetails}>
                      <Text style={styles.serviceName}>{service.title}</Text>
                    </View>
                  </View>
                  <Switch
                    value={service.isActive}
                    onValueChange={() => toggleService(service.id)}
                    trackColor={{ false: THEME.colors.border, true: `${THEME.colors.success}50` }}
                    thumbColor={service.isActive ? THEME.colors.success : '#f4f3f4'}
                  />
                </View>
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
});
