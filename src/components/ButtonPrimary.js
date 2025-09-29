import React from 'react';
import { Pressable, Text } from 'react-native';
import { useTailwind } from 'tailwind-rn';

export default function ButtonPrimary({ title, onPress, disabled }) {
  const tw = useTailwind();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={tw(`${disabled ? 'bg-neutral-300' : 'bg-black'} w-full rounded-2xl py-4 items-center justify-center`)}
      android_ripple={{ color: '#333' }}
    >
      <Text style={tw('text-white font-semibold')}>{title}</Text>
    </Pressable>
  );
}
