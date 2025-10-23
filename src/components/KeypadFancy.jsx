// src/components/KeypadFancy.jsx
import React, { useMemo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, { FadeInDown, FadeOutDown, Layout } from 'react-native-reanimated';
import { Svg, Path } from 'react-native-svg';

function BackspaceIcon({ size = 20, color = '#111' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 12l5.2-6H20a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H8.2L3 12z" stroke={color} strokeWidth="1.8" strokeLinejoin="round"/>
      <Path d="M14.5 10l-3 3m0-3l3 3" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
    </Svg>
  );
}

function Key({ label, onPress, index }) {
  return (
    <Animated.View
      entering={FadeInDown.springify().damping(16).stiffness(220).delay(20 * index)}
      exiting={FadeOutDown}
      layout={Layout.springify().damping(18).stiffness(260)}
      style={styles.keyWrap}
    >
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.key, pressed && styles.keyPressed]}
      >
        {label === 'back'
          ? <BackspaceIcon size={22} color="#111" />
          : <Text style={styles.keyText}>{label}</Text>}
      </Pressable>
    </Animated.View>
  );
}

export default function KeypadFancy({ onKey, onBackspace, onDot }) {
  const rows = useMemo(
    () => [
      ['1', '2', '3'],
      ['4', '5', '6'],
      ['7', '8', '9'],
      ['.', '0', 'back'],
    ],
    []
  );

  return (
    <View style={styles.grid}>
      {rows.map((r, i) => (
        <View key={i} style={styles.row}>
          {r.map((c, j) => (
            <Key
              key={`${i}-${j}`}
              index={i * 3 + j}
              label={c}
              onPress={
                c === 'back'
                  ? onBackspace
                  : c === '.'
                  ? onDot ?? (() => onKey?.('.'))
                  : () => onKey?.(c)
              }
            />
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 },
  row: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  keyWrap: { flex: 1 },
  key: {
    height: 68,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyPressed: { backgroundColor: '#ECECEC' },
  keyText: { fontSize: 24, fontWeight: '700', color: '#111' },
});