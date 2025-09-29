import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useTailwind } from 'tailwind-rn';
import { getCurrentUsername, clearToken } from '../utils/authStorage';

export default function HomeScreen({ navigation }) {
  const tw = useTailwind();

  async function onLogout() {
    const u = await getCurrentUsername();
    await clearToken(u);          // on garde le PIN
    navigation.replace('ChooseTag');
  }

  return (
    <View style={tw('flex-1 bg-white pt-16')}>
      <View style={tw('items-center mb-10')}>
        <View style={tw('w-16 h-1 bg-gray-300 rounded-full')} />
      </View>

      <View style={tw('px-6')}>
        <Text style={tw('text-xl font-semibold text-black mb-10')}>Home</Text>
        <TouchableOpacity onPress={onLogout} style={tw('h-12 rounded-2xl items-center justify-center bg-black')}>
          <Text style={tw('text-white font-semibold')}>Log out</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}