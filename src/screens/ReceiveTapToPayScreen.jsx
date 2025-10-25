// src/screens/ReceiveTapToPayScreen.jsx
import React, { useEffect, useState, useRef } from 'react'
import { View, Text, StyleSheet, ActivityIndicator, Animated, Easing } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import HeaderBar from '../components/HeaderBar'
import { useError } from '../context/ErrorContext'
import { useP2P } from '../p2p/useP2P'
import { approveTapToPayRequest } from '../api/tapToPay'
import { getCurrentPhone, getToken } from '../utils/authStorage'
import * as Haptics from 'expo-haptics'

export default function ReceiveTapToPayScreen({ navigation }) {
  const { showError } = useError()
  const { ready, connected, onMessage, sendJson } = useP2P({
    displayName: 'Tilt Receiver',
    autoAdvertise: true,
  })

  const [incoming, setIncoming] = useState(null)
  const [approving, setApproving] = useState(false)
  const [approved, setApproved] = useState(null)

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

  const vibrate = async (type = 'light') => {
    if (type === 'light') await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    else if (type === 'medium') await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    else if (type === 'success') await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    else if (type === 'error') await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
  }

  const goBack = async () => {
    await vibrate('light')
    navigation.goBack()
  }

  // 1) Réception du token via P2P
  useEffect(() => {
    onMessage(async ({ message }) => {
      try {
        const data = JSON.parse(message)
        if (data?.type !== 'tiltpay:t2p') return
        await vibrate('medium')
        setIncoming({
          requestId: data.requestId,
          secret: data.secret,
          amount: data.amount,
          currency: data.currency,
        })
      } catch {}
    })
  }, [onMessage])

  // 2) Si on a reçu une demande → approve côté serveur
  useEffect(() => {
    let mounted = true
    ;(async () => {
      if (!incoming) return
      try {
        setApproving(true)
        const phone = await getCurrentPhone()
        const token = phone ? await getToken(phone) : null
        await vibrate('light')

        const res = await approveTapToPayRequest(
          { requestId: incoming.requestId, secret: incoming.secret },
          { token }
        )
        if (!mounted) return
        setApproved(res)
        await vibrate('success')

        // envoie un ACK au sender
        if (connected) {
          await sendJson({ type: 'tiltpay:p2p-ack', requestId: incoming.requestId })
        }
      } catch (e) {
        await vibrate('error')
        showError(e?.text || e?.message || 'Approval failed', { position: 'top' })
      } finally {
        if (mounted) setApproving(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [incoming, connected, sendJson, showError])

  return (
    <SafeAreaView style={styles.safe}>
      <HeaderBar title="Tap to receive" onBack={goBack} />
      <Animated.View
        style={[
          styles.container,
          { opacity: fadeAnim, transform: [{ translateY }] },
        ]}
      >
        {!incoming && (
          <>
            <Text style={styles.title}>Waiting for sender…</Text>
            {!ready && <Text style={styles.subtle}>Starting peer discovery…</Text>}
          </>
        )}

        {!!incoming && !approved && (
          <>
            <Text style={styles.title}>Incoming</Text>
            <Text style={styles.amount}>
              {incoming.amount?.toFixed(2)} {incoming.currency}
            </Text>
            {approving ? (
              <View style={styles.center}>
                <ActivityIndicator />
                <Text style={styles.subtle}>Approving…</Text>
              </View>
            ) : null}
          </>
        )}

        {!!approved && (
          <>
            <Text style={stylessuccess.title}>Received ✓</Text>
            <Text style={stylessuccess.amount}>
              {approved.amount?.toFixed(2)} {approved.currency}
            </Text>
          </>
        )}
      </Animated.View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
  title: { fontSize: 20, fontWeight: '700', color: '#111' },
  amount: { marginTop: 8, fontSize: 32, fontWeight: '800', color: '#111' },
  subtle: { color: '#9CA3AF', marginTop: 6 },
  center: { alignItems: 'center', marginTop: 12 },
})

const stylessuccess = StyleSheet.create({
  title: { fontSize: 20, fontWeight: '800', color: '#0a7' },
  amount: { marginTop: 8, fontSize: 32, fontWeight: '900', color: '#0a7' },
})