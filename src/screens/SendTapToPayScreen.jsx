import React, { useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  PermissionsAndroid,
  Platform,
  Alert,
  Linking,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import HeaderBar from '../components/HeaderBar'
import * as Haptics from 'expo-haptics'
import { NativeModules } from 'react-native'
import { BleManager } from 'react-native-ble-plx'

const { BleAdvertiser } = NativeModules
const manager = new BleManager()

export default function SendTapToPayScreen({ navigation }) {
  const [isAdvertising, setIsAdvertising] = useState(false)
  const [status, setStatus] = useState('⏳ Prêt à diffuser')
  const message = 'TILTPAY:15.90EUR'

  const requestPermissions = async () => {
    if (Platform.OS !== 'android') return true
    try {
      const granted = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_ADVERTISE,
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      ])

      const allGranted = Object.values(granted).every(v => v === 'granted')
      if (!allGranted) {
        Alert.alert(
          'Permissions manquantes',
          'Active le Bluetooth et la localisation dans les paramètres',
          [{ text: 'Ouvrir paramètres', onPress: () => Linking.openSettings() }, { text: 'OK' }]
        )
        return false
      }

      const state = await manager.state()
      if (state !== 'PoweredOn') {
        Alert.alert('Bluetooth désactivé', 'Active ton Bluetooth puis réessaie.')
        return false
      }

      return true
    } catch (e) {
      console.log('Erreur permissions:', e)
      return false
    }
  }

  const startAdvertising = async () => {
    const ok = await requestPermissions()
    if (!ok) return

    try {
      setStatus('📡 Démarrage diffusion...')
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
      await BleAdvertiser.startAdvertising(message)
      setIsAdvertising(true)
      setStatus('✅ Diffusion BLE active')
      console.log('✅ Advertising started')
    } catch (err) {
      console.log('Erreur advertising:', err)
      setStatus('❌ ' + (err.message || 'Erreur inconnue'))
      setIsAdvertising(false)
    }
  }

  const stopAdvertising = async () => {
    try {
      await BleAdvertiser.stopAdvertising()
      setIsAdvertising(false)
      setStatus('📴 Diffusion arrêtée')
      console.log('🛑 Advertising stopped')
    } catch (err) {
      console.log('Erreur stop:', err)
    }
  }

  const handleBack = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    navigation.goBack()
  }

  return (
    <SafeAreaView style={styles.safe}>
      <HeaderBar title="Send Payment" onBack={handleBack} />
      <View style={styles.container}>
        <Text style={styles.title}>📤 Émetteur BLE</Text>
        <Text style={styles.status}>{status}</Text>

        <TouchableOpacity
          onPress={isAdvertising ? stopAdvertising : startAdvertising}
          style={[styles.btn, isAdvertising && styles.stop]}
          activeOpacity={0.85}
        >
          <Text style={styles.btnText}>
            {isAdvertising ? '⏹ Arrêter' : '📡 Diffuser paiement'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 16 },
  status: { fontSize: 15, color: '#333', marginBottom: 30, textAlign: 'center' },
  btn: { backgroundColor: '#111', paddingVertical: 16, paddingHorizontal: 40, borderRadius: 14 },
  stop: { backgroundColor: '#EF4444' },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
})