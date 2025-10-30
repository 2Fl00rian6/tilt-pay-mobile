import React, { memo, useRef } from 'react'
import { View, Text, Pressable, StyleSheet, Animated } from 'react-native'
import * as Haptics from 'expo-haptics'
import { Svg, Path } from 'react-native-svg'

/* ---------- Icône backspace ---------- */
const IconBackspace = ({ size = 26, color = '#48484A' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M3 12l5.2-6H20a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H8.2L3 12z"
      stroke={color}
      strokeWidth="1.6"
      strokeLinejoin="round"
    />
    <Path
      d="M14.5 10l-3 3m0-3l3 3"
      stroke={color}
      strokeWidth="1.6"
      strokeLinecap="round"
    />
  </Svg>
)

const KEYS = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['', '0', 'back'],
]

function Key({ label, onPress }) {
  const scale = useRef(new Animated.Value(1)).current

  const pressIn = () => {
    Animated.spring(scale, {
      toValue: 0.92,
      useNativeDriver: true,
      speed: 40,
      bounciness: 5,
    }).start()
  }

  const pressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 35,
      bounciness: 7,
    }).start()
  }

  const handlePress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    onPress(label)
  }

  const renderContent = () => {
    if (label === 'back') return <IconBackspace />
    if (label === '') return <View style={{ width: 26 }} />
    return <Text style={styles.keyText}>{label}</Text>
  }

  return (
    <Pressable
      onPressIn={pressIn}
      onPressOut={pressOut}
      onPress={handlePress}
      style={({ pressed }) => [styles.keyWrap, pressed && styles.keyPressed]}
      hitSlop={12}
    >
      <Animated.View style={{ transform: [{ scale }] }}>
        {renderContent()}
      </Animated.View>
    </Pressable>
  )
}

function Keypad({ onKey, onBackspace }) {
  const handlePress = (key) => {
    if (key === 'back') onBackspace()
    else if (key !== '') onKey(key)
  }

  return (
    <View style={styles.grid}>
      {KEYS.map((row, i) => (
        <View key={i} style={styles.row}>
          {row.map((key) => (
            <Key key={key || i} label={key} onPress={handlePress} />
          ))}
        </View>
      ))}
    </View>
  )
}

export default memo(Keypad)

/* ---------- Styles ---------- */
const styles = StyleSheet.create({
  grid: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 32,
    gap: 18,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 40,
  },
  keyWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  keyPressed: {
    backgroundColor: '#F3F4F6',
  },
  keyText: {
    fontSize: 28,
    fontWeight: '500',
    color: '#111827',
  },
})