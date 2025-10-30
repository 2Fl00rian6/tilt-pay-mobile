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

    override fun processCommandApdu(apdu: ByteArray?, extras: Bundle?): ByteArray {
        if (apdu == null) return SELECT_OK

        val apduString = apdu.joinToString(" ") { "%02X".format(it) }
        Log.d(TAG, "📥 APDU reçu: $apduString")

        val message = String(apdu)
        sendEventToReact(message)

        return "ACK_FROM_HCE".toByteArray() + SELECT_OK
    }

    override fun onDeactivated(reason: Int) {
        Log.d(TAG, "❌ HCE désactivé: $reason")
    }

    private fun sendEventToReact(message: String) {
        try {
            val reactApp = application as ReactApplication
            val reactContext: ReactContext? = reactApp.reactNativeHost.reactInstanceManager.currentReactContext

            if (reactContext != null && reactContext.hasActiveCatalystInstance()) {
                val params = Arguments.createMap()
                params.putString("response", message)
                reactContext
                    .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                    .emit("HCE_EVENT", params)
                Log.d(TAG, "✅ Événement HCE_EVENT envoyé: $message")
            } else {
                Log.w(TAG, "⚠️ ReactContext inactif — événement non envoyé")
            }
        } catch (e: Exception) {
            Log.e(TAG, "💥 Erreur émission HCE_EVENT: ${e.message}", e)
        }
    }
}