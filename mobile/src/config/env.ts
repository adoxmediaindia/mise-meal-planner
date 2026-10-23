import { Platform } from 'react-native';

// In Expo, EXPO_PUBLIC_* env vars are accessible on client
const ENV_API_URL = process.env.EXPO_PUBLIC_API_URL;

const getDefaultBaseUrl = (): string => {
  if (ENV_API_URL) {
    return ENV_API_URL.replace(/\/$/, '');
  }
  // Android emulator routes host machine loopback to 10.0.2.2
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:5000';
  }
  // iOS simulator and desktop
  return 'http://localhost:5000';
};

export const API_BASE_URL = getDefaultBaseUrl();
export const API_V1_URL = `${API_BASE_URL}/api/v1`;
