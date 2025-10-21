// src/screens/SetPinScreen.jsx
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import HeaderBar from '../components/HeaderBar';
import PinDots from '../components/PinDots';
import Keypad from '../components/Keypad';
import { useError } from '../context/ErrorContext';
import { createAccount } from '../api/auth';

const PIN_LEN = 4;

export default function SetPinScreen({ route, navigation }) {
  const { showError } = useError();

  // On reçoit dialCode (avec +) et nsn (chiffres)
  const dialCode = route?.params?.dialCode || '+33';
  const nsn = route?.params?.nsn || '';
  const phoneDisplay = route?.params?.phoneDisplay || `${dialCode} ${nsn}`;
  const phoneNumber = `${dialCode}${nsn}`; // => ex "+33XXXXXXXXX"

  const fullName = route?.params?.fullName || 'Tilt User';
  const tagName = route?.params?.tagName || '';

  const [pin, setPin] = useState('');
  const [step, setStep] = useState('create'); // 'create' | 'confirm'
  const [firstPin, setFirstPin] = useState(null);
  const [sending, setSending] = useState(false);
  const [errorTick, setErrorTick] = useState(0);

  const onKey = (k) => { if (pin.length < PIN_LEN) setPin((p) => p + String(k)); };
  const onBackspace = () => setPin((p) => p.slice(0, -1));

  const onMismatch = useCallback(() => {
    setErrorTick(t => t + 1);
    setFirstPin(null);
    setStep('create');
    setPin('');
    showError('PIN codes do not match', { position: 'top' });
  }, [showError]);

  useEffect(() => {
    if (pin.length !== PIN_LEN) return;

    if (step === 'create') {
      setFirstPin(pin);
      setPin('');
      setStep('confirm');
      return;
    }

    // step === 'confirm'
    (async () => {
      if (firstPin !== pin) return onMismatch();

      try {
        setSending(true);
        await createAccount({ phoneNumber, fullName, tagName, pin });

        // Succès: l'API envoie un SMS → on va sur VerifyCode
        navigation.replace('VerifyCode', {
          mode: 'register',
          dialCode,
          nsn,
          phoneDisplay,
        });
      } catch (e) {
        // Affiche d'abord le message retourné par l'API (agrégé si 422)
        showError(e?.text || e?.message || 'Create account failed', { position: 'top' });

        // Si l’utilisateur existe déjà, on redirige vers l’écran de login PIN
        if (e?.redirectTo === 'login' || e?.status === 409) {
          setTimeout(() => {
            navigation.replace('LoginPin', { dialCode, nsn });
          }, 500);
        } else {
          // Sinon on ré-initialise le flux de création
          setPin('');
          setFirstPin(null);
          setStep('create');
        }
      } finally {
        setSending(false);
      }
    })();
  }, [
    pin, step, firstPin,
    dialCode, nsn, phoneDisplay,
    fullName, tagName,
    onMismatch, showError, navigation, phoneNumber
  ]);

  const title = useMemo(
    () => (step === 'create' ? 'Set your PIN code' : 'Confirm your PIN code'),
    [step]
  );

  return (
    <SafeAreaView style={styles.safe}>
      <HeaderBar title="" onBack={() => navigation.goBack()} />
      <View style={styles.container}>
        <View style={styles.handleWrap}><View style={styles.handle} /></View>

        <View style={{ paddingHorizontal: 24 }}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>Phone: {phoneDisplay}</Text>
        </View>

        <View style={styles.dotsWrap}>
          <PinDots value={pin} length={PIN_LEN} errorTick={errorTick} />
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