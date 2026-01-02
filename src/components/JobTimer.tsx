import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
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

const { width } = Dimensions.get('window');

export const JobTimer: React.FC<JobTimerProps> = ({
  startTime,
  expectedDuration,
  style
}) => {
  const { colors } = useTheme();
  const [elapsed, setElapsed] = useState(0);
  const [isOvertime, setIsOvertime] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const elapsedMs = now.getTime() - new Date(startTime).getTime();
      const elapsedMinutes = Math.floor(elapsedMs / (1000 * 60));
      
      setElapsed(elapsedMinutes);
      setIsOvertime(elapsedMinutes > expectedDuration);
    }, 1000);

    // Pulse animation for the "Active" indicator
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.6,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();

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
  
  // Calculate progress percentage (capped at 100%)
  const progressPercent = Math.min(100, (elapsed / expectedDuration) * 100);

  return (
    <View style={[styles.container, style]}>
      <LinearGradient
        colors={isOvertime ? ['#DC2626', '#B91C1C'] : ['#2563EB', '#1E40AF']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Header Section */}
        <View style={styles.headerRow}>
            <View style={styles.liveBadge}>
                <Animated.View style={[styles.pulseDot, { opacity: pulseAnim }]} />
                <Text style={styles.liveText}>LIVE JOB</Text>
            </View>
            {isOvertime && (
                <View style={styles.overtimeBadge}>
                    <Ionicons name="warning" size={12} color="#FFF" />
                    <Text style={styles.overtimeBadgeText}>OVERTIME</Text>
                </View>
            )}
        </View>

        {/* Main Timer Display */}
        <View style={styles.timerDisplay}>
          <Text style={styles.timerDigits}>
            {time.hours}<Text style={styles.timerSeparator}>:</Text>
            {time.minutes}<Text style={styles.timerSeparator}>:</Text>
            {time.seconds}
          </Text>
          <Text style={styles.timerLabels}>HOURS   MIN   SEC</Text>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
            <View style={styles.progressBarBg}>
                <View 
                    style={[
                        styles.progressBarFill, 
                        { width: `${progressPercent}%`, backgroundColor: isOvertime ? '#FECACA' : '#60A5FA' }
                    ]} 
                />
            </View>
            <View style={styles.progressLabels}>
                <Text style={styles.progressText}>Started {new Date(startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</Text>
                <Text style={styles.progressText}>Exp: {expectedHours}h {expectedMins}m</Text>
            </View>
        </View>

        {/* Overtime Details */}
        {isOvertime && (
          <View style={styles.overtimeFooter}>
            <Text style={styles.overtimeFooterText}>
              You are {Math.floor(overtimeMinutes / 60)}h {overtimeMinutes % 60}m over the expected time.
            </Text>
          </View>
        )}
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 24,
    overflow: 'hidden',
    ...SHADOWS.lg,
    marginVertical: SPACING.md,
  },
  gradient: {
    padding: SPACING.lg,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444', // Red Pulse
  },
  liveText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  overtimeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(220, 38, 38, 0.4)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  overtimeBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  timerDisplay: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  timerDigits: {
    fontSize: 56, // Massive
    fontWeight: '800', // Extra Bold
    color: '#FFF',
    fontVariant: ['tabular-nums'], // Monospace numbers
    letterSpacing: 2,
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  timerSeparator: {
    opacity: 0.6,
    fontSize: 48,
    fontWeight: '300',
  },
  timerLabels: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 4, // Align with digits roughly
    marginTop: -4,
  },
  progressContainer: {
    marginTop: SPACING.sm,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    fontWeight: '500',
  },
  overtimeFooter: {
    marginTop: SPACING.md,
    backgroundColor: 'rgba(0,0,0,0.2)',
    padding: SPACING.md,
    borderRadius: RADIUS.medium,
    alignItems: 'center',
  },
  overtimeFooterText: {
    color: '#FECACA',
    fontSize: 13,
    fontWeight: '600',
  },
});
