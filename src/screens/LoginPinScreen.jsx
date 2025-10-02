import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { useTailwind } from 'tailwind-rn';
import PinDots from '../components/PinDots';
import Keypad from '../components/Keypad';
import { useError } from '../context/ErrorContext';
import { getCurrentUsername, getPin, setToken } from '../utils/authStorage';

const PIN_LEN = 4;

export default function LoginPinScreen({ route, navigation }) {
  const tw = useTailwind();
  const { showError } = useError();
  const [pin, setPin] = useState('');
  const [username, setUsername] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      const u = route?.params?.username || (await getCurrentUsername());
      if (!u) return navigation.replace('ChooseTag');
      setUsername(u);
      const saved = await getPin(u);
      if (!saved) return navigation.replace('SetPin', { username: u }); // pas de PIN → créer
      setReady(true);
    })();
  }, [route, navigation]);

  const onKey = (k) => { if (pin.length < PIN_LEN) setPin(pin + String(k)); };
  const onBackspace = () => setPin((p) => p.slice(0, -1));

  useEffect(() => {
    (async () => {
      if (pin.length !== PIN_LEN || !username) return;
      const saved = await getPin(username);
      if (saved === pin) {
        await setToken(username, '1');
        navigation.replace('Home');
      } else {
        setPin('');
        showError('Wrong PIN', { position:'top' });
      }
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