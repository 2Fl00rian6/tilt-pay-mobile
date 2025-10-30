package com.tilt.pay.nfc

import android.bluetooth.*
import android.bluetooth.le.*
import android.content.Context
import android.os.ParcelUuid
import android.util.Log
import com.facebook.react.bridge.*
import java.util.*

class BlePeripheralModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    
    private val TAG = "BlePeripheral"
    private var bluetoothManager: BluetoothManager? = null
    private var gattServer: BluetoothGattServer? = null
    private var advertiser: BluetoothLeAdvertiser? = null
    
    private val SERVICE_UUID = UUID.fromString("12345678-1234-1234-1234-123456789abc")
    private val CHAR_UUID = UUID.fromString("12345678-1234-1234-1234-123456789abd")
    
    override fun getName() = "BlePeripheral"
    
    init {
        try {
            bluetoothManager = reactContext.getSystemService(Context.BLUETOOTH_SERVICE) as BluetoothManager
            Log.d(TAG, "✅ BlePeripheralModule initialisé")
        } catch (e: Exception) {
            Log.e(TAG, "❌ Erreur init", e)
        }
    }
    
    @ReactMethod
    fun startAdvertising(message: String, promise: Promise) {
        try {
            val adapter = bluetoothManager?.adapter
            if (adapter == null) {
                promise.reject("NO_BT", "Bluetooth non disponible")
                return
            }
            
            // Changer le nom Bluetooth de l'appareil pour être reconnaissable
            try {
                adapter.name = "TiltPay-${android.os.Build.MODEL.take(8)}"
                Log.d(TAG, "✅ Nom Bluetooth défini: ${adapter.name}")
            } catch (e: Exception) {
                Log.w(TAG, "⚠️ Impossible de changer le nom BT: ${e.message}")
            }
            
            advertiser = adapter.bluetoothLeAdvertiser
            if (advertiser == null) {
                promise.reject("NO_ADV", "BLE Advertising non supporté")
                return
            }
            
            // Créer le GATT Server
            gattServer = bluetoothManager?.openGattServer(reactApplicationContext, gattCallback)
            
            // Créer le service et la caractéristique
            val service = BluetoothGattService(SERVICE_UUID, BluetoothGattService.SERVICE_TYPE_PRIMARY)
            val characteristic = BluetoothGattCharacteristic(
                CHAR_UUID,
                BluetoothGattCharacteristic.PROPERTY_READ,
                BluetoothGattCharacteristic.PERMISSION_READ
            )
            characteristic.value = message.toByteArray()
            service.addCharacteristic(characteristic)
            gattServer?.addService(service)
            
            // Démarrer l'advertising avec nom visible
            val settings = AdvertiseSettings.Builder()
                .setAdvertiseMode(AdvertiseSettings.ADVERTISE_MODE_LOW_LATENCY)
                .setTxPowerLevel(AdvertiseSettings.ADVERTISE_TX_POWER_HIGH)
                .setConnectable(true)
                .setTimeout(0) // Pas de timeout
                .build()
            
            val data = AdvertiseData.Builder()
                .setIncludeDeviceName(true) // IMPORTANT: inclure le nom
                .addServiceUuid(ParcelUuid(SERVICE_UUID))
                .build()
            
            val scanResponse = AdvertiseData.Builder()
                .setIncludeDeviceName(true)
                .build()
            
            advertiser?.startAdvertising(settings, data, scanResponse, advertiseCallback)
            
            Log.d(TAG, "✅ Advertising démarré avec message: $message")
            promise.resolve(true)
            
        } catch (e: Exception) {
            Log.e(TAG, "❌ Erreur startAdvertising", e)
            promise.reject("ERROR", e.message)
        }
    }
    
    @ReactMethod
    fun stopAdvertising(promise: Promise) {
        try {
            advertiser?.stopAdvertising(advertiseCallback)
            gattServer?.close()
            
            // Restaurer le nom Bluetooth original si possible
            try {
                val adapter = bluetoothManager?.adapter
                adapter?.name = android.os.Build.MODEL
            } catch (e: Exception) {
                Log.w(TAG, "⚠️ Impossible de restaurer le nom BT")
            }
            
            Log.d(TAG, "✅ Advertising arrêté")
            promise.resolve(true)
        } catch (e: Exception) {
            Log.e(TAG, "❌ Erreur stopAdvertising", e)
            promise.reject("ERROR", e.message)
        }
    }
    
    private val advertiseCallback = object : AdvertiseCallback() {
        override fun onStartSuccess(settingsInEffect: AdvertiseSettings?) {
            Log.d(TAG, "✅ Advertising démarré avec succès")
        }
        
        override fun onStartFailure(errorCode: Int) {
            val errorMsg = when (errorCode) {
                ADVERTISE_FAILED_DATA_TOO_LARGE -> "Données trop grandes"
                ADVERTISE_FAILED_TOO_MANY_ADVERTISERS -> "Trop d'advertisers actifs"
                ADVERTISE_FAILED_ALREADY_STARTED -> "Déjà démarré"
                ADVERTISE_FAILED_INTERNAL_ERROR -> "Erreur interne"
                ADVERTISE_FAILED_FEATURE_UNSUPPORTED -> "Fonctionnalité non supportée"
                else -> "Erreur inconnue: $errorCode"
            }
            Log.e(TAG, "❌ Advertising échec: $errorMsg")
        }
    }
    
    private val gattCallback = object : BluetoothGattServerCallback() {
        override fun onConnectionStateChange(device: BluetoothDevice?, status: Int, newState: Int) {
            super.onConnectionStateChange(device, status, newState)
            if (newState == BluetoothProfile.STATE_CONNECTED) {
                Log.d(TAG, "📱 Appareil connecté: ${device?.address}")
            } else if (newState == BluetoothProfile.STATE_DISCONNECTED) {
                Log.d(TAG, "📱 Appareil déconnecté: ${device?.address}")
            }
        }
        
        override fun onCharacteristicReadRequest(
            device: BluetoothDevice?,
            requestId: Int,
            offset: Int,
            characteristic: BluetoothGattCharacteristic?
        ) {
            Log.d(TAG, "📖 Lecture demandée par ${device?.address}")
            gattServer?.sendResponse(
                device,
                requestId,
                BluetoothGatt.GATT_SUCCESS,
                0,
                characteristic?.value
            )
        }
    }
}