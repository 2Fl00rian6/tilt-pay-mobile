// src/screens/SendTapToPayScreen.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import HeaderBar from '../components/HeaderBar';
import { useP2P } from '../p2p/useP2P';
import { useError } from '../context/ErrorContext';
import { http } from '../api/client'; // ton client déjà configuré (baseURL + auth)

export default function SendTapToPayScreen({ route, navigation }) {
  const { showError } = useError();
  const amount = route?.params?.amount ?? 0;
  const currency = route?.params?.currency ?? 'EUR';

  const { ready, peers, connected, connect, sendJson, onMessage } = useP2P({ displayName: 'Tilt Sender' });

  const [issuing, setIssuing] = useState(false);
  const [intent, setIntent] = useState(null); // {token, amount, currency, expiresAt ...}

  // 1) Crée l’intent côté serveur (token à transmettre)
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setIssuing(true);
        const resp = await http.post('/p2p/intent', { amount, currency, ttl_sec: 90 });
        if (!mounted) return;
        setIntent(resp);
      } catch (e) {
        showError(e?.text || e?.message || 'Failed to prepare transfer', { position: 'top' });
        navigation.goBack();
      } finally {
        setIssuing(false);
      }
    })();
    return () => { mounted = false; };
  }, [amount, currency, navigation, showError]);

  // 2) Quand on est connecté et qu’on a un intent, on l’envoie
  useEffect(() => {
    (async () => {
      if (!connected || !intent) return;
      const ok = await sendJson({
        type: 'tiltpay:p2p-intent',
        token: intent.token,
        amount: intent.amount,
        currency: intent.currency,
        expiresAt: intent.expiresAt,
      });
      if (!ok) {
        showError('Could not send token', { position: 'top' });
      } else {
        // Option UX: afficher “Sent ✓” puis revenir/fermer
      }
    })();
  }, [connected, intent, sendJson, showError]);

  // (facultatif) Réactions aux messages du receiver (ack)
  useEffect(() => {
    onMessage(({ message }) => {
      try {
        const data = JSON.parse(message);
        if (data?.type === 'tiltpay:p2p-ack') {
          // ack reçu → on peut afficher “Claimed ✓”
        }
      } catch {}
    });
  }, [onMessage]);

  const renderPeer = ({ item }) => (
    <TouchableOpacity style={styles.card} onPress={() => connect(item.id)}>
      <Text style={styles.peerName}>{item.name || 'Nearby device'}</Text>
      <Text style={styles.peerSub}>{item.state}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <HeaderBar title="Tap to send" onBack={() => navigation.goBack()} />
      <View style={styles.container}>
        <Text style={styles.amount}>{amount.toFixed(2)} {currency}</Text>
        <Text style={styles.tip}>Bring phones together to connect</Text>

        {issuing && (
          <View style={styles.center}><ActivityIndicator /><Text style={styles.subtle}>Preparing…</Text></View>
        )}

        {ready && !issuing && (
          <>
            <Text style={styles.section}>Nearby</Text>
            <FlatList
              data={peers}
              keyExtractor={(p) => p.id}
              renderItem={renderPeer}
              contentContainerStyle={{ paddingHorizontal: 16 }}
              ListEmptyComponent={<Text style={styles.subtle}>No device yet</Text>}
            />
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex:1, backgroundColor:'#fff' },
  container: { flex:1 },
  amount: { fontSize:32, fontWeight:'800', textAlign:'center', marginTop:16, color:'#111' },
  tip: { textAlign:'center', color:'#6B7280', marginTop:4 },
  section: { marginTop:16, marginBottom:8, paddingHorizontal:16, color:'#6B7280', fontWeight:'600' },
  card: { padding:16, borderRadius:12, backgroundColor:'#F3F4F6', marginBottom:12 },
  peerName: { fontWeight:'700', color:'#111' },
  peerSub: { color:'#6B7280', marginTop:2 },
  center: { alignItems:'center', marginTop:12 },
  subtle: { color:'#9CA3AF', marginTop:8 },
});