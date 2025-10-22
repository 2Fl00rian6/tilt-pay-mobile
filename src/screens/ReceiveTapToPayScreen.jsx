// src/screens/ReceiveTapToPayScreen.jsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import HeaderBar from '../components/HeaderBar';
import { useP2P } from '../p2p/useP2P';
import { useError } from '../context/ErrorContext';
import { http } from '../api/client';

export default function ReceiveTapToPayScreen({ navigation }) {
  const { showError } = useError();
  const { ready, connected, onMessage, sendJson } = useP2P({ displayName: 'Tilt Receiver' });
  const [incoming, setIncoming] = useState(null); // {token, amount, currency, expiresAt}
  const [claiming, setClaiming] = useState(false);
  const [result, setResult] = useState(null);     // claim response

  useEffect(() => {
    onMessage(async ({ message }) => {
      try {
        const data = JSON.parse(message);
        if (data?.type === 'tiltpay:p2p-intent' && data?.token) {
          setIncoming({ token: data.token, amount: data.amount, currency: data.currency, expiresAt: data.expiresAt });
          // envoyer un ack facultatif
          try { await sendJson({ type: 'tiltpay:p2p-ack' }); } catch {}
        }
      } catch {}
    });
  }, [onMessage, sendJson]);

  const claim = async () => {
    if (!incoming?.token) return;
    try {
      setClaiming(true);
      const resp = await http.post('/p2p/claim', { token: incoming.token });
      setResult(resp);
    } catch (e) {
      showError(e?.text || e?.message || 'Claim failed', { position:'top' });
    } finally {
      setClaiming(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <HeaderBar title="Tap to receive" onBack={() => navigation.goBack()} />
      <View style={styles.container}>
        {!incoming && (
          <>
            <Text style={styles.tip}>{ready ? 'Bring phones together…' : 'Initializing…'}</Text>
            {!ready && <ActivityIndicator style={{ marginTop:8 }} />}
          </>
        )}

        {incoming && !result && (
          <>
            <Text style={styles.title}>Incoming</Text>
            <Text style={styles.amount}>{incoming.amount?.toFixed(2)} {incoming.currency}</Text>
            <TouchableOpacity style={styles.cta} onPress={claim} disabled={claiming}>
              {claiming ? <ActivityIndicator color="#fff" /> : <Text style={styles.ctaText}>Accept</Text>}
            </TouchableOpacity>
          </>
        )}

        {result && (
          <>
            <Text style={styles.title}>Received ✅</Text>
            <Text style={styles.amount}>{result.amount?.toFixed(2)} {result.currency}</Text>
            <Text style={styles.subtle}>Tx: {result.tx_id}</Text>
            <TouchableOpacity style={[styles.cta, { marginTop:16, backgroundColor:'#111' }]} onPress={() => navigation.replace('Home')}>
              <Text style={styles.ctaText}>Done</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex:1, backgroundColor:'#fff' },
  container: { flex:1, alignItems:'center', justifyContent:'center', padding:16 },
  tip: { color:'#6B7280' },
  title: { fontSize:18, fontWeight:'700', color:'#111', marginBottom:8 },
  amount: { fontSize:32, fontWeight:'800', color:'#111' },
  subtle: { color:'#9CA3AF', marginTop:6 },
  cta: { marginTop:16, height:52, paddingHorizontal:28, borderRadius:14, backgroundColor:'#16a34a', alignItems:'center', justifyContent:'center' },
  ctaText: { color:'#fff', fontWeight:'700' },
});