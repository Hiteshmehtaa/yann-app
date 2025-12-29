import React from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, TextInputProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, ICON_SIZES, SHADOWS, LAYOUT } from '../../utils/theme';

type SearchBarProps = TextInputProps & {
  value: string;
  onChangeText: (text: string) => void;
  onClear?: () => void;
  placeholder?: string;
};

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChangeText,
  onClear,
  placeholder = 'Search for services...',
  ...props
}) => {
  return (
    <View style={styles.container}>
      <Ionicons name="search" size={ICON_SIZES.medium} color={COLORS.textSecondary} style={styles.searchIcon} />
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={COLORS.textTertiary}
        value={value}
        onChangeText={onChangeText}
        autoCapitalize="none"
        autoCorrect={false}
        {...props}
      />
      {value.length > 0 && (
        <TouchableOpacity onPress={onClear || (() => onChangeText(''))}>
          <Ionicons name="close-circle" size={ICON_SIZES.medium} color={COLORS.textSecondary} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 0,
    marginTop: 0,
    marginBottom: 0,
    paddingHorizontal: SPACING.lg,
    height: 56, // Larger height for premium feel
    borderRadius: 16, // More rounded
    borderWidth: 1.5,
    borderColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  searchIcon: {
    marginRight: SPACING.md,
    opacity: 0.6,
  },
  input: {
    flex: 1,
    fontSize: 16, // Slightly larger text
    color: COLORS.text,
    padding: 0,
    height: '100%',
    fontWeight: '500',
  },
});
