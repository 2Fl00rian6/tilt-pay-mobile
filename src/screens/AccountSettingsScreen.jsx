import React, { useRef, useEffect, useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
} from 'react-native'
import * as Haptics from 'expo-haptics'
import HeaderBar from '../components/HeaderBar'
import { Svg, Path } from 'react-native-svg'
import { wipeAllLocalData } from '../utils/authStorage'

/* ---------- Icônes ---------- */
const IconChat = ({ size = 20, color = '#111' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8A8.5 8.5 0 0 1 8.7 3.9 8.38 8.38 0 0 1 12.5 3a8.5 8.5 0 0 1 8.5 8.5z"
      stroke={color}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
)

const IconLogout = ({ size = 20, color = '#111' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"
      stroke={color}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M16 17l5-5-5-5M21 12H9"
      stroke={color}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
)

export default function AccountSettingsScreen({ navigation }) {
  const fadeAnim = useRef(new Animated.Value(0)).current
  const [currency, setCurrency] = useState('USD')

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start()
  }, [])

  const handleBack = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    navigation.goBack()
  }

  const onLogout = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    await wipeAllLocalData()
    navigation.reset({ index: 0, routes: [{ name: 'EnterPhone' }] })
  }

  const onSupport = async () => {
    await Haptics.selectionAsync()
    navigation.navigate('Support')
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <HeaderBar title="Settings" onBack={handleBack} />
      <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
        <View style={styles.handleWrap}>
          <View style={styles.handle} />
        </View>

        <Text style={styles.title}>Settings</Text>

        {/* Currency */}
        <View style={styles.rowBetween}>
          <Text style={styles.label}>Default currency</Text>
          <TouchableOpacity
            style={styles.currencyBtn}
            onPress={async () => {
              await Haptics.selectionAsync()
              setCurrency(currency === 'USD' ? 'EUR' : 'USD')
            }}
          >
            <Text style={styles.currencyText}>{currency}</Text>
          </TouchableOpacity>
        </View>

        {/* Support */}
        <TouchableOpacity style={styles.row} onPress={onSupport} activeOpacity={0.8}>
          <IconChat size={20} color="#111" />
          <Text style={styles.rowText}>Support</Text>
        </TouchableOpacity>

        {/* Logout */}
        <TouchableOpacity style={styles.row} onPress={onLogout} activeOpacity={0.8}>
          <IconLogout size={20} color="#111" />
          <Text style={styles.rowText}>Log out</Text>
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  )
}

/* ---------- Styles ---------- */
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1, backgroundColor: '#fff', paddingTop: 8 },
  handleWrap: { alignItems: 'center', marginBottom: 8 },
  handle: { width: 36, height: 4, backgroundColor: '#D1D5DB', borderRadius: 2 },
  title: { fontSize: 22, fontWeight: '600', color: '#111827', marginBottom: 20, paddingHorizontal: 20 },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  label: { fontSize: 16, color: '#111' },
  currencyBtn: {
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  currencyText: { fontWeight: '600', color: '#111827' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingVertical: 12 },
  rowText: { fontSize: 16, color: '#111827' },
})