import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

interface BackButtonProps {
  onPress: () => void;
  style?: object;
  testID?: string;
}

export const BackButton: React.FC<BackButtonProps> = ({ onPress, style, testID }) => {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel="Go back to previous screen"
      style={[styles.button, style]}
    >
      <Text style={styles.arrow}>←</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(42, 42, 42, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  arrow: {
    fontSize: 22,
    fontWeight: '600',
    color: '#1A1A1A',
    marginTop: -2,
  },
});
