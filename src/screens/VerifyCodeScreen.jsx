import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard, Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import HeaderBar from '../components/HeaderBar';
import { useError } from '../context/ErrorContext';
import { verifyAccount } from '../api/auth';

const CODE_LEN = 6;

export default function VerifyCodeScreen({ route, navigation }) {
  const { showError } = useError();
  const inputRef = useRef(null);

  const mode = route?.params?.mode || 'register';
  const dialCode = route?.params?.dialCode || '+33';
  const nsn = route?.params?.nsn || '';
  const phoneDisplay = route?.params?.phoneDisplay || `${dialCode}${nsn}`;
  const phoneE164 = `${dialCode}${nsn}`;

  const [code, setCode] = useState('');

  const boxes = useMemo(() => {
    const arr = new Array(CODE_LEN).fill('');
    for (let i = 0; i < Math.min(code.length, CODE_LEN); i++) arr[i] = code[i];
    return arr;
  }, [code]);

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 100);
    return () => clearTimeout(t);
  }, []);

  const onChange = useCallback((t) => {
    const v = String(t).replace(/\D+/g, '').slice(0, CODE_LEN);
    setCode(v);
  }, []);

  const goBackToPhone = useCallback(() => {
    navigation.replace('EnterPhone');
  }, [navigation]);

  const onContinue = async () => {
    if (code.length !== CODE_LEN) {
      showError(`Enter the ${CODE_LEN}-digit code`, { position: 'top' });
      return;
    }
    try {
      await verifyAccount({ phoneNumber: phoneE164, token: code });
      navigation.replace('LoginPin', { dialCode, nsn });
    } catch (e) {
      showError(e?.text || e?.message || 'Verification failed', { position: 'top' });
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <HeaderBar title="" onBack={goBackToPhone} />
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.container}>
            <View style={styles.handleWrap}><View style={styles.handle} /></View>
            <View style={{ paddingHorizontal: 24 }}>
              <Text style={styles.title}>Enter verification code</Text>
              <Text style={styles.subtitle}>We sent a code to {phoneDisplay}.</Text>
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
            </View>
            <View style={{ flex: 1 }} />
            <View style={styles.bottom}>
              <TouchableOpacity
                onPress={onContinue}
                activeOpacity={0.9}
                disabled={code.length !== CODE_LEN}
                style={[styles.cta, code.length !== CODE_LEN && styles.ctaDisabled]}
              >
                <Text style={[styles.ctaText, code.length !== CODE_LEN && styles.ctaTextDisabled]}>
                  Continue
                </Text>
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
  box: { width: 48, height: 56, borderRadius: 12, borderWidth: 1, borderColor: '#D1D5DB', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF' },
  boxFilled: { borderColor: '#111111' },
  boxText: { fontSize: 20, fontWeight: '700', color: '#111827' },

  hiddenInput: { position: 'absolute', opacity: 0, width: 0, height: 0 },

  actionsRow: { marginTop: 14, paddingHorizontal: 24, flexDirection: 'row', justifyContent: 'space-between' },
  link: { color: '#111111', fontWeight: '700' },

  bottom: { paddingHorizontal: 24, paddingBottom: 16, alignItems: 'center' },
  cta: { height: 56, borderRadius: 16, backgroundColor: '#111111', alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  ctaDisabled: { backgroundColor: '#E5E7EB' },
  ctaText: { color: '#FFFFFF', fontWeight: '700', fontSize: 16 },
  ctaTextDisabled: { color: '#9CA3AF' },
});