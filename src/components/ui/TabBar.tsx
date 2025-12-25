import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../../utils/theme';
import { useTheme } from '../../contexts/ThemeContext';
import { haptics } from '../../utils/haptics';

interface Tab {
  key: string;
  label: string;
}

interface TabBarProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabKey: string) => void;
}

export const TabBar: React.FC<TabBarProps> = ({ tabs, activeTab, onTabChange }) => {
  const { colors } = useTheme();
  
  return (
    <View style={[styles.container, { backgroundColor: colors.cardBg, borderBottomColor: colors.divider }]}>
      {tabs.map((tab) => {
        const isActive = tab.key === activeTab;
        
        return (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, isActive && styles.activeTab]}
            onPress={() => {
              haptics.light();
              onTabChange(tab.key);
            }}
            activeOpacity={0.7}
          >
            <Text style={[
                styles.tabText, 
                { color: colors.textSecondary },
                isActive && { color: colors.primary, fontWeight: '700' }
            ]}>
              {tab.label}
            </Text>
            {isActive && <View style={[styles.indicator, { backgroundColor: colors.primary }]} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    borderBottomWidth: 1,
  },
  tab: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    marginRight: SPACING.lg,
    position: 'relative',
  },
  activeTab: {
    // Active state handled by indicator
  },
  tabText: {
    fontSize: TYPOGRAPHY.size.md,
    fontWeight: TYPOGRAPHY.weight.medium,
  },
  indicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: COLORS.primary,
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
  },
});
