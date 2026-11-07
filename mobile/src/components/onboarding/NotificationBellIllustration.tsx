import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface NotificationBellIllustrationProps {
  size?: number;
}

export const NotificationBellIllustration: React.FC<NotificationBellIllustrationProps> = ({
  size = 160,
}) => {
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Floor Glow */}
      <View style={[styles.floorGlow, { width: size * 0.7 }]} />

      {/* Bell Structure */}
      <View style={styles.bellFrame}>
        {/* Top Loop */}
        <View style={styles.topLoop} />

        {/* Bell Body */}
        <View style={styles.bellDome}>
          {/* Inner Highlight Bar */}
          <View style={styles.specular} />
        </View>

        {/* Bell Flare / Rim */}
        <View style={styles.bellRim} />

        {/* Clapper */}
        <View style={styles.clapper} />

        {/* Red Notification Badge Dot */}
        <View style={styles.redBadge}>
          <View style={styles.badgeHighlight} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    position: 'relative',
  },
  floorGlow: {
    position: 'absolute',
    bottom: 8,
    height: 18,
    backgroundColor: 'rgba(245, 158, 11, 0.25)',
    borderRadius: 12,
  },
  bellFrame: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  topLoop: {
    width: 22,
    height: 16,
    borderRadius: 8,
    borderWidth: 4,
    borderColor: '#f59e0b',
    backgroundColor: 'transparent',
    marginBottom: -6,
    zIndex: 1,
  },
  bellDome: {
    width: 82,
    height: 72,
    backgroundColor: '#fbbf24',
    borderTopLeftRadius: 42,
    borderTopRightRadius: 42,
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
    shadowColor: '#d97706',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
    overflow: 'hidden',
    position: 'relative',
  },
  specular: {
    position: 'absolute',
    left: 10,
    top: 8,
    width: 14,
    height: 52,
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
    borderRadius: 7,
    transform: [{ rotate: '12deg' }],
  },
  bellRim: {
    width: 106,
    height: 16,
    backgroundColor: '#f59e0b',
    borderRadius: 8,
    marginTop: -6,
    zIndex: 2,
    shadowColor: '#b45309',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  clapper: {
    width: 24,
    height: 14,
    backgroundColor: '#b45309',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    marginTop: -4,
  },
  redBadge: {
    position: 'absolute',
    top: 6,
    right: 2,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#ef4444',
    borderWidth: 2.5,
    borderColor: '#ffffff',
    zIndex: 10,
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 6,
    elevation: 8,
  },
  badgeHighlight: {
    position: 'absolute',
    top: 4,
    left: 6,
    width: 8,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
  },
});
