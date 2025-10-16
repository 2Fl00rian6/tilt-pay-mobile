import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useError } from '../context/ErrorContext';

const CODE_LEN = 4;

export default function VerifyCodeScreen({ route, navigation }) {
  const { showError } = useError();
  const phoneDisplay = route?.params?.phoneDisplay;
  const [digits, setDigits] = useState(Array(CODE_LEN).fill(''));
  const inputs = useRef([]);

  useEffect(() => { inputs.current[0]?.focus(); }, []);

  const setAt = (i, v) => {
    const next = [...digits];
    next[i] = v.replace(/\D+/g, '').slice(0, 1);
    setDigits(next);
    if (next[i] && i < CODE_LEN - 1) inputs.current[i + 1]?.focus();
  };

  const onKeyPress = (i, e) => {
    if (e.nativeEvent.key === 'Backspace' && !digits[i] && i > 0) {
      inputs.current[i - 1]?.focus();
    }
  };

  const valueStr = digits.join('');
  const canVerify = valueStr.length === CODE_LEN;

  const onVerify = () => {
    if (!canVerify) return;
    // Ici tu appelles ton backend pour vérifier le code reçu par SMS.
    // Pour la démo, on accepte n'importe quel code et on passe à ChooseTag.
    navigation.replace('ChooseTag');
  };

  const onResend = () => {
    showError('Code resent', { type: 'info', position: 'top' });
    // Appeler ton API d’envoi SMS ici (utiliser route.params.e164 si besoin).
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.container}>
          {/* Handle */}
          <View style={styles.handleWrap}><View style={styles.handle} /></View>

          {/* Title */}
          <View style={{ paddingHorizontal: 24 }}>
            <Text style={styles.title}>Enter your verification code</Text>
            {!!phoneDisplay && (
              <Text style={styles.subtitle}>We sent a 4 digit code to {phoneDisplay}.</Text>
            )}
          </View>

          {/* Boxes */}
          <View style={styles.boxRow}>
            {Array.from({ length: CODE_LEN }).map((_, i) => (
              <TextInput
                key={i}
                ref={(r) => (inputs.current[i] = r)}
                value={digits[i]}
                onChangeText={(t) => setAt(i, t)}
                onKeyPress={(e) => onKeyPress(i, e)}
                keyboardType="number-pad"
                maxLength={1}
                style={styles.box}
                textAlign="center"
                selectionColor="#111"
              />
            ))}
          </View>

          <View style={{ flex: 1 }} />

          {/* Bottom */}
          <View style={styles.bottom}>
            <TouchableOpacity
              onPress={onVerify}
              activeOpacity={0.9}
              disabled={!canVerify}
              style={[styles.cta, !canVerify && styles.ctaDisabled]}
            >
              <Text style={[styles.ctaText, !canVerify && styles.ctaTextDisabled]}>Verify</Text>
            </TouchableOpacity>

            <Text style={styles.footerText}>
              Didn’t receive the code ?{' '}
              <Text onPress={onResend} style={styles.footerLink}>Resend</Text>
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1, backgroundColor: '#fff', paddingTop: 16 },
  handleWrap: { alignItems: 'center', marginBottom: 24 },
  handle: { width: 36, height: 4, backgroundColor: '#D1D5DB', borderRadius: 2 },

  title: { fontSize: 20, lineHeight: 28, fontWeight: '600', color: '#111827', marginBottom: 8 },
  subtitle: { fontSize: 14, lineHeight: 20, color: '#6B7280' },

  boxRow: { flexDirection: 'row', justifyContent: 'center', gap: 12, marginTop: 28 },
  box: {
    width: 56, height: 56, borderRadius: 12, borderWidth: 1, borderColor: '#D1D5DB',
    fontSize: 20, color: '#111827',
  },

  bottom: { paddingHorizontal: 24, paddingBottom: 16, alignItems: 'center' },
  cta: {
    height: 52, borderRadius: 16, backgroundColor: '#111111',
    alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  ctaDisabled: { backgroundColor: '#E5E7EB' },
  ctaText: { color: '#FFFFFF', fontWeight: '600', fontSize: 16 },
  ctaTextDisabled: { color: '#9CA3AF' },
  footerText: { color: '#6B7280', fontSize: 13 },
  footerLink: { color: '#111111', fontWeight: '600' },
});