import React from 'react';
import { View, StyleSheet } from 'react-native';
import { BackButton } from './BackButton';
import { ProgressBar } from './ProgressBar';

interface OnboardingHeaderProps {
  onBack?: () => void;
  progress?: number;
  showBack?: boolean;
}

export const OnboardingHeader: React.FC<OnboardingHeaderProps> = ({
  onBack,
  progress,
  showBack = true,
}) => {
  return (
    <View style={styles.header}>
      {showBack && onBack ? (
        <BackButton onPress={onBack} />
      ) : (
        <View style={styles.placeholder} />
      )}

      {progress !== undefined ? (
        <View style={styles.progressContainer}>
          <ProgressBar progress={progress} />
        </View>
      ) : (
        <View style={styles.placeholderFlex} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 16,
    width: '100%',
  },
  placeholder: {
    width: 44,
    height: 44,
  },
  placeholderFlex: {
    flex: 1,
  },
  progressContainer: {
    flex: 1,
    paddingRight: 8,
  },
});
