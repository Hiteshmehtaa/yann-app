import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS, SHADOWS } from '../../utils/theme';

interface PremiumDateTimePickerProps {
  label: string;
  value: Date | null;
  onChange: (date: Date) => void;
  mode: 'date' | 'time';
  error?: string;
  containerStyle?: ViewStyle;
  placeholder?: string;
  minimumDate?: Date;
  leftIcon?: keyof typeof Ionicons.glyphMap;
}

export const PremiumDateTimePicker: React.FC<PremiumDateTimePickerProps> = ({
  label,
  value,
  onChange,
  mode,
  error,
  containerStyle,
  placeholder,
  minimumDate,
  leftIcon = mode === 'date' ? 'calendar' : 'time',
}) => {
  const [show, setShow] = useState(false);

  const handlePress = () => {
    setShow(true);
  };

  const handleChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShow(false);
    }
    if (selectedDate) {
      onChange(selectedDate);
    }
  };

  const formatValue = () => {
    if (!value) return null;

    if (mode === 'date') {
      // More structured format: "Wed, 24 Dec 2024"
      const day = value.getDate().toString().padStart(2, '0');
      const monthShort = value.toLocaleDateString('en-US', { month: 'short' });
      const year = value.getFullYear();
      const weekday = value.toLocaleDateString('en-US', { weekday: 'short' });
      return `${weekday}, ${day} ${monthShort} ${year}`;
    } else {
      const hours = value.getHours().toString().padStart(2, '0');
      const minutes = value.getMinutes().toString().padStart(2, '0');
      return `${hours}:${minutes}`;
    }
  };

  const displayValue = formatValue();

  return (
    <View style={[styles.container, containerStyle]}>
      {/* Label */}
      <Text style={styles.label}>{label}</Text>

      {/* Picker Button */}
      <TouchableOpacity
        style={[
          styles.pickerButton,
          error && styles.pickerButtonError,
          show && { borderColor: COLORS.primary, backgroundColor: '#F8FAFC' } // Active State
        ]}
        onPress={handlePress}
        activeOpacity={0.8}
      >
        <View style={styles.iconContainer}>
          <Ionicons
            name={leftIcon}
            size={22} // Slightly larger icon
            color={COLORS.primary} // Always primary color for consistency
          />
        </View>

        <View style={styles.contentContainer}>
          {displayValue ? (
            <Text style={styles.valueText}>{displayValue}</Text>
          ) : (
            <Text style={styles.placeholderText}>
              {placeholder || (mode === 'date' ? 'Select Date' : 'Select Time')}
            </Text>
          )}
        </View>

        <Ionicons
          name="chevron-down"
          size={18}
          color={COLORS.textTertiary}
        />
      </TouchableOpacity>

      {error && <Text style={styles.errorText}>{error}</Text>}

      {/* Date/Time Picker Modal */}
      {show && (
        <>
          {Platform.OS === 'ios' && (
            <View style={styles.iosPickerContainer}>
              <View style={styles.iosPickerHeader}>
                <TouchableOpacity onPress={() => setShow(false)}>
                  <Text style={styles.iosPickerButton}>Done</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={value || new Date()}
                mode={mode}
                display="spinner"
                onChange={handleChange}
                minimumDate={minimumDate}
                textColor={COLORS.text}
              />
            </View>
          )}

          {Platform.OS === 'android' && (
            <DateTimePicker
              value={value || new Date()}
              mode={mode}
              display="default"
              onChange={handleChange}
              minimumDate={minimumDate}
            />
          )}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: TYPOGRAPHY.size.sm, // 14
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 8,
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 16, // Smoother corners
    borderWidth: 1.5, // Slightly thicker border
    borderColor: COLORS.gray200,
    height: 64, // Taller touch target
    paddingHorizontal: 16,
    gap: 12,
    ...SHADOWS.sm, // Soft shadow
  },
  pickerButtonError: {
    borderColor: COLORS.error,
    backgroundColor: '#FEF2F2', // Light red bg
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#EFF6FF', // Light blue bg
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DBEAFE', // Blue 100
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  valueText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text, // Dark slate
    marginTop: 2,
  },
  placeholderText: {
    fontSize: 16,
    color: COLORS.textTertiary,
    fontWeight: '500',
  },
  errorText: {
    fontSize: TYPOGRAPHY.size.xs,
    color: COLORS.error,
    marginTop: 6,
    marginLeft: 4,
    fontWeight: '600',
  },
  iosPickerContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    marginTop: 12,
    overflow: 'hidden',
    ...SHADOWS.lg, // Stronger shadow for modal feel
    borderWidth: 1,
    borderColor: COLORS.gray100,
  },
  iosPickerHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray100,
    backgroundColor: COLORS.gray50,
  },
  iosPickerButton: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
  },
});
