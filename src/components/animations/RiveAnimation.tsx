import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Rive, { RiveRef, Fit, Alignment } from 'rive-react-native';

interface RiveAnimationProps {
  animationUrl: string;
  autoplay?: boolean;
  loop?: boolean;
  fit?: Fit;
  alignment?: Alignment;
  style?: ViewStyle;
  stateMachineName?: string;
  artboardName?: string;
  onPlay?: () => void;
  onPause?: () => void;
  onStop?: () => void;
}

export const RiveAnimation: React.FC<RiveAnimationProps> = ({
  animationUrl,
  autoplay = true,
  loop = true,
  fit = Fit.Contain,
  alignment = Alignment.Center,
  style,
  stateMachineName,
  artboardName,
  onPlay,
  onPause,
  onStop,
}) => {
  const riveRef = useRef<RiveRef>(null);

  useEffect(() => {
    if (autoplay && riveRef.current) {
      riveRef.current.play();
      onPlay?.();
    }
  }, [autoplay, onPlay]);

  return (
    <View style={[styles.container, style]}>
      <Rive
        ref={riveRef}
        url={animationUrl}
        autoplay={autoplay}
        fit={fit}
        alignment={alignment}
        stateMachineName={stateMachineName}
        artboardName={artboardName}
        style={styles.rive}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: '100%',
  },
  rive: {
    width: '100%',
    height: '100%',
  },
});
