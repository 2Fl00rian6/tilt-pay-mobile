import React, { useMemo, useState, useRef, useEffect } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  Animated,
  Easing,
} from 'react-native'
import HeaderBar from '../components/HeaderBar'
import { Svg, Path } from 'react-native-svg'
import * as Haptics from 'expo-haptics'

const IconBackspace = ({ size = 22, color = '#111' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M3 12l5.2-6H20a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H8.2L3 12z"
      stroke={color}
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
    <Path
      d="M14.5 10l-3 3m0-3l3 3"
      stroke={color}
      strokeWidth="1.8"
      strokeLinecap="round"
    />
  </Svg>
)

function Key({ label, onPress }) {
  const scale = useRef(new Animated.Value(1)).current

  const pressIn = () =>
    Animated.spring(scale, {
      toValue: 0.9,
      useNativeDriver: true,
      speed: 40,
      bounciness: 5,
    }).start()

  const pressOut = () =>
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 30,
      bounciness: 8,
    }).start()

  const handlePress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    onPress()
  }

  return (
    <View style={styles.keyWrap}>
      <Pressable
        onPressIn={pressIn}
        onPressOut={pressOut}
        onPress={handlePress}
        style={({ pressed }) => [styles.key, pressed && styles.keyPressed]}
      >
        <Animated.View style={{ transform: [{ scale }] }}>
          {typeof label === 'string' ? (
            <Text style={styles.keyText}>{label}</Text>
          ) : (
            label
          )}
        </Animated.View>
      </Pressable>
    </View>
  )
}

export default function SendEnterAmountScreen({ route, navigation }) {
  const currency = route?.params?.currency ?? 'USD'
  const currencySymbol = useMemo(() => {
    if (currency === 'EUR') return '€'
    if (currency === 'GBP') return '£'
    return '$'
  }, [currency])

  const [val, setVal] = useState('0')

  const fadeAnim = useRef(new Animated.Value(0)).current
  const translateY = useRef(new Animated.Value(30)).current

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
    ]).start()
  }, [])

  const animValue = useRef(new Animated.Value(1)).current
  const animateValue = () => {
    animValue.setValue(1.05)
    Animated.timing(animValue, {
      toValue: 1,
      duration: 180,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start()
  }

  const addChar = (c) => {
    setVal((prev) => {
      let v = prev
      if (c === 'back') {
        if (v.length <= 1) return '0'
        v = v.slice(0, -1)
        if (v === '0.' || v === '-') v = '0'
        if (v.endsWith('.')) v = v.slice(0, -1)
        animateValue()
        return v || '0'
      }
      if (c === '.') {
        if (v.includes('.')) return v
        animateValue()
        return v + '.'
      }
      if (v === '0' && c !== '0' && !v.includes('.')) {
        animateValue()
        return c
      }
      const afterDot = v.includes('.') ? v.split('.')[1] : ''
      if (v.includes('.') && afterDot.length >= 2) return v
      animateValue()
      return v + c
    })
  }

  const amountNumber = Number(val) || 0

  const handleBack = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    navigation.goBack()
  }

  const handleContinue = async () => {
    if (amountNumber <= 0) return
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)

    const tag = route?.params?.tag

    if (tag) {
      navigation.navigate('ConfirmTagTransfer', { tag, amount: amountNumber, currency })
    } else {
      navigation.navigate('SendTapToPay', { amount: amountNumber, currency })
    }
  }
  const rows = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['.', '0', 'back'],
  ]

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <HeaderBar title="Enter an amount" onBack={handleBack} />

      <Animated.View
        style={[
          styles.container,
          {
            opacity: fadeAnim,
            transform: [{ translateY }],
          },
        ]}
      >
        <View style={styles.amountWrap}>
          <Text style={styles.amountCurrency}>{currencySymbol}</Text>
          <Animated.Text
            style={[
              styles.amountText,
              {
                transform: [{ scale: animValue }],
                opacity: animValue.interpolate({
                  inputRange: [0.95, 1.05],
                  outputRange: [0.8, 1],
                }),
              },
            ]}
          >
            {val}
          </Animated.Text>
        </View>

        <View style={styles.grid}>
          {rows.map((r, i) => (
            <View key={i} style={styles.row}>
              {r.map((c, j) => (
                <Key
                  key={`${i}-${j}`}
                  label={c === 'back' ? <IconBackspace /> : c}
                  onPress={() => addChar(c)}
                />
              ))}
            </View>
          ))}
        </View>

        <Animated.View
          style={{
            transform: [
              {
                translateY: translateY.interpolate({
                  inputRange: [0, 30],
                  outputRange: [0, 15],
                }),
              },
            ],
            opacity: fadeAnim,
          }}
        >
          <TouchableOpacity
            style={[styles.nextBtn, amountNumber <= 0 && styles.nextDisabled]}
            activeOpacity={0.95}
            onPress={handleContinue}
            disabled={amountNumber <= 0}
          >
            <Text
              style={[
                styles.nextText,
                amountNumber <= 0 && styles.nextTextDisabled,
              ]}
            >
              Continue
            </Text>
            <Text
              style={[
                styles.nextArrow,
                amountNumber <= 0 && styles.nextTextDisabled,
              ]}
            >
              ›
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1, backgroundColor: '#fff', justifyContent: 'space-between' },

  amountWrap: {
    marginTop: 80,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  amountCurrency: { fontSize: 56, fontWeight: '700', color: '#CBD5E1', marginRight: 8 },
  amountText: { fontSize: 56, fontWeight: '700', color: '#CBD5E1' },

  grid: { paddingHorizontal: 50, marginTop: 40 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 18 },

  keyWrap: { width: 80, height: 80 },
  key: {
    flex: 1,
    backgroundColor: 'transparent',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  keyPressed: { backgroundColor: '#E5E7EB' },
  keyText: { fontSize: 28, fontWeight: '600', color: '#111827' },

  nextBtn: {
    alignSelf: 'center',
    marginBottom: 36,
    minWidth: 180,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#111111',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    gap: 8,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  nextDisabled: { backgroundColor: '#E5E7EB' },
  nextText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  nextTextDisabled: { color: '#9CA3AF' },
  nextArrow: { color: '#fff', fontSize: 20, marginLeft: 6, marginTop: -2 },
})