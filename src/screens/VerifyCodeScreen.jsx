import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard, Pressable, InteractionManager,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import HeaderBar from '../components/HeaderBar';
import { useError } from '../context/ErrorContext';

const CODE_LEN = 4;

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

export default function VerifyCodeScreen({ route, navigation }) {
  const { showError } = useError();
  const insets = useSafeAreaInsets();
  const inputRef = useRef(null);

  const phoneDisplay = route?.params?.phoneDisplay ?? '';
  const e164 = route?.params?.e164 ?? '';

  const [code, setCode] = useState('');

  const boxes = useMemo(() => {
    const arr = new Array(CODE_LEN).fill('');
    for (let i = 0; i < Math.min(code.length, CODE_LEN); i++) arr[i] = code[i];
    return arr;
  }, [code]);

  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      setTimeout(() => inputRef.current?.focus(), 120);
    });
    return () => task.cancel();
  }, []);

  const onChange = useCallback((t) => {
    let v = String(t).replace(/\D+/g, '');
    if (v.length > CODE_LEN) v = v.slice(0, CODE_LEN);
    setCode(v);
  }, []);

  const goBackToPhone = useCallback(async () => {
    try { inputRef.current?.blur(); } catch {}
    await awaitKeyboardHide();
    navigation.reset({ index: 0, routes: [{ name: 'EnterPhone' }] });
  }, [navigation]);

  const onResend = () => {
    showError('Verification code sent', { type: 'info', position: 'top' });
  };

  const onContinue = async () => {
    if (code.length !== CODE_LEN) {
      showError(`Enter the ${CODE_LEN}-digit code`, { position: 'top' });
      return;
    }
    inputRef.current?.blur();
    await awaitKeyboardHide();
    requestAnimationFrame(() => navigation.replace('ChooseTag'));
  };

  const kbOffset = (insets?.top || 0) + 52;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <HeaderBar title="" onBack={goBackToPhone} />

      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? kbOffset : 0}
        >
          <View style={styles.container}>
            <View style={styles.handleWrap}><View style={styles.handle} /></View>

            <View style={{ paddingHorizontal: 24 }}>
              <Text style={styles.title}>Enter verification code</Text>
              <Text style={styles.subtitle}>
                We sent a code to {phoneDisplay || e164 || 'your phone number'}.
              </Text>
            </View>

            <Pressable style={styles.codeWrap} onPress={() => inputRef.current?.focus()}>
              {boxes.map((ch, i) => (
                <View key={i} style={[styles.box, ch ? styles.boxFilled : null]}>
                  <Text style={styles.boxText}>{ch}</Text>
                </View>
              ))}
              <TextInput
                ref={inputRef}
                value={code}
                onChangeText={onChange}
                keyboardType="number-pad"
                inputMode="numeric"
                textContentType="oneTimeCode"
                autoComplete="sms-otp"
                maxLength={CODE_LEN}
                style={styles.hiddenInput}
              />
            </Pressable>

            <View style={styles.actionsRow}>
              <TouchableOpacity onPress={goBackToPhone} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Text style={styles.link}>Edit number</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={onResend} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Text style={styles.link}>Resend code</Text>
              </TouchableOpacity>
            </View>

            <View style={{ flex: 1 }} />

            <View style={styles.bottom}>
              <TouchableOpacity
                onPress={onContinue}
                activeOpacity={0.9}
                disabled={code.length !== CODE_LEN}
                style={[styles.cta, code.length !== CODE_LEN && styles.ctaDisabled]}
              >
                <Text style={[styles.ctaText, code.length !== CODE_LEN && styles.ctaTextDisabled]}>Continue</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1, backgroundColor: '#fff', paddingTop: 8 },
  handleWrap: { alignItems: 'center', marginBottom: 16 },
  handle: { width: 36, height: 4, backgroundColor: '#D1D5DB', borderRadius: 2 },
  title: { fontSize: 20, lineHeight: 28, fontWeight: '600', color: '#111827', marginBottom: 8, paddingHorizontal: 24 },
  subtitle: { fontSize: 14, lineHeight: 20, color: '#6B7280' },
  codeWrap: { marginTop: 24, paddingHorizontal: 24, flexDirection: 'row', justifyContent: 'space-between' },
  box: { width: 56, height: 60, borderRadius: 14, borderWidth: 1, borderColor: '#D1D5DB', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF' },
  boxFilled: { borderColor: '#111111' },
  boxText: { fontSize: 22, fontWeight: '700', color: '#111827' },
  hiddenInput: { position: 'absolute', opacity: 0, width: 0, height: 0 },
  actionsRow: { marginTop: 14, paddingHorizontal: 24, flexDirection: 'row', justifyContent: 'space-between' },
  link: { color: '#111111', fontWeight: '700' },
  bottom: { paddingHorizontal: 24, paddingBottom: 16, alignItems: 'center' },
  cta: { height: 56, borderRadius: 16, backgroundColor: '#111111', alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  ctaDisabled: { backgroundColor: '#E5E7EB' },
  ctaText: { color: '#FFFFFF', fontWeight: '700', fontSize: 16 },
  ctaTextDisabled: { color: '#9CA3AF' },
});