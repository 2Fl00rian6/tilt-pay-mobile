import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useError } from '../context/ErrorContext';
import { setCurrentUsername, getPin, sanitizeUsername } from '../utils/authStorage';

function validateTag(raw) {
  const trimmed = String(raw || '').trim();
  if (!trimmed) return { ok: false, msg: 'Please enter your tag name' };
  // autorise A-Z a-z 0-9 . _ -
  if (!/^[A-Za-z0-9._-]+$/.test(trimmed)) {
    return { ok: false, msg: 'Only letters, numbers, ".", "-" and "_" allowed' };
  }
  if (trimmed.length < 3) return { ok: false, msg: 'Minimum 3 characters' };
  if (trimmed.length > 24) return { ok: false, msg: 'Maximum 24 characters' };
  return { ok: true, value: sanitizeUsername(trimmed) };
}

export default function ChooseTagScreen({ navigation }) {
  const { showError } = useError();
  const [tag, setTag] = useState('');
  const [loading, setLoading] = useState(false);

  const onContinue = async () => {
    const v = validateTag(tag);
    if (!v.ok) return showError(v.msg, { position: 'top' });

    try {
      setLoading(true);
      await setCurrentUsername(v.value);
      const existingPin = await getPin(v.value);
      // route -> SetPin si pas de PIN, sinon LoginPin
      navigation.navigate(existingPin ? 'LoginPin' : 'SetPin', { username: v.value });
    } catch (e) {
      console.warn('ChooseTag onContinue error:', e);
      showError('Unexpected error. Please try again.', { position: 'top' });
    } finally {
      setLoading(false);
    }
  };

  const onPressLogin = async () => {
    const v = validateTag(tag);
    if (!v.ok) return showError(v.msg, { position: 'top' });
    try {
      setLoading(true);
      await setCurrentUsername(v.value);
      navigation.navigate('LoginPin', { username: v.value });
    } catch (e) {
      console.warn('ChooseTag onPressLogin error:', e);
      showError('Unexpected error. Please try again.', { position: 'top' });
    } finally {
      setLoading(false);
    }
  };

  const canContinue = validateTag(tag).ok;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={styles.safe} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.container}>
          <View style={styles.handleWrap}><View style={styles.handle} /></View>

          <View style={styles.header}>
            <Text style={styles.title}>Choose your tag name</Text>
            <Text style={styles.subtitle}>This tag will be used by others to send you money.</Text>
          </View>

          <View style={styles.inputWrap}>
            <TextInput
              value={tag}
              onChangeText={setTag}
              placeholder="Enter your tag name"
              placeholderTextColor="#9CA3AF"
              autoCapitalize="none"
              autoCorrect={false}
              style={styles.input}
              returnKeyType="done"
              onSubmitEditing={onContinue}
            />
          </View>

          <View style={{ flex: 1 }} />

          <View style={styles.bottom}>
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={onContinue}
              disabled={!canContinue || loading}
              style={[styles.cta, (!canContinue || loading) && styles.ctaDisabled]}
            >
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={[styles.ctaText, (!canContinue || loading) && styles.ctaTextDisabled]}>Continue</Text>}
            </TouchableOpacity>

            <Text style={styles.footerText}>
              Do you have an account? <Text onPress={onPressLogin} style={styles.footerLink}>Log in</Text>
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  container: { flex: 1, backgroundColor: '#FFFFFF', paddingTop: 32 },
  handleWrap: { alignItems: 'center', marginBottom: 40 },
  handle: { width: 36, height: 4, backgroundColor: '#D1D5DB', borderRadius: 2 },
  header: { paddingHorizontal: 24 },
  title: { fontSize: 20, lineHeight: 28, fontWeight: '600', color: '#111827', marginBottom: 8 },
  subtitle: { fontSize: 14, lineHeight: 20, color: '#6B7280', marginBottom: 24 },
  inputWrap: { paddingHorizontal: 24 },
  input: { height: 48, borderRadius: 12, paddingHorizontal: 12, backgroundColor: '#F6F6F6', fontSize: 16, color: '#111827' },
  bottom: { paddingHorizontal: 24, paddingBottom: 16, alignItems: 'center' },
  cta: { height: 52, borderRadius: 16, backgroundColor: '#111111', alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  ctaDisabled: { backgroundColor: '#E5E7EB' },
  ctaText: { color: '#FFFFFF', fontWeight: '600', fontSize: 16 },
  ctaTextDisabled: { color: '#9CA3AF' },
  footerText: { color: '#6B7280', fontSize: 13 },
  footerLink: { color: '#111111', fontWeight: '600' },
});