import React, { useEffect, useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import NfcManager, { NfcTech } from 'react-native-nfc-manager'
import * as utf8 from 'utf8'

export default function SendHceScreen() {
  const [status, setStatus] = useState('⏳ Initialisation...')

  useEffect(() => {
    initNfc()
    return () => NfcManager.stop()
  }, [])

  const initNfc = async () => {
    try {
      await NfcManager.start()
      setStatus('📶 NFC prêt — approche un téléphone en mode réception')
    } catch (e) {
      console.log('❌ Erreur init NFC:', e)
      setStatus('❌ NFC non disponible')
    }
  }

  const toBytes = (text) => Array.from(utf8.encode(text)).map(c => c.charCodeAt(0))

  const sendData = async () => {
    try {
      await NfcManager.requestTechnology(NfcTech.NfcA)
      setStatus('📤 Envoi en cours...')
      console.log('📤 Envoi SELECT APDU...')

      const AID = 'F222222222'
      const SELECT_APDU = [
        0x00, 0xA4, 0x04, 0x00, AID.length / 2,
        ...AID.match(/.{1,2}/g).map(x => parseInt(x, 16))
      ]

      await NfcManager.transceive(SELECT_APDU)
      console.log('📤 Envoi message...')
      const msgBytes = toBytes('HELLO_FROM_SENDER')
      const response = await NfcManager.transceive(msgBytes)

      console.log('✅ Réponse HCE:', response)
      setStatus('✅ Données envoyées avec succès')
    } catch (err) {
      console.log('❌ Erreur NFC:', err)
      setStatus('❌ Échec de l’envoi')
    } finally {
      NfcManager.cancelTechnologyRequest()
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sender HCE</Text>
      <Text style={styles.status}>{status}</Text>
      <TouchableOpacity onPress={sendData} style={styles.btn}>
        <Text style={styles.btnText}>📲 Envoyer</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 20 },
  status: { fontSize: 16, color: '#333', marginBottom: 30 },
  btn: { backgroundColor: '#007bff', paddingVertical: 12, paddingHorizontal: 30, borderRadius: 10 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
})