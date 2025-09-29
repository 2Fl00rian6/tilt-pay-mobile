import React from 'react';
import { View, Text, Pressable, useWindowDimensions, Animated } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTailwind } from 'tailwind-rn';

function Key({ label, onPress }) {
  const tw = useTailwind();
  const scale = React.useRef(new Animated.Value(1)).current;
  const opacity = React.useRef(new Animated.Value(1)).current;

  const pressIn = () => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 0.95, useNativeDriver: true, speed: 30 }),
      Animated.timing(opacity, { toValue: 0.5, duration: 80, useNativeDriver: true }),
    ]).start();
  };
  const pressOut = () => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 30 }),
      Animated.timing(opacity, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();
  };

  return (
    <Pressable
      onPress={() => {
        Haptics.selectionAsync().catch(() => {});
        onPress?.();
      }}
      onPressIn={pressIn}
      onPressOut={pressOut}
      style={tw('items-center justify-center')}
    >
      <Animated.View style={{ transform: [{ scale }], opacity }}>
        <Text style={tw('text-2xl text-gray-800')}>{label}</Text>
      </Animated.View>
    </Pressable>
  );
}

export default function Keypad({ onKey, onBackspace }) {
  const tw = useTailwind();
  const { width } = useWindowDimensions();

  // responsive : 3 colonnes, marges = 8, taille bouton ~ 1/3 de la largeur moins padding
  const sidePadding = 32; // px (≈ px-8)
  const gap = 8; // between cells
  const cell = Math.floor((width - sidePadding * 2 - gap * 2) / 3);

  const baseStyle = [
    { width: cell, height: Math.max(64, Math.floor(cell * 0.9)) },
    tw('rounded-2xl my-1'),
  ];

  const keys = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    [' ', '0', '⌫'],
  ];

  return (
    <View style={[tw('px-8'), { alignItems: 'center' }]}>
      {keys.map((row, r) => (
        <View key={r} style={[tw('flex-row'), { gap }]}>
          {row.map((k, c) => {
            if (k === ' ') {
              return <View key={`${r}-${c}`} style={baseStyle} />;
            }
            const handler = k === '⌫' ? onBackspace : () => onKey(k);
            return (
              <View key={`${r}-${c}`} style={baseStyle}>
                <Key label={k} onPress={handler} />
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}