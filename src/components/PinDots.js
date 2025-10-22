import React, { useEffect, useRef } from 'react';
import { View, Animated } from 'react-native';
import { useTailwind } from 'tailwind-rn';

export default function PinDots({ value = '', length = 4, errorTick = 0 }) {
  const tw = useTailwind();
  const scales = useRef([...Array(length)].map(() => new Animated.Value(0))).current;
  const shake = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const idx = value.length - 1;
    if (idx >= 0 && idx < length) {
      Animated.spring(scales[idx], {
        toValue: 1,
        useNativeDriver: true,
        bounciness: 12,
        speed: 12,
      }).start();
    }
    for (let i = value.length; i < length; i++) {
      scales[i].setValue(0);
    }
  }, [value, length, scales]);

  useEffect(() => {
    if (!errorTick) return;
    shake.setValue(0);
    Animated.sequence([
      Animated.timing(shake, { toValue: 1, duration: 40, useNativeDriver: true }),
      Animated.timing(shake, { toValue: -1, duration: 80, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 0, duration: 40, useNativeDriver: true }),
    ]).start();
  }, [errorTick, shake]);

  const translateX = shake.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: [-10, 0, 10],
  });

  return (
    <Animated.View style={[tw('flex-row items-center justify-center'), { transform: [{ translateX }] }]}>
      {Array.from({ length }).map((_, i) => (
        <View key={i} style={tw('mx-3')}>
          <View style={tw('w-4 h-4 rounded-full bg-gray-200')} />
          <Animated.View
            style={[
              tw('w-4 h-4 rounded-full absolute'),
              { backgroundColor: '#111', transform: [{ scale: scales[i] }] },
            ]}
          />
        </View>
      ))}
    </Animated.View>
  );
}