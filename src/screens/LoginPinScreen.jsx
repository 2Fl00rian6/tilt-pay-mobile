import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import HeaderBar from '../components/HeaderBar';
import PinDots from '../components/PinDots';
import Keypad from '../components/Keypad';
import { useError } from '../context/ErrorContext';
import { login, me } from '../api/auth';
import { setToken, setUser, setCurrentPhone } from '../utils/authStorage';

const PIN_LEN = 4;

export default function LoginPinScreen({ route, navigation }) {
  const { showError } = useError();

  const dialCode = route?.params?.dialCode || '+33';
  const nsn = route?.params?.nsn || '';
  const phoneDisplay = route?.params?.phoneDisplay || `${dialCode} ${nsn}`;
  const phoneNumber = `${dialCode}${nsn}`;

  const [pin, setPin] = useState('');
  const [sending, setSending] = useState(false);

  const onKey = (k) => { if (pin.length < PIN_LEN) setPin((p) => p + String(k)); };
  const onBackspace = () => setPin((p) => p.slice(0, -1));

  useEffect(() => {
    if (pin.length !== PIN_LEN) return;
    (async () => {
      try {
        setSending(true);
        const res = await login({ phoneNumber, pin });
        const token = res?.access_token;
        if (!token) throw new Error('Missing access_token');
        const resMe = await me(token);
        await setToken(phoneNumber, token);
        await setUser({
          id: resMe.id,
          fullName: resMe.fullName,
          tagName: resMe.tagname,
          phoneNumber: resMe.phoneNumber,
          verified: resMe.verified,
          createdAt: resMe.createdAt,
        });
        await setCurrentPhone(phoneNumber);
        navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
      } catch (e) {
        showError(e?.text || e?.message || 'Login failed', { position: 'top' });
        setPin('');
      } finally {
        setSending(false);
      }
    })();
  }, [pin, phoneNumber, navigation, showError]);

  return (
    <SafeAreaView style={styles.safe}>
      <HeaderBar title="" onBack={() => navigation.goBack()} />
      <View style={styles.container}>
        <View style={styles.handleWrap}><View style={styles.handle} /></View>

        <View style={{ paddingHorizontal: 24 }}>
          <Text style={styles.title}>Enter your PIN</Text>
          <Text style={styles.subtitle}>Phone: {phoneDisplay}</Text>
        </View>

        <View style={styles.dotsWrap}>
          <PinDots value={pin} length={PIN_LEN} />
        </View>

        <View style={{ flex: 1 }} />
        <View style={styles.kpWrap} pointerEvents={sending ? 'none' : 'auto'}>
          <Keypad onKey={onKey} onBackspace={onBackspace} />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1, backgroundColor: '#fff', paddingTop: 8 },
  handleWrap: { alignItems: 'center', marginBottom: 16 },
  handle: { width: 36, height: 4, backgroundColor: '#D1D5DB', borderRadius: 2 },

  title: { fontSize: 20, lineHeight: 28, fontWeight:'600', color:'#111827', marginBottom: 8 },
  subtitle: { fontSize: 14, lineHeight: 20, color:'#6B7280' },

  dotsWrap: { alignItems: 'center', marginTop: 24 },
  kpWrap: { paddingBottom: 8 },
});