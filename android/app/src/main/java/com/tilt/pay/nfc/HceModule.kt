package com.tilt.pay.nfc

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import android.util.Log
import android.content.Intent

class HCEModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "HCEModule"

    @ReactMethod
    fun sendDataToHce(message: String) {
        Log.d("HCEModule", "🔄 Envoi HCE: $message")
        val intent = Intent("com.tilt.pay.HCE_EVENT")
        intent.putExtra("response", message)
        reactContext.sendBroadcast(intent)
    }
}