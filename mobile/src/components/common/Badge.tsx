import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';

interface BadgeProps {
  label: string;
  variant?: 'green' | 'amber' | 'neutral' | 'blue';
  style?: ViewStyle;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'green',
  style,
}) => {
  const getContainerStyle = () => {
    switch (variant) {
      case 'amber':
        return styles.amberBg;
      case 'neutral':
        return styles.neutralBg;
      case 'blue':
        return styles.blueBg;
      default:
        return styles.greenBg;
    }
  };

  const getTextStyle = () => {
    switch (variant) {
      case 'amber':
        return styles.amberText;
      case 'neutral':
        return styles.neutralText;
      case 'blue':
        return styles.blueText;
      default:
        return styles.greenText;
    }
  };

  return (
    <View style={[styles.badge, getContainerStyle(), style]}>
      <Text style={[styles.text, getTextStyle()]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
  },
  greenBg: {
    backgroundColor: '#E7F2EB',
  },
  greenText: {
    color: '#0D5C3A',
  },
  amberBg: {
    backgroundColor: '#FEF3C7',
  },
  amberText: {
    color: '#B45309',
  },
  neutralBg: {
    backgroundColor: '#F3F4F6',
  },
  neutralText: {
    color: '#4B5563',
  },
  blueBg: {
    backgroundColor: '#E0F2FE',
  },
  blueText: {
    color: '#0369A1',
  },
});
