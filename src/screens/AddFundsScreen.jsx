import React, { useEffect, useRef } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
} from 'react-native';
import HeaderBar from '../components/HeaderBar';
import * as Haptics from 'expo-haptics';

/* ---------- Icônes SVG ---------- */
import IconCard from '../assets/icon-credit-cart.svg';
import IconBank from '../assets/icon-bank.svg';
import IconCrypto from '../assets/icon-wallet.svg';

export default function AddFundsScreen({ navigation }) {
  /* ---------- Animations d'entrée ---------- */
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(30)).current;
  const item1 = useRef(new Animated.Value(0)).current;
  const item2 = useRef(new Animated.Value(0)).current;
  const item3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 450,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        damping: 14,
        stiffness: 120,
      }),
      Animated.stagger(120, [
        Animated.timing(item1, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(item2, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(item3, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  const animateTouch = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  /* ---------- Navigation ---------- */
  const goBack = async () => {
    await animateTouch();
    navigation.goBack();
  };

  const goCreditCard = () => {
    animateTouch();
    navigation.navigate('AddFundsCard');
  };

  const goBank = () => {
    animateTouch();
    navigation.navigate('AddFundsBank');
  };

  const goCrypto = () => {
    animateTouch();
    navigation.navigate('AddFundsCrypto');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* Retour haptique ajouté ici */}
      <HeaderBar title="Add Funds" onBack={goBack} />

      <Animated.View
        style={[
          styles.container,
          { opacity: fadeAnim, transform: [{ translateY }] },
        ]}
      >
        <Text style={styles.title}>Choose a funding method</Text>

        {/* Credit Card */}
        <Animated.View
          style={{
            opacity: item1,
            transform: [
              {
                translateY: item1.interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0],
                }),
              },
            ],
          }}
        >
          <TouchableOpacity style={styles.row} onPress={goCreditCard} activeOpacity={0.85}>
            <IconCard width={24} height={24} />
            <Text style={styles.rowText}>Credit Card</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Bank Transfer */}
        <Animated.View
          style={{
            opacity: item2,
            transform: [
              {
                translateY: item2.interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0],
                }),
              },
            ],
          }}
        >
          <TouchableOpacity style={styles.row} onPress={goBank} activeOpacity={0.85}>
            <IconBank width={24} height={24} />
            <Text style={styles.rowText}>Bank Transfer</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Crypto */}
        <Animated.View
          style={{
            opacity: item3,
            transform: [
              {
                translateY: item3.interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0],
                }),
              },
            ],
          }}
        >
          <TouchableOpacity style={styles.row} onPress={goCrypto} activeOpacity={0.85}>
            <IconCrypto width={24} height={24} />
            <Text style={styles.rowText}>Crypto</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </SafeAreaView>
  );
}

/* ---------- Styles ---------- */
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1, paddingTop: 16 },
  title: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: 'transparent',
    borderRadius: 14,
    marginHorizontal: 16,
    marginBottom: 14,
  },
  rowText: { fontSize: 16, color: '#48484A', fontWeight: '500' },
});