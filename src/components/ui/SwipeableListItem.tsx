import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import SwipeableItem, {
  SwipeableItemImperativeRef,
  useSwipeableItemParams,
} from 'react-native-swipeable-item';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../../utils/theme';
import { AnimatedTouchable } from './AnimatedTouchable';

interface SwipeAction {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  onPress: () => void;
}

interface SwipeableListItemProps {
  children: React.ReactNode;
  leftActions?: SwipeAction[];
  rightActions?: SwipeAction[];
  onSwipeStart?: () => void;
  onSwipeEnd?: () => void;
}

const UnderlayLeft = ({ actions }: { actions: SwipeAction[] }) => {
  const { percentOpen } = useSwipeableItemParams();
  
  return (
    <Animated.View style={[styles.underlay, styles.underlayLeft]}>
      {actions.map((action, index) => (
        <AnimatedTouchable
          key={index}
          onPress={action.onPress}
          style={[styles.actionButton, { backgroundColor: action.color }]}
          hapticFeedback="medium"
        >
          <Ionicons name={action.icon} size={20} color="#FFF" />
          <Text style={styles.actionText}>{action.label}</Text>
        </AnimatedTouchable>
      ))}
    </Animated.View>
  );
};

const UnderlayRight = ({ actions }: { actions: SwipeAction[] }) => {
  const { percentOpen } = useSwipeableItemParams();
  
  return (
    <Animated.View style={[styles.underlay, styles.underlayRight]}>
      {actions.map((action, index) => (
        <AnimatedTouchable
          key={index}
          onPress={action.onPress}
          style={[styles.actionButton, { backgroundColor: action.color }]}
          hapticFeedback="medium"
        >
          <Ionicons name={action.icon} size={20} color="#FFF" />
          <Text style={styles.actionText}>{action.label}</Text>
        </AnimatedTouchable>
      ))}
    </Animated.View>
  );
};

/**
 * Swipeable list item with customizable left and right actions
 * Provides iOS-style swipe-to-action functionality
 */
export const SwipeableListItem: React.FC<SwipeableListItemProps> = ({
  children,
  leftActions = [],
  rightActions = [],
  onSwipeStart,
  onSwipeEnd,
}) => {
  const itemRef = React.useRef<SwipeableItemImperativeRef>(null);

  return (
    <SwipeableItem
      key={`swipeable-item`}
      item={{}}
      ref={itemRef}
      onChange={({ open }) => {
        if (open) {
          onSwipeStart?.();
        } else {
          onSwipeEnd?.();
        }
      }}
      overSwipe={20}
      renderUnderlayLeft={
        leftActions.length > 0
          ? () => <UnderlayLeft actions={leftActions} />
          : undefined
      }
      renderUnderlayRight={
        rightActions.length > 0
          ? () => <UnderlayRight actions={rightActions} />
          : undefined
      }
      snapPointsLeft={leftActions.length > 0 ? [leftActions.length * 80] : undefined}
      snapPointsRight={rightActions.length > 0 ? [rightActions.length * 80] : undefined}
    >
      <View style={styles.content}>{children}</View>
    </SwipeableItem>
  );
};

const styles = StyleSheet.create({
  content: {
    backgroundColor: COLORS.cardBg,
  },
  underlay: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  underlayLeft: {
    justifyContent: 'flex-start',
    paddingLeft: SPACING.md,
  },
  underlayRight: {
    justifyContent: 'flex-end',
    paddingRight: SPACING.md,
  },
  actionButton: {
    width: 70,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
    borderRadius: RADIUS.medium,
  },
  actionText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },
});
