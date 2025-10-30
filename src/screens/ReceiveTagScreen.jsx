import React, { useRef, useEffect } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
  Share,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import HeaderBar from '../components/HeaderBar'
import * as Haptics from 'expo-haptics'
import { Svg, Path, Rect } from 'react-native-svg'

const IconCopy = ({ size = 20, color = '#fff' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="9" y="9" width="13" height="13" rx="2" stroke={color} strokeWidth="2" />
    <Path
      d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"
      stroke={color}
      strokeWidth="2"
    />
  </Svg>
)

export default function ReceiveTagScreen({ navigation, route }) {
  const userTag = route?.params?.tag || 'elliot.boyer' // Le tag de l'utilisateur connecté

  const fadeAnim = useRef(new Animated.Value(0)).current
  const translateY = useRef(new Animated.Value(30)).current

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 450,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        damping: 14,
        stiffness: 120,
      }),
    ]).start()
  }, [])

  const handleCopy = async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    // Copier le tag dans le presse-papier
    // import Clipboard from '@react-native-clipboard/clipboard'
    // Clipboard.setString(userTag)
    
    // Ou avec expo:
    // import * as Clipboard from 'expo-clipboard'
    // await Clipboard.setStringAsync(userTag)
    
    alert('Tag copied!')
  }

  const handleShare = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    try {
      await Share.share({
        message: `Send me money with my tag: ${userTag}`,
      })
    } catch (error) {
      console.log(error)
    }
  }

  const handleBack = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    navigation.goBack()
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <HeaderBar title="Receive money with tag" onBack={handleBack} />

      <Animated.View
        style={[
          styles.container,
          {
            opacity: fadeAnim,
            transform: [{ translateY }],
          },
        ]}
      >
        <View style={styles.content}>
          <Text style={styles.label}>Tag</Text>
          <View style={styles.tagContainer}>
            <Text style={styles.tagText}>{userTag}</Text>
            <TouchableOpacity 
              style={styles.copyIconBtn} 
              onPress={handleCopy}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                <Rect x="9" y="9" width="13" height="13" rx="2" stroke="#6B7280" strokeWidth="2" />
                <Path
                  d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"
                  stroke="#6B7280"
                  strokeWidth="2"
                />
              </Svg>
            </TouchableOpacity>
          </View>
        </View>

        <Animated.View
          style={{
            transform: [
              {
                translateY: translateY.interpolate({
                  inputRange: [0, 30],
                  outputRange: [0, 15],
                }),
              },
            ],
            opacity: fadeAnim,
          }}
        >
          <TouchableOpacity
            style={styles.copyBtn}
            onPress={handleCopy}
            activeOpacity={0.95}
          >
            <IconCopy />
            <Text style={styles.copyText}>Copy</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  container: { 
    flex: 1, 
    paddingHorizontal: 24,
    justifyContent: 'space-between',
  },
  
  content: {
    marginTop: 40,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 12,
  },
  tagContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tagText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
  copyIconBtn: {
    padding: 4,
  },
  
  copyBtn: {
    backgroundColor: '#111111',
    height: 56,
    borderRadius: 16,
    marginBottom: 36,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  copyText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
})