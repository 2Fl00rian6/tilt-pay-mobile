package com.tiltpay

import android.bluetooth.BluetoothAdapter
import android.bluetooth.BluetoothManager
import android.bluetooth.le.AdvertiseCallback
import android.bluetooth.le.AdvertiseData
import android.bluetooth.le.AdvertiseSettings
import android.bluetooth.le.BluetoothLeAdvertiser
import android.content.Context
import android.os.ParcelUuid
import android.util.Log
import com.facebook.react.bridge.*

import java.nio.charset.StandardCharsets
import java.util.*

class BleAdvertiserModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    private var advertiser: BluetoothLeAdvertiser? = null
    private var advertising = false
    private var callback: AdvertiseCallback? = null
    private val serviceUUID: UUID = UUID.fromString("4fafc201-1fb5-459e-8fcc-c5c9c331914b")

    override fun getName(): String {
        return "BleAdvertiser"
    }

    @ReactMethod
    fun startAdvertising(message: String, promise: Promise) {
        try {
            val manager = reactApplicationContext.getSystemService(Context.BLUETOOTH_SERVICE) as BluetoothManager
            val adapter = manager.adapter
            if (adapter == null || !adapter.isEnabled) {
                promise.reject("BT_DISABLED", "Bluetooth non activé")
                return
            }

            advertiser = adapter.bluetoothLeAdvertiser
            if (advertiser == null) {
                promise.reject("NO_ADVERTISER", "BLE Advertising non supporté")
                return
            }

            val settings = AdvertiseSettings.Builder()
                .setAdvertiseMode(AdvertiseSettings.ADVERTISE_MODE_LOW_LATENCY)
                .setConnectable(false)
                .setTimeout(0)
                .setTxPowerLevel(AdvertiseSettings.ADVERTISE_TX_POWER_HIGH)
                .build()

            val dataBuilder = AdvertiseData.Builder()
                .addServiceUuid(ParcelUuid(serviceUUID))

            // Limite 31 bytes max → texte simple (ex: "TILTPAY:15.90")
            val msgBytes = message.toByteArray(StandardCharsets.UTF_8)
            val truncatedMsg = if (msgBytes.size > 20) msgBytes.copyOf(20) else msgBytes

            dataBuilder.addServiceData(ParcelUuid(serviceUUID), truncatedMsg)
            val data = dataBuilder.build()

            callback = object : AdvertiseCallback() {
                override fun onStartSuccess(settingsInEffect: AdvertiseSettings) {
                    Log.i("BleAdvertiser", "✅ Advertising started: $message")
                    advertising = true
                    promise.resolve("Started")
                }

                override fun onStartFailure(errorCode: Int) {
                    Log.e("BleAdvertiser", "❌ Advertising failed: $errorCode")
                    advertising = false
                    promise.reject("ADVERT_FAIL", "Erreur $errorCode")
                }
            }

            advertiser?.startAdvertising(settings, data, callback)
        } catch (e: Exception) {
            Log.e("BleAdvertiser", "Exception", e)
            promise.reject("ADVERT_ERROR", e)
        }
    }

    @ReactMethod
    fun stopAdvertising(promise: Promise) {
        try {
            advertiser?.stopAdvertising(callback)
            advertising = false
            Log.i("BleAdvertiser", "🛑 Advertising stopped")
            promise.resolve("Stopped")
        } catch (e: Exception) {
            promise.reject("STOP_ERROR", e)
        }
    }
}