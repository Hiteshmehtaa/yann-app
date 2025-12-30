import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Animated,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../contexts/ThemeContext';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS, SHADOWS } from '../utils/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type DialogType = 'success' | 'error' | 'warning' | 'info' | 'confirm';

export interface DialogAction {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

interface CustomDialogProps {
  visible: boolean;
  type?: DialogType;
  title: string;
  message: string;
  actions?: DialogAction[];
  onClose: () => void;
  onConfirm?: () => void;
  confirmText?: string;
  cancelText?: string;
  showCancel?: boolean;
}

const DIALOG_CONFIG: Record<DialogType, {
  icon: keyof typeof Ionicons.glyphMap;
  colors: string[];
  iconColor: string;
}> = {
  success: {
    icon: 'checkmark-circle',
    colors: ['#10B981', '#059669'],
    iconColor: '#10B981',
  },
  error: {
    icon: 'close-circle',
    colors: ['#EF4444', '#DC2626'],
    iconColor: '#EF4444',
  },
  warning: {
    icon: 'warning',
    colors: ['#F59E0B', '#D97706'],
    iconColor: '#F59E0B',
  },
  info: {
    icon: 'information-circle',
    colors: ['#3B82F6', '#2563EB'],
    iconColor: '#3B82F6',
  },
  confirm: {
    icon: 'help-circle',
    colors: ['#8B5CF6', '#7C3AED'],
    iconColor: '#8B5CF6',
  },
};

export const CustomDialog: React.FC<CustomDialogProps> = ({
  visible,
  type = 'info',
  title,
  message,
  actions,
  onClose,
  onConfirm,
  confirmText = 'OK',
  cancelText = 'Cancel',
  showCancel = false,
}) => {
  const { colors, isDark } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const iconScaleAnim = useRef(new Animated.Value(0)).current;

  const config = DIALOG_CONFIG[type];

  useEffect(() => {
    if (visible) {
      // Reset animations
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.8);
      iconScaleAnim.setValue(0);

      // Start animations
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 65,
          useNativeDriver: true,
        }),
      ]).start();

      // Delayed icon animation
      setTimeout(() => {
        Animated.spring(iconScaleAnim, {
          toValue: 1,
          friction: 5,
          tension: 80,
          useNativeDriver: true,
        }).start();
      }, 150);
    }
  }, [visible]);

  const handleClose = (callback?: () => void) => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.8,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      callback?.();
      onClose();
    });
  };

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="none" statusBarTranslucent>
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <BlurView intensity={isDark ? 40 : 25} style={StyleSheet.absoluteFill} tint={isDark ? 'dark' : 'light'} />
        
        <Animated.View
          style={[
            styles.container,
            {
              backgroundColor: colors.cardBg,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Icon Header */}
          <View style={styles.iconWrapper}>
            <LinearGradient
              colors={config.colors as [string, string]}
              style={styles.iconGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Animated.View style={{ transform: [{ scale: iconScaleAnim }] }}>
                <Ionicons name={config.icon} size={48} color="#FFFFFF" />
              </Animated.View>
            </LinearGradient>
          </View>

          {/* Content */}
          <View style={styles.content}>
            <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
            <Text style={[styles.message, { color: colors.textSecondary }]}>{message}</Text>
          </View>

          {/* Buttons */}
          {actions && actions.length > 0 ? (
            <View style={styles.actionsList}>
              {actions.map((action, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.actionButton,
                    action.style === 'cancel' && styles.actionButtonCancel,
                    action.style === 'destructive' && styles.actionButtonDestructive,
                    index > 0 && { marginTop: 10 }
                  ]}
                  onPress={() => handleClose(action.onPress)}
                  activeOpacity={0.8}
                >
                  {action.style !== 'cancel' && action.style !== 'destructive' ? (
                    <LinearGradient
                      colors={config.colors as [string, string]}
                      style={styles.actionGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                    >
                      <Text style={styles.actionButtonTextPrimary}>{action.text}</Text>
                    </LinearGradient>
                  ) : (
                    <View style={styles.actionButtonContent}>
                       <Text style={[
                        styles.actionButtonText,
                        action.style === 'cancel' && { color: colors.textSecondary },
                        action.style === 'destructive' && { color: '#EF4444' },
                      ]}>
                        {action.text}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={[styles.buttonContainer, showCancel && styles.buttonContainerRow]}>
              {showCancel && (
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton, { borderColor: colors.divider }]}
                  onPress={() => handleClose()}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.cancelButtonText, { color: colors.textSecondary }]}>
                    {cancelText}
                  </Text>
                </TouchableOpacity>
              )}
              
              <TouchableOpacity
                style={[styles.button, styles.confirmButton]}
                onPress={() => handleClose(onConfirm)}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={config.colors as [string, string]}
                  style={styles.confirmGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={styles.confirmButtonText}>{confirmText}</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

// Hook for using dialogs easily
interface DialogState {
  visible: boolean;
  type: DialogType;
  title: string;
  message: string;
  onConfirm?: () => void;
  actions?: DialogAction[];
  showCancel?: boolean;
  confirmText?: string;
  cancelText?: string;
}

export const useDialog = () => {
  const [dialogState, setDialogState] = React.useState<DialogState>({
    visible: false,
    type: 'info',
    title: '',
    message: '',
  });

  const showDialog = (
    type: DialogType,
    title: string,
    message: string,
    options?: {
      onConfirm?: () => void;
      actions?: DialogAction[];
      showCancel?: boolean;
      confirmText?: string;
      cancelText?: string;
    }
  ) => {
    setDialogState({
      visible: true,
      type,
      title,
      message,
      ...options,
    });
  };

  const hideDialog = () => {
    setDialogState(prev => ({ ...prev, visible: false }));
  };

  const showSuccess = (title: string, message: string, onConfirm?: () => void) => {
    showDialog('success', title, message, { onConfirm });
  };

  const showError = (title: string, message: string, onConfirm?: () => void) => {
    showDialog('error', title, message, { onConfirm });
  };

  const showWarning = (title: string, message: string, onConfirm?: () => void) => {
    showDialog('warning', title, message, { onConfirm });
  };

  const showInfo = (title: string, message: string, onConfirm?: () => void) => {
    showDialog('info', title, message, { onConfirm });
  };

  const showConfirm = (
    title: string,
    message: string,
    onConfirm: () => void,
    options?: { confirmText?: string; cancelText?: string }
  ) => {
    showDialog('confirm', title, message, {
      onConfirm,
      showCancel: true,
      ...options,
    });
  };

  const showOptions = (
    title: string,
    message: string,
    actions: DialogAction[]
  ) => {
    showDialog('info', title, message, { actions });
  };

  return {
    dialogState,
    hideDialog,
    showDialog,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showConfirm,
    showOptions,
    DialogComponent: (
      <CustomDialog
        visible={dialogState.visible}
        type={dialogState.type}
        title={dialogState.title}
        message={dialogState.message}
        onClose={hideDialog}
        onConfirm={dialogState.onConfirm}
        actions={dialogState.actions}
        showCancel={dialogState.showCancel}
        confirmText={dialogState.confirmText}
        cancelText={dialogState.cancelText}
      />
    ),
  };
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  container: {
    width: Math.min(SCREEN_WIDTH - 48, 340),
    borderRadius: RADIUS.xlarge,
    overflow: 'hidden',
    ...SHADOWS.lg,
  },
  iconWrapper: {
    alignItems: 'center',
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.md,
  },
  iconGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.md,
  },
  content: {
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.lg,
    alignItems: 'center',
  },
  title: {
    fontSize: TYPOGRAPHY.size.xl,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  message: {
    fontSize: TYPOGRAPHY.size.md,
    textAlign: 'center',
    lineHeight: 22,
  },
  buttonContainer: {
    padding: SPACING.lg,
    paddingTop: SPACING.sm,
  },
  buttonContainerRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  button: {
    flex: 1,
    borderRadius: RADIUS.medium,
    overflow: 'hidden',
  },
  cancelButton: {
    borderWidth: 1.5,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: TYPOGRAPHY.size.md,
    fontWeight: '600',
  },
  confirmButton: {
    ...SHADOWS.sm,
  },
  confirmGradient: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: TYPOGRAPHY.size.md,
    fontWeight: '700',
  },
  actionsList: {
    padding: SPACING.lg,
    paddingTop: 0,
    width: '100%',
  },
  actionButton: {
    width: '100%',
    borderRadius: RADIUS.medium,
    overflow: 'hidden',
  },
  actionButtonCancel: {
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },
  actionButtonDestructive: {
    borderWidth: 1.5,
    borderColor: '#FCA5A5',
    backgroundColor: '#FEF2F2',
  },
  actionGradient: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonContent: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: {
    fontSize: TYPOGRAPHY.size.md,
    fontWeight: '600',
  },
  actionButtonTextPrimary: {
    color: '#FFFFFF',
    fontSize: TYPOGRAPHY.size.md,
    fontWeight: '700',
  },
  actionButtonTextCancel: {
     // color handled inline based on theme
  },
  actionButtonTextDestructive: {
    // color handled inline
  },
});

export default CustomDialog;
