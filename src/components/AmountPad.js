import React, { useCallback, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Animated } from 'react-native';
import { Svg, Path } from 'react-native-svg';

function BackspaceIcon({ size = 20, color = '#111' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 12l5.2-6H20a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H8.2L3 12z" stroke={color} strokeWidth="1.8" strokeLinejoin="round"/>
      <Path d="M14.5 10l-3 3m0-3l3 3" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
    </Svg>
  );
}

function Key({ children, onPress }) {
  const scale = useRef(new Animated.Value(1)).current;
  const pressIn = () => Animated.spring(scale, { toValue: 0.96, useNativeDriver: true, speed: 30, bounciness: 6 }).start();
  const pressOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 30, bounciness: 6 }).start();
  return (
    <Pressable onPressIn={pressIn} onPressOut={pressOut} onPress={onPress} style={({ pressed }) => [styles.key, pressed && styles.keyPressed]}>
      <Animated.View style={{ transform: [{ scale }] }}>
        {typeof children === 'string' ? <Text style={styles.keyText}>{children}</Text> : children}
      </Animated.View>
    </Pressable>
  );
}

export default function AmountPad({ value, onChange }) {
  const append = useCallback((ch) => {
    let v = String(value || '');
    if (ch === '.') {
      if (!v) v = '0';
      if (!v.includes('.')) v += '.';
      return onChange(v);
    }
    // chiffres
    if (/^\d$/.test(ch)) {
      // limite 2 décimales
      if (v.includes('.')) {
        const [, dec = ''] = v.split('.');
        if (dec.length >= 2) return;
      }
      // éviter 000… en tête (garde "0" puis ajoute décimales / remplace)
      if (v === '0' && ch === '0' && !v.includes('.')) return; // empêche 00
      if (v === '0' && !v.includes('.')) v = ch; else v += ch;
      return onChange(v);
    }
    // 00
    if (ch === '00') {
      if (!v || v === '0') return; // pas de 000
      if (v.includes('.')) {
        const [, dec = ''] = v.split('.');
        if (dec.length >= 2) return;
        // Ajoute jusqu’à 2 décimales max
        const room = 2 - dec.length;
        v += '0'.repeat(room);
      } else {
        v += '00';
      }
      return onChange(v);
    }
  }, [value, onChange]);

  const backspace = useCallback(() => {
    let v = String(value || '');
    if (!v) return;
    v = v.slice(0, -1);
    onChange(v);
  }, [value, onChange]);

  const rows = [
    ['1','2','3'],
    ['4','5','6'],
    ['7','8','9'],
    ['.','0','⌫'],
    ['00'],
  ];

  return (
    <View style={styles.grid}>
      {rows.map((r, i) => (
        <View key={i} style={styles.row}>
          {r.map((label, j) => {
            if (label === '⌫') {
              return <Key key={`${i}-${j}`} onPress={backspace}><BackspaceIcon /></Key>;
            }
            return <Key key={`${i}-${j}`} onPress={() => append(label)}>{label}</Key>;
          })}
          {/* équilibre la dernière ligne si elle n’a qu’un bouton */}
          {r.length === 1 && <View style={[styles.key, { opacity: 0 }]} />}
          {r.length === 1 && <View style={[styles.key, { opacity: 0 }]} />}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { paddingHorizontal: 16, gap: 10, paddingBottom: 8 },
  row: { flexDirection: 'row', gap: 10 },
  key: {
    flex: 1, height: 60, borderRadius: 16, alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#F5F5F5',
  },
  keyPressed: { backgroundColor: '#ECECEC' },
  keyText: { fontSize: 22, fontWeight: '700', color: '#111' },
});
