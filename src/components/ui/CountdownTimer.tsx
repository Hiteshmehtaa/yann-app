import React, { useState, useEffect } from 'react';
import { Text, StyleSheet, TextStyle } from 'react-native';
import { COLORS, TYPOGRAPHY } from '../../utils/theme';

interface CountdownTimerProps {
  targetDate: Date;
  style?: TextStyle;
  prefix?: string;
}

export const CountdownTimer: React.FC<CountdownTimerProps> = ({
  targetDate,
  style,
  prefix = 'Starts in ',
}) => {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const target = new Date(targetDate).getTime();
      const difference = target - now;

      if (difference <= 0) {
        setTimeLeft('Started');
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));

      if (days > 0) {
        setTimeLeft(`${days}d ${hours}h`);
      } else if (hours > 0) {
        setTimeLeft(`${hours}h ${minutes}m`);
      } else {
        setTimeLeft(`${minutes}m`);
      }
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [targetDate]);

  return (
    <Text style={[styles.timer, style]}>
      {prefix}{timeLeft}
    </Text>
  );
};

const styles = StyleSheet.create({
  timer: {
    fontSize: TYPOGRAPHY.size.xs,
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.weight.semibold,
  },
});
