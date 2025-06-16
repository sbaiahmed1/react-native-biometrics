package com.sbaiahmed1.reactnativebiometrics

import android.os.Handler
import android.os.Looper
import android.content.Context
import androidx.biometric.BiometricManager
import androidx.biometric.BiometricPrompt
import androidx.core.content.ContextCompat
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactMethod

class ReactNativeBiometricsModule(reactContext: ReactApplicationContext) :
  ReactNativeBiometricsSpec(reactContext) {
  companion object {
    const val NAME = "ReactNativeBiometrics" // Make sure this exists and is correct
  }
  private val context: Context = reactContext

  override fun getName() = NAME

  @ReactMethod
  override fun isSensorAvailable(promise: Promise) {
    val biometricManager = BiometricManager.from(context)
    val result = Arguments.createMap()

    when (biometricManager.canAuthenticate(BiometricManager.Authenticators.BIOMETRIC_STRONG)) {
      BiometricManager.BIOMETRIC_SUCCESS -> {
        result.putBoolean("available", true)
        result.putString("biometryType", "Biometrics")
      }
      else -> {
        result.putBoolean("available", false)
        result.putString("biometryType", "None")
      }
    }
    promise.resolve(result)
  }

  @ReactMethod
  override fun simplePrompt(reason: String, promise: Promise) {
    val executor = ContextCompat.getMainExecutor(context)

    val promptInfo = BiometricPrompt.PromptInfo.Builder()
      .setTitle(reason)
      .setSubtitle(reason)
      .setNegativeButtonText("Cancel")
      .setAllowedAuthenticators(BiometricManager.Authenticators.BIOMETRIC_STRONG)
      .build()

    val callback = object : BiometricPrompt.AuthenticationCallback() {
      override fun onAuthenticationSucceeded(result: BiometricPrompt.AuthenticationResult) {
        promise.resolve(true)
      }

      override fun onAuthenticationError(errorCode: Int, errString: CharSequence) {
        promise.reject("AUTH_ERROR", errString.toString())
      }
    }

    Handler(Looper.getMainLooper()).post {
      val activity = currentActivity as? androidx.fragment.app.FragmentActivity
      if (activity != null) {
        val biometricPrompt = BiometricPrompt(activity, executor, callback)
        biometricPrompt.authenticate(promptInfo)
      } else {
        promise.reject("NO_ACTIVITY", "No active activity")
      }
    }
  }
}
