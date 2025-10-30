import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Animated,
  Easing,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Svg, Path, Rect, Circle } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import { getUser, getToken } from '../utils/authStorage';
import { useError } from '../context/ErrorContext';

const screenWidth = Dimensions.get('window').width;

/* ---------- Icônes ---------- */
const IconUser = ({ size = 22, color = '#111' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M20 21a8 8 0 0 0-16 0" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    <Circle cx="12" cy="7" r="4" stroke={color} strokeWidth="1.8" />
  </Svg>
);
const IconCopy = ({ size = 16, color = '#6B7280' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="9" y="9" width="11" height="11" rx="2.5" stroke={color} strokeWidth="1.6" />
    <Rect x="4" y="4" width="11" height="11" rx="2.5" stroke={color} strokeWidth="1.6" />
  </Svg>
);
const IconPlus = ({ size = 12, color = '#111' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M12 5v14M5 12h14" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </Svg>
);
const IconArrowDownLeft = ({ size = 18, color = '#111' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M17 7L7 17M7 17V9M7 17h8" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);
const IconArrowUpRight = ({ size = 18, color = '#fff' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M7 17l10-10M17 7H9m8 0v8" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

/* ---------- Main Screen ---------- */
export default function HomeScreen({ navigation, route }) {
  const { showError } = useError();
  const tagFromParams = route?.params?.tagName;

  const [phone, setPhone] = useState('');
  const [tag, setTag] = useState('');
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingBalance, setLoadingBalance] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(15)).current;
  const spinAnim = useRef(new Animated.Value(0)).current;
  const shimmer = useRef(new Animated.Value(0)).current;

  const playAnimation = () => {
    fadeAnim.setValue(0);
    translateY.setValue(15);
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 550,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        damping: 16,
      }),
    ]).start();
  };

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const startSpinner = () => {
    spinAnim.setValue(0);
    Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 1200,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  };

  const startShimmer = () => {
    shimmer.setValue(0);
    Animated.loop(
      Animated.timing(shimmer, {
        toValue: 1,
        duration: 1200,
        easing: Easing.linear,
        useNativeDriver: false,
      })
    ).start();
  };

  const shimmerBg = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: ['#E5E7EB', '#F3F4F6'],
  });

  useEffect(() => {
    startSpinner();
    startShimmer();
  }, []);

  const fetchData = useCallback(async () => {
    try {
      if (!refreshing) setLoading(true);
      setLoadingBalance(true);
      startSpinner();

      const user = await getUser();
      if (!user) return;
      setPhone(user.phoneNumber || '');
      setTag(user.tagName || tagFromParams || '');
      const token = await getToken(user.phoneNumber);
      if (!token) return;

      const resBalance = await fetch('https://tilt-pay-api.florianwarther.fr/wallet/balance', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const dataBalance = await resBalance.json();

      let usdBalance = 0;
      if (Array.isArray(dataBalance?.tokens)) {
        const usdc = dataBalance.tokens.find((t) => t.symbol === 'USDC');
        if (usdc) {
          const value = usdc.amount / 10 ** usdc.decimals;
          usdBalance = Math.floor(value * 100) / 100;
        }
      }
      setBalance(usdBalance);
      setLoadingBalance(false);

      const resTx = await fetch('https://tilt-pay-api.florianwarther.fr/transaction/transactions', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const dataTx = await resTx.json();
      setTransactions(Array.isArray(dataTx.transactions) ? dataTx.transactions : []);

      playAnimation();
    } catch (e) {
      showError(e?.message || 'Error while loading data', { position: 'top' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [showError, tagFromParams]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /* ---------- Haptics ---------- */
  async function vibrate() {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (e) {
      console.warn('Haptics unavailable', e);
    }
  }

  /* ---------- Copier le tag ---------- */
  async function onCopyTag() {
    try {
      if (!tag) {
        showError('No tag to copy', { position: 'top' });
        return;
      }
      await Clipboard.setStringAsync(tag);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showError('Tag copied to clipboard', { type: 'success', position: 'top' });
    } catch (e) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showError('Failed to copy tag', { type: 'error', position: 'top' });
    }
  }

  /* ---------- UI ---------- */
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.headerRow}>
          <View style={{ width: 28 }} />
          <TouchableOpacity onPress={() => navigation.navigate('AccountSettings')} style={styles.profileBtn}>
            <IconUser size={22} color="#111" />
          </TouchableOpacity>
        </View>

        {/* Tag */}
        <View style={styles.tagRow}>
          <Text style={styles.tagText}>tag: {tag || 'user'}</Text>
          <TouchableOpacity onPress={onCopyTag} style={styles.copyBtn} activeOpacity={0.8}>
            <IconCopy size={16} color="#6B7280" />
          </TouchableOpacity>
        </View>

        {/* Balance */}
        {loadingBalance ? (
          <Animated.View style={[styles.skeleton, { backgroundColor: shimmerBg, alignSelf: 'center' }]} />
        ) : (
          <Text style={styles.balanceText}>${balance.toFixed(2)}</Text>
        )}

        {/* Add funds */}
        <TouchableOpacity
          style={styles.addBtn}
          onPress={async () => {
            await vibrate();
            navigation.navigate('AddFunds');
          }}
          activeOpacity={0.85}
        >
          <Text style={styles.addBtnText}>Add funds</Text>
          <IconPlus size={14} color="#111" />
        </TouchableOpacity>

        {/* Transactions */}
        <Text style={styles.sectionTitle}>Transactions</Text>

        {loading ? (
          <View style={styles.loaderCenter}>
            <Animated.View style={[styles.spinner, { transform: [{ rotate: spin }] }]} />
          </View>
        ) : (
          <Animated.View style={{ flex: 1, opacity: fadeAnim, transform: [{ translateY }] }}>
            <FlatList
              data={transactions}
              keyExtractor={(item) => String(item.id)}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={() => {
                    setRefreshing(true);
                    fetchData();
                  }}
                  tintColor="#888"
                />
              }
              contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
              ItemSeparatorComponent={() => <View style={{ height: 14 }} />}
              renderItem={({ item }) => (
                <View style={styles.txRow}>
                  <View style={styles.txAvatar} />
                  <View style={styles.txInfo}>
                    <Text style={styles.txName}>{item.name}</Text>
                    <Text style={styles.txDate}>
                      {new Date(item.createdAt).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.txAmount,
                      item.type === 'credit' ? styles.amountPlus : styles.amountMinus,
                    ]}
                  >
                    {item.type === 'credit' ? '+' : '-'}${(item.amount / 100000).toFixed(2)}
                  </Text>
                </View>
              )}
            />
          </Animated.View>
        )}

        {/* Bottom actions */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={[styles.bigBtn, styles.bigBtnDark]}
            activeOpacity={0.9}
            onPress={async () => {
              await vibrate();
              navigation.navigate('ReceiveSelect');
            }}
          >
            <View style={styles.bigBtnRow}>
              <Text style={styles.bigBtnText}>Receive</Text>
              <IconArrowDownLeft size={18} color="#fff" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.bigBtn, styles.bigBtnDark]}
            activeOpacity={0.9}
            onPress={async () => {
              await vibrate();
              navigation.navigate('SendMethod');
            }}
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

/* ---------- Styles ---------- */
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1, backgroundColor: '#fff' },

  headerRow: { paddingTop: 12, paddingHorizontal: 20, flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center' },
  profileBtn: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center', borderRadius: 14 },

  tagRow: { marginTop: 6, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
  tagText: { color: '#6B7280', fontSize: 14 },
  copyBtn: { padding: 6, marginLeft: 6 },

  skeleton: { marginTop: 20, width: screenWidth * 0.4, height: 44, borderRadius: 8 },

  balanceText: { marginTop: 16, fontSize: 40, lineHeight: 48, color: '#111827', fontWeight: '700', textAlign: 'center' },

  spinner: { width: 42, height: 42, borderWidth: 3, borderColor: '#D1D5DB', borderTopColor: '#9CA3AF', borderRadius: 21 },
  loaderCenter: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  addBtn: {
    marginTop: 12,
    alignSelf: 'center',
    height: 40,
    paddingHorizontal: 18,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#111111',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
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
    flex: 1,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  bigBtnLight: { backgroundColor: '#F3F4F6' },
  bigBtnDark: { backgroundColor: '#111111' },
  bigBtnText: { fontSize: 16, fontWeight: '600', color: '#fff' },
  bigBtnTextDark: { fontSize: 16, fontWeight: '600', color: '#111' },
  bigBtnRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});