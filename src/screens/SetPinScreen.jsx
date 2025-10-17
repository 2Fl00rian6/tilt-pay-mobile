import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { View, Text } from 'react-native';
import { useTailwind } from 'tailwind-rn';
import PinDots from '../components/PinDots';
import Keypad from '../components/Keypad';
import { useError } from '../context/ErrorContext';
import { getCurrentUsername, setPin as storePin, setToken } from '../utils/authStorage';

const PIN_LEN = 4;

export default function SetPinScreen({ route, navigation }) {
  const tw = useTailwind();
  const { showError } = useError();
  const [pin, setPin] = useState('');
  const [step, setStep] = useState('create');
  const [firstPin, setFirstPin] = useState(null);
  const [errorTick, setErrorTick] = useState(0);
  const usernameParam = route?.params?.username;
  const mismatchRef = useRef(false);

  const onKey = useCallback((k) => {
    if (!k) return;
    const d = String(k).replace(/\D+/g, '');
    if (!d) return;
    setPin((p) => (p.length < PIN_LEN ? p + d : p));
  }, []);
  const onBackspace = useCallback(() => setPin((p) => p.slice(0, -1)), []);

  const triggerMismatch = useCallback(() => {
    if (mismatchRef.current) return;
    mismatchRef.current = true;
    setErrorTick((t) => t + 1);
    showError('PIN codes do not match', { position: 'top' });
    setTimeout(() => {
      setFirstPin(null);
      setStep('create');
      setPin('');
      mismatchRef.current = false;
    }, 260);
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
      const username = usernameParam || (await getCurrentUsername());
      if (!username) { navigation.replace('EnterPhone'); return; }

      if (firstPin === pin) {
        await storePin(username, pin);
        await setToken(username, '1');
        navigation.replace('Home');
      } else {
        triggerMismatch();
      }
    })();
  }, [pin, step, firstPin, navigation, usernameParam, triggerMismatch]);

  const title = useMemo(
    () => (step === 'create' ? 'Set your PIN code' : 'Confirm your PIN code'),
    [step]
  );

  return (
    <View style={tw('flex-1 bg-white pt-16')}>
      <View style={tw('items-center mb-10')}>
        <View style={tw('w-9 h-1 bg-gray-300 rounded-full')} />
      </View>

      <View style={tw('px-6')}>
        <Text style={tw('text-xl font-semibold text-black mb-10')}>{title}</Text>
      </View>

      <View style={tw('items-center mb-8')}>
        <PinDots value={pin} length={PIN_LEN} errorTick={errorTick} />
      </View>

      <View style={tw('flex-1')}>
        <Keypad onKey={onKey} onBackspace={onBackspace} />
      </View>

      <View style={tw('px-6 pb-4')}>
        <View style={tw('h-14 rounded-2xl items-center justify-center bg-gray-200')}>
          <Text style={tw('text-gray-400 font-semibold')}>Continue</Text>
        </View>
      </View>

      <View style={tw('items-center mb-8')}>
        <Text style={tw('text-gray-500')}>
          Do you have an account?{' '}
          <Text onPress={() => navigation.replace('LoginPin')} style={tw('text-black font-semibold')}>
            Log in
          </Text>
        </Text>
      </View>
    </View>
  );
}