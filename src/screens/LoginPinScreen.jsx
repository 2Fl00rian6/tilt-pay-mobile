import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import PinDots from '../components/PinDots';
import Keypad from '../components/Keypad';
import { useError } from '../context/ErrorContext';
import { login } from '../api/auth';
import { setCurrentPhone, setToken } from '../utils/authStorage';
import HeaderBar from '../components/HeaderBar';

const PIN_LEN = 4;

export default function LoginPinScreen({ route, navigation }) {
  const { showError } = useError();
  const phoneNumber = route?.params?.phoneNumber ?? '';

  const [pin, setPin] = useState('');
  const onKey = (k) => { if (pin.length < PIN_LEN) setPin((p) => p + String(k)); };
  const onBackspace = () => setPin((p) => p.slice(0, -1));

  useEffect(() => {
    if (pin.length !== PIN_LEN) return;
    (async () => {
      try {
        const { access_token } = await login({ phoneNumber, pin });
        await setCurrentPhone(phoneNumber);
        await setToken(phoneNumber, access_token || '');
        navigation.replace('Home');
      } catch (e) {
        setPin('');
        showError(e?.message || 'Invalid PIN', { position: 'top' });
      }
    })();
  }, [pin, phoneNumber, navigation, showError]);

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <HeaderBar title="" onBack={() => navigation.replace('EnterPhone')} />
      <View style={styles.container}>
        <View style={styles.handleWrap}><View style={styles.handle} /></View>

        <View style={{ paddingHorizontal: 24 }}>
          <Text style={styles.title}>Enter your PIN code</Text>
        </View>

        <View style={styles.dotsWrap}>
          <PinDots value={pin} length={PIN_LEN} />
        </View>

        <View style={{ flex: 1 }}>
          <Keypad onKey={onKey} onBackspace={onBackspace} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', paddingTop: 8 },
  handleWrap: { alignItems: 'center', marginBottom: 16 },
  handle: { width: 36, height: 4, backgroundColor: '#D1D5DB', borderRadius: 2 },
  title: { fontSize: 20, lineHeight: 28, fontWeight: '600', color: '#111827', marginBottom: 24 },
  dotsWrap: { alignItems: 'center', marginBottom: 10 },
});