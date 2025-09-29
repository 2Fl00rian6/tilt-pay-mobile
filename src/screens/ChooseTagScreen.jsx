// src/screens/ChooseTagScreen.jsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from 'react-native';
import { useError } from '../context/ErrorContext';
import { setCurrentUsername, getPin } from '../utils/authStorage';

export default function ChooseTagScreen({ navigation }) {
  const { showError } = useError();
  const [tag, setTag] = useState('');

  useEffect(() => {
    // option: trim live
    setTag((t) => t.trimStart());
  }, []);

  const onContinue = async () => {
    const username = tag.trim();
    if (!username) {
      showError('Please enter your tag name', { position: 'top' });
      return;
    }
    await setCurrentUsername(username);
    const existingPin = await getPin(username);

    if (existingPin) {
      // compte existant => PIN à saisir
      navigation.replace('LoginPin', { username });
    } else {
      // onboarding => créer PIN (create -> confirm)
      navigation.replace('SetPin', { username });
    }
  };

  const onPressLogin = async () => {
    const username = tag.trim();
    if (!username) {
      showError('Enter your tag name first', { position: 'top' });
      return;
    }
    await setCurrentUsername(username);
    navigation.replace('LoginPin', { username });
  };

  const canContinue = tag.trim().length > 0;

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.safe}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.container}>
          {/* Handle */}
          <View style={styles.handleWrap}>
            <View style={styles.handle} />
          </View>

          {/* Titre + sous-titre */}
          <View style={styles.header}>
            <Text style={styles.title}>Choose your tag name</Text>
            <Text style={styles.subtitle}>
              This tag will be used by others to send you money.
            </Text>
          </View>

          {/* Champ */}
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

          {/* Spacer large (comme la maquette) */}
          <View style={{ flex: 1 }} />

          {/* Bouton bas */}
          <View style={styles.bottom}>
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={onContinue}
              disabled={!canContinue}
              style={[styles.cta, !canContinue && styles.ctaDisabled]}
            >
              <Text style={[styles.ctaText, !canContinue && styles.ctaTextDisabled]}>
                Continue
              </Text>
            </TouchableOpacity>

            <Text style={styles.footerText}>
              Do you have an account?{' '}
              <Text onPress={onPressLogin} style={styles.footerLink}>
                Log in
              </Text>
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
  input: {
    height: 48,
    borderRadius: 12,
    paddingHorizontal: 12,
    backgroundColor: '#F6F6F6',
    fontSize: 16,
    color: '#111827',
  },
  bottom: { paddingHorizontal: 24, paddingBottom: 16, alignItems: 'center' },
  cta: {
    height: 52,
    borderRadius: 16,
    backgroundColor: '#111111',
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  ctaDisabled: { backgroundColor: '#E5E7EB' },
  ctaText: { color: '#FFFFFF', fontWeight: '600', fontSize: 16 },
  ctaTextDisabled: { color: '#9CA3AF' },
  footerText: { color: '#6B7280', fontSize: 13 },
  footerLink: { color: '#111111', fontWeight: '600' },
});