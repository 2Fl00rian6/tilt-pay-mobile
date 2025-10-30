package com.tilt.pay.nfc

import android.nfc.cardemulation.HostApduService
import android.os.Bundle
import android.util.Log
import com.facebook.react.ReactApplication
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactContext
import com.facebook.react.modules.core.DeviceEventManagerModule

class TokenHostService : HostApduService() {
    private val TAG = "TokenHostService"
    private val SELECT_OK = byteArrayOf(0x90.toByte(), 0x00.toByte())

    init {
        Log.d(TAG, "🚀 TokenHostService INIT appelé!")
    }

    override fun onCreate() {
        super.onCreate()
        Log.d(TAG, "✅ TokenHostService.onCreate() appelé")
    }

    override fun onStartCommand(intent: android.content.Intent?, flags: Int, startId: Int): Int {
        Log.d(TAG, "🔄 TokenHostService.onStartCommand() appelé")
        return super.onStartCommand(intent, flags, startId)
    }

    override fun processCommandApdu(apdu: ByteArray?, extras: Bundle?): ByteArray {
        Log.d(TAG, "📥 ===== processCommandApdu APPELÉ =====")
        
        if (apdu == null) {
            Log.w(TAG, "⚠️ APDU null reçu")
            return SELECT_OK
        }

        val apduHex = apdu.joinToString(" ") { "%02X".format(it) }
        Log.d(TAG, "📥 APDU (${apdu.size} bytes): $apduHex")

        // Vérifier SELECT APDU (00 A4 04 00 ...)
        if (apdu.size >= 5 && apdu[0] == 0x00.toByte() && apdu[1] == 0xA4.toByte()) {
            Log.d(TAG, "✅ SELECT APDU reconnu → réponse 90 00")
            return SELECT_OK
        }

        // Traiter les données
        try {
            val message = String(apdu, Charsets.UTF_8)
            Log.d(TAG, "📩 Message: $message")
            sendEventToReact(message)
            
            val ack = "ACK_FROM_HCE".toByteArray(Charsets.UTF_8)
            Log.d(TAG, "📤 Envoi ACK + 90 00")
            return ack + SELECT_OK
        } catch (e: Exception) {
            Log.e(TAG, "❌ Erreur: ${e.message}", e)
            return SELECT_OK
        }
    }

    override fun onDeactivated(reason: Int) {
        val reasonStr = when (reason) {
            DEACTIVATION_LINK_LOSS -> "LINK_LOSS"
            DEACTIVATION_DESELECTED -> "DESELECTED"
            else -> "UNKNOWN($reason)"
        }
        Log.d(TAG, "❌ HCE désactivé: $reasonStr")
    }

    private fun sendEventToReact(message: String) {
        try {
            val reactApp = application as? ReactApplication
            if (reactApp == null) {
                Log.e(TAG, "❌ App non ReactApplication")
                return
            }

            val reactContext = reactApp.reactNativeHost.reactInstanceManager.currentReactContext

            if (reactContext?.hasActiveCatalystInstance() == true) {
                val params = Arguments.createMap()
                params.putString("response", message)
                reactContext
                    .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                    .emit("HCE_EVENT", params)
                Log.d(TAG, "✅ Événement envoyé à React: $message")
            } else {
                Log.w(TAG, "⚠️ ReactContext inactif")
            }
        } catch (e: Exception) {
            Log.e(TAG, "💥 Erreur React: ${e.message}", e)
        }
    }
}