// src/screens/ChooseTagScreen.jsx
import React, { useState, useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import HeaderBar from '../components/HeaderBar';
import { useError } from '../context/ErrorContext';

export default function ChooseTagScreen({ route, navigation }) {
  const { showError } = useError();

  // Ces 2 params DOIVENT arriver depuis EnterPhoneScreen
  const dialCode = route?.params?.dialCode; // ex: "+33"
  const nsn      = route?.params?.nsn;      // ex: "68562749"
  const phoneDisplay = route?.params?.phoneDisplay || (dialCode && nsn ? `${dialCode} ${nsn}` : '');
  const mode = route?.params?.mode || 'register';

  const [fullName, setFullName] = useState('');
  const [tagName, setTagName]   = useState('');

  // Si on arrive sans nsn ou sans dialCode, on ne peut pas continuer
  const validChain = useMemo(() => typeof dialCode === 'string' && dialCode.startsWith('+') && !!nsn, [dialCode, nsn]);
  const canContinue = (fullName.trim().length >= 2) && (tagName.trim().length >= 3) && validChain;

  const goNext = () => {
    if (!validChain) {
      showError('Phone number not found, please re-enter it.', { position: 'top' });
      navigation.replace('EnterPhone');
      return;
    }
    if (fullName.trim().length < 2) {
      showError('Please enter your full name (min 2 chars).', { position: 'top' });
      return;
    }
    if (tagName.trim().length < 3) {
      showError('Please choose a tag (min 3 chars).', { position: 'top' });
      return;
    }
    // IMPORTANT : on renvoie dialCode & nsn SANS LES MODIFIER
    navigation.navigate('SetPin', {
      dialCode,
      nsn,
      phoneDisplay,
      fullName: fullName.trim(),
      tagName: tagName.trim(),
      mode,
    });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <HeaderBar title="" onBack={() => navigation.goBack()} />
      <View style={styles.container}>
        <View style={styles.handleWrap}><View style={styles.handle} /></View>

        <View style={{ paddingHorizontal: 24 }}>
          <Text style={styles.title}>Set up your profile</Text>
          <Text style={styles.subtitle}>Phone: {phoneDisplay || '(unknown)'}</Text>
        </View>

        <View style={{ paddingHorizontal: 24, marginTop: 16 }}>
          <Text style={styles.label}>Full name</Text>
          <TextInput
            value={fullName}
            onChangeText={setFullName}
            placeholder="John Doe"
            placeholderTextColor="#9CA3AF"
            style={styles.input}
            autoCapitalize="words"
            returnKeyType="next"
          />

          <Text style={[styles.label, { marginTop: 14 }]}>Your tag</Text>
          <TextInput
            value={tagName}
            onChangeText={setTagName}
            placeholder="johndoe"
            placeholderTextColor="#9CA3AF"
            style={styles.input}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="done"
            onSubmitEditing={goNext}
          />
        </View>

        <View style={{ flex: 1 }} />

        <View style={styles.bottom}>
          <TouchableOpacity
            onPress={goNext}
            activeOpacity={0.9}
            disabled={!canContinue}
            style={[styles.cta, !canContinue && styles.ctaDisabled]}
          >
            <Text style={[styles.ctaText, !canContinue && styles.ctaTextDisabled]}>
              Continue
            </Text>
          </TouchableOpacity>
        </View>
      </View>
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

  label: { color: '#6B7280', fontSize: 13, marginBottom: 6 },
  input: {
    height: 56, borderRadius: 14, borderWidth: 1, borderColor: '#D1D5DB',
    paddingHorizontal: 16, backgroundColor: '#fff', color: '#111827', fontSize: 16,
  },

  bottom: { paddingHorizontal: 24, paddingBottom: 16, alignItems: 'center' },
  cta: {
    height: 56, borderRadius: 16, backgroundColor: '#111111',
    alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  ctaDisabled: { backgroundColor: '#E5E7EB' },
  ctaText: { color: '#FFFFFF', fontWeight: '700', fontSize: 16 },
  ctaTextDisabled: { color: '#9CA3AF' },
});