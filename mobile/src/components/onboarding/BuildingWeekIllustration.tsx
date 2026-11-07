import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';

interface BuildingWeekIllustrationProps {
  size?: number;
}

export const BuildingWeekIllustration: React.FC<BuildingWeekIllustrationProps> = ({
  size = 240,
}) => {
  const spinAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 20000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, [spinAnim]);

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const counterSpin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '-360deg'],
  });

  const items = [
    { emoji: '🥑', angle: 0, label: 'Avocado' },
    { emoji: '🍅', angle: 40, label: 'Tomatoes' },
    { emoji: '🫑', angle: 80, label: 'Red Pepper' },
    { emoji: '🍃', angle: 120, label: 'Spinach' },
    { emoji: '🍆', angle: 160, label: 'Aubergine' },
    { emoji: '🧄', angle: 200, label: 'Garlic' },
    { emoji: '🌽', angle: 240, label: 'Corn' },
    { emoji: '🥒', angle: 280, label: 'Cucumber' },
    { emoji: '🍋', angle: 320, label: 'Lemon' },
  ];

  const radius = size * 0.38;
  const center = size / 2;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Animated Vegetable Orbit Ring */}
      <Animated.View
        style={[
          styles.orbitRing,
          {
            width: size,
            height: size,
            transform: [{ rotate: spin }],
          },
        ]}
      >
        {items.map((item, idx) => {
          const rad = ((item.angle - 90) * Math.PI) / 180;
          const x = center + radius * Math.cos(rad) - 18;
          const y = center + radius * Math.sin(rad) - 18;

          return (
            <Animated.View
              key={idx}
              style={[
                styles.emojiWrapper,
                {
                  left: x,
                  top: y,
                  transform: [{ rotate: counterSpin }],
                },
              ]}
            >
              <Text style={styles.emojiText}>{item.emoji}</Text>
            </Animated.View>
          );
        })}
      </Animated.View>

      {/* Central Meltto Bowl & Emblem */}
      <View style={styles.centerCard}>
        <View style={styles.bowlIconWrapper}>
          <Text style={styles.centerBowlEmoji}>🥗</Text>
        </View>
        <Text style={styles.melttoBrandText}>meltto</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    alignSelf: 'center',
  },
  orbitRing: {
    position: 'absolute',
  },
  emojiWrapper: {
    position: 'absolute',
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f0f0eb',
  },
  emojiText: {
    fontSize: 20,
  },
  centerCard: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  bowlIconWrapper: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#eef6dc',
    borderWidth: 2,
    borderColor: '#9ed034',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#9ed034',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 4,
  },
  centerBowlEmoji: {
    fontSize: 34,
  },
  melttoBrandText: {
    fontSize: 20,
    fontWeight: '900',
    color: '#6f9d13',
    letterSpacing: -0.5,
  },
});
