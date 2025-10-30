import React, { useState, useEffect, useRef } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
  PermissionsAndroid,
  Animated,
  Easing,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import HeaderBar from '../components/HeaderBar'
import * as Haptics from 'expo-haptics'
import BleManager from 'react-native-ble-manager'

const SERVICE_UUID = '4fafc201-1fb5-459e-8fcc-c5c9c331914b'
const CHARACTERISTIC_UUID = 'beb5483e-36e1-4688-b7f5-ea07361b26a8'

export default function ReceiveTapToPayScreen({ navigation }) {
  const [scanning, setScanning] = useState(false)
  const [foundDevices, setFoundDevices] = useState([])
  const [receivedAmount, setReceivedAmount] = useState(null)

  const fadeAnim = useRef(new Animated.Value(0)).current
  const translateY = useRef(new Animated.Value(30)).current
  const pulseAnim = useRef(new Animated.Value(1)).current

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

    initBLE()
    return () => {
      stopScanning()
    }
  }, [])

  useEffect(() => {
    if (scanning) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start()
    } else {
      pulseAnim.setValue(1)
    }
  }, [scanning])

  const initBLE = async () => {
    try {
      await BleManager.start({ showAlert: false })
      console.log('✅ BLE Manager initialisé')

      if (Platform.OS === 'android') {
        const permissions = await requestAndroidPermissions()
        if (!permissions) {
          Alert.alert('Permissions requises', 'Les permissions Bluetooth sont nécessaires')
          return
        }
      }

      // Auto-start scanning
      await startScanning()
    } catch (error) {
      console.error('❌ Erreur init BLE:', error)
      Alert.alert('Erreur', 'Impossible d\'initialiser le Bluetooth')
    }
  }

  const requestAndroidPermissions = async () => {
    if (Platform.OS !== 'android') return true

    try {
      if (Platform.Version >= 31) {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        ])

        return (
          granted['android.permission.BLUETOOTH_SCAN'] === 'granted' &&
          granted['android.permission.BLUETOOTH_CONNECT'] === 'granted' &&
          granted['android.permission.ACCESS_FINE_LOCATION'] === 'granted'
        )
      } else {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        )
        return granted === 'granted'
      }
    } catch (error) {
      console.error('❌ Erreur permissions:', error)
      return false
    }
  }

  const startScanning = async () => {
    try {
      if (scanning) {
        console.log('⚠️ Scan déjà en cours')
        return
      }

      setFoundDevices([])
      setScanning(true)
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)

      BleManager.addListener('BleManagerDiscoverPeripheral', handleDiscoverPeripheral)

      await BleManager.scan([SERVICE_UUID], 30, true)
      console.log('🔍 Scan BLE démarré')

      setTimeout(() => {
        if (foundDevices.length === 0) {
          console.log('⏱️ Timeout scan - aucun appareil trouvé')
        }
      }, 30000)
    } catch (error) {
      console.error('❌ Erreur scan:', error)
      setScanning(false)
      
      const errorMessage = error?.message || error?.toString() || 'Erreur inconnue'
      Alert.alert('Erreur Scan', `Impossible de scanner: ${errorMessage}`)
    }
  }

  const stopScanning = async () => {
    try {
      if (!scanning) return
      
      await BleManager.stopScan()
      BleManager.removeAllListeners('BleManagerDiscoverPeripheral')
      setScanning(false)
      console.log('🛑 Scan arrêté')
    } catch (error) {
      console.error('❌ Erreur arrêt scan:', error)
      setScanning(false)
    }
  }

  const handleDiscoverPeripheral = (peripheral) => {
    console.log('📱 Appareil découvert:', peripheral)
    
    if (!peripheral?.id) {
      console.log('⚠️ Appareil ignoré (pas d\'id)')
      return
    }

    // Extraire les données du manufacturer
    if (peripheral.advertising?.manufacturerData) {
      try {
        const data = peripheral.advertising.manufacturerData
        const paymentDataString = String.fromCharCode(...data)
        const paymentData = JSON.parse(paymentDataString)
        
        console.log('💰 Données de paiement reçues:', paymentData)
        peripheral.paymentData = paymentData
      } catch (error) {
        console.log('⚠️ Impossible de parser les données manufacturer')
      }
    }

    setFoundDevices((prev) => {
      const exists = prev.find((d) => d.id === peripheral.id)
      if (exists) return prev
      return [...prev, peripheral]
    })
  }

  const acceptPayment = async (device) => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)
      
      if (device.paymentData) {
        setReceivedAmount(device.paymentData)
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
        
        Alert.alert(
          'Paiement reçu !',
          `Montant: ${device.paymentData.currency} ${device.paymentData.amount}`,
          [{ text: 'OK', onPress: () => navigation.popToTop() }]
        )
      } else {
        console.log('🔗 Connexion à:', device.name || device.id)
        await BleManager.connect(device.id)
        console.log('✅ Connecté')

        await BleManager.retrieveServices(device.id)

        // Lire les données
        const data = await BleManager.read(
          device.id,
          SERVICE_UUID,
          CHARACTERISTIC_UUID
        )

        const paymentDataString = String.fromCharCode(...data)
        const paymentData = JSON.parse(paymentDataString)
        
        setReceivedAmount(paymentData)
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
        
        Alert.alert(
          'Paiement reçu !',
          `Montant: ${paymentData.currency} ${paymentData.amount}`,
          [{ text: 'OK', onPress: () => navigation.popToTop() }]
        )
      }
    } catch (error) {
      console.error('❌ Erreur réception paiement:', error)
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
      
      const errorMessage = error?.message || error?.toString() || 'Erreur inconnue'
      Alert.alert('Erreur', `Échec de la réception: ${errorMessage}`)
    }
  }

  const handleBack = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    navigation.goBack()
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <HeaderBar title="Receive Payment" onBack={handleBack} />

      <Animated.View
        style={[
          styles.container,
          {
            opacity: fadeAnim,
            transform: [{ translateY }],
          },
        ]}
      >
        {/* Status */}
        <View style={styles.statusSection}>
          <Animated.View
            style={[
              styles.statusIndicator,
              scanning && styles.statusActive,
              { transform: [{ scale: pulseAnim }] },
            ]}
          />
          <Text style={styles.statusText}>
            {scanning ? '🔍 Scanning for payments...' : '○ Not scanning'}
          </Text>
        </View>

        {/* Instructions */}
        <View style={styles.instructionsContainer}>
          <Text style={styles.instructionTitle}>
            {foundDevices.length > 0
              ? 'Tap a device to receive'
              : 'Hold your phone near the sender'}
          </Text>
          <Text style={styles.instructionText}>
            {foundDevices.length > 0
              ? 'Select the device you want to receive payment from'
              : 'Waiting to detect payment devices...'}
          </Text>
        </View>

        {/* Appareils trouvés */}
        {foundDevices.length > 0 ? (
          <View style={styles.devicesContainer}>
            <Text style={styles.devicesTitle}>
              {foundDevices.length} device{foundDevices.length > 1 ? 's' : ''} found:
            </Text>
            {foundDevices.map((device) => (
              <TouchableOpacity
                key={device.id}
                style={styles.deviceItem}
                onPress={() => acceptPayment(device)}
                activeOpacity={0.7}
              >
                <View>
                  <Text style={styles.deviceName}>
                    {device.name || 'TiltPay Device'}
                  </Text>
                  {device.paymentData && (
                    <Text style={styles.deviceAmount}>
                      {device.paymentData.currency} {device.paymentData.amount}
                    </Text>
                  )}
                </View>
                <Text style={styles.tapText}>Tap to accept</Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : scanning ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Searching for devices...</Text>
          </View>
        ) : null}

        {/* Boutons */}
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
          {!scanning ? (
            <TouchableOpacity
              style={styles.scanBtn}
              onPress={startScanning}
              activeOpacity={0.95}
            >
              <Text style={styles.btnText}>Start scanning</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.scanBtn, styles.stopBtn]}
              onPress={stopScanning}
              activeOpacity={0.95}
            >
              <Text style={styles.btnText}>Stop scanning</Text>
            </TouchableOpacity>
          )}
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

  statusSection: {
    alignItems: 'center',
    marginTop: 60,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#E5E7EB',
  },
  statusActive: {
    backgroundColor: '#10B981',
  },
  statusText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },

  instructionsContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 40,
  },
  instructionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
    textAlign: 'center',
  },
  instructionText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },

  devicesContainer: {
    flex: 1,
    marginTop: 30,
  },
  devicesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  deviceItem: {
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  deviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  deviceAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: '#10B981',
  },
  tapText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },

  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#9CA3AF',
  },

  scanBtn: {
    backgroundColor: '#111111',
    height: 56,
    borderRadius: 16,
    marginBottom: 36,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  stopBtn: {
    backgroundColor: '#EF4444',
  },
  btnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
})