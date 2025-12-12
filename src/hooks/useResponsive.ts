import { useState, useEffect } from 'react';
import { Dimensions, ScaledSize } from 'react-native';

export const useResponsive = () => {
  const [dimensions, setDimensions] = useState(() => {
    const { width, height } = Dimensions.get('window');
    return { width, height };
  });

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions({ width: window.width, height: window.height });
    });

    return () => subscription?.remove();
  }, []);

  const isTablet = dimensions.width >= 768;
  const isSmallDevice = dimensions.width < 375;
  const isLargeDevice = dimensions.width >= 1024;

  return {
    width: dimensions.width,
    height: dimensions.height,
    isTablet,
    isSmallDevice,
    isLargeDevice,
  };
};
