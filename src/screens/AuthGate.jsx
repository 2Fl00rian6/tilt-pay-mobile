// src/screens/AuthGate.jsx
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
        const username = await getCurrentUsername();
        if (!username) { if (!cancelled) setTarget('ChooseTag'); return; }

        const [token, pin] = await Promise.all([
          hasToken(username),
          getPin(username),
        ]);

        if (!cancelled) setTarget(token && pin ? 'EnterPin' : 'ChooseTag');
      } catch (e) {
        console.warn('AuthGate error:', e);
        if (!cancelled) setTarget('ChooseTag');
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