import React, { useMemo, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  View, Text, StyleSheet, TouchableOpacity, Pressable, Animated,
} from 'react-native';
import HeaderBar from '../components/HeaderBar';
import { Svg, Path } from 'react-native-svg';

const IconChevronLeft = ({ size = 18, color = '#111' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M15 6l-6 6 6 6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const IconBackspace = ({ size = 22, color = '#111' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M3 12l5.2-6H20a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H8.2L3 12z" stroke={color} strokeWidth="1.8" strokeLinejoin="round"/>
    <Path d="M14.5 10l-3 3m0-3l3 3" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
  </Svg>
);

function Key({ label, onPress, size }) {
  const scale = React.useRef(new Animated.Value(1)).current;
  const pressIn = () => Animated.spring(scale, { toValue: 0.96, useNativeDriver: true, speed: 30, bounciness: 6 }).start();
  const pressOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 30, bounciness: 6 }).start();

  return (
    <View style={[styles.keyWrap, { height: size }]}>
      <Pressable
        onPressIn={pressIn}
        onPressOut={pressOut}
        onPress={onPress}
        style={({ pressed }) => [styles.key, pressed && styles.keyPressed]}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      >
        <Animated.View style={{ transform: [{ scale }] }}>
          {typeof label === 'string' ? (
            <Text style={styles.keyText}>{label}</Text>
          ) : label}
        </Animated.View>
      </Pressable>
    </View>
  );
}

export default function SendEnterAmountScreen({ route, navigation }) {
  const currency = route?.params?.currency ?? 'USD';
  const currencySymbol = useMemo(() => {
    if (currency === 'EUR') return '€';
    if (currency === 'GBP') return '£';
    return '$';
  }, [currency]);

  const [val, setVal] = useState('0');

  const addChar = (c) => {
    setVal((prev) => {
      let v = prev;
      if (c === 'back') {
        if (v.length <= 1) return '0';
        v = v.slice(0, -1);
        if (v === '0.' || v === '-') v = '0';
        if (v.endsWith('.')) v = v.slice(0, -1);
        return v || '0';
      }
      if (c === '.') {
        if (v.includes('.')) return v;
        return v + '.';
      }
      // digit
      if (v === '0' && c !== '0' && !v.includes('.')) return c;
      const afterDot = v.includes('.') ? v.split('.')[1] : '';
      if (v.includes('.') && afterDot.length >= 2) return v; // 2 décimales max
      return v + c;
    });
  };

  const amountNumber = useMemo(() => {
    const n = Number(val);
    return Number.isFinite(n) ? n : 0;
  }, [val]);

  const next = () => {
    if (amountNumber <= 0) return;
    navigation.navigate('SendTapToPay', { amount: amountNumber, currency });
  };

  // grille clavier
  const rows = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['.', '0', 'back'],
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['top','bottom']}>
      {/* Pas de back en haut; on met le bouton flottant en bas-gauche pour coller à la maquette */}
      <HeaderBar title="" onBack={undefined} />

      <View style={styles.container}>
        <View style={styles.handleWrap}><View style={styles.handle} /></View>

        <Text style={styles.title}>Enter an amount</Text>

        <View style={styles.amountWrap}>
          <Text style={styles.amountCurrency}>{currencySymbol}</Text>
          <Text style={styles.amountText}>{val}</Text>
        </View>

        <View style={styles.grid}>
          {rows.map((r, i) => (
            <View key={i} style={styles.row}>
              {r.map((c, j) => (
                <Key
                  key={`${i}-${j}`}
                  label={c === 'back' ? <IconBackspace /> : c}
                  size={74}
                  onPress={() => addChar(c)}
                />
              ))}
            </View>
          ))}
        </View>

        {/* Boutons flottants bas */}
        <View style={styles.bottomBar}>
          <TouchableOpacity style={styles.backFloat} onPress={() => navigation.goBack()} activeOpacity={0.9}>
            <IconChevronLeft size={18} color="#111" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.nextFloat, amountNumber <= 0 && styles.nextDisabled]}
            activeOpacity={0.95}
            onPress={next}
            disabled={amountNumber <= 0}
          >
            <Text style={[styles.nextText, amountNumber <= 0 && styles.nextTextDisabled]}>Next</Text>
            <Text style={[styles.nextArrow, amountNumber <= 0 && styles.nextTextDisabled]}>{'›'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex:1, backgroundColor:'#fff' },
  container: { flex:1, backgroundColor:'#fff' },

  handleWrap: { alignItems:'center', marginTop:8, marginBottom:8 },
  handle: { width:36, height:4, backgroundColor:'#D1D5DB', borderRadius:2 },

  title: { fontSize:20, lineHeight:28, fontWeight:'600', color:'#0F172A', marginTop:8, paddingHorizontal:20 },

  amountWrap: { alignItems:'center', marginTop:40, flexDirection:'row', justifyContent:'center' },
  amountCurrency: { fontSize:56, fontWeight:'700', color:'#D1D5DB', marginRight:8 },
  amountText: { fontSize:56, fontWeight:'700', color:'#D1D5DB' },

  grid: { marginTop:12, paddingHorizontal:40 },
  row: { flexDirection:'row', justifyContent:'space-between', marginBottom:12 },
  keyWrap: { width:72, height:72 },
  key: {
    flex:1, backgroundColor:'#F3F4F6', borderRadius:16,
    alignItems:'center', justifyContent:'center',
  },
  keyPressed: { backgroundColor:'#ECECEC' },
  keyText: { fontSize:24, fontWeight:'700', color:'#414141' },

  bottomBar: {
    position:'absolute', bottom:16, left:16, right:16,
    flexDirection:'row', justifyContent:'space-between', alignItems:'center',
  },
  backFloat: {
    width:56, height:56, borderRadius:16, backgroundColor:'#FFFFFF',
    alignItems:'center', justifyContent:'center',
    shadowColor:'#000', shadowOpacity:0.08, shadowRadius:8, shadowOffset:{ width:0, height:4 },
  },
  nextFloat: {
    minWidth:140, height:56, borderRadius:16, backgroundColor:'#111111',
    flexDirection:'row', alignItems:'center', justifyContent:'center', paddingHorizontal:18,
    gap:8, shadowColor:'#000', shadowOpacity:0.12, shadowRadius:10, shadowOffset:{ width:0, height:4 },
  },
  nextDisabled: { backgroundColor:'#E5E7EB' },
  nextText: { color:'#fff', fontWeight:'700', fontSize:16 },
  nextTextDisabled: { color:'#9CA3AF' },
  nextArrow: { color:'#fff', fontSize:20, marginLeft:6, marginTop:-2 },
});