import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export type ApplianceId = 'Stovetop' | 'Oven' | 'Air Fryer' | 'Microwave';

interface KitchenIllustrationProps {
  selectedAppliances: ApplianceId[];
  onToggleAppliance: (appliance: ApplianceId) => void;
  style?: object;
}

export const KitchenIllustration: React.FC<KitchenIllustrationProps> = ({
  selectedAppliances,
  onToggleAppliance,
  style,
}) => {
  const isSelected = (app: ApplianceId) => selectedAppliances.includes(app);

  return (
    <View style={[styles.wrapper, style]}>
      {/* Visual Kitchen Room Scene */}
      <View style={styles.roomContainer}>
        {/* Wall Backsplash */}
        <View style={styles.wall}>
          <View style={styles.tileLine} />
          <View style={styles.tileLine} />
          <View style={styles.tileLine} />
          {/* Upper Floating Shelf */}
          <View style={styles.shelf}>
            <View style={styles.jar} />
            <View style={[styles.jar, { height: 16 }]} />
            <View style={styles.jar} />
          </View>
        </View>

        {/* Counter Surface */}
        <View style={styles.counterSurface}>
          {/* Left Counter */}
          <View style={styles.leftCounter} />
          {/* Corner / Center Stovetop Area */}
          <View style={styles.centerCorner} />
          {/* Right Counter */}
          <View style={styles.rightCounter} />
        </View>

        {/* Appliances Layer */}
        {/* 1. Microwave (Left) */}
        <TouchableOpacity
          testID="appliance-hotspot-Microwave"
          activeOpacity={0.8}
          onPress={() => onToggleAppliance('Microwave')}
          style={[
            styles.applianceBox,
            styles.microwaveBox,
            isSelected('Microwave') && styles.applianceSelected,
          ]}
        >
          <View style={styles.microwaveScreen} />
          <Text style={styles.applianceIconText}>📻</Text>
        </TouchableOpacity>

        {/* 2. Stovetop (Center top) */}
        <TouchableOpacity
          testID="appliance-hotspot-Stovetop"
          activeOpacity={0.8}
          onPress={() => onToggleAppliance('Stovetop')}
          style={[
            styles.applianceBox,
            styles.stovetopBox,
            isSelected('Stovetop') && styles.applianceSelected,
          ]}
        >
          <View style={styles.stovetopBurners}>
            <View style={styles.burner} />
            <View style={styles.burner} />
          </View>
        </TouchableOpacity>

        {/* 3. Oven (Center bottom) */}
        <TouchableOpacity
          testID="appliance-hotspot-Oven"
          activeOpacity={0.8}
          onPress={() => onToggleAppliance('Oven')}
          style={[
            styles.applianceBox,
            styles.ovenBox,
            isSelected('Oven') && styles.applianceSelected,
          ]}
        >
          <View style={styles.ovenWindow} />
          <Text style={styles.applianceIconText}>♨️</Text>
        </TouchableOpacity>

        {/* 4. Air Fryer (Right) */}
        <TouchableOpacity
          testID="appliance-hotspot-Air Fryer"
          activeOpacity={0.8}
          onPress={() => onToggleAppliance('Air Fryer')}
          style={[
            styles.applianceBox,
            styles.airFryerBox,
            isSelected('Air Fryer') && styles.applianceSelected,
          ]}
        >
          <View style={styles.airFryerTop} />
          <Text style={styles.applianceIconText}>🍟</Text>
        </TouchableOpacity>

        {/* Wooden Floor */}
        <View style={styles.floor} />

        {/* Floating Badges */}
        <TouchableOpacity
          testID="appliance-badge-Microwave"
          onPress={() => onToggleAppliance('Microwave')}
          style={[styles.badge, styles.badgeMicrowave, isSelected('Microwave') && styles.badgeActive]}
        >
          <Text style={[styles.badgeText, isSelected('Microwave') && styles.badgeTextActive]}>
            {isSelected('Microwave') ? '✓ Microwave' : 'Microwave'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          testID="appliance-badge-Stovetop"
          onPress={() => onToggleAppliance('Stovetop')}
          style={[styles.badge, styles.badgeStovetop, isSelected('Stovetop') && styles.badgeActive]}
        >
          <Text style={[styles.badgeText, isSelected('Stovetop') && styles.badgeTextActive]}>
            {isSelected('Stovetop') ? '✓ Stovetop' : 'Stovetop'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          testID="appliance-badge-Oven"
          onPress={() => onToggleAppliance('Oven')}
          style={[styles.badge, styles.badgeOven, isSelected('Oven') && styles.badgeActive]}
        >
          <Text style={[styles.badgeText, isSelected('Oven') && styles.badgeTextActive]}>
            {isSelected('Oven') ? '✓ Oven' : 'Oven'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          testID="appliance-badge-Air Fryer"
          onPress={() => onToggleAppliance('Air Fryer')}
          style={[styles.badge, styles.badgeAirFryer, isSelected('Air Fryer') && styles.badgeActive]}
        >
          <Text style={[styles.badgeText, isSelected('Air Fryer') && styles.badgeTextActive]}>
            {isSelected('Air Fryer') ? '✓ Air Fryer' : 'Air Fryer'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    alignItems: 'center',
    marginVertical: 10,
  },
  roomContainer: {
    width: '100%',
    maxWidth: 360,
    height: 290,
    backgroundColor: '#FAF7F2',
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#EAE6DC',
    position: 'relative',
  },
  wall: {
    height: 140,
    backgroundColor: '#EFE9DE',
    justifyContent: 'space-evenly',
    paddingHorizontal: 16,
  },
  tileLine: {
    height: 1,
    backgroundColor: '#E2D9CA',
  },
  shelf: {
    width: 110,
    height: 6,
    backgroundColor: '#B68859',
    borderRadius: 3,
    alignSelf: 'center',
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'flex-end',
    marginTop: -10,
  },
  jar: {
    width: 10,
    height: 13,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 2,
    marginBottom: 6,
  },
  counterSurface: {
    height: 90,
    backgroundColor: '#E6DCCB',
    flexDirection: 'row',
    borderTopWidth: 2,
    borderColor: '#DDD0BC',
  },
  leftCounter: {
    flex: 1,
    backgroundColor: '#E6DCCB',
    borderRightWidth: 1,
    borderColor: '#D4C6B2',
  },
  centerCorner: {
    width: 110,
    backgroundColor: '#DFD4C1',
  },
  rightCounter: {
    flex: 1,
    backgroundColor: '#E6DCCB',
    borderLeftWidth: 1,
    borderColor: '#D4C6B2',
  },
  floor: {
    height: 60,
    backgroundColor: '#C6996D',
    borderTopWidth: 2,
    borderColor: '#B38356',
  },
  applianceBox: {
    position: 'absolute',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  applianceSelected: {
    borderColor: '#9ED034',
    shadowColor: '#9ED034',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 5,
    elevation: 3,
  },
  microwaveBox: {
    left: 16,
    top: 96,
    width: 72,
    height: 48,
    backgroundColor: '#27272A',
  },
  microwaveScreen: {
    position: 'absolute',
    left: 6,
    top: 6,
    width: 44,
    height: 36,
    backgroundColor: '#18181B',
    borderRadius: 4,
  },
  stovetopBox: {
    alignSelf: 'center',
    top: 122,
    width: 86,
    height: 22,
    backgroundColor: '#D4D4D8',
    borderRadius: 4,
  },
  stovetopBurners: {
    flexDirection: 'row',
    gap: 20,
  },
  burner: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#18181B',
    borderWidth: 2,
    borderColor: '#71717A',
  },
  ovenBox: {
    alignSelf: 'center',
    top: 148,
    width: 94,
    height: 80,
    backgroundColor: '#E4E4E7',
    borderRadius: 6,
  },
  ovenWindow: {
    width: 76,
    height: 52,
    backgroundColor: '#7C2D12',
    borderRadius: 4,
    marginTop: 10,
  },
  airFryerBox: {
    right: 18,
    top: 98,
    width: 66,
    height: 64,
    backgroundColor: '#18181B',
    borderRadius: 14,
  },
  airFryerTop: {
    width: 32,
    height: 8,
    backgroundColor: '#27272A',
    borderRadius: 4,
    marginTop: 4,
  },
  applianceIconText: {
    fontSize: 16,
  },
  badge: {
    position: 'absolute',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderWidth: 1,
    borderColor: '#EAEAE6',
    zIndex: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  badgeActive: {
    backgroundColor: '#9ED034',
    borderColor: '#9ED034',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6B6B6B',
  },
  badgeTextActive: {
    color: '#1A1A1A',
  },
  badgeMicrowave: {
    top: 72,
    left: 12,
  },
  badgeStovetop: {
    top: 100,
    alignSelf: 'center',
  },
  badgeOven: {
    top: 232,
    alignSelf: 'center',
  },
  badgeAirFryer: {
    top: 72,
    right: 14,
  },
});
