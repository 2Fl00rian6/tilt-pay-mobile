// src/screens/SendEnterAmountScreen.jsx
import React, { useMemo, useRef, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, TouchableOpacity, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import HeaderBar from '../components/HeaderBar';
import { Svg, Path } from 'react-native-svg';

function BackspaceIcon({ size = 20, color = '#4B5563' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 12l5.2-6H20a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H8.2L3 12z" stroke={color} strokeWidth="1.8" strokeLinejoin="round"/>
      <Path d="M14.5 10l-3 3m0-3l3 3" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
    </Svg>
  );
}
function ChevronLeft({ size = 18, color = '#111' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M15 18l-6-6 6-6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}
function ChevronRight({ size = 18, color = '#fff' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M9 6l6 6-6 6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function Key({ label, onPress }) {
  const scale = useRef(new Animated.Value(1)).current;
  const pressIn = () => Animated.spring(scale, { toValue: 0.96, useNativeDriver: true, speed: 30, bounciness: 6 }).start();
  const pressOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 30, bounciness: 6 }).start();

  const handlePress = useCallback(async () => {
    try {
      const Haptics = await import('expo-haptics');
      Haptics.selectionAsync?.();
    } catch {}
    onPress?.();
  }, [onPress]);

  return (
    <Pressable onPressIn={pressIn} onPressOut={pressOut} onPress={handlePress} style={({ pressed }) => [styles.key, pressed && styles.keyPressed]}>
      <Animated.View style={{ transform: [{ scale }] }}>
        {typeof label === 'string' ? <Text style={styles.keyText}>{label}</Text> : label}
      </Animated.View>
    </Pressable>
  );
}

function AmountPad({ onDigit, onDot, onBackspace }) {
  const rows = [
    ['1','2','3'],
    ['4','5','6'],
    ['7','8','9'],
    ['.','0','back'],
  ];
  return (
    <View style={styles.grid}>
      {rows.map((r, i) => (
        <View key={i} style={styles.row}>
          {r.map((c, j) => {
            if (c === 'back') {
              return <Key key={`${i}-${j}`} label={<BackspaceIcon />} onPress={onBackspace} />;
            }
            if (c === '.') return <Key key={`${i}-${j}`} label="." onPress={onDot} />;
            return <Key key={`${i}-${j}`} label={c} onPress={() => onDigit(c)} />;
          })}
        </View>
      ))}
    </View>
  );
}

export default function SendEnterAmountScreen({ navigation, route }) {
  const currency = route?.params?.currency || '$';
  const [val, setVal] = useState(''); // chaîne brute (ex: "12.3")

  const amount = useMemo(() => Number(val || '0'), [val]);
  const canNext = amount > 0;

  const onDigit = (d) => {
    let v = val;
    // limite 2 décimales
    if (v.includes('.')) {
      const [, dec=''] = v.split('.');
      if (dec.length >= 2) return;
    }
    // éviter “00” en tête
    if (v === '0' && !v.includes('.')) v = d;
    else v += d;
    setVal(v);
  };
  const onDot = () => {
    if (!val) setVal('0.');
    else if (!val.includes('.')) setVal(val + '.');
  };
  const onBackspace = () => setVal((s) => s.slice(0, -1));

  return (
    <SafeAreaView style={styles.safe} edges={['top','bottom']}>
      <HeaderBar title="" onBack={() => navigation.goBack()} />
      <View style={styles.container}>
        <View style={styles.handleWrap}><View style={styles.handle} /></View>

        <Text style={styles.title}>Enter an amount</Text>

        <View style={styles.amountWrap}>
          <Text style={styles.amountCurrency}>{currency}</Text>
          <Text style={styles.amountText}>{val ? Number(val).toString() : '0'}</Text>
        </View>

        <View style={{ flex: 1 }} />

        <AmountPad onDigit={onDigit} onDot={onDot} onBackspace={onBackspace} />

        <View style={styles.bottomRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.9}>
            <ChevronLeft />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate('SendMethodSelect', { amount })}
            disabled={!canNext}
            activeOpacity={0.9}
            style={[styles.nextBtn, !canNext && styles.nextBtnDisabled]}
          >
            <Text style={[styles.nextText, !canNext && styles.nextTextDisabled]}>Next</Text>
            <ChevronRight />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  container: { flex: 1, backgroundColor: '#FFFFFF', paddingTop: 8 },
  handleWrap: { alignItems: 'center', marginBottom: 8 },
  handle: { width: 40, height: 4, backgroundColor: '#D1D5DB', borderRadius: 2 },

  title: { marginTop: 8, marginLeft: 24, color: '#0F172A', fontSize: 20, fontWeight: '600' },

  amountWrap: { marginTop: 48, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' },
  amountCurrency: { fontSize: 52, color: '#D1D5DB', fontWeight: '700', marginRight: 6 },
  amountText: { fontSize: 64, color: '#D1D5DB', fontWeight: '700' },

  grid: { paddingHorizontal: 32, gap: 12, paddingBottom: 8 },
  row: { flexDirection: 'row', gap: 12 },
  key: {
    flex: 1, height: 64, borderRadius: 16, alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#F5F5F5',
  },
  keyPressed: { backgroundColor: '#ECECEC' },
  keyText: { fontSize: 24, fontWeight: '700', color: '#444' },

  bottomRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 16, marginTop: 4 },
  backBtn: {
    width: 56, height: 56, borderRadius: 14, backgroundColor: '#FFFFFF',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 4 },
  },
  nextBtn: {
    height: 56, borderRadius: 16, backgroundColor: '#111111',
    paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', gap: 8,
    shadowColor: '#000', shadowOpacity: 0.10, shadowRadius: 10, shadowOffset: { width: 0, height: 6 },
  },
  nextBtnDisabled: { backgroundColor: '#E5E7EB' },
  nextText: { color: '#FFFFFF', fontWeight: '700', fontSize: 16 },
  nextTextDisabled: { color: '#9CA3AF' },
});