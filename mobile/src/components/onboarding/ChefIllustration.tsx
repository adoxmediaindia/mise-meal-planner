import React from 'react';
import { View, Image, StyleSheet } from 'react-native';

interface ChefIllustrationProps {
  style?: object;
}

export const ChefIllustration: React.FC<ChefIllustrationProps> = ({ style }) => {
  return (
    <View style={[styles.container, style]}>
      <Image
        source={require('../../../assets/chef-illustration.png')}
        style={styles.image}
        resizeMode="contain"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  image: {
    width: 220,
    height: 240,
  },
});
