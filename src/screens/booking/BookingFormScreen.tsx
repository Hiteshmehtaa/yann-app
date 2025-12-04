import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StatusBar,
  Animated,
} from 'react-native';
import { Toast } from '../../components/Toast';
import { useToast } from '../../hooks/useToast';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';
import { PAYMENT_METHODS } from '../../utils/constants';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { Service } from '../../types';
import { COLORS, SPACING, RADIUS, SHADOWS, ICON_SIZES, TYPOGRAPHY, ANIMATIONS } from '../../utils/theme';

type Props = {
  navigation: NativeStackNavigationProp<any>;
  route: RouteProp<{ params: { service: Service; selectedProvider?: any } }, 'params'>;
};

export const BookingFormScreen: React.FC<Props> = ({ navigation, route }) => {
  const { service, selectedProvider } = route.params;
  const { user } = useAuth();
  const { toast, showSuccess, showError, hideToast } = useToast();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  const [formData, setFormData] = useState({
    customerName: user?.name || '',
    customerPhone: user?.phone || '',
    customerAddress: '',
    bookingDate: '',
    bookingTime: '10:00',
    paymentMethod: 'cash',
    notes: '',
  });

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: ANIMATIONS.slow,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: ANIMATIONS.slow,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const updateField = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const validateForm = (): boolean => {
    if (!formData.customerName.trim()) {
      showError('Please enter your name');
      return false;
    }
    if (!formData.customerPhone.trim() || formData.customerPhone.length !== 10) {
      showError('Please enter a valid 10-digit phone number');
      return false;
    }
    if (!formData.customerAddress.trim()) {
      showError('Please enter your address');
      return false;
    }
    if (!formData.bookingDate) {
      showError('Please select a date');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const bookingData = {
        serviceId: service.id,
        serviceName: service.title,
        serviceCategory: service.category,
        customerId: user?._id || null,
        customerName: formData.customerName,
        customerPhone: formData.customerPhone,
        customerAddress: formData.customerAddress,
        bookingDate: formData.bookingDate,
        bookingTime: formData.bookingTime,
        basePrice: 299,
        extras: [],
        totalPrice: 299,
        paymentMethod: formData.paymentMethod,
        billingType: 'one-time',
        quantity: 1,
        notes: formData.notes,
        providerId: selectedProvider?._id || null,
      };

      // Validate providerId is present
      if (!bookingData.providerId) {
        showError('Provider information is missing. Please go back and select a provider.');
        return;
      }

      await apiService.createBooking(bookingData);

      showSuccess('Booking confirmed successfully!');
      setTimeout(() => {
        navigation.navigate('BookingsList');
      }, 1500);
    } catch (error: any) {
      showError(
        error.response?.data?.message || 'Failed to create booking. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={ICON_SIZES.large} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Confirm Booking</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        bounces={true}
        alwaysBounceVertical={true}
      >
        <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          {/* Service Summary Card */}
          <View style={styles.summaryCard}>
            <LinearGradient
              colors={[COLORS.primary, COLORS.primaryGradientEnd]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.summaryGradient}
            >
              <View style={styles.summaryIcon}>
                <Ionicons name="sparkles" size={ICON_SIZES.xlarge} color={COLORS.white} />
              </View>
              <Text style={styles.summaryTitle}>{service.title}</Text>
              <View style={styles.summaryRating}>
                <Ionicons name="star" size={14} color={COLORS.warning} />
                <Text style={styles.summaryRatingText}>4.8</Text>
              </View>
              <Text style={styles.summaryPrice}>{service.price}</Text>
            </LinearGradient>
          </View>

          {/* Contact Information */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconContainer}>
                <Ionicons name="person" size={ICON_SIZES.medium} color={COLORS.success} />
              </View>
              <Text style={styles.sectionTitle}>Contact Information</Text>
            </View>

            <Input
              label="Full Name"
              leftIcon="person-outline"
              value={formData.customerName}
              onChangeText={(value) => updateField('customerName', value)}
              placeholder="Enter your name"
            />

            <Input
              label="Phone Number"
              leftIcon="call-outline"
              value={formData.customerPhone}
              onChangeText={(value) => updateField('customerPhone', value)}
              placeholder="10-digit mobile number"
              keyboardType="phone-pad"
              maxLength={10}
            />

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Service Address</Text>
              <TextInput
                style={styles.textArea}
                placeholder="Enter complete address with landmark"
                placeholderTextColor={COLORS.textTertiary}
                multiline
                numberOfLines={4}
                value={formData.customerAddress}
                onChangeText={(value) => updateField('customerAddress', value)}
                textAlignVertical="top"
              />
            </View>
          </View>

          {/* Schedule */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconContainer}>
                <Ionicons name="calendar" size={ICON_SIZES.medium} color={COLORS.accentOrange} />
              </View>
              <Text style={styles.sectionTitle}>Schedule</Text>
            </View>

            <View style={styles.row}>
              <View style={styles.halfInput}>
                <Text style={styles.inputLabel}>Date</Text>
                <TextInput
                  style={styles.input}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={COLORS.textTertiary}
                  value={formData.bookingDate}
                  onChangeText={(value) => updateField('bookingDate', value)}
                />
              </View>

              <View style={styles.halfInput}>
                <Text style={styles.inputLabel}>Time</Text>
                <TextInput
                  style={styles.input}
                  placeholder="10:00"
                  placeholderTextColor={COLORS.textTertiary}
                  value={formData.bookingTime}
                  onChangeText={(value) => updateField('bookingTime', value)}
                />
              </View>
            </View>
          </View>

          {/* Payment Method */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconContainer}>
                <Ionicons name="wallet" size={ICON_SIZES.medium} color={COLORS.warning} />
              </View>
              <Text style={styles.sectionTitle}>Payment Method</Text>
            </View>

            <View style={styles.paymentOptions}>
              {PAYMENT_METHODS.map((method) => (
                <TouchableOpacity
                  key={method.id}
                  style={[
                    styles.paymentOption,
                    formData.paymentMethod === method.id && styles.paymentOptionActive,
                  ]}
                  onPress={() => updateField('paymentMethod', method.id)}
                >
                  <Ionicons
                    name={method.icon as keyof typeof Ionicons.glyphMap}
                    size={ICON_SIZES.medium}
                    color={formData.paymentMethod === method.id ? COLORS.primary : COLORS.textSecondary}
                  />
                  <Text
                    style={[
                      styles.paymentOptionText,
                      formData.paymentMethod === method.id && styles.paymentOptionTextActive,
                    ]}
                  >
                    {method.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Additional Notes */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconContainer}>
                <Ionicons name="document-text" size={ICON_SIZES.medium} color={COLORS.info} />
              </View>
              <Text style={styles.sectionTitle}>Additional Notes</Text>
            </View>

            <TextInput
              style={styles.textArea}
              placeholder="Any special requirements or instructions..."
              placeholderTextColor={COLORS.textTertiary}
              multiline
              numberOfLines={4}
              value={formData.notes}
              onChangeText={(value) => updateField('notes', value)}
              textAlignVertical="top"
            />
          </View>

          {/* Price Breakdown */}
          <View style={styles.priceCard}>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Service Fee</Text>
              <Text style={styles.priceValue}>{service.price}</Text>
            </View>
            <View style={styles.priceDivider} />
            <View style={styles.priceRow}>
              <Text style={styles.priceTotalLabel}>Total Amount</Text>
              <Text style={styles.priceTotalValue}>{service.price}</Text>
            </View>
          </View>

          {/* Submit Button */}
          <Button
            title="Confirm Booking"
            onPress={handleSubmit}
            loading={isLoading}
            size="large"
            style={styles.submitButton}
          />
        </Animated.View>
      </ScrollView>

      <LoadingSpinner visible={isLoading} />
      
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={hideToast}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.cardBg,
    ...SHADOWS.sm,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.small,
    backgroundColor: COLORS.elevated,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: TYPOGRAPHY.size.xl,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
    marginHorizontal: SPACING.md,
  },
  headerSpacer: {
    width: 44,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: SPACING.lg,
  },
  summaryCard: {
    borderRadius: RADIUS.large,
    overflow: 'hidden',
    marginBottom: SPACING.xl,
    ...SHADOWS.md,
  },
  summaryGradient: {
    padding: SPACING.xl,
    alignItems: 'center',
  },
  summaryIcon: {
    width: 64,
    height: 64,
    borderRadius: RADIUS.medium,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  summaryTitle: {
    fontSize: TYPOGRAPHY.size.xxl,
    fontWeight: '800',
    color: COLORS.white,
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  summaryRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: SPACING.sm,
  },
  summaryRatingText: {
    fontSize: TYPOGRAPHY.size.md,
    fontWeight: '600',
    color: COLORS.white,
  },
  summaryPrice: {
    fontSize: TYPOGRAPHY.size.xxxl,
    fontWeight: '800',
    color: COLORS.white,
    letterSpacing: -0.5,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  sectionIconContainer: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.small,
    backgroundColor: COLORS.elevated,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.size.lg,
    fontWeight: '700',
    color: COLORS.text,
  },
  inputGroup: {
    marginBottom: SPACING.md,
  },
  inputLabel: {
    fontSize: TYPOGRAPHY.size.sm,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  input: {
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.medium,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    fontSize: TYPOGRAPHY.size.md,
    color: COLORS.text,
  },
  textArea: {
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.medium,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    fontSize: TYPOGRAPHY.size.md,
    color: COLORS.text,
    minHeight: 100,
  },
  row: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  halfInput: {
    flex: 1,
  },
  paymentOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  paymentOption: {
    flex: 1,
    minWidth: '45%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.medium,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  paymentOptionActive: {
    borderColor: COLORS.primary,
    borderWidth: 2,
    backgroundColor: `${COLORS.primary}08`,
  },
  paymentOptionText: {
    fontSize: TYPOGRAPHY.size.sm,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  paymentOptionTextActive: {
    color: COLORS.primary,
  },
  priceCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.large,
    padding: SPACING.lg,
    marginBottom: SPACING.xl,
    ...SHADOWS.md,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  priceLabel: {
    fontSize: TYPOGRAPHY.size.md,
    color: COLORS.textSecondary,
  },
  priceValue: {
    fontSize: TYPOGRAPHY.size.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  priceDivider: {
    height: 1,
    backgroundColor: COLORS.divider,
    marginVertical: SPACING.sm,
  },
  priceTotalLabel: {
    fontSize: TYPOGRAPHY.size.lg,
    fontWeight: '700',
    color: COLORS.text,
  },
  priceTotalValue: {
    fontSize: TYPOGRAPHY.size.xxl,
    fontWeight: '800',
    color: COLORS.primary,
  },
  submitButton: {
    marginBottom: SPACING.xl,
  },
});
