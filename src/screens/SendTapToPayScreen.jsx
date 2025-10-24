import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import HeaderBar from '../components/HeaderBar';
import { useP2P } from '../p2p/useP2P';
import { useError } from '../context/ErrorContext';

export default function SendTapToPayScreen({ route, navigation }) {
  const amount = route?.params?.amount ?? 0;
  const currency = route?.params?.currency ?? 'EUR';
  const { showError } = useError();

  const { ready, peers, connected, connect, sendJson, onMessage } = useP2P({ displayName: 'Tilt Sender' });
  const [sending, setSending] = useState(false);
  const [lastMsg, setLastMsg] = useState(null);

  useEffect(() => {
    return onMessage(({ message }) => {
      setLastMsg(String(message));
    });
  }, [onMessage]);

  const sendDemo = useCallback(async () => {
    try {
      setSending(true);
      const ok = await sendJson({
        type: 'tiltpay:demo',
        note: 'hello from sender',
        amount,
        currency,
        ts: Date.now(),
      });
      if (!ok) showError('Send failed');
    } finally {
      setSending(false);
    }
  }, [sendJson, amount, currency, showError]);

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
        <Text style={styles.tip}>Bring both phones together • Bluetooth & Wi-Fi ON</Text>

        {!ready && (
          <View style={styles.center}>
            <ActivityIndicator />
            <Text style={styles.subtle}>Starting nearby services…</Text>
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

            <View style={styles.bottom}>
              <TouchableOpacity
                disabled={!connected || sending}
                onPress={sendDemo}
                style={[styles.cta, (!connected || sending) && styles.ctaDisabled]}
              >
                <Text style={styles.ctaText}>{sending ? 'Sending…' : 'Send test payload'}</Text>
              </TouchableOpacity>
              {!!lastMsg && <Text style={styles.small}>Last message: {lastMsg}</Text>}
            </View>
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
  card: { padding:16, borderRadius:12, backgroundColor:'#F3F4F6', marginHorizontal:16, marginBottom:12 },
  peerName: { fontWeight:'700', color:'#111' },
  peerSub: { color:'#6B7280', marginTop:2 },
  center: { alignItems:'center', marginTop:12 },
  subtle: { color:'#9CA3AF', marginTop:8 },
  bottom: { padding:16, gap:8 },
  cta: { backgroundColor:'#111', height:52, borderRadius:14, alignItems:'center', justifyContent:'center' },
  ctaDisabled: { backgroundColor:'#E5E7EB' },
  ctaText: { color:'#fff', fontWeight:'700' },
  small: { color:'#6B7280', textAlign:'center' },
});
