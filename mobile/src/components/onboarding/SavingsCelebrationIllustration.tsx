import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface SavingsCelebrationIllustrationProps {
  style?: object;
  size?: number;
}

export const SavingsCelebrationIllustration: React.FC<SavingsCelebrationIllustrationProps> = ({
  style,
  size = 140,
}) => {
  return (
    <View style={[styles.container, style]}>
      {/* Confetti / Burst Particles */}
      <View style={[styles.particle, { top: 0, left: 24, backgroundColor: '#10B981', width: 10, height: 10, borderRadius: 5 }]} />
      <View style={[styles.particle, { top: 12, right: 28, backgroundColor: '#6366F1', width: 9, height: 9, borderRadius: 4.5 }]} />
      <View style={[styles.particle, { top: 38, left: 6, backgroundColor: '#3B82F6', width: 8, height: 8, borderRadius: 4 }]} />
      <View style={[styles.particle, { top: 36, right: 8, backgroundColor: '#EC4899', width: 9, height: 9, borderRadius: 4.5 }]} />
      <View style={[styles.particle, { bottom: 16, left: 16, backgroundColor: '#F59E0B', width: 8, height: 8, borderRadius: 4 }]} />
      <View style={[styles.particle, { bottom: 20, right: 18, backgroundColor: '#10B981', width: 8, height: 8, borderRadius: 4 }]} />

      {/* Main Exploding Mind Head */}
      <View style={styles.burstHalo} />
      <Text style={[styles.emoji, { fontSize: size * 0.72 }]}>🤯</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 12,
    width: 160,
    height: 140,
    position: 'relative',
    alignSelf: 'center',
  },
  burstHalo: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'rgba(255, 72, 32, 0.08)',
  },
  emoji: {
    textAlign: 'center',
  },
  particle: {
    position: 'absolute',
  },
});
