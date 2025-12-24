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
        style={[styles.pickerButton, error && styles.pickerButtonError]}
        onPress={handlePress}
        activeOpacity={0.7}
      >
        <View style={styles.iconContainer}>
          <Ionicons
            name={leftIcon}
            size={20}
            color={value ? COLORS.primary : COLORS.textSecondary}
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
          size={20}
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
    fontSize: TYPOGRAPHY.size.sm,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.medium,
    borderWidth: 1,
    borderColor: COLORS.border,
    minHeight: 56,
    paddingHorizontal: SPACING.md,
    gap: SPACING.sm,
    ...SHADOWS.sm,
  },
  pickerButtonError: {
    borderColor: COLORS.error,
    borderWidth: 2,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.small,
    backgroundColor: COLORS.elevated,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    flex: 1,
  },
  valueText: {
    fontSize: TYPOGRAPHY.size.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  placeholderText: {
    fontSize: TYPOGRAPHY.size.md,
    color: COLORS.textTertiary,
    fontWeight: '500',
  },
  errorText: {
    fontSize: TYPOGRAPHY.size.xs,
    color: COLORS.error,
    marginTop: SPACING.xs,
    marginLeft: SPACING.sm,
    fontWeight: '500',
  },
  iosPickerContainer: {
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.large,
    marginTop: SPACING.sm,
    overflow: 'hidden',
    ...SHADOWS.md,
  },
  iosPickerHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  iosPickerButton: {
    fontSize: TYPOGRAPHY.size.md,
    fontWeight: '700',
    color: COLORS.primary,
  },
});
