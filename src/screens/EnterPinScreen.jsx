import React, { useEffect, useState } from 'react';
import { View, Text, Alert, TouchableOpacity, StyleSheet } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import PinDots from '../components/PinDots';
import Keypad from '../components/Keypad';

const PIN_LEN = 4;

export default function EnterPinScreen({ navigation }) {
  const [pin, setPin] = useState('');
  const [hasPin, setHasPin] = useState(false);

  useEffect(() => {
    (async () => {
      const saved = await SecureStore.getItemAsync('user_pin');
      if (!saved) {
        navigation.replace('SetPin');
      } else {
        setHasPin(true);
      }
    })();
  }, [navigation]);

  const onKey = (k) => { if (pin.length < PIN_LEN) setPin((p) => p + String(k)); };
  const onBackspace = () => setPin((p) => p.slice(0, -1));

  useEffect(() => {
    (async () => {
      if (pin.length === PIN_LEN) {
        const saved = await SecureStore.getItemAsync('user_pin');
        if (saved === pin) {
          navigation.replace('Home');
        } else {
          Alert.alert('Wrong PIN');
          setPin('');
        }
      }
    })();
  }, [pin, navigation]);

  if (!hasPin) return null;

  return (
    <View style={styles.safe}>
      {/* Handle */}
      <View style={styles.handleWrap}><View style={styles.handle} /></View>

      {/* Title */}
      <View style={{ paddingHorizontal: 24 }}>
        <Text style={styles.title}>Enter your PIN code</Text>
      </View>

      {/* Dots */}
      <View style={styles.dotsWrap}>
        <PinDots value={pin} length={PIN_LEN} />
      </View>

      {/* Keypad */}
      <View style={{ flex: 1, justifyContent: 'flex-end' }}>
        <Keypad onKey={onKey} onBackspace={onBackspace} />
      </View>

      {/* Footer link */}
      <TouchableOpacity onPress={() => navigation.replace('SetPin')} style={styles.footerBtn}>
        <Text style={styles.footerLink}>Forgot your PIN code?</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF', paddingTop: 16 },
  handleWrap: { alignItems: 'center', marginBottom: 28 },
  handle: { width: 36, height: 4, backgroundColor: '#D1D5DB', borderRadius: 2 },
  title: { fontSize: 20, lineHeight: 28, fontWeight: '600', color: '#111827' },
  dotsWrap: { alignItems: 'center', marginTop: 48, marginBottom: 12 },
  footerBtn: { alignSelf: 'center', paddingVertical: 14, marginBottom: 8 },
  footerLink: { color: '#6B7280', fontSize: 14 },
});