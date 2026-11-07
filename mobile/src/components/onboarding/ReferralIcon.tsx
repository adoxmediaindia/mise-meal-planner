import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ReferralSource } from '../../types';

interface ReferralIconProps {
  source: ReferralSource;
}

export const ReferralIcon: React.FC<ReferralIconProps> = ({ source }) => {
  switch (source) {
    case 'Instagram':
      return (
        <View style={[styles.box, styles.instagram]}>
          <Text style={styles.whiteIcon}>📷</Text>
        </View>
      );
    case 'TikTok':
      return (
        <View style={[styles.box, styles.tiktok]}>
          <Text style={styles.whiteIcon}>🎵</Text>
        </View>
      );
    case 'YouTube':
      return (
        <View style={[styles.box, styles.youtube]}>
          <Text style={styles.whiteIcon}>▶</Text>
        </View>
      );
    case 'Facebook':
      return (
        <View style={[styles.box, styles.facebook]}>
          <Text style={styles.facebookF}>f</Text>
        </View>
      );
    case 'Word of mouth':
      return (
        <View style={[styles.box, styles.wordOfMouth]}>
          <Text style={styles.darkIcon}>💬</Text>
        </View>
      );
    case 'Google Play':
      return (
        <View style={[styles.box, styles.googlePlay]}>
          <Text style={styles.playIcon}>▶</Text>
        </View>
      );
    default:
      return null;
  }
};

const styles = StyleSheet.create({
  box: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  instagram: {
    backgroundColor: '#E1306C',
  },
  tiktok: {
    backgroundColor: '#000000',
  },
  youtube: {
    backgroundColor: '#FF0000',
  },
  facebook: {
    backgroundColor: '#1877F2',
    borderRadius: 17,
  },
  wordOfMouth: {
    backgroundColor: '#F3F4F6',
  },
  googlePlay: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  whiteIcon: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  darkIcon: {
    fontSize: 16,
  },
  playIcon: {
    fontSize: 16,
    color: '#4285F4',
    fontWeight: 'bold',
  },
  facebookF: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: -2,
  },
});
