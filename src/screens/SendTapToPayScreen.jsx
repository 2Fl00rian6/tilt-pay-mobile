// src/screens/SendTapToPayScreen.jsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, FlatList, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import HeaderBar from '../components/HeaderBar';
import { useP2P } from '../p2p/useP2P';
import { useError } from '../context/ErrorContext';

export default function SendTapToPayScreen({ route, navigation }) {
  const { showError } = useError();

  // Montant / devise uniquement pour affichage (optionnel)
  const amountParam = route?.params?.amount;
  const amount = useMemo(() => {
    const n = Number(amountParam);
    return Number.isFinite(n) ? n : 0;
  }, [amountParam]);
  const currency = (route?.params?.currency || 'EUR').toUpperCase();

  // P2P (iOS MultipeerConnectivity via votre hook)
  const { ready, peers, connected, connect, sendJson, onMessage } = useP2P({ displayName: 'Tilt Sender' });

  const [sending, setSending] = useState(false);
  const [sentOnce, setSentOnce] = useState(false);

  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // Dès qu’on est connecté, envoyer un message simple UNE SEULE FOIS
  useEffect(() => {
    (async () => {
      if (!connected || sentOnce) return;
      try {
        setSending(true);
        const ok = await sendJson({
          type: 'tiltpay:test',
          text: `Hello from sender — amount=${amount.toFixed(2)} ${currency}`,
          ts: Date.now(),
        });
        if (!ok) {
          showError('Could not send message', { position: 'top' });
          return;
        }
        setSentOnce(true);
      } catch (e) {
        showError(e?.message || 'Send failed', { position: 'top' });
      } finally {
        if (mountedRef.current) setSending(false);
      }
    })();
  }, [connected, sentOnce, sendJson, amount, currency, showError]);

  // (facultatif) écouter un ACK du receiver
  useEffect(() => {
    return onMessage(({ message }) => {
      try {
        const data = JSON.parse(message);
        if (data?.type === 'tiltpay:ack') {
          // tu peux afficher un “Reçu ✓” ou fermer l’écran
          // navigation.goBack();
        }
      } catch {
        // ignore
      }
    });
  }, [onMessage /*, navigation */]);

  const isUnsupported = Platform.OS !== 'ios';

  const renderPeer = ({ item }) => (
    <TouchableOpacity style={styles.card} onPress={() => connect(item.id)} activeOpacity={0.85}>
      <Text style={styles.peerName}>{item.name || 'Nearby device'}</Text>
      <Text style={styles.peerSub}>{item.state}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <HeaderBar title="Tap to send" onBack={() => navigation.goBack()} />
      <View style={styles.container}>
        <Text style={styles.amount}>
          {amount.toFixed(2)} {currency}
        </Text>

        {isUnsupported ? (
          <View style={styles.center}>
            <Text style={styles.subtle}>
              Tap to send is only available on iPhone (AirDrop-style).
            </Text>
          </View>
        ) : (
          <>
            <Text style={styles.tip}>Bring phones together to connect</Text>

            {!ready && (
              <View style={styles.center}>
                <ActivityIndicator />
                <Text style={styles.subtle}>Initializing…</Text>
              </View>
            )}

            {ready && (
              <>
                <Text style={styles.section}>Nearby</Text>
                <FlatList
                  data={peers}
                  keyExtractor={(p) => String(p.id)}
                  renderItem={renderPeer}
                  contentContainerStyle={{ paddingHorizontal: 16 }}
                  ListEmptyComponent={<Text style={styles.subtle}>No device yet</Text>}
                />
                {connected && (
                  <View style={styles.center}>
                    <Text style={styles.connected}>
                      Connected — {sending ? 'sending…' : sentOnce ? 'sent ✓' : 'ready'}
                    </Text>
                  </View>
                )}
              </>
            )}
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1 },
  amount: { fontSize: 32, fontWeight: '800', textAlign: 'center', marginTop: 16, color: '#111' },
  tip: { textAlign: 'center', color: '#6B7280', marginTop: 6 },
  section: { marginTop: 16, marginBottom: 8, paddingHorizontal: 16, color: '#6B7280', fontWeight: '600' },
  card: { padding: 16, borderRadius: 12, backgroundColor: '#F3F4F6', marginBottom: 12 },
  peerName: { fontWeight: '700', color: '#111' },
  peerSub: { color: '#6B7280', marginTop: 2 },
  center: { alignItems: 'center', marginTop: 12 },
  subtle: { color: '#9CA3AF', marginTop: 8, textAlign: 'center' },
  connected: { color: '#16a34a', marginTop: 10, fontWeight: '600' },
});