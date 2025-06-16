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
import com.facebook.react.bridge.ReadableMap

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

  @ReactMethod
  fun authenticateWithOptions(options: ReadableMap, promise: Promise) {
    val executor = ContextCompat.getMainExecutor(context)
    val result = Arguments.createMap()

    val title = if (options.hasKey("title")) options.getString("title") else "Biometric Authentication"
    val subtitle = if (options.hasKey("subtitle")) options.getString("subtitle") else "Please verify your identity"
    val description = if (options.hasKey("description")) options.getString("description") else null
    val cancelLabel = if (options.hasKey("cancelLabel")) options.getString("cancelLabel") else "Cancel"
    val allowDeviceCredentials = if (options.hasKey("allowDeviceCredentials")) options.getBoolean("allowDeviceCredentials") else false
    val disableDeviceFallback = if (options.hasKey("disableDeviceFallback")) options.getBoolean("disableDeviceFallback") else false

    val authenticators = if (allowDeviceCredentials && !disableDeviceFallback) {
      BiometricManager.Authenticators.BIOMETRIC_STRONG or BiometricManager.Authenticators.DEVICE_CREDENTIAL
    } else {
      BiometricManager.Authenticators.BIOMETRIC_STRONG
    }

    val promptInfoBuilder = BiometricPrompt.PromptInfo.Builder()
      .setTitle(title!!)
      .setSubtitle(subtitle!!)
      .setAllowedAuthenticators(authenticators)

    if (description != null) {
      promptInfoBuilder.setDescription(description)
    }

    if (!allowDeviceCredentials || disableDeviceFallback) {
      promptInfoBuilder.setNegativeButtonText(cancelLabel!!)
    }

    val promptInfo = promptInfoBuilder.build()

    val callback = object : BiometricPrompt.AuthenticationCallback() {
      override fun onAuthenticationSucceeded(authResult: BiometricPrompt.AuthenticationResult) {
        result.putBoolean("success", true)
        promise.resolve(result)
      }

      override fun onAuthenticationError(errorCode: Int, errString: CharSequence) {
        result.putBoolean("success", false)
        result.putString("error", errString.toString())
        result.putString("errorCode", errorCode.toString())
        promise.resolve(result)
      }

      override fun onAuthenticationFailed() {
        result.putBoolean("success", false)
        result.putString("error", "Authentication failed")
        result.putString("errorCode", "AUTH_FAILED")
        promise.resolve(result)
      }
    }

    Handler(Looper.getMainLooper()).post {
      val activity = currentActivity as? androidx.fragment.app.FragmentActivity
      if (activity != null) {
        val biometricPrompt = BiometricPrompt(activity, executor, callback)
        biometricPrompt.authenticate(promptInfo)
      } else {
        result.putBoolean("success", false)
        result.putString("error", "No active activity")
        result.putString("errorCode", "NO_ACTIVITY")
        promise.resolve(result)
      }
    }
  }
}
