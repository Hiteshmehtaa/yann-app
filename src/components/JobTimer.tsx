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
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isOvertime, setIsOvertime] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Calculate initial elapsed time
    const now = new Date();
    const initialElapsedMs = now.getTime() - new Date(startTime).getTime();
    const initialElapsedSeconds = Math.floor(initialElapsedMs / 1000);
    setElapsedSeconds(initialElapsedSeconds);

    // Update every second
    const interval = setInterval(() => {
      setElapsedSeconds(prev => {
        const newElapsed = prev + 1;
        const elapsedMinutes = Math.floor(newElapsed / 60);
        setIsOvertime(elapsedMinutes > expectedDuration);
        return newElapsed;
      });
    }, 1000);

    // Pulse animation for the "Active" indicator
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.4,
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

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return {
      hours: hours.toString().padStart(2, '0'),
      minutes: minutes.toString().padStart(2, '0'),
      seconds: seconds.toString().padStart(2, '0')
    };
  };

  const time = formatTime(elapsedSeconds);
  const elapsedMinutes = Math.floor(elapsedSeconds / 60);
  const expectedHours = Math.floor(expectedDuration / 60);
  const expectedMins = expectedDuration % 60;
  const overtimeMinutes = Math.max(0, elapsedMinutes - expectedDuration);

  // Calculate progress percentage (capped at 100%)
  const progressPercent = Math.min(100, (elapsedMinutes / expectedDuration) * 100);

  return (
    <View style={[styles.deviceFrame, style]}>
      {/* Physical Device Frame Bevels */}
      <View style={styles.outerBevel}>
        <View style={styles.innerBevel}>

          {/* Dark Digital Screen */}
          <LinearGradient
            colors={['#0F172A', '#1E293B']}
            style={styles.screenContainer}
          >

            {/* Screen Header */}
            <View style={styles.screenHeader}>
              <View style={styles.signalGroup}>
                <View style={styles.signalDot} />
                <View style={[styles.signalDot, { opacity: 0.5 }]} />
                <View style={[styles.signalDot, { opacity: 0.3 }]} />
              </View>

              <View style={styles.liveIndicator}>
                <Animated.View
                  style={[
                    styles.recordingDot,
                    {
                      opacity: pulseAnim,
                      backgroundColor: isOvertime ? '#EF4444' : '#10B981'
                    }
                  ]}
                />
                <Text style={[
                  styles.liveText,
                  { color: isOvertime ? '#EF4444' : '#10B981' }
                ]}>
                  {isOvertime ? 'OVERTIME' : 'REQ ACTIVE'}
                </Text>
              </View>
            </View>

            {/* Main Digital Time Display */}
            <View style={styles.displayArea}>
              <View style={styles.timeGroup}>
                <Text style={styles.digit}>{time.hours}</Text>
                <Text style={styles.digitLabel}>HR</Text>
              </View>

              <Text style={styles.separator}>:</Text>

              <View style={styles.timeGroup}>
                <Text style={styles.digit}>{time.minutes}</Text>
                <Text style={styles.digitLabel}>MIN</Text>
              </View>

              <Text style={styles.separator}>:</Text>

              <View style={styles.timeGroup}>
                <Text style={styles.digit}>{time.seconds}</Text>
                <Text style={styles.digitLabel}>SEC</Text>
              </View>
            </View>

            {/* Digital Progress Bar */}
            <View style={styles.progressSection}>
              <View style={styles.track}>
                <View
                  style={[
                    styles.fill,
                    {
                      width: `${progressPercent}%`,
                      backgroundColor: isOvertime ? '#EF4444' : '#38BDF8',
                      shadowColor: isOvertime ? '#EF4444' : '#38BDF8',
                    }
                  ]}
                />
              </View>
              <View style={styles.metaRow}>
                <Text style={styles.metaText}>
                  START {new Date(startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
                <Text style={styles.metaText}>
                  EXP {expectedHours}h {expectedMins}m
                </Text>
              </View>
            </View>

            {/* Screen Glare/Reflection */}
            <LinearGradient
              colors={['rgba(255,255,255,0.03)', 'transparent']}
              style={styles.screenGlare}
              pointerEvents="none"
            />

          </LinearGradient>
        </View>
      </View>

      {isOvertime && (
        <View style={styles.alertStrip}>
          <Ionicons name="warning" size={12} color="#7F1D1D" />
          <Text style={styles.alertText}>
            EXCEEDED BY {Math.floor(overtimeMinutes / 60)}H {overtimeMinutes % 60}M
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  deviceFrame: {
    backgroundColor: '#E2E8F0', // Slate 200 Frame
    borderRadius: 24,
    padding: 3, // Outer frame thickness
    ...SHADOWS.lg,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    marginVertical: SPACING.md,
    borderBottomWidth: 4, // 3D Bottom Lip
    borderBottomColor: '#CBD5E1', // Darker Slate
    borderWidth: 1,
    borderColor: '#F1F5F9', // Highlight top
  },
  outerBevel: {
    backgroundColor: '#334155', // Slate 700 - Dark Bevel
    borderRadius: 20,
    padding: 2,
  },
  innerBevel: {
    backgroundColor: '#0F172A', // Slate 900 - Screen Housing
    borderRadius: 18,
    overflow: 'hidden',
  },
  screenContainer: {
    padding: SPACING.lg,
    minHeight: 180,
    justifyContent: 'space-between',
  },
  screenHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  signalGroup: {
    flexDirection: 'row',
    gap: 3,
  },
  signalDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#38BDF8',
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  recordingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  liveText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  displayArea: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-start',
    gap: 4,
    marginBottom: SPACING.lg,
  },
  timeGroup: {
    alignItems: 'center',
  },
  digit: {
    fontSize: 48,
    fontWeight: '800',
    color: '#F8FAFC', // Almost White
    fontVariant: ['tabular-nums'],
    letterSpacing: 2,
    textShadowColor: 'rgba(56, 189, 248, 0.5)', // Cyan Glow
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
    lineHeight: 52,
  },
  digitLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748B', // Slate 500
    letterSpacing: 1,
    marginTop: 4,
  },
  separator: {
    fontSize: 40,
    fontWeight: '300',
    color: '#475569', // Dim separator
    marginTop: -2,
  },
  progressSection: {
    gap: 8,
  },
  track: {
    height: 4,
    backgroundColor: '#334155',
    borderRadius: 2,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 4,
    shadowOpacity: 1,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaText: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  screenGlare: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 80,
  },
  alertStrip: {
    backgroundColor: '#FEE2E2',
    padding: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    marginTop: -20, // Pull up to meet frame
    paddingTop: 24, // Push content down past overlap
    zIndex: -1,
  },
  alertText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#991B1B',
    letterSpacing: 0.5,
  },
});
