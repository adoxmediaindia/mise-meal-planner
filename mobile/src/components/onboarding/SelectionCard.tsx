import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';

interface SelectionCardProps {
  title: string;
  subtitle?: string;
  icon?: string | React.ReactNode;
  selected?: boolean;
  mutedUnselected?: boolean;
  onPress: () => void;
  style?: object;
  testID?: string;
}

export const SelectionCard: React.FC<SelectionCardProps> = ({
  title,
  subtitle,
  icon,
  selected = false,
  mutedUnselected = false,
  onPress,
  style,
  testID,
}) => {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      testID={testID}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={[
        styles.card,
        selected ? styles.cardSelected : styles.cardDefault,
        style,
      ]}
    >
      {icon ? (
        <View style={styles.iconContainer}>
          {typeof icon === 'string' ? (
            <Text style={styles.icon}>{icon}</Text>
          ) : (
            icon
          )}
        </View>
      ) : null}
      <View style={styles.content}>
        <Text
          style={[
            styles.title,
            selected
              ? styles.titleSelected
              : mutedUnselected
              ? styles.titleMuted
              : styles.titleDefault,
          ]}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.subtitle}>{subtitle}</Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingVertical: 18,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  cardDefault: {
    borderWidth: 1.5,
    borderColor: '#EAEAE6',
  },
  cardSelected: {
    borderWidth: 2,
    borderColor: '#9ED034',
    shadowColor: '#9ED034',
    shadowOpacity: 0.18,
    shadowRadius: 8,
  },
  iconContainer: {
    width: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 28,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  titleDefault: {
    color: '#2A2A2A',
  },
  titleMuted: {
    color: '#9A9A94',
  },
  titleSelected: {
    color: '#1A1A1A',
  },
  subtitle: {
    fontSize: 14,
    color: '#8C8C88',
    marginTop: 2,
    fontWeight: '500',
  },
});
