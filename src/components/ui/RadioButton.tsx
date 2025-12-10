import React from 'react';
import { View, StyleSheet } from 'react-native';
import { COLORS } from '../../utils/theme';

interface RadioButtonProps {
  selected: boolean;
}

export const RadioButton: React.FC<RadioButtonProps> = ({ selected }) => {
  return (
    <View style={[styles.container, selected && styles.selectedContainer]}>
      {selected && <View style={styles.innerCircle} />}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white,
  },
  selectedContainer: {
    borderColor: COLORS.primary,
  },
  innerCircle: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.primary,
  },
});
