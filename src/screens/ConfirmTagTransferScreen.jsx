import React, { useState, useRef, useEffect } from 'react'
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Alert,
  Animated,
  Easing,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation, useRoute } from '@react-navigation/native'
import HeaderBar from '../components/HeaderBar'
import { transferByTag } from '../api/wallet'
import * as Haptics from 'expo-haptics'

export default function ConfirmTagTransferScreen() {
  const route = useRoute()
  const navigation = useNavigation()
  const { tag, amount, currency = 'USD' } = route.params
  const [loading, setLoading] = useState(false)

  const fadeAnim = useRef(new Animated.Value(0)).current
  const translateY = useRef(new Animated.Value(30)).current
  const scaleAnim = useRef(new Animated.Value(0.9)).current

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
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        damping: 12,
        stiffness: 100,
      }),
    ]).start()
  }, [])

  const currencySymbol = currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : '$'

  const handleConfirm = async () => {
    try {
      setLoading(true)
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
      await transferByTag({ tag, amount })
      Alert.alert('Success', 'Transfer sent!')
      navigation.popToTop()
    } catch (err) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
      Alert.alert('Error', err.response?.data?.message || 'Transfer failed')
    } finally {
      setLoading(false)
    }
  }

  const handleBack = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    navigation.goBack()
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <HeaderBar title="Confirm your transaction" onBack={handleBack} />
      
      <Animated.View
        style={[
          styles.container,
          {
            opacity: fadeAnim,
            transform: [{ translateY }],
          },
        ]}
      >
        <Animated.View 
          style={[
            styles.amountSection,
            {
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <Text style={styles.amountSymbol}>{currencySymbol}</Text>
          <Text style={styles.amount}>{amount}</Text>
        </Animated.View>

        <View style={styles.detailsContainer}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Send to</Text>
            <Text style={styles.detailValue}>{tag}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Delays</Text>
            <Text style={styles.detailValue}>Instant</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Fees</Text>
            <Text style={styles.detailValue}>{currencySymbol} 0.00</Text>
          </View>
          
          <View style={[styles.detailRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{currencySymbol} {amount}</Text>
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
            style={[styles.confirmBtn, loading && styles.confirmBtnLoading]}
            onPress={handleConfirm}
            disabled={loading}
            activeOpacity={0.95}
          >
            <Text style={styles.confirmText}>
              {loading ? 'Processing...' : 'Confirm'}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { 
    flex: 1, 
    backgroundColor: '#fff',
  },
  container: { 
    flex: 1, 
    paddingHorizontal: 24,
    justifyContent: 'space-between',
  },
  
  amountSection: {
    alignItems: 'center',
    marginTop: 80,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  amountSymbol: {
    fontSize: 48,
    fontWeight: '700',
    color: '#111827',
    marginRight: 4,
  },
  amount: { 
    fontSize: 64, 
    fontWeight: '700',
    color: '#111827',
  },
  
  detailsContainer: {
    marginTop: 'auto',
    paddingHorizontal: 8,
  },
  detailRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
  },
  detailLabel: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '400',
  },
  detailValue: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '500',
  },
  
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    marginTop: 8,
    paddingTop: 18,
  },
  totalLabel: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '600',
  },
  totalValue: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '700',
  },
  
  confirmBtn: {
    backgroundColor: '#111111',
    height: 56,
    borderRadius: 16,
    marginBottom: 36,
    marginTop: 32,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  confirmBtnLoading: {
    opacity: 0.7,
  },
  confirmText: { 
    color: '#fff', 
    fontSize: 16,
    fontWeight: '700',
  },
})