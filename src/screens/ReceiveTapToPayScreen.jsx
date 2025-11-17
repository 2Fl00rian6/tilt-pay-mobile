import React, { useEffect, useState } from 'react'
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
import { BleManager } from 'react-native-ble-plx'

const manager = new BleManager()
const SERVICE_UUID = '4fafc201-1fb5-459e-8fcc-c5c9c331914b'

export default function ReceiveTapToPayScreen({ navigation }) {
  const [scanning, setScanning] = useState(false)
  const [foundMsg, setFoundMsg] = useState(null)

  const requestPermissions = async () => {
    if (Platform.OS !== 'android') return true
    try {
      const granted = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
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

  const startScan = async () => {
    const ok = await requestPermissions()
    if (!ok) return

    setScanning(true)
    setFoundMsg(null)
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)

    manager.startDeviceScan(null, null, (error, device) => {
      if (error) {
        console.log('Erreur scan:', error)
        setScanning(false)
        return
      }

      const data = device?.serviceData
      if (data && data[SERVICE_UUID]) {
        const raw = data[SERVICE_UUID]
        const msg = new TextDecoder('utf-8').decode(raw)
        console.log('💰 Message reçu:', msg)
        setFoundMsg(msg)
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
        stopScan()
      }
    })

    setTimeout(() => stopScan(), 20000)
  }

  const stopScan = () => {
    manager.stopDeviceScan()
    setScanning(false)
  }

  const handleBack = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    navigation.goBack()
  }

  return (
    <SafeAreaView style={styles.safe}>
      <HeaderBar title="Receive Payment" onBack={handleBack} />
      <View style={styles.container}>
        {foundMsg ? (
          <>
            <Text style={styles.success}>💰 Paiement reçu !</Text>
            <Text style={styles.msg}>{foundMsg}</Text>
          </>
        ) : (
          <>
            <Text style={styles.title}>📥 Récepteur BLE</Text>
            <Text style={styles.status}>
              {scanning ? '🔍 Recherche en cours...' : 'Prêt à scanner un paiement'}
            </Text>
            <TouchableOpacity
              onPress={scanning ? stopScan : startScan}
              style={[styles.btn, scanning && styles.stop]}
              activeOpacity={0.85}
            >
              <Text style={styles.btnText}>
                {scanning ? '⏹ Stopper' : '📡 Scanner les paiements'}
              </Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 16 },
  status: { fontSize: 15, color: '#333', marginBottom: 30, textAlign: 'center' },
  success: { fontSize: 22, fontWeight: '700', color: '#10B981', marginBottom: 16 },
  msg: { fontSize: 16, color: '#111', marginBottom: 20, textAlign: 'center' },
  btn: { backgroundColor: '#111', paddingVertical: 16, paddingHorizontal: 40, borderRadius: 14 },
  stop: { backgroundColor: '#EF4444' },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
})