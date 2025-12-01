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
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Service Summary */}
        <View style={styles.serviceSummary}>
          <Text style={styles.serviceName}>{service.title}</Text>
          <Text style={styles.servicePrice}>{service.price}</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {/* Contact Information */}
          <Text style={styles.sectionTitle}>Contact details</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full name</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="person-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter your name"
                placeholderTextColor="#9CA3AF"
                value={formData.customerName}
                onChangeText={(value) => updateField('customerName', value)}
                editable={!isLoading}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone number</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="call-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="10-digit mobile number"
                placeholderTextColor="#9CA3AF"
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
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={3}
                value={formData.customerAddress}
                onChangeText={(value) => updateField('customerAddress', value)}
                editable={!isLoading}
              />
            </View>
          </View>

          {/* Schedule */}
          <Text style={styles.sectionTitle}>Schedule</Text>

          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Date (YYYY-MM-DD)</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="2025-12-15"
                  placeholderTextColor="#9CA3AF"
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
                  placeholderTextColor="#9CA3AF"
                  value={formData.bookingTime}
                  onChangeText={(value) => updateField('bookingTime', value)}
                  editable={!isLoading}
                />
              </View>
            </View>
          </View>

          {/* Payment Method */}
          <Text style={styles.sectionTitle}>Payment method</Text>
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
                  size={20} 
                  color={formData.paymentMethod === method.value ? '#0A0A0A' : '#6B7280'} 
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
                placeholderTextColor="#9CA3AF"
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
            {isLoading ? 'Processing...' : 'Confirm booking'}
          </Text>
          {!isLoading && <Ionicons name="checkmark" size={20} color="#FFFFFF" />}
        </TouchableOpacity>
      </View>
      
      <LoadingSpinner visible={isLoading} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
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
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0A0A0A',
  },
  servicePrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0A0A0A',
  },
  form: {},
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0A0A0A',
    marginTop: 8,
    marginBottom: 16,
    letterSpacing: -0.3,
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
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 14,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
    color: '#0A0A0A',
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
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    padding: 14,
    gap: 8,
  },
  paymentOptionActive: {
    backgroundColor: '#F9FAFB',
    borderColor: '#0A0A0A',
    borderWidth: 2,
  },
  paymentLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  paymentLabelActive: {
    color: '#0A0A0A',
    fontWeight: '600',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0A0A0A',
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
