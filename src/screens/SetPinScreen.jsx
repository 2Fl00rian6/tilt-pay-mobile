import React, { useEffect, useMemo, useState, useCallback } from 'react';
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
  const [step, setStep] = useState('create'); // 'create' | 'confirm'
  const [firstPin, setFirstPin] = useState(null);
  const usernameParam = route?.params?.username;

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

    // confirm
    (async () => {
      const username = usernameParam || (await getCurrentUsername());
      if (!username) return navigation.replace('ChooseTag');

      if (firstPin === pin) {
        await storePin(username, pin);
        await setToken(username, '1');
        navigation.replace('Home');
      } else {
        onMismatch();
      }
    })();
  }, [pin, step, firstPin, navigation, usernameParam, onMismatch]);

  const title = useMemo(
    () => (step === 'create' ? 'Set your PIN code' : 'Confirm your PIN code'),
    [step]
  );

  return (
    <View style={tw('flex-1 bg-white pt-16')}>
      <View style={tw('items-center mb-10')}>
        <View style={tw('w-16 h-1 bg-gray-300 rounded-full')} />
      </View>

      <View style={tw('px-6')}>
        <Text style={tw('text-xl font-semibold text-black mb-10')}>{title}</Text>
      </View>

      <View style={tw('items-center mb-10')}>
        <PinDots value={pin} length={PIN_LEN} />
      </View>

      <View style={tw('flex-1')}>
        <Keypad onKey={onKey} onBackspace={onBackspace} />
      </View>
    </View>
  );
}