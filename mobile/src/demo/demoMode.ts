import { Platform } from 'react-native';

export const isLocalDemoMode = (): boolean => {
  if (!__DEV__ || Platform.OS !== 'web' || typeof window === 'undefined') {
    return false;
  }

  const { hostname, searchParams } = new URL(window.location.href);
  return (
    (hostname === 'localhost' || hostname === '127.0.0.1') &&
    searchParams.get('melttoDemo') === '1'
  );
};
