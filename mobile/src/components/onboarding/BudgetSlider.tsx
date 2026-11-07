import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  PanResponder,
  LayoutChangeEvent,
} from 'react-native';

interface BudgetSliderProps {
  value: number;
  min: number;
  max: number;
  step?: number;
  symbol: string;
  onChange: (val: number) => void;
}

export const BudgetSlider: React.FC<BudgetSliderProps> = ({
  value,
  min,
  max,
  step = 5,
  symbol,
  onChange,
}) => {
  const [trackWidth, setTrackWidth] = useState<number>(0);
  const trackRef = useRef<View>(null);

  const thumbSize = 38;

  const clampValue = (raw: number) => {
    const stepped = Math.round(raw / step) * step;
    return Math.max(min, Math.min(max, stepped));
  };

  const handleTouch = (pageX: number) => {
    if (trackWidth <= 0) return;
    trackRef.current?.measure((_x, _y, width, _height, pageXOffset) => {
      const touchX = pageX - pageXOffset;
      const ratio = Math.max(0, Math.min(1, touchX / width));
      const newValue = clampValue(min + ratio * (max - min));
      onChange(newValue);
    });
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        handleTouch(evt.nativeEvent.pageX);
      },
      onPanResponderMove: (evt) => {
        handleTouch(evt.nativeEvent.pageX);
      },
    })
  ).current;

  const handleLayout = (e: LayoutChangeEvent) => {
    setTrackWidth(e.nativeEvent.layout.width);
  };

  const progressRatio = max > min ? Math.max(0, Math.min(1, (value - min) / (max - min))) : 0;
  const thumbOffset = trackWidth > 0 ? progressRatio * (trackWidth - thumbSize) : 0;

  return (
    <View style={styles.container}>
      <View style={styles.sliderRow}>
        <View
          ref={trackRef}
          style={styles.trackContainer}
          onLayout={handleLayout}
          {...panResponder.panHandlers}
        >
          {/* Base Track */}
          <View style={styles.track} />

          {/* Active Fill Track */}
          <View
            style={[
              styles.activeTrack,
              { width: thumbOffset + thumbSize / 2 },
            ]}
          />

          {/* Golden / Amber Thumb with Currency Symbol */}
          <View
            style={[
              styles.thumb,
              {
                width: thumbSize,
                height: thumbSize,
                borderRadius: thumbSize / 2,
                transform: [{ translateX: thumbOffset }],
              },
            ]}
          >
            <Text style={styles.thumbText}>{symbol}</Text>
          </View>
        </View>

        {/* Max Budget Label on Right */}
        <Text style={styles.maxLabel}>
          {symbol}{max}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingVertical: 14,
  },
  sliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  trackContainer: {
    flex: 1,
    height: 44,
    justifyContent: 'center',
    position: 'relative',
  },
  track: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EAEAE6',
    width: '100%',
  },
  activeTrack: {
    position: 'absolute',
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EAEAE6',
    left: 0,
  },
  thumb: {
    position: 'absolute',
    backgroundColor: '#F5C242',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 5,
    elevation: 4,
  },
  thumbText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 16,
  },
  maxLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#8C8C88',
    minWidth: 44,
    textAlign: 'right',
  },
});
