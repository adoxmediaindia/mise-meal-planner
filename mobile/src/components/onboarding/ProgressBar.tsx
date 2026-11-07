import React from 'react';
import { View, StyleSheet } from 'react-native';

interface ProgressBarProps {
  progress: number; // 0 to 100
  style?: object;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ progress, style }) => {
  const clamped = Math.min(100, Math.max(0, progress));

  return (
    <View style={[styles.track, style]}>
      <View style={[styles.fill, { width: `${clamped}%` }]} />
    </View>
  );
};

const styles = StyleSheet.create({
  track: {
    height: 4.5,
    width: '100%',
    backgroundColor: '#E8E8E3',
    borderRadius: 999,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: '#9ED034',
    borderRadius: 999,
  },
});
