import React, { useEffect, useRef } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import { getCurrentUsername, getToken } from '../utils/authStorage';

export default function LoginSplashScreen({ navigation }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(12)).current;
  const timeoutRef = useRef(null);

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: 420,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
    Animated.timing(translateY, {
      toValue: 0,
      duration: 420,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();

    let mounted = true;
    (async () => {
      try {
        const u = await getCurrentUsername();
        const t = u ? await getToken(u) : null;
        const target = t ? 'Home' : 'EnterPhone';
        if (!mounted) return;
        timeoutRef.current = setTimeout(() => {
          navigation.reset({ index: 0, routes: [{ name: target }] });
        }, 700); // bref délai pour voir l’écran
      } catch {
        if (!mounted) return;
        timeoutRef.current = setTimeout(() => {
          navigation.reset({ index: 0, routes: [{ name: 'EnterPhone' }] });
        }, 700);
      }
    })();

    return () => {
      mounted = false;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [navigation, opacity, translateY]);

  return (
    <SafeAreaView style={styles.safe} edges={['top','bottom']}>
      <View style={styles.container}>
        <Animated.Text style={[styles.brand, { opacity, transform: [{ translateY }] }]}>
          Tilt Pay
        </Animated.Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  brand: { fontSize: 40, fontWeight: '800', color: '#111114', letterSpacing: 0.2 },
});