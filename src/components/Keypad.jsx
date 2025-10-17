import React, { useMemo, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Animated, Easing, useWindowDimensions } from 'react-native';
import { Svg, Path } from 'react-native-svg';

function BackspaceIcon({ size = 22, color = '#6B7280' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 12l5.2-6H20a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H8.2L3 12z" stroke={color} strokeWidth="1.6" strokeLinejoin="round"/>
      <Path d="M14.5 10l-3 3m0-3l3 3" stroke={color} strokeWidth="1.6" strokeLinecap="round"/>
    </Svg>
  );
}

function Key({ label, onPress }) {
  const scale = useRef(new Animated.Value(1)).current;
  const animate = (to) =>
    Animated.timing(scale, { toValue: to, duration: 90, easing: Easing.out(Easing.quad), useNativeDriver: true });

  const handlePress = async () => {
    try {
      const Haptics = await import('expo-haptics').catch(() => null);
      if (Haptics?.selectionAsync) await Haptics.selectionAsync();
    } catch {}
    onPress?.();
  };

  return (
    <Pressable
      onPressIn={() => animate(0.96).start()}
      onPressOut={() => animate(1).start()}
      onPress={handlePress}
      style={({ pressed }) => [styles.key, pressed && styles.keyPressed]}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <Animated.View style={{ transform: [{ scale }] }}>
        {typeof label === 'string' ? (
          <Text style={styles.digit}>{label}</Text>
        ) : (
          label
        )}
      </Animated.View>
    </Pressable>
  );
}

export default function Keypad({ onKey, onBackspace }) {
  const { width } = useWindowDimensions();
  const cols = 3;
  const gap = 26;                  // airy spacing like mock
  const side = Math.max(60, Math.min(88, (width - 48 - gap * (cols - 1)) / cols)); // 24px side paddings

  const rows = useMemo(
    () => [
      ['1', '2', '3'],
      ['4', '5', '6'],
      ['7', '8', '9'],
      [null, '0', 'back'],
    ],
    []
  );

  return (
    <View style={[styles.wrap, { paddingHorizontal: 24 }]}>
      {rows.map((r, i) => (
        <View key={i} style={[styles.row, { columnGap: gap, marginBottom: i < rows.length - 1 ? gap : 0 }]}>
          {r.map((c, j) => {
            if (c === null) return <View key={`${i}-${j}`} style={{ width: side, height: side }} />;
            if (c === 'back') {
              return (
                <View key={`${i}-${j}`} style={{ width: side, height: side, alignItems: 'center', justifyContent: 'center' }}>
                  <Key label={<BackspaceIcon size={22} />} onPress={onBackspace} />
                </View>
              );
            }
            return (
              <View key={`${i}-${j}`} style={{ width: side, height: side, alignItems: 'center', justifyContent: 'center' }}>
                <Key label={c} onPress={() => onKey?.(c)} />
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingTop: 8, paddingBottom: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  key: { alignItems: 'center', justifyContent: 'center' }, // no background, flat
  keyPressed: { opacity: 0.6 },
  digit: { fontSize: 30, fontWeight: '600', color: '#4B5563' }, // gray-600 like mock
});