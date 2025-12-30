import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../contexts/ThemeContext';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS, SHADOWS } from '../utils/theme';

interface JobTimerProps {
  startTime: Date;
  expectedDuration: number; // in minutes
  style?: any;
}

export const JobTimer: React.FC<JobTimerProps> = ({
  startTime,
  expectedDuration,
  style
}) => {
  const { colors } = useTheme();
  const [elapsed, setElapsed] = useState(0);
  const [isOvertime, setIsOvertime] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const elapsedMs = now.getTime() - new Date(startTime).getTime();
      const elapsedMinutes = Math.floor(elapsedMs / (1000 * 60));
      
      setElapsed(elapsedMinutes);
      setIsOvertime(elapsedMinutes > expectedDuration);
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime, expectedDuration]);

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    const secs = Math.floor((Date.now() - new Date(startTime).getTime()) / 1000) % 60;
    
    return {
      hours: hours.toString().padStart(2, '0'),
      minutes: mins.toString().padStart(2, '0'),
      seconds: secs.toString().padStart(2, '0')
    };
  };

  const time = formatTime(elapsed);
  const expectedHours = Math.floor(expectedDuration / 60);
  const expectedMins = expectedDuration % 60;
  const overtimeMinutes = Math.max(0, elapsed - expectedDuration);

  return (
    <View style={[styles.container, style]}>
      <LinearGradient
        colors={isOvertime ? ['#EF4444', '#DC2626'] : ['#10B981', '#059669']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Timer Display */}
        <View style={styles.timerSection}>
          <View style={styles.iconContainer}>
            <Ionicons name="time" size={24} color="#FFFFFF" />
          </View>
          <View style={styles.timeDisplay}>
            <View style={styles.timeUnit}>
              <Text style={styles.timeValue}>{time.hours}</Text>
              <Text style={styles.timeLabel}>HRS</Text>
            </View>
            <Text style={styles.timeSeparator}>:</Text>
            <View style={styles.timeUnit}>
              <Text style={styles.timeValue}>{time.minutes}</Text>
              <Text style={styles.timeLabel}>MIN</Text>
            </View>
            <Text style={styles.timeSeparator}>:</Text>
            <View style={styles.timeUnit}>
              <Text style={styles.timeValue}>{time.seconds}</Text>
              <Text style={styles.timeLabel}>SEC</Text>
            </View>
          </View>
        </View>

        {/* Expected Duration */}
        <View style={styles.infoSection}>
          <Text style={styles.infoLabel}>Expected Duration</Text>
          <Text style={styles.infoValue}>
            {expectedHours}h {expectedMins}m
          </Text>
        </View>

        {/* Overtime Indicator */}
        {isOvertime && (
          <View style={styles.overtimeSection}>
            <Ionicons name="alert-circle" size={16} color="#FFFFFF" />
            <Text style={styles.overtimeText}>
              Overtime: {Math.floor(overtimeMinutes / 60)}h {overtimeMinutes % 60}m
            </Text>
          </View>
        )}
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: RADIUS.large,
    overflow: 'hidden',
    ...SHADOWS.md,
  },
  gradient: {
    padding: SPACING.lg,
  },
  timerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  timeDisplay: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeUnit: {
    alignItems: 'center',
  },
  timeValue: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 36,
  },
  timeLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
    letterSpacing: 0.5,
  },
  timeSeparator: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    marginHorizontal: SPACING.xs,
  },
  infoSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  infoLabel: {
    fontSize: TYPOGRAPHY.size.sm,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
  },
  infoValue: {
    fontSize: TYPOGRAPHY.size.md,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  overtimeSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.sm,
    padding: SPACING.sm,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: RADIUS.small,
    gap: SPACING.xs,
  },
  overtimeText: {
    fontSize: TYPOGRAPHY.size.sm,
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
