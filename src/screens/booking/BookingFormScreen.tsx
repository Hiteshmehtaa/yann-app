import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';
import { PAYMENT_METHODS } from '../../utils/constants';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { Service } from '../../types';

// Dark Editorial Theme
const THEME = {
  bg: '#0A0A0A',
  bgCard: '#1A1A1A',
  bgInput: '#141414',
  text: '#F5F0EB',
  textMuted: '#8A8A8A',
  accent: '#FF6B35',
  accentSoft: 'rgba(255, 107, 53, 0.12)',
  border: '#2A2A2A',
  borderActive: '#FF6B35',
};

type Props = {
  navigation: NativeStackNavigationProp<any>;
  route: RouteProp<{ params: { service: Service } }, 'params'>;
};

const PAYMENT_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  cash: 'cash-outline',
  upi: 'phone-portrait-outline',
  card: 'card-outline',
  online: 'globe-outline',
};

export const BookingFormScreen: React.FC<Props> = ({ navigation, route }) => {
  const { service } = route.params;
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    customerName: user?.name || '',
    customerPhone: user?.phone || '',
    customerAddress: '',
    bookingDate: '',
    bookingTime: '10:00',
    paymentMethod: 'cash',
    billingType: 'one-time',
    quantity: 1,
    notes: '',
  });

  const [isLoading, setIsLoading] = useState(false);

  const updateField = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const validateForm = (): boolean => {
    if (!formData.customerName.trim()) {
      Alert.alert('Error', 'Please enter your name');
      return false;
    }
    if (!formData.customerPhone.trim() || formData.customerPhone.length !== 10) {
      Alert.alert('Error', 'Please enter a valid 10-digit phone number');
      return false;
    }
    if (!formData.customerAddress.trim()) {
      Alert.alert('Error', 'Please enter your address');
      return false;
    }
    if (!formData.bookingDate) {
      Alert.alert('Error', 'Please select a date');
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
        billingType: formData.billingType,
        quantity: formData.quantity,
        notes: formData.notes,
        providerId: null,
      };

      await apiService.createBooking(bookingData);

      Alert.alert(
        'Booking Confirmed',
        'Your booking has been created successfully. Service providers have been notified.',
        [
          {
            text: 'View Bookings',
            onPress: () => navigation.navigate('BookingsList'),
          },
          {
            text: 'Done',
            onPress: () => navigation.navigate('Home'),
          },
        ]
      );
    } catch (error: any) {
      console.error('Booking error:', error);
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to create booking. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <StatusBar barStyle="light-content" backgroundColor={THEME.bg} />
      
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Service Summary */}
        <View style={styles.serviceSummary}>
          <View>
            <Text style={styles.summaryLabel}>BOOKING</Text>
            <Text style={styles.serviceName}>{service.title}</Text>
          </View>
          <Text style={styles.servicePrice}>{service.price}</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {/* Contact Information */}
          <View style={styles.sectionHeader}>
            <View style={styles.accentBar} />
            <Text style={styles.sectionTitle}>CONTACT</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full name</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="person-outline" size={18} color={THEME.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter your name"
                placeholderTextColor={THEME.textMuted}
                value={formData.customerName}
                onChangeText={(value) => updateField('customerName', value)}
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
                placeholder="10-digit mobile number"
                placeholderTextColor={THEME.textMuted}
                keyboardType="phone-pad"
                maxLength={10}
                value={formData.customerPhone}
                onChangeText={(value) => updateField('customerPhone', value)}
                editable={!isLoading}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Service address</Text>
            <View style={[styles.inputContainer, styles.textAreaContainer]}>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Enter complete address"
                placeholderTextColor={THEME.textMuted}
                multiline
                numberOfLines={3}
                value={formData.customerAddress}
                onChangeText={(value) => updateField('customerAddress', value)}
                editable={!isLoading}
              />
            </View>
          </View>

          {/* Schedule */}
          <View style={styles.sectionHeader}>
            <View style={styles.accentBar} />
            <Text style={styles.sectionTitle}>SCHEDULE</Text>
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Date (YYYY-MM-DD)</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="2025-12-15"
                  placeholderTextColor={THEME.textMuted}
                  value={formData.bookingDate}
                  onChangeText={(value) => updateField('bookingDate', value)}
                  editable={!isLoading}
                />
              </View>
            </View>

            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Time</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="10:00"
                  placeholderTextColor={THEME.textMuted}
                  value={formData.bookingTime}
                  onChangeText={(value) => updateField('bookingTime', value)}
                  editable={!isLoading}
                />
              </View>
            </View>
          </View>

          {/* Payment Method */}
          <View style={styles.sectionHeader}>
            <View style={styles.accentBar} />
            <Text style={styles.sectionTitle}>PAYMENT</Text>
          </View>
          <View style={styles.paymentOptions}>
            {PAYMENT_METHODS.map((method) => (
              <TouchableOpacity
                key={method.value}
                style={[
                  styles.paymentOption,
                  formData.paymentMethod === method.value && styles.paymentOptionActive,
                ]}
                onPress={() => updateField('paymentMethod', method.value)}
                disabled={isLoading}
                activeOpacity={0.7}
              >
                <Ionicons 
                  name={PAYMENT_ICONS[method.value] || 'wallet-outline'} 
                  size={18} 
                  color={formData.paymentMethod === method.value ? THEME.accent : THEME.textMuted} 
                />
                <Text
                  style={[
                    styles.paymentLabel,
                    formData.paymentMethod === method.value && styles.paymentLabelActive,
                  ]}
                >
                  {method.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Additional Notes */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Special instructions (optional)</Text>
            <View style={[styles.inputContainer, styles.textAreaContainer]}>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Any special requirements..."
                placeholderTextColor={THEME.textMuted}
                multiline
                numberOfLines={3}
                value={formData.notes}
                onChangeText={(value) => updateField('notes', value)}
                editable={!isLoading}
              />
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Submit Button */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isLoading}
          activeOpacity={0.8}
        >
          <Text style={styles.submitButtonText}>
            {isLoading ? 'PROCESSING...' : 'CONFIRM BOOKING'}
          </Text>
          {!isLoading && <Ionicons name="checkmark" size={18} color="#FFFFFF" />}
        </TouchableOpacity>
      </View>
      
      <LoadingSpinner visible={isLoading} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.bg,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 100,
  },
  serviceSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 18,
    backgroundColor: THEME.bgCard,
    borderRadius: 16,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: THEME.accent,
  },
  summaryLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: THEME.accent,
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  serviceName: {
    fontSize: 17,
    fontWeight: '700',
    color: THEME.text,
  },
  servicePrice: {
    fontSize: 20,
    fontWeight: '800',
    color: THEME.accent,
    letterSpacing: -0.5,
  },
  form: {},
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
    marginBottom: 18,
  },
  accentBar: {
    width: 3,
    height: 18,
    backgroundColor: THEME.accent,
    borderRadius: 2,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.text,
    letterSpacing: 2,
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
    fontSize: 13,
    fontWeight: '600',
    color: THEME.textMuted,
    marginBottom: 8,
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
  textAreaContainer: {
    alignItems: 'flex-start',
    paddingVertical: 4,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
    paddingTop: 10,
  },
  paymentOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 24,
  },
  paymentOption: {
    flex: 1,
    minWidth: '45%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.bgCard,
    borderWidth: 1,
    borderColor: THEME.border,
    borderRadius: 12,
    padding: 14,
    gap: 8,
  },
  paymentOptionActive: {
    backgroundColor: THEME.accentSoft,
    borderColor: THEME.accent,
    borderWidth: 2,
  },
  paymentLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: THEME.textMuted,
  },
  paymentLabelActive: {
    color: THEME.accent,
    fontWeight: '700',
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
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.accent,
    borderRadius: 14,
    paddingVertical: 16,
    gap: 10,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
  },
});
