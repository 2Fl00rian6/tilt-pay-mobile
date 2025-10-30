package com.tilt.pay.nfc

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log
import com.facebook.react.ReactApplication
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.modules.core.DeviceEventManagerModule

class HceReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        val response = intent.getStringExtra("response") ?: return
        Log.d("HceReceiver", "📩 Données HCE: $response")

        val reactApp = context.applicationContext as ReactApplication
        val reactContext = reactApp.reactNativeHost.reactInstanceManager.currentReactContext

        reactContext?.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            ?.emit("HCE_EVENT", intent.extras)
    }
}