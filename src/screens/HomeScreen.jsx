// src/screens/HomeScreen.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Svg, Path, Rect, Circle } from 'react-native-svg';
import { getCurrentUsername, getToken, wipeAllLocalData } from '../utils/authStorage';
import { getBalance } from '../api/wallet';
import { useError } from '../context/ErrorContext';

/* ---------- Icônes ---------- */
const IconUser = ({ size = 22, color = '#111' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M20 21a8 8 0 0 0-16 0" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
    <Circle cx="12" cy="7" r="4" stroke={color} strokeWidth="1.8"/>
  </Svg>
);
const IconCopy = ({ size = 16, color = '#6B7280' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="9" y="9" width="11" height="11" rx="2.5" stroke={color} strokeWidth="1.6"/>
    <Rect x="4" y="4" width="11" height="11" rx="2.5" stroke={color} strokeWidth="1.6"/>
  </Svg>
);
const IconPlus = ({ size = 12, color = '#111' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M12 5v14M5 12h14" stroke={color} strokeWidth="2" strokeLinecap="round"/>
  </Svg>
);
const IconArrowDownLeft = ({ size = 18, color = '#111' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M17 7L7 17M7 17V9M7 17h8" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);
const IconArrowUpRight = ({ size = 18, color = '#fff' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M7 17l10-10M17 7H9m8 0v8" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

/* ---------- Écran ---------- */
export default function HomeScreen({ navigation, route }) {
  const { showError } = useError();

  // tag éventuel passé par navigation après login/creation (si tu veux)
  const tagFromParams = route?.params?.tagName;

  const [phone, setPhone] = useState('');
  const [tag, setTag] = useState('');
  const [balance, setBalance] = useState(0);

  // Démo transactions (à remplacer par l’API quand tu l’auras)
  const transactions = useMemo(() => [
    { id: '1', name: 'Uber eats', date: '2025-09-07', amount: -7.12 },
    { id: '2', name: 'Sling Money', date: '2025-09-05', amount: 649.34 },
    { id: '3', name: 'Walmart', date: '2025-09-01', amount: -1467.12 },
    { id: '4', name: 'Interests 4%', date: '2025-08-29', amount: 1.42 },
  ], []);

  useEffect(() => {
    (async () => {
      try {
        const p = await getCurrentUsername();
        setPhone(p || '');
        setTag(tagFromParams || (p ? `user-${String(p).slice(-4)}` : 'user'));

        const token = await getToken(p);
        if (!token) return;

        const b = await getBalance(token);
        // L’API renvoie { address, lamports, sol, tokens: [...] }
        const sol = typeof b?.sol === 'number' ? b.sol : 0;
        setBalance(sol);
      } catch (e) {
        showError(e?.message || 'Could not fetch balance', { position: 'top' });
      }
    })();
  }, [showError, tagFromParams]);

  const fmtAmount = (n) => {
    const abs = Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return `${n >= 0 ? '+$' : '-$'} ${abs}`;
  };
  const fmtDate = (iso) =>
    new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });

  async function onCopyTag() {
    try {
      const Clipboard = await import('expo-clipboard');
      await Clipboard.setStringAsync(tag);
      showError('Tag copied', { type: 'info', position: 'top' });
    } catch {
      showError('Could not copy tag', { position: 'top' });
    }
  }

  async function onLogout() {
    try { await wipeAllLocalData(); }
    finally { navigation.reset({ index: 0, routes: [{ name: 'EnterPhone' }] }); }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.container}>
        {/* Header right (profile → logout) */}
        <View style={styles.headerRow}>
          <View style={{ width: 28 }} />
          <TouchableOpacity onPress={onLogout} style={styles.profileBtn}>
            <IconUser size={22} color="#111" />
          </TouchableOpacity>
        </View>

        {/* Tag + copy */}
        <View style={styles.tagRow}>
          <Text style={styles.tagText}>tag: {tag || 'user'}</Text>
          <TouchableOpacity onPress={onCopyTag} style={styles.copyBtn}>
            <IconCopy size={16} color="#6B7280" />
          </TouchableOpacity>
        </View>

        {/* Balance (affiche SOL par défaut — change le label si tu veux USD/EUR) */}
        <Text style={styles.balanceText}>
          ${balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </Text>

        {/* Add funds (outline) */}
        <TouchableOpacity style={styles.addBtn}>
          <Text style={styles.addBtnText}>Add funds</Text>
          <IconPlus size={14} color="#111" />
        </TouchableOpacity>

        {/* Transactions */}
        <Text style={styles.sectionTitle}>Transactions</Text>
        <FlatList
          data={transactions}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 20 }}
          ItemSeparatorComponent={() => <View style={{ height: 14 }} />}
          renderItem={({ item }) => (
            <View style={styles.txRow}>
              <View style={styles.txAvatar} />
              <View style={styles.txInfo}>
                <Text style={styles.txName}>{item.name}</Text>
                <Text style={styles.txDate}>{fmtDate(item.date)}</Text>
              </View>
              <Text
                style={[
                  styles.txAmount,
                  item.amount >= 0 ? styles.amountPlus : styles.amountMinus,
                ]}
              >
                {fmtAmount(item.amount)}
              </Text>
            </View>
          )}
        />

        {/* Bottom actions */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={[styles.bigBtn, styles.bigBtnLight]}
            onPress={() => navigation.navigate('ReceiveSelect')}
          >
            <View style={styles.bigBtnRow}>
              <Text style={styles.bigBtnTextDark}>Receive</Text>
              <IconArrowDownLeft size={18} color="#111" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.bigBtn, styles.bigBtnDark]}
            onPress={() => navigation.navigate('SendMethod')}  
          >
            <View style={styles.bigBtnRow}>
              <Text style={styles.bigBtnText}>Send</Text>
              <IconArrowUpRight size={18} color="#fff" />
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

/* ---------- Styles identiques à ta version ---------- */
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1, backgroundColor: '#fff' },

  headerRow: { paddingTop: 12, paddingHorizontal: 20, flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center' },
  profileBtn: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center', borderRadius: 14 },

  tagRow: { marginTop: 6, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
  tagText: { color: '#6B7280', fontSize: 14 },
  copyBtn: { padding: 6, marginLeft: 6 },

  balanceText: { marginTop: 16, fontSize: 40, lineHeight: 48, color: '#111827', fontWeight: '700', textAlign: 'center' },

  addBtn: {
    marginTop: 12, alignSelf: 'center', height: 40, paddingHorizontal: 18,
    borderRadius: 20, borderWidth: 1.5, borderColor: '#111111',
    alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8,
  },
  addBtnText: { color: '#111111', fontWeight: '600' },

  sectionTitle: { marginTop: 22, marginBottom: 10, paddingHorizontal: 20, color: '#6B7280', fontWeight: '600' },

  txRow: { flexDirection: 'row', alignItems: 'center' },
  txAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#E5E7EB', marginRight: 12 },
  txInfo: { flex: 1 },
  txName: { color: '#111827', fontWeight: '600' },
  txDate: { color: '#9CA3AF', fontSize: 12, marginTop: 2 },
  txAmount: { marginLeft: 8, fontWeight: '600' },
  amountPlus: { color: '#111827' },
  amountMinus: { color: '#4B5563' },

  bottomBar: { paddingHorizontal: 16, paddingBottom: 16, paddingTop: 8, flexDirection: 'row', gap: 12 },
  bigBtn: {
    flex: 1, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 3,
  },
  bigBtnLight: { backgroundColor: '#F3F4F6' },
  bigBtnDark: { backgroundColor: '#111111' },
  bigBtnText: { fontSize: 16, fontWeight: '600', color: '#fff' },
  bigBtnTextDark: { fontSize: 16, fontWeight: '600', color: '#111' },
  bigBtnRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});