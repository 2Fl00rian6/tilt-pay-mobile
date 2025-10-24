// src/screens/SendTapToPayScreen.jsx
import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import HeaderBar from '../components/HeaderBar';
import { useP2P } from '../p2p/useP2P';
import { useError } from '../context/ErrorContext';
// import { createTapToPayRequest, createTapToPayAuthorization } from '../api/tapToPay'; // <- Activez ça quand l'API sera prête
// import { formatApiError } from '../api/http';

function makeDemoIntent({ amount, currency }) {
  // Token de démo pour “beamer” quelque chose de simple au device receveur
  const token = `DEMO_${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
  const expiresAt = new Date(Date.now() + 90_000).toISOString();
  return {
    requestId: 0, // pas d’API, donc 0
    amount,
    currency,
    secret: token, // on nomme “secret” pour rester compatible avec l’API réelle
    expiresAt,
    isDemo: true,
  };
}

export default function SendTapToPayScreen({ route, navigation }) {
  const { showError } = useError();
  const amount = route?.params?.amount ?? 0;
  const currency = route?.params?.currency ?? 'EUR';

  // Votre hook P2P (Multipeer/Bluetooth/Wi-Fi)
  const { ready, peers, connected, connect, sendJson, sendString, onMessage } = useP2P({
    displayName: 'Tilt Sender',
  });

  const [issuing, setIssuing] = useState(false);
  const [intent, setIntent] = useState(null); // {requestId, amount, currency, secret, expiresAt}

  // 1) Prépare un “intent” local (sans API). Quand l’API sera prête, remplacez par la création serveur.
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setIssuing(true);

        // // ===== API (optionnel) =====
        // const req = await createTapToPayRequest({ amount, currency }); // -> { id, amount, currency }
        // const { secret } = await createTapToPayAuthorization({ requestId: req.id }); // -> { secret }
        // const intentFromApi = {
        //   requestId: req.id,
        //   amount: req.amount,
        //   currency: req.currency,
        //   secret,
        //   expiresAt: new Date(Date.now() + 90_000).toISOString(),
        // };
        // if (mounted) setIntent(intentFromApi);
        // // ===========================

        // ====== DEMO (sans API) ======
        const demo = makeDemoIntent({ amount, currency });
        if (mounted) setIntent(demo);
        // =============================
      } catch (e) {
        // showError(formatApiError(e, 'Failed to prepare transfer'), { position: 'top' });
        showError('Failed to prepare transfer', { position: 'top' });
        navigation.goBack();
      } finally {
        setIssuing(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [amount, currency, navigation, showError]);

  // 2) Dès qu’on est connecté et qu’on a un intent, on l’envoie
  useEffect(() => {
    (async () => {
      if (!connected || !intent) return;

      // Payload minimal pour le receveur (il pourra afficher le montant et “réclamer” via API plus tard)
      const payload = {
        type: 'tiltpay:p2p-intent',
        requestId: intent.requestId,
        amount: intent.amount,
        currency: intent.currency,
        secret: intent.secret,
        expiresAt: intent.expiresAt,
        demo: !!intent.isDemo,
      };

      let ok = false;
      try {
        if (typeof sendJson === 'function') {
          ok = await sendJson(payload);
        } else if (typeof sendString === 'function') {
          ok = await sendString(JSON.stringify(payload));
        } else {
          throw new Error('No send method available');
        }
      } catch (err) {
        ok = false;
      }

      if (!ok) {
        showError('Could not send token', { position: 'top' });
      } else {
        // Ici vous pouvez afficher un petit toast “Sent ✓”
        // puis éventuellement revenir automatiquement à l’écran précédent
        // setTimeout(() => navigation.goBack(), 800);
      }
    })();
  }, [connected, intent, sendJson, sendString, showError /*, navigation */]);

  // 3) (optionnel) Écoute des ACKs du receveur
  useEffect(() => {
    return onMessage?.(({ message }) => {
      try {
        const data = JSON.parse(message);
        if (data?.type === 'tiltpay:p2p-ack') {
          // ACK reçu
          // Vous pouvez afficher “Claimed ✓”
        }
      } catch {
        // messages non JSON
      }
    });
  }, [onMessage]);

  const renderPeer = ({ item }) => (
    <TouchableOpacity style={styles.card} onPress={() => connect?.(item.id)}>
      <Text style={styles.peerName}>{item.name || 'Nearby device'}</Text>
      <Text style={styles.peerSub}>{item.state || 'idle'}</Text>
    </TouchableOpacity>
  );

  const infoLine = useMemo(() => {
    if (!ready) return 'Enabling peer-to-peer…';
    if (issuing) return 'Preparing…';
    return 'Bring phones together to connect';
  }, [ready, issuing]);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <HeaderBar title="Tap to send" onBack={() => navigation.goBack()} />
      <View style={styles.container}>
        <Text style={styles.amount}>
          {Number(amount).toFixed(2)} {currency}
        </Text>
        <Text style={styles.tip}>{infoLine}</Text>

        {issuing && (
          <View style={styles.center}>
            <ActivityIndicator />
            <Text style={styles.subtle}>Preparing…</Text>
          </View>
        )}

        {!issuing && (
          <>
            <Text style={styles.section}>Nearby</Text>
            <FlatList
              data={Array.isArray(peers) ? peers : []}
              keyExtractor={(p, i) => p?.id || String(i)}
              renderItem={renderPeer}
              contentContainerStyle={{ paddingHorizontal: 16 }}
              ListEmptyComponent={
                <Text style={styles.subtle}>
                  {ready ? 'No device yet' : 'Starting…'}
                </Text>
              }
            />
          </>
        )}

        {/* Petit bandeau debug pour voir l’intent courant */}
        {intent && (
          <View style={styles.debugBox}>
            <Text style={styles.debugTitle}>Intent</Text>
            <Text style={styles.debugText}>secret: {intent.secret}</Text>
            <Text style={styles.debugText}>
              expiresAt: {new Date(intent.expiresAt).toLocaleTimeString()}
            </Text>
            {!!intent.isDemo && <Text style={styles.debugText}>mode: DEMO</Text>}
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1 },
  amount: {
    fontSize: 32,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 16,
    color: '#111',
  },
  tip: { textAlign: 'center', color: '#6B7280', marginTop: 4 },
  section: {
    marginTop: 16,
    marginBottom: 8,
    paddingHorizontal: 16,
    color: '#6B7280',
    fontWeight: '600',
  },
  card: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    marginBottom: 12,
  },
  peerName: { fontWeight: '700', color: '#111' },
  peerSub: { color: '#6B7280', marginTop: 2 },
  center: { alignItems: 'center', marginTop: 12 },
  subtle: { color: '#9CA3AF', marginTop: 8 },
  debugBox: {
    borderTopWidth: 1,
    borderColor: '#EEE',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  debugTitle: { color: '#6B7280', fontWeight: '600', marginBottom: 6 },
  debugText: { color: '#6B7280', fontSize: 12 },
});