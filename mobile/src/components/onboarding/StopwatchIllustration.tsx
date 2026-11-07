import React from 'react';
import { View, StyleSheet } from 'react-native';

interface StopwatchIllustrationProps {
  style?: object;
  size?: number;
}

export const StopwatchIllustration: React.FC<StopwatchIllustrationProps> = ({
  style,
  size = 130,
}) => {
  const outerRadius = size / 2;
  const innerRadius = (size * 0.82) / 2;

  return (
    <View style={[styles.container, style]}>
      {/* Top Ring / Loop */}
      <View style={styles.topLoop} />
      {/* Top Pusher */}
      <View style={styles.topPusher} />

      {/* Stopwatch Body */}
      <View
        style={[
          styles.outerCircle,
          {
            width: size,
            height: size,
            borderRadius: outerRadius,
          },
        ]}
      >
        {/* Inner Dial */}
        <View
          style={[
            styles.innerDial,
            {
              width: size * 0.82,
              height: size * 0.82,
              borderRadius: innerRadius,
            },
          ]}
        >
          {/* 12 o'clock tick */}
          <View style={[styles.tick, styles.tick12]} />
          {/* 6 o'clock tick */}
          <View style={[styles.tick, styles.tick6]} />
          {/* 3 o'clock tick */}
          <View style={[styles.tick, styles.tick3]} />
          {/* 9 o'clock tick */}
          <View style={[styles.tick, styles.tick9]} />

          {/* Stopwatch Hand (pointing to 12:00) */}
          <View style={styles.hand} />
          {/* Center Pin */}
          <View style={styles.centerPin} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 14,
  },
  topLoop: {
    width: 28,
    height: 18,
    borderWidth: 3.5,
    borderColor: '#9FA7AF',
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    marginBottom: -4,
  },
  topPusher: {
    width: 14,
    height: 8,
    backgroundColor: '#7D868F',
    borderRadius: 2,
    marginBottom: -3,
    zIndex: 2,
  },
  outerCircle: {
    backgroundColor: '#BEC5CB',
    borderWidth: 4,
    borderColor: '#CCD1D7',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  innerDial: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E5E8',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  tick: {
    position: 'absolute',
    backgroundColor: '#6B7280',
  },
  tick12: {
    top: 4,
    width: 2.5,
    height: 9,
    borderRadius: 1,
  },
  tick6: {
    bottom: 4,
    width: 2.5,
    height: 9,
    borderRadius: 1,
  },
  tick3: {
    right: 4,
    width: 9,
    height: 2.5,
    borderRadius: 1,
  },
  tick9: {
    left: 4,
    width: 9,
    height: 2.5,
    borderRadius: 1,
  },
  hand: {
    position: 'absolute',
    top: 10,
    width: 3,
    height: 44,
    backgroundColor: '#1A1A1A',
    borderRadius: 2,
  },
  centerPin: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: '#1A1A1A',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    zIndex: 10,
  },
});
