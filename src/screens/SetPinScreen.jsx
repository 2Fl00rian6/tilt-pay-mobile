import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import PinDots from '../components/PinDots';
import Keypad from '../components/Keypad';
import { useError } from '../context/ErrorContext';
import { createAccount, login } from '../api/auth';
import { setCurrentPhone, setToken } from '../utils/authStorage';
import HeaderBar from '../components/HeaderBar';

const PIN_LEN = 4;

export default function SetPinScreen({ route, navigation }) {
  const { showError } = useError();

  const phoneNumber = route?.params?.phoneNumber ?? '';
  const tagName = route?.params?.tagName ?? '';
  const fullName = route?.params?.fullName ?? (tagName || 'Tilt User');

  const [pin, setPin] = useState('');
  const [step, setStep] = useState('create'); // create | confirm
  const [firstPin, setFirstPin] = useState(null);

  const onKey = (k) => { if (pin.length < PIN_LEN) setPin((p) => p + String(k)); };
  const onBackspace = () => setPin((p) => p.slice(0, -1));

  const onMismatch = useCallback(() => {
    showError('PIN codes do not match', { position:'top' });
    setFirstPin(null);
    setStep('create');
    setPin('');
  }, [showError]);

  useEffect(() => {
    if (pin.length !== PIN_LEN) return;

    if (step === 'create') {
      setFirstPin(pin);
      setPin('');
      setStep('confirm');
      return;
    }

    (async () => {
      try {
        await createAccount({ phoneNumber, fullName, tagName, pin: firstPin });
        const { access_token } = await login({ phoneNumber, pin: firstPin });
        await setCurrentPhone(phoneNumber);
        await setToken(phoneNumber, access_token || '');
        navigation.replace('Home');
      } catch (e) {
        showError(e?.message || 'Account creation failed', { position: 'top' });
        onMismatch();
      }
    })();
  }, [pin, step, firstPin, phoneNumber, fullName, tagName, navigation, onMismatch, showError]);

  const title = useMemo(() => (step === 'create' ? 'Set your PIN code' : 'Confirm your PIN code'), [step]);

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <HeaderBar title="" onBack={() => navigation.replace('ChooseTag', { phoneNumber })} />
      <View style={styles.container}>
        <View style={styles.handleWrap}><View style={styles.handle} /></View>

        <View style={{ paddingHorizontal: 24 }}>
          <Text style={styles.title}>{title}</Text>
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