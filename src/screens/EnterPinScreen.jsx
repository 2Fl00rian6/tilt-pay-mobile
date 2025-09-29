import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { useTailwind } from 'tailwind-rn';
import PinDots from '../components/PinDots';
import Keypad from '../components/Keypad';
import { useError } from '../context/ErrorContext';
import { getCurrentUsername, getPin, hasToken } from '../utils/authStorage';

const PIN_LEN = 4;

export default function EnterPinScreen({ navigation }) {
  const tw = useTailwind();
  const { showError } = useError();
  const [pin, setPin] = useState('');
  const [ready, setReady] = useState(false);
  const [username, setUsername] = useState(null);

  useEffect(() => {
    (async () => {
      const u = await getCurrentUsername();
      if (!u) return navigation.replace('ChooseTag');
      setUsername(u);

      const token = await hasToken(u);
      const savedPin = await getPin(u);

      if (!token) return navigation.replace('ChooseTag');
      if (!savedPin) return navigation.replace('SetPin', { username: u });
      setReady(true);
    })();
  }, [navigation]);

  const onKey = (k) => { if (pin.length < PIN_LEN) setPin(pin + String(k)); };
  const onBackspace = () => setPin((p) => p.slice(0, -1));

  useEffect(() => {
    (async () => {
      if (pin.length !== PIN_LEN || !username) return;
      const saved = await getPin(username);
      if (saved === pin) navigation.replace('Home');
      else { setPin(''); showError('Wrong PIN', { position:'top' }); }
    })();
  }, [pin, username, navigation, showError]);

  if (!ready) return null;

  return (
    <View style={tw('flex-1 bg-white pt-16')}>
      <View style={tw('items-center mb-10')}>
        <View style={tw('w-16 h-1 bg-gray-300 rounded-full')} />
      </View>

      <View style={tw('px-6')}>
        <Text style={tw('text-xl font-semibold text-black mb-10')}>Enter your PIN code</Text>
      </View>

      <View style={tw('items-center mb-10')}>
        <PinDots value={pin} length={PIN_LEN} />
      </View>

      <View style={tw('flex-1')}>
        <Keypad onKey={onKey} onBackspace={onBackspace} />
      </View>

      <View style={tw('items-center mb-8')}>
        <Text style={tw('text-gray-500')}>Forgot your PIN code?</Text>
      </View>
    </View>
  );
}