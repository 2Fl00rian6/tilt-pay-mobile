import { useMemo, useRef, useState, useEffect } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, Modal, FlatList, Animated,
  TouchableWithoutFeedback, Keyboard, ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import HeaderBar from '../components/HeaderBar'
import { useError } from '../context/ErrorContext'
import { me } from '../api/auth'
import { getToken, getUser } from '../utils/authStorage'
import allCountries from 'world-countries'

const COUNTRIES = allCountries.map((c) => {
  const base = {
    cca2: c.cca2,
    name: c.name.common,
    flag: c.flag || '🏳️',
    callingCode: c.idd?.root
      ? `${c.idd.root}${(c.idd.suffixes?.[0] || '').replace('+', '')}`.replace('+', '')
      : '',
    nsnMin: 6,
    nsnMax: 12,
    hasTrunk0: true,
    groups: [3, 3, 4],
  }
  if (c.cca2 === 'FR') {
    base.nsnMin = 9
    base.nsnMax = 9
    base.groups = [2, 2, 2, 2, 1]
    base.hasTrunk0 = true
  }
  return base
}).filter((c) => !!c.callingCode)

function formatNational(nsn, groups, countryCode) {
  if (!nsn) return ''
  if (countryCode === 'FR') {
    // Toujours sans le 0
    let v = nsn.replace(/^0+/, '')
    if (!v) return ''
    // Découpe en 5 groupes : 1 + 2 + 2 + 2 + 2
    const groupsFR = [1, 2, 2, 2, 2]
    const parts = []
    let i = 0
    for (const g of groupsFR) {
      if (i >= v.length) break
      parts.push(v.slice(i, i + g))
      i += g
    }
    return parts.join(' ')
  }

  // Par défaut autres pays
  const out = []
  let i = 0
  for (const g of groups) {
    if (i >= nsn.length) break
    out.push(nsn.slice(i, i + g))
    i += g
  }
  if (i < nsn.length) out.push(nsn.slice(i))
  return out.filter(Boolean).join(' ')
}

function CountrySelectModal({ visible, onClose, onSelect }) {
  const [mounted, setMounted] = useState(visible)
  const [q, setQ] = useState('')
  const anim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (visible) {
      setMounted(true)
      Animated.timing(anim, { toValue: 1, duration: 220, useNativeDriver: true }).start()
    } else if (mounted) {
      Animated.timing(anim, { toValue: 0, duration: 180, useNativeDriver: true }).start(({ finished }) => finished && setMounted(false))
    }
  }, [visible, mounted, anim])

  const overlayStyle = { opacity: anim }
  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [420, 0] })
  const cardAnimStyle = { transform: [{ translateY }] }

  const list = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (!s) return COUNTRIES
    return COUNTRIES.filter(
      (c) =>
        c.name.toLowerCase().includes(s) ||
        c.cca2.toLowerCase().includes(s) ||
        c.callingCode.includes(s)
    )
  }, [q])

  const close = () => {
    Animated.timing(anim, { toValue: 0, duration: 160, useNativeDriver: true }).start(() => {
      setMounted(false)
      onClose?.()
    })
  }

  if (!mounted) return null

  return (
    <Modal visible transparent animationType="none" onRequestClose={close}>
      <View style={styles.modalRoot} pointerEvents="box-none">
        <TouchableWithoutFeedback onPress={close}>
          <Animated.View style={[styles.modalOverlay, overlayStyle]} />
        </TouchableWithoutFeedback>

        <Animated.View style={[styles.modalCard, cardAnimStyle]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select country</Text>
            <TouchableOpacity onPress={close}>
              <Text style={styles.modalClose}>✕</Text>
            </TouchableOpacity>
          </View>

          <TextInput
            placeholder="Search country or code"
            placeholderTextColor="#9CA3AF"
            value={q}
            onChangeText={setQ}
            style={styles.searchInput}
          />

          {list.length > 0 ? (
            <FlatList
              data={list}
              keyExtractor={(item) => item.cca2}
              ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
              contentContainerStyle={{ paddingBottom: 20, minHeight: 250 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.countryRow}
                  onPress={() => {
                    onSelect(item)
                    close()
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.flag}>{item.flag}</Text>
                  <Text style={styles.countryName}>{item.name}</Text>
                  <Text style={styles.calling}>+{item.callingCode}</Text>
                </TouchableOpacity>
              )}
            />
          ) : (
            <View style={styles.emptyList}>
              <Text style={styles.emptyText}>No countries found</Text>
            </View>
          )}
        </Animated.View>
      </View>
    </Modal>
  )
}

function awaitKeyboardHide() {
  return new Promise((resolve) => {
    if (Platform.OS !== 'ios') { Keyboard.dismiss(); return resolve() }
    let done = false
    const finish = () => { if (!done) { done = true; resolve() } }
    const sub = Keyboard.addListener('keyboardDidHide', () => {
      sub.remove()
      setTimeout(finish, 40)
    })
    Keyboard.dismiss()
    setTimeout(() => { try { sub.remove() } catch {} finish() }, 300)
  })
}

export default function EnterPhoneScreen({ navigation }) {
  const { showError } = useError()
  const [pickerOpen, setPickerOpen] = useState(false)
  const [country, setCountry] = useState(COUNTRIES.find(c => c.cca2 === 'FR') || COUNTRIES[0])
  const [nsn, setNsn] = useState('')
  const [checkingSession, setCheckingSession] = useState(true)
  const inputRef = useRef(null)

  useEffect(() => {
    (async () => {
      try {
        const user = await getUser()
        if (!user?.phoneNumber) return setCheckingSession(false)
        const token = await getToken(user.phoneNumber)
        if (!token) return setCheckingSession(false)
        const resMe = await me(token)
        if (resMe?.id) navigation.reset({ index: 0, routes: [{ name: 'Home' }] })
        else setCheckingSession(false)
      } catch (e) {
        console.log('[SESSION CHECK]', e.message)
        setCheckingSession(false)
      }
    })()
  }, [navigation])

  useEffect(() => {
    let v = nsn.replace(/\D+/g, '')
    // Supprime le 0 initial pour la France uniquement
    if (country.cca2 === 'FR') v = v.replace(/^0+/, '')
    if (v.length > country.nsnMax) v = v.slice(0, country.nsnMax)
    if (v !== nsn) setNsn(v)
  }, [country])

  const formattedNational = useMemo(
    () => formatNational(nsn, country.groups || [], country.cca2),
    [nsn, country]
  )
  const canContinue = nsn.length >= country.nsnMin

  const onChangeNational = (t) => {
    let v = String(t).replace(/\D+/g, '')
    if (country.hasTrunk0 && v.startsWith('0')) v = v.replace(/^0+/, '')
    if (v.length > country.nsnMax) v = v.slice(0, country.nsnMax)
    setNsn(v)
  }

  const goLoginPin = async () => {
    if (!canContinue) return showError('Enter a valid phone number', { position: 'top' })
    inputRef.current?.blur()
    await awaitKeyboardHide()
    const dialCode = `+${country.callingCode}`
    const phoneDisplay = `${dialCode} ${formattedNational}`
    navigation.navigate('LoginPin', { dialCode, nsn, phoneDisplay })
  }

  const goSignup = async () => {
    if (!canContinue) return showError('Enter a valid phone number', { position: 'top' })
    inputRef.current?.blur()
    await awaitKeyboardHide()
    const dialCode = `+${country.callingCode}`
    const phoneDisplay = `${dialCode} ${formattedNational}`
    navigation.navigate('ChooseTag', { dialCode, nsn, phoneDisplay })
  }

  if (checkingSession) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#111" />
          <Text style={{ marginTop: 10, color: '#555' }}>Checking session...</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <HeaderBar title="" onBack={undefined} />
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.container}>
            <View style={styles.handleWrap}><View style={styles.handle} /></View>

            <View style={{ paddingHorizontal: 24 }}>
              <Text style={styles.title}>Log in with your phone</Text>
              <Text style={styles.subtitle}>
                Enter your number to continue. If you don’t have an account yet, you can create one below.
              </Text>
            </View>

            <View style={{ paddingHorizontal: 24, marginTop: 16 }}>
              <View style={styles.phoneField}>
                <TouchableOpacity
                  style={styles.codeBox}
                  activeOpacity={0.8}
                  onPress={() => setPickerOpen(true)}
                >
                  <Text style={styles.flagBig}>{country.flag}</Text>
                  <Text style={styles.codeText}>+{country.callingCode}</Text>
                </TouchableOpacity>
                <View style={styles.divider} />
                <TextInput
                  ref={inputRef}
                  value={formattedNational}
                  onChangeText={onChangeNational}
                  keyboardType="number-pad"
                  placeholder="Phone number"
                  placeholderTextColor="#9CA3AF"
                  style={styles.phoneInput}
                  returnKeyType="done"
                  onSubmitEditing={goLoginPin}
                />
              </View>
            </View>

            <View style={{ flex: 1 }} />

            <View style={styles.bottom}>
              <TouchableOpacity
                onPress={goLoginPin}
                activeOpacity={0.9}
                disabled={!canContinue}
                style={[styles.cta, !canContinue && styles.ctaDisabled]}
              >
                <Text style={[styles.ctaText, !canContinue && styles.ctaTextDisabled]}>
                  Continue
                </Text>
              </TouchableOpacity>

              <Text style={styles.footerText}>
                New here? <Text onPress={goSignup} style={styles.footerLink}>Create an account</Text>
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
  )
}

const styles = StyleSheet.create({
  emptyList: { minHeight: 250, alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
  emptyText: { color: '#9CA3AF', fontSize: 15, fontWeight: '500' },
  safe: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1, backgroundColor: '#fff', paddingTop: 8 },
  handleWrap: { alignItems: 'center', marginBottom: 16 },
  handle: { width: 36, height: 4, backgroundColor: '#D1D5DB', borderRadius: 2 },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 20, fontWeight: '600', color: '#111827', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#6B7280' },
  phoneField: { height: 60, borderRadius: 14, borderWidth: 1, borderColor: '#D1D5DB', flexDirection: 'row', alignItems: 'center' },
  codeBox: { paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center' },
  flagBig: { fontSize: 22, marginRight: 10 },
  codeText: { fontSize: 17, color: '#111827', fontWeight: '700' },
  divider: { width: 1, height: '70%', backgroundColor: '#E5E7EB' },
  phoneInput: { flex: 1, paddingHorizontal: 16, fontSize: 17, color: '#111827' },
  bottom: { paddingHorizontal: 24, paddingBottom: 16, alignItems: 'center' },
  cta: { alignSelf: 'stretch', height: 56, borderRadius: 16, backgroundColor: '#111111', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  ctaDisabled: { backgroundColor: '#E5E7EB' },
  ctaText: { color: '#FFFFFF', fontWeight: '700', fontSize: 16 },
  ctaTextDisabled: { color: '#9CA3AF' },
  footerText: { color: '#6B7280', fontSize: 13 },
  footerLink: { color: '#111111', fontWeight: '700' },
  modalRoot: { flex: 1, justifyContent: 'flex-end' },
  modalOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.25)' },
  modalCard: { height: '70%', minHeight: 380, backgroundColor: '#fff', borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 16 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  modalTitle: { fontSize: 16, fontWeight: '700', color: '#111' },
  modalClose: { fontSize: 18, color: '#111' },
  searchInput: { height: 44, borderRadius: 12, backgroundColor: '#F3F4F6', paddingHorizontal: 14, color: '#111827', fontSize: 15, marginBottom: 14 },
  countryRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 6, borderRadius: 12 },
  flag: { fontSize: 20, width: 32, textAlign: 'center' },
  countryName: { flex: 1, color: '#111827', fontSize: 16, fontWeight: '600' },
  calling: { color: '#6B7280', fontWeight: '700', fontSize: 14 },
})