import React, { useMemo, useRef, useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, Modal, FlatList, Animated,
  TouchableWithoutFeedback, Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useError } from '../context/ErrorContext';
import HeaderBar from '../components/HeaderBar';

const COUNTRIES = [
  { cca2: 'FR', name: 'France', flag: '🇫🇷', callingCode: '33', nsnMin: 9, nsnMax: 9, hasTrunk0: true,  groups: [1,2,2,2,2] },
  { cca2: 'BE', name: 'Belgium',flag: '🇧🇪', callingCode: '32', nsnMin: 8, nsnMax: 9, hasTrunk0: false, groups: [3,3,3] },
  { cca2: 'CH', name: 'Switzerland', flag: '🇨🇭', callingCode: '41', nsnMin: 9, nsnMax: 9, hasTrunk0: false, groups: [2,3,2,2] },
  { cca2: 'DE', name: 'Germany', flag: '🇩🇪', callingCode: '49', nsnMin: 6, nsnMax: 11, hasTrunk0: true, groups: [3,3,3,2] },
  { cca2: 'ES', name: 'Spain', flag: '🇪🇸', callingCode: '34', nsnMin: 9, nsnMax: 9, hasTrunk0: false, groups: [3,3,3] },
  { cca2: 'IT', name: 'Italy', flag: '🇮🇹', callingCode: '39', nsnMin: 9, nsnMax: 10, hasTrunk0: true, groups: [3,3,4] },
  { cca2: 'GB', name: 'United Kingdom', flag: '🇬🇧', callingCode: '44', nsnMin: 9, nsnMax: 10, hasTrunk0: true, groups: [4,3,3] },
  { cca2: 'US', name: 'United States', flag: '🇺🇸', callingCode: '1', nsnMin: 10, nsnMax: 10, hasTrunk0: false, groups: [3,3,4] },
  { cca2: 'CA', name: 'Canada', flag: '🇨🇦', callingCode: '1', nsnMin: 10, nsnMax: 10, hasTrunk0: false, groups: [3,3,4] },
  { cca2: 'MA', name: 'Morocco', flag: '🇲🇦', callingCode: '212', nsnMin: 9, nsnMax: 9, hasTrunk0: false, groups: [2,3,2,2] },
];

function formatNational(nsn, groups) {
  if (!nsn) return '';
  const out = [];
  let i = 0;
  for (const g of groups) { if (i >= nsn.length) break; out.push(nsn.slice(i, i + g)); i += g; }
  if (i < nsn.length) out.push(nsn.slice(i));
  return out.filter(Boolean).join(' ');
}

function CountrySelectModal({ visible, onClose, onSelect }) {
  const [mounted, setMounted] = useState(visible);
  const [q, setQ] = useState('');
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) { setMounted(true); Animated.timing(anim, { toValue: 1, duration: 220, useNativeDriver: true }).start(); }
    else if (mounted) { Animated.timing(anim, { toValue: 0, duration: 180, useNativeDriver: true }).start(({ finished }) => finished && setMounted(false)); }
  }, [visible, mounted, anim]);

  const overlayStyle = { opacity: anim };
  const translateY = anim.interpolate({ inputRange: [0,1], outputRange: [420,0] });
  const cardAnimStyle = { transform: [{ translateY }] };

  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return COUNTRIES;
    return COUNTRIES.filter(c => c.name.toLowerCase().includes(s) || c.cca2.toLowerCase().includes(s) || c.callingCode.includes(s));
  }, [q]);

  const close = () => {
    Animated.timing(anim, { toValue: 0, duration: 160, useNativeDriver: true }).start(() => { setMounted(false); onClose?.(); });
  };

  if (!mounted) return null;

  return (
    <Modal visible transparent animationType="none" onRequestClose={close}>
      <View style={styles.modalRoot} pointerEvents="box-none">
        <TouchableWithoutFeedback onPress={close}>
          <Animated.View style={[styles.modalOverlay, overlayStyle]} />
        </TouchableWithoutFeedback>
        <Animated.View style={[styles.modalCard, cardAnimStyle]}>
          <View style={{ height: 10 }} />
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select country</Text>
            <TouchableOpacity onPress={close} hitSlop={{ top:12, bottom:12, left:12, right:12 }}>
              <Text style={styles.modalClose}>✕</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.searchWrap}>
            <TextInput
              placeholder="Search country or code"
              placeholderTextColor="#9CA3AF"
              value={q}
              onChangeText={setQ}
              style={styles.searchInput}
            />
          </View>
          <FlatList
            data={list}
            keyExtractor={(item) => item.cca2}
            ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.countryRow}
                onPress={() => { onSelect(item); close(); }}
                activeOpacity={0.8}
                hitSlop={{ top:8, bottom:8, left:8, right:8 }}
              >
                <Text style={styles.flag}>{item.flag}</Text>
                <Text style={styles.countryName}>{item.name}</Text>
                <Text style={styles.calling}>+{item.callingCode}</Text>
              </TouchableOpacity>
            )}
          />
        </Animated.View>
      </View>
    </Modal>
  );
}

