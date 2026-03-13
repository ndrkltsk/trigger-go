import { useWindowDimensions } from 'react-native';

const TABLET_BREAKPOINT = 768;
const LARGE_TABLET_BREAKPOINT = 1024;

export function useDeviceLayout() {
  const { width, height } = useWindowDimensions();

  return {
    width,
    height,
    isTablet: width >= TABLET_BREAKPOINT,
    isLargeTablet: width >= LARGE_TABLET_BREAKPOINT,
    isLandscape: width > height,
    columns: width >= LARGE_TABLET_BREAKPOINT ? 4 : width >= TABLET_BREAKPOINT ? 3 : 2,
  };
}
