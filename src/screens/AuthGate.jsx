import React, { useEffect, useRef, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { getCurrentUsername, getPin, hasToken } from '../utils/authStorage';

export default function AuthGate({ navigation }) {
  const [target, setTarget] = useState(null);
  const didNav = useRef(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const username = await getCurrentUsername(); // '' if none
        if (!username) { if (!cancelled) setTarget('EnterPhone'); return; }

        const [token, pin] = await Promise.all([hasToken(username), getPin(username)]);

        // If fully signed-in and has a PIN -> unlock screen
        if (token && pin) {
          if (!cancelled) setTarget('EnterPin');
        } else {
          if (!cancelled) setTarget('EnterPhone');
        }
      } catch (e) {
        console.warn('AuthGate error:', e);
        if (!cancelled) setTarget('EnterPhone'); // safe default
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!target || didNav.current) return;
    didNav.current = true;
    navigation.reset({ index: 0, routes: [{ name: target }] });
  }, [target, navigation]);

  return (
    <View style={{ flex:1, backgroundColor:'#fff', alignItems:'center', justifyContent:'center' }}>
      <ActivityIndicator />
    </View>
  );
}