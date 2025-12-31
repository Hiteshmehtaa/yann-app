import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS } from '../utils/theme';

interface OvertimeBreakdownProps {
  duration: number; // in minutes
  expectedDuration: number; // in minutes
  overtimeDuration: number; // in minutes
  baseHourlyRate: number;
  overtimeRate: number;
  overtimeCharge: number;
  totalCharge: number;
}

export const OvertimeBreakdown: React.FC<OvertimeBreakdownProps> = ({
  duration,
  expectedDuration,
  overtimeDuration,
  baseHourlyRate,
  overtimeRate,
  overtimeCharge,
  totalCharge,
}) => {
  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const hasOvertime = overtimeDuration > 0;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={hasOvertime ? ['#EF4444', '#DC2626'] : ['#10B981', '#059669']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.header}>
          <Ionicons 
            name={hasOvertime ? "alert-circle" : "checkmark-circle"} 
            size={24} 
            color="#FFFFFF" 
          />
          <Text style={styles.headerText}>
            {hasOvertime ? 'Overtime Charges Applied' : 'Within Expected Duration'}
          </Text>
        </View>
      </LinearGradient>

      <View style={styles.content}>
        {/* Duration Breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Duration Breakdown</Text>
          
          <View style={styles.row}>
            <Text style={styles.label}>Expected Duration</Text>
            <Text style={styles.value}>{formatDuration(expectedDuration)}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Actual Duration</Text>
            <Text style={[styles.value, hasOvertime && styles.overtimeText]}>
              {formatDuration(duration)}
            </Text>
          </View>

          {hasOvertime && (
            <View style={[styles.row, styles.highlightRow]}>
              <Text style={[styles.label, styles.boldText]}>Overtime</Text>
              <Text style={[styles.value, styles.overtimeText, styles.boldText]}>
                {formatDuration(overtimeDuration)}
              </Text>
            </View>
          )}
        </View>

        {/* Charges Breakdown */}
        <View style={styles.divider} />
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Charges Breakdown</Text>
          
          <View style={styles.row}>
            <Text style={styles.label}>Base Rate (per hour)</Text>
            <Text style={styles.value}>₹{baseHourlyRate}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>
              Base Charge ({formatDuration(expectedDuration)})
            </Text>
            <Text style={styles.value}>
              ₹{Math.round((expectedDuration / 60) * baseHourlyRate)}
            </Text>
          </View>

          {hasOvertime && (
            <>
              <View style={styles.row}>
                <Text style={styles.label}>Overtime Rate (1.5x)</Text>
                <Text style={styles.value}>₹{overtimeRate}</Text>
              </View>

              <View style={[styles.row, styles.highlightRow]}>
                <Text style={[styles.label, styles.boldText]}>
                  Overtime Charge ({formatDuration(overtimeDuration)})
                </Text>
                <Text style={[styles.value, styles.overtimeText, styles.boldText]}>
                  ₹{overtimeCharge}
                </Text>
              </View>
            </>
          )}
        </View>

        {/* Total */}
        <View style={styles.divider} />
        
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total Charge</Text>
          <Text style={styles.totalValue}>₹{totalCharge}</Text>
        </View>

        {hasOvertime && (
          <View style={styles.infoBox}>
            <Ionicons name="information-circle" size={16} color={COLORS.primary} />
            <Text style={styles.infoText}>
              Overtime is charged at 1.5x the base hourly rate for any time exceeding the expected duration.
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.large,
    overflow: 'hidden',
    marginVertical: SPACING.md,
  },
  gradient: {
    padding: SPACING.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  headerText: {
    fontSize: TYPOGRAPHY.size.md,
    fontWeight: TYPOGRAPHY.weight.bold,
    color: '#FFFFFF',
  },
  content: {
    padding: SPACING.md,
  },
  section: {
    marginBottom: SPACING.sm,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.size.sm,
    fontWeight: TYPOGRAPHY.weight.semibold,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
  },
  highlightRow: {
    backgroundColor: `${COLORS.error}10`,
    paddingHorizontal: SPACING.sm,
    borderRadius: RADIUS.small,
    marginTop: SPACING.xs,
  },
  label: {
    fontSize: TYPOGRAPHY.size.sm,
    color: COLORS.text,
  },
  value: {
    fontSize: TYPOGRAPHY.size.sm,
    fontWeight: TYPOGRAPHY.weight.semibold,
    color: COLORS.text,
  },
  boldText: {
    fontWeight: TYPOGRAPHY.weight.bold,
  },
  overtimeText: {
    color: COLORS.error,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.md,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: `${COLORS.primary}10`,
    padding: SPACING.md,
    borderRadius: RADIUS.medium,
  },
  totalLabel: {
    fontSize: TYPOGRAPHY.size.md,
    fontWeight: TYPOGRAPHY.weight.bold,
    color: COLORS.text,
  },
  totalValue: {
    fontSize: TYPOGRAPHY.size.xl,
    fontWeight: TYPOGRAPHY.weight.bold,
    color: COLORS.primary,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
    backgroundColor: `${COLORS.primary}10`,
    padding: SPACING.sm,
    borderRadius: RADIUS.small,
    marginTop: SPACING.md,
  },
  infoText: {
    flex: 1,
    fontSize: TYPOGRAPHY.size.xs,
    color: COLORS.textSecondary,
    lineHeight: 16,
  },
});
