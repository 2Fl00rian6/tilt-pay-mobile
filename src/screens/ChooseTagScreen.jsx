import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, SafeAreaView } from 'react-native';
import HeaderBar from '../components/HeaderBar';

export default function ChooseTagScreen({ route, navigation }) {
  const phoneNumber = route?.params?.phoneNumber ?? '';
  const [tag, setTag] = useState('');

  const onContinue = () => {
    const tagName = tag.trim();
    if (!tagName) return;
    navigation.replace('SetPin', { phoneNumber, tagName, fullName: tagName });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <HeaderBar title="" onBack={() => navigation.replace('EnterPhone')} />
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
            <TouchableOpacity onPress={onContinue} activeOpacity={0.9} disabled={!tag.trim()} style={[styles.cta, !tag.trim() && styles.ctaDisabled]}>
              <Text style={[styles.ctaText, !tag.trim() && styles.ctaTextDisabled]}>Continue</Text>
            </TouchableOpacity>
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
});