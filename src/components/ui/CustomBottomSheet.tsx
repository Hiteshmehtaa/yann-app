import React, { useCallback, useMemo, useRef, forwardRef, useImperativeHandle } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import BottomSheet, { BottomSheetBackdrop, BottomSheetView } from '@gorhom/bottom-sheet';
import { COLORS, SPACING, RADIUS } from '../../utils/theme';
import { haptics } from '../../utils/haptics';

export interface CustomBottomSheetRef {
  open: () => void;
  close: () => void;
}

interface CustomBottomSheetProps {
  children: React.ReactNode;
  title?: string;
  snapPoints?: (string | number)[];
  enablePanDownToClose?: boolean;
  onClose?: () => void;
  onOpen?: () => void;
}

/**
 * Custom Bottom Sheet component with backdrop and haptic feedback
 * Provides native-feeling modal experience
 */
export const CustomBottomSheet = forwardRef<CustomBottomSheetRef, CustomBottomSheetProps>(
  ({ children, title, snapPoints = ['50%', '90%'], enablePanDownToClose = true, onClose, onOpen }, ref) => {
    const bottomSheetRef = useRef<BottomSheet>(null);

    useImperativeHandle(ref, () => ({
      open: () => {
        haptics.light();
        bottomSheetRef.current?.expand();
      },
      close: () => {
        haptics.light();
        bottomSheetRef.current?.close();
      },
    }));

    const handleSheetChanges = useCallback((index: number) => {
      if (index === -1) {
        onClose?.();
      } else if (index > -1) {
        onOpen?.();
      }
    }, [onClose, onOpen]);

    const renderBackdrop = useCallback(
      (props: any) => (
        <BottomSheetBackdrop
          {...props}
          disappearsOnIndex={-1}
          appearsOnIndex={0}
          opacity={0.5}
        />
      ),
      []
    );

    return (
      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose={enablePanDownToClose}
        onChange={handleSheetChanges}
        backdropComponent={renderBackdrop}
        backgroundStyle={styles.background}
        handleIndicatorStyle={styles.indicator}
      >
        <BottomSheetView style={styles.contentContainer}>
          {title && (
            <View style={styles.header}>
              <Text style={styles.title}>{title}</Text>
            </View>
          )}
          {children}
        </BottomSheetView>
      </BottomSheet>
    );
  }
);

const styles = StyleSheet.create({
  background: {
    backgroundColor: COLORS.cardBg,
    borderTopLeftRadius: RADIUS.xlarge,
    borderTopRightRadius: RADIUS.xlarge,
  },
  indicator: {
    backgroundColor: COLORS.border,
    width: 40,
    height: 4,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
  },
  header: {
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
  },
});
