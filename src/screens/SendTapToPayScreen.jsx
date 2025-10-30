import React, { useEffect, useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, PermissionsAndroid, Platform, NativeModules } from 'react-native'

const { BlePeripheral } = NativeModules

export default function SendBLE() {
  const [status, setStatus] = useState('⏳ Initialisation...')
  const [isAdvertising, setIsAdvertising] = useState(false)

  useEffect(() => {
    requestPermissions()
    return () => {
      if (isAdvertising) {
        BlePeripheral.stopAdvertising()
      }
    }
  }, [])

  const requestPermissions = async () => {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_ADVERTISE,
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      ])
      console.log('Permissions BLE:', granted)
    }
    setStatus('📶 Prêt - Appuie sur Diffuser')
  }

  const startAdvertising = async () => {
    try {
      setStatus('📡 Démarrage de la diffusion...')
      
      const message = 'HELLO_FROM_SENDER'
      await BlePeripheral.startAdvertising(message)
      
      setIsAdvertising(true)
      setStatus('📡 TiltPay diffuse maintenant!\nVisible par les autres appareils')
      console.log('✅ BLE Advertising actif')
      
    } catch (err) {
      console.log('❌ Erreur:', err)
      setStatus(`❌ Erreur: ${err.message}`)
      setIsAdvertising(false)
    }
  }

  const stopAdvertising = async () => {
    try {
      await BlePeripheral.stopAdvertising()
      setIsAdvertising(false)
      setStatus('📶 Diffusion arrêtée')
      console.log('✅ Advertising arrêté')
    } catch (err) {
      console.log('❌ Erreur stop:', err)
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>📤 Sender BLE</Text>
      <Text style={styles.status}>{status}</Text>
      
      {isAdvertising && (
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            ℹ️ Ton appareil est maintenant visible par les autres téléphones TiltPay à proximité
          </Text>
        </View>
      )}
      
      <TouchableOpacity 
        onPress={isAdvertising ? stopAdvertising : startAdvertising}
        style={[styles.btn, isAdvertising && styles.btnActive]}
      >
        <Text style={styles.btnText}>
          {isAdvertising ? '⏹ Arrêter la diffusion' : '📡 Diffuser TiltPay'}
        </Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', padding: 20 },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 20 },
  status: { fontSize: 16, color: '#333', marginBottom: 30, textAlign: 'center', lineHeight: 24 },
  infoBox: { 
    backgroundColor: '#cfe2ff', 
    padding: 15, 
    borderRadius: 10, 
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#9ec5fe'
  },
  infoText: { fontSize: 14, color: '#084298', textAlign: 'center' },
  btn: { backgroundColor: '#007bff', paddingVertical: 14, paddingHorizontal: 40, borderRadius: 10 },
  btnActive: { backgroundColor: '#dc3545' },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
})