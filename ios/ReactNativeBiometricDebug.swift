import Foundation
import UIKit
import LocalAuthentication

/**
 * Utility class for handling debug logging and diagnostic information
 * in React Native Biometrics
 */
public class ReactNativeBiometricDebug {
  
  /**
   * Logs a debug message if debug mode is enabled
   * - Parameter message: The message to log
   */
  public static func debugLog(_ message: String) {
    if isDebugModeEnabled() {
      debugPrint("[ReactNativeBiometrics Debug] \(message)")
    }
  }
  
  /**
   * Checks if debug mode is enabled
   * - Returns: True if debug mode is enabled, false otherwise
   */
  static func isDebugModeEnabled() -> Bool {
    return UserDefaults.standard.bool(forKey: "ReactNativeBiometricsDebugMode")
  }
  
  /**
   * Gets biometric capabilities of the device
   * - Returns: Array of capability strings
   */
  static func getBiometricCapabilities() -> [String] {
    let context = LAContext()
    var capabilities: [String] = []

    if #available(iOS 11.0, *) {
      switch context.biometryType {
      case .faceID:
        capabilities.append("FaceID")
      case .touchID:
        capabilities.append("TouchID")
      case .opticID:
        capabilities.append("OpticID")
      case .none:
        capabilities.append("None")
      @unknown default:
        capabilities.append("Unknown")
      }
    } else {
      capabilities.append("Legacy")
    }

    return capabilities
  }
  
  /**
   * Gets the security level of the device
   * - Returns: Security level string
   */
  static func getSecurityLevel() -> String {
    // iOS always uses secure hardware for biometrics
    return "SecureHardware"
  }
  
  /**
   * Gets enrolled biometrics on the device
   * - Returns: Array of enrolled biometric types
   */
  static func getEnrolledBiometrics() -> [String] {
    let context = LAContext()
    var enrolled: [String] = []

    if context.canEvaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, error: nil) {
      if #available(iOS 11.0, *) {
        switch context.biometryType {
        case .faceID:
          enrolled.append("FaceID")
        case .touchID:
          enrolled.append("TouchID")
        case .opticID:
          enrolled.append("OpticID")
        default:
          break
        }
      }
    }

    return enrolled
  }
  
  /**
   * Gets comprehensive diagnostic information about the device
   * - Returns: Dictionary containing diagnostic information
   */
  static func getDiagnosticInfo() -> [String: Any] {
    let context = LAContext()
    var error: NSError?

    return [
      "platform": "iOS",
      "osVersion": UIDevice.current.systemVersion,
      "deviceModel": UIDevice.current.model,
      "biometricCapabilities": getBiometricCapabilities(),
      "securityLevel": getSecurityLevel(),
      "keyguardSecure": context.canEvaluatePolicy(.deviceOwnerAuthentication, error: &error),
      "enrolledBiometrics": getEnrolledBiometrics(),
      "lastError": error?.localizedDescription ?? ""
    ]
  }
  
  /**
   * Runs comprehensive biometric tests
   * - Returns: Dictionary containing test results
   */
  static func runBiometricTest() -> [String: Any] {
    let context = LAContext()
    var error: NSError?
    var errors: [String] = []
    var warnings: [String] = []

    // Test sensor availability
    let sensorAvailable = context.canEvaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, error: &error)
    if let error = error {
      errors.append("Sensor test failed: \(error.localizedDescription)")
    }

    // Test authentication capability
    let canAuthenticate = context.canEvaluatePolicy(.deviceOwnerAuthentication, error: &error)
    if let error = error {
      errors.append("Authentication test failed: \(error.localizedDescription)")
    }

    // Check hardware detection
    let hardwareDetected = context.biometryType != .none
    if !hardwareDetected {
      warnings.append("No biometric hardware detected")
    }

    // Check enrolled biometrics
    let hasEnrolledBiometrics = sensorAvailable
    if !hasEnrolledBiometrics {
      warnings.append("No biometrics enrolled")
    }

    // Check secure hardware (always true on iOS)
    let secureHardware = true

    let results: [String: Any] = [
      "sensorAvailable": sensorAvailable,
      "canAuthenticate": canAuthenticate,
      "hardwareDetected": hardwareDetected,
      "hasEnrolledBiometrics": hasEnrolledBiometrics,
      "secureHardware": secureHardware
    ]

    return [
      "success": errors.isEmpty,
      "results": results,
      "errors": errors,
      "warnings": warnings
    ]
  }
}
