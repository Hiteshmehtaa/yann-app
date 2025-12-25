import React from 'react';
import { View, StyleSheet, Animated, ViewStyle } from 'react-native';
import { PanGestureHandler, PanGestureHandlerGestureEvent } from 'react-native-gesture-handler';

interface SwipeableCardProps {
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  swipeThreshold?: number;
  style?: ViewStyle;
}

export const SwipeableCard: React.FC<SwipeableCardProps> = ({
  children,
  onSwipeLeft,
  onSwipeRight,
  swipeThreshold = 100,
  style,
}) => {
  const translateX = React.useRef(new Animated.Value(0)).current;
  const lastOffset = React.useRef(0);

  const onGestureEvent = Animated.event(
    [{ nativeEvent: { translationX: translateX } }],
    { useNativeDriver: true }
  );

  const onHandlerStateChange = (event: any) => {
    // Check if gesture ended (state 5 is END in react-native-gesture-handler)
    if (event.nativeEvent.state === 5) {
      const { translationX } = event.nativeEvent;
      
      if (translationX < -swipeThreshold && onSwipeLeft) {
        // Swipe left detected
        Animated.timing(translateX, {
          toValue: -500,
          duration: 200,
          useNativeDriver: true,
        }).start(() => {
          onSwipeLeft();
          translateX.setValue(0);
          lastOffset.current = 0;
        });
      } else if (translationX > swipeThreshold && onSwipeRight) {
        // Swipe right detected
        Animated.timing(translateX, {
          toValue: 500,
          duration: 200,
          useNativeDriver: true,
        }).start(() => {
          onSwipeRight();
          translateX.setValue(0);
          lastOffset.current = 0;
        });
      } else {
        // Reset position
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
        lastOffset.current = 0;
      }
    }
  };

  return (
    <PanGestureHandler
      onGestureEvent={onGestureEvent}
      onHandlerStateChange={onHandlerStateChange}
    >
      <Animated.View
        style={[
          style,
          {
            transform: [{ translateX }],
          },
        ]}
      >
        {children}
      </Animated.View>
    </PanGestureHandler>
  );
};

const styles = StyleSheet.create({});
