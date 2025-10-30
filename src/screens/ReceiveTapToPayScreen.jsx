import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet, DeviceEventEmitter } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function ReceiveHceScreen() {
  const [status, setStatus] = useState('⏳ En attente de message NFC...')

  useEffect(() => {
    console.log('👂 En écoute HCE_EVENT...')
    setStatus('📶 Service HCE actif — approche un autre téléphone')

    const sub = DeviceEventEmitter.addListener('HCE_EVENT', (event) => {
      console.log('📩 Données HCE reçues:', event)
      setStatus(`📡 Token reçu : ${event?.response || 'aucune donnée'}`)
    })

    return () => {
      console.log('🧹 Nettoyage listener HCE_EVENT')
      sub.remove()
    }
  }, [])

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>Receiver HCE</Text>
        <Text style={styles.status}>{status}</Text>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 16 },
  status: { fontSize: 16, color: '#333', textAlign: 'center', paddingHorizontal: 20 },
})