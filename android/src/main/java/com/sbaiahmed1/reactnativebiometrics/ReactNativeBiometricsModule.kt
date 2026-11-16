package com.sbaiahmed1.reactnativebiometrics

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableMap

/**
 * TurboModule implementation. Extends the codegen-generated
 * NativeReactNativeBiometricsSpec.
 */
class ReactNativeBiometricsModule(reactContext: ReactApplicationContext) :
  NativeReactNativeBiometricsSpec(reactContext) {

  companion object {
    const val NAME = "ReactNativeBiometrics"
  }

  private val sharedImpl = ReactNativeBiometricsSharedImpl(reactContext)

  init {
    // Detection is not started here: JS calls startBiometricChangeDetection().
    sharedImpl.setBiometricChangeListener { event -> emitOnBiometricChange(event) }
  }

  override fun getName() = NAME

  @ReactMethod
  override fun isSensorAvailable(biometricStrength: String?, promise: Promise) {
    sharedImpl.isSensorAvailable(biometricStrength, promise)
  }

  @ReactMethod
  override fun simplePrompt(reason: String, biometricStrength: String?, promise: Promise) {
    sharedImpl.simplePrompt(reason, "Cancel", biometricStrength, promise)
  }

  // Delegate all other methods to shared implementation
  @ReactMethod
  override fun authenticateWithOptions(options: ReadableMap, promise: Promise) {
    sharedImpl.authenticateWithOptions(options, promise)
  }

  @ReactMethod
  override fun createKeys(keyAlias: String?, keyType: String?, biometricStrength: String?, allowDeviceCredentials: Boolean?, failIfExists: Boolean?, promise: Promise) {
    sharedImpl.createKeysWithType(keyAlias, keyType, biometricStrength, allowDeviceCredentials ?: false, failIfExists ?: false, promise)
  }

  @ReactMethod
  override fun createKeysWithOptions(options: ReadableMap, promise: Promise) {
    sharedImpl.createKeysWithOptions(options, promise)
  }

  @ReactMethod
  override fun getPublicKey(keyAlias: String?, promise: Promise) {
    sharedImpl.getPublicKey(keyAlias, promise)
  }

  @ReactMethod
  override fun signData(options: ReadableMap, promise: Promise) {
    sharedImpl.signData(options, promise)
  }

  @ReactMethod
  override fun deleteKeys(keyAlias: String?, promise: Promise) {
    sharedImpl.deleteKeys(keyAlias, promise)
  }

  @ReactMethod
  override fun getAllKeys(customAlias: String?, promise: Promise) {
    sharedImpl.getAllKeys(customAlias, promise)
  }

  @ReactMethod
  override fun validateKeyIntegrity(keyAlias: String?, promise: Promise) {
    sharedImpl.validateKeyIntegrity(keyAlias, promise)
  }

  @ReactMethod
  override fun verifyKeySignature(keyAlias: String?, data: String, promptTitle: String?, promptSubtitle: String?, cancelButtonText: String?, promise: Promise) {
    sharedImpl.verifyKeySignature(keyAlias, data, promptTitle, promptSubtitle, cancelButtonText, promise)
  }

  @ReactMethod
  override fun verifyKeySignatureWithOptions(keyAlias: String?, data: String, promptTitle: String?, promptSubtitle: String?, cancelButtonText: String?, biometricStrength: String?, disableDeviceFallback: Boolean?, inputEncoding: String?, promise: Promise) {
    sharedImpl.verifyKeySignature(keyAlias, data, promptTitle, promptSubtitle, cancelButtonText, biometricStrength, disableDeviceFallback ?: false, inputEncoding ?: "utf8", promise)
  }

  @ReactMethod
  override fun verifyKeySignatureWithEncoding(keyAlias: String?, data: String, promptTitle: String?, promptSubtitle: String?, cancelButtonText: String?, inputEncoding: String?, promise: Promise) {
    sharedImpl.verifyKeySignature(keyAlias, data, promptTitle, promptSubtitle, cancelButtonText, null, false, inputEncoding ?: "utf8", promise)
  }

  @ReactMethod
  override fun validateSignature(keyAlias: String?, data: String, signature: String, promise: Promise) {
    sharedImpl.validateSignature(keyAlias, data, signature, promise)
  }

  @ReactMethod
  override fun sha256(data: String, inputEncoding: String?, promise: Promise) {
    sharedImpl.sha256(data, inputEncoding, promise)
  }

  @ReactMethod
  override fun getKeyAttributes(keyAlias: String?, promise: Promise) {
    sharedImpl.getKeyAttributes(keyAlias, promise)
  }

  @ReactMethod
  override fun configureKeyAlias(keyAlias: String, promise: Promise) {
    sharedImpl.configureKeyAlias(keyAlias, promise)
  }

  @ReactMethod
  override fun getDefaultKeyAlias(promise: Promise) {
    sharedImpl.getDefaultKeyAlias(promise)
  }

  @ReactMethod
  override fun getDiagnosticInfo(promise: Promise) {
    sharedImpl.getDiagnosticInfo(promise)
  }

  @ReactMethod
  override fun runBiometricTest(promise: Promise) {
    sharedImpl.runBiometricTest(promise)
  }

  @ReactMethod
  override fun setDebugMode(enabled: Boolean, promise: Promise) {
    sharedImpl.setDebugMode(enabled, promise)
  }

  @ReactMethod
  override fun getDeviceIntegrityStatus(promise: Promise) {
    sharedImpl.getDeviceIntegrityStatus(promise)
  }

  @ReactMethod
  override fun startBiometricChangeDetection(promise: Promise) {
    sharedImpl.startBiometricChangeDetection()
    promise.resolve(null)
  }

  @ReactMethod
  override fun stopBiometricChangeDetection(promise: Promise) {
    sharedImpl.stopBiometricChangeDetection()
    promise.resolve(null)
  }

  override fun invalidate() {
    // Cleanup when the React Native instance is destroyed
    sharedImpl.stopBiometricChangeDetection()
    super.invalidate()
  }
}