function awaitKeyboardHide() {
  return new Promise((resolve) => {
    if (Platform.OS !== 'ios') { Keyboard.dismiss(); return resolve(); }
    let done = false;
    const finish = () => { if (!done) { done = true; resolve(); } };
    const sub = Keyboard.addListener('keyboardDidHide', () => {
      sub.remove();
      setTimeout(finish, 40);
    });
    Keyboard.dismiss();
    setTimeout(() => { try { sub.remove(); } catch {} finish(); }, 300);
  });
}

export default function EnterPhoneScreen({ navigation }) {
  const { showError } = useError();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [country, setCountry] = useState(COUNTRIES[0]);
  const [nsn, setNsn] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    let v = nsn.replace(/\D+/g, '');
    if (country.hasTrunk0 && v.startsWith('0')) v = v.replace(/^0+/, '');
    if (v.length > country.nsnMax) v = v.slice(0, country.nsnMax);
    if (v !== nsn) setNsn(v);
  }, [country]);

  const formattedNational = useMemo(() => formatNational(nsn, country.groups || []), [nsn, country]);
  const canContinue = nsn.length >= country.nsnMin;

  const onChangeNational = (t) => {
    let v = String(t).replace(/\D+/g, '');
    if (country.hasTrunk0 && v.startsWith('0')) v = v.replace(/^0+/, '');
    if (v.length > country.nsnMax) v = v.slice(0, country.nsnMax);
    setNsn(v);
  };

  const onContinue = async () => {
    if (!canContinue) { showError('Enter a valid phone number', { position: 'top' }); return; }
    inputRef.current?.blur();
    await awaitKeyboardHide();
    const e164 = `+${country.callingCode}${nsn}`;
    navigation.navigate('VerifyCode', { phoneDisplay: `+${country.callingCode} ${formattedNational}`, e164 });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <HeaderBar title="" />

      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.container}>
            <View style={styles.handleWrap}><View style={styles.handle} /></View>

            <View style={{ paddingHorizontal: 24 }}>
              <Text style={styles.title}>Enter your phone number</Text>
              <Text style={styles.subtitle}>Enter your phone number below to create your account.</Text>
            </View>

            <View style={{ paddingHorizontal: 24, marginTop: 16 }}>
              <View style={styles.phoneField}>
                <TouchableOpacity
                  style={styles.codeBox}
                  activeOpacity={0.8}
                  onPress={() => setPickerOpen(true)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Text style={styles.flagBig}>{country.flag}</Text>
                  <Text style={styles.codeText}>+{country.callingCode}</Text>
                </TouchableOpacity>

                <View style={styles.divider} />

                <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => inputRef.current?.focus()}>
                  <TextInput
                    ref={inputRef}
                    value={formattedNational}
                    onChangeText={onChangeNational}
                    keyboardType="number-pad"
                    placeholder="Phone number"
                    placeholderTextColor="#9CA3AF"
                    style={styles.phoneInput}
                    maxLength={40}
                    returnKeyType="done"
                    onSubmitEditing={onContinue}
                  />
                </TouchableOpacity>
              </View>
            </View>

            <View style={{ flex: 1 }} />

            <View style={styles.bottom}>
              <TouchableOpacity
                onPress={onContinue}
                activeOpacity={0.9}
                disabled={!canContinue}
                style={[styles.cta, !canContinue && styles.ctaDisabled]}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={[styles.ctaText, !canContinue && styles.ctaTextDisabled]}>Continue</Text>
              </TouchableOpacity>

              <Text style={styles.footerText}>
                Do you have an account ? <Text onPress={onContinue} style={styles.footerLink}>Log in</Text>
              </Text>
            </View>
          </View>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>

      <CountrySelectModal
        visible={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={(c) => setCountry(c)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1, backgroundColor: '#fff', paddingTop: 8 },
  handleWrap: { alignItems: 'center', marginBottom: 16 },
  handle: { width: 36, height: 4, backgroundColor: '#D1D5DB', borderRadius: 2 },

  title: { fontSize: 20, lineHeight: 28, fontWeight:'600', color:'#111827', marginBottom: 8 },
  subtitle: { fontSize: 14, lineHeight: 20, color:'#6B7280' },

  phoneField: { height: 60, borderRadius: 14, borderWidth: 1, borderColor: '#D1D5DB', flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff' },
  codeBox: { paddingHorizontal: 16, paddingVertical: 12, height: '100%', flexDirection:'row', alignItems:'center' },
  flagBig: { fontSize: 22, marginRight: 10 },
  codeText: { fontSize: 17, color:'#111827', fontWeight:'700' },
  divider: { width:1, height:'70%', backgroundColor:'#E5E7EB' },
  phoneInput: { flex:1, paddingHorizontal:16, fontSize:17, color:'#111827', paddingVertical:14 },

  bottom: { paddingHorizontal: 24, paddingBottom: 16, alignItems:'center' },
  cta: { height:56, borderRadius:16, backgroundColor:'#111111', alignSelf:'stretch', alignItems:'center', justifyContent:'center', marginBottom:12 },
  ctaDisabled: { backgroundColor:'#E5E7EB' },
  ctaText: { color:'#FFFFFF', fontWeight:'700', fontSize:16 },
  ctaTextDisabled: { color:'#9CA3AF' },
  footerText: { color:'#6B7280', fontSize:13 },
  footerLink: { color:'#111111', fontWeight:'700' },

  modalRoot: { flex:1, justifyContent:'flex-end' },
  modalOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor:'rgba(0,0,0,0.25)' },
  modalCard: { maxHeight: '70%', backgroundColor: '#fff', borderTopLeftRadius: 16, borderTopRightRadius: 16, paddingTop: 24, paddingBottom: 16, paddingHorizontal: 16 },
  modalHeader: { flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginBottom: 24 },
  modalTitle: { fontSize:16, fontWeight:'700', color:'#111' },
  modalClose: { fontSize:18, color:'#111' },
  searchWrap: { marginTop: 8, marginBottom: 14 },
  searchInput: { height:44, borderRadius:12, backgroundColor:'#F3F4F6', paddingHorizontal:14, color:'#111827', fontSize:15 },
  countryRow: { flexDirection:'row', alignItems:'center', paddingVertical:14, paddingHorizontal:6, borderRadius:12 },
  flag: { fontSize:20, width:32, textAlign:'center' },
  countryName: { flex:1, color:'#111827', fontSize:16, fontWeight:'600' },
  calling: { color:'#6B7280', fontWeight:'700', fontSize:14 },
});