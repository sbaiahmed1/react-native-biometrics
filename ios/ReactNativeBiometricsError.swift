import Foundation
import LocalAuthentication

// MARK: - ReactNativeBiometricsError
public enum ReactNativeBiometricsError: Error {
  case userCancel
  case userFallback
  case systemCancel
  case authenticationFailed
  case invalidContext
  case notInteractive
  case biometryNotAvailable
  case biometryNotEnrolled
  case biometryLockout
  case biometryLockoutPermanent
  case passcodeNotSet
  case touchIDNotAvailable
  case touchIDNotEnrolled
  case touchIDLockout
  case faceIDNotAvailable
  case faceIDNotEnrolled
  case faceIDLockout
  case watchNotAvailable
  case biometryDisconnected

  case keyNotFound
  case keyCreationFailed
  case keyAlreadyExists
  case keyDeletionFailed
  case keyAccessFailed
  case invalidKeyAlias
  case keyExportFailed
  case publicKeyExtractionFailed
  case accessControlCreationFailed
  case keychainQueryFailed
  case invalidKeyReference
  case keyIntegrityCheckFailed

  case signatureCreationFailed
  case signatureVerificationFailed
  case invalidSignatureFormat
  case algorithmNotSupported
  case dataEncodingFailed

  case emptyData
  case emptySignature
  case emptyKeyAlias
  case invalidBase64
  case invalidParameters

  case secureEnclaveNotAvailable
  case hardwareNotSupported
  case osVersionNotSupported
  case memoryAllocationFailed
  case unexpectedError(String)

  case unknown(Int)

  public var errorInfo: (code: String, message: String) {
    switch self {
      // Authentication Errors
    case .userCancel:
      return ("USER_CANCEL", "User canceled authentication")
    case .userFallback:
      return ("USER_FALLBACK", "User selected fallback authentication")
    case .systemCancel:
      return ("SYSTEM_CANCEL", "System canceled authentication")
    case .authenticationFailed:
      return ("AUTHENTICATION_FAILED", "Authentication failed")
    case .invalidContext:
      return ("INVALID_CONTEXT", "Invalid authentication context")
    case .notInteractive:
      return ("NOT_INTERACTIVE", "Authentication not interactive")
    case .biometryNotAvailable:
      return ("BIOMETRY_NOT_AVAILABLE", "Biometric authentication not available")
    case .biometryNotEnrolled:
      return ("BIOMETRY_NOT_ENROLLED", "No biometric data enrolled")
    case .biometryLockout:
      return ("BIOMETRY_LOCKOUT", "Biometric authentication locked out")
    case .biometryLockoutPermanent:
      return ("BIOMETRY_LOCKOUT_PERMANENT", "Biometric authentication permanently locked out")
    case .passcodeNotSet:
      return ("PASSCODE_NOT_SET", "Device passcode not set")
    case .touchIDNotAvailable:
      return ("TOUCH_ID_NOT_AVAILABLE", "Touch ID not available")
    case .touchIDNotEnrolled:
      return ("TOUCH_ID_NOT_ENROLLED", "Touch ID not enrolled")
    case .touchIDLockout:
      return ("TOUCH_ID_LOCKOUT", "Touch ID locked out")
    case .faceIDNotAvailable:
      return ("FACE_ID_NOT_AVAILABLE", "Face ID not available")
    case .faceIDNotEnrolled:
      return ("FACE_ID_NOT_ENROLLED", "Face ID not enrolled")
    case .faceIDLockout:
      return ("FACE_ID_LOCKOUT", "Face ID locked out")
    case .watchNotAvailable:
      return ("WATCH_NOT_AVAILABLE", "Apple Watch not available")
    case .biometryDisconnected:
      return ("BIOMETRY_DISCONNECTED", "Biometric sensor disconnected")

      // Key Management Errors
    case .keyNotFound:
      return ("KEY_NOT_FOUND", "Cryptographic key not found")
    case .keyCreationFailed:
      return ("KEY_CREATION_FAILED", "Failed to create cryptographic key")
    case .keyAlreadyExists:
      return ("KEY_ALREADY_EXISTS", "A key with this alias already exists")
    case .keyDeletionFailed:
      return ("KEY_DELETION_FAILED", "Failed to delete cryptographic key")
    case .keyAccessFailed:
      return ("KEY_ACCESS_FAILED", "Failed to access cryptographic key")
    case .invalidKeyAlias:
      return ("INVALID_KEY_ALIAS", "Invalid key alias provided")
    case .keyExportFailed:
      return ("KEY_EXPORT_FAILED", "Failed to export key data")
    case .publicKeyExtractionFailed:
      return ("PUBLIC_KEY_EXTRACTION_FAILED", "Failed to extract public key")
    case .accessControlCreationFailed:
      return ("ACCESS_CONTROL_CREATION_FAILED", "Failed to create access control")
    case .keychainQueryFailed:
      return ("KEYCHAIN_QUERY_FAILED", "Keychain query operation failed")
    case .invalidKeyReference:
      return ("INVALID_KEY_REFERENCE", "Invalid key reference")
    case .keyIntegrityCheckFailed:
      return ("KEY_INTEGRITY_CHECK_FAILED", "Key integrity verification failed")

      // Signature Errors
    case .signatureCreationFailed:
      return ("SIGNATURE_CREATION_FAILED", "Failed to create digital signature")
    case .signatureVerificationFailed:
      return ("SIGNATURE_VERIFICATION_FAILED", "Failed to verify digital signature")
    case .invalidSignatureFormat:
      return ("INVALID_SIGNATURE_FORMAT", "Invalid signature format")
    case .algorithmNotSupported:
      return ("ALGORITHM_NOT_SUPPORTED", "Cryptographic algorithm not supported")
    case .dataEncodingFailed:
      return ("DATA_ENCODING_FAILED", "Failed to encode data")

      // Input Validation Errors
    case .emptyData:
      return ("EMPTY_DATA", "Data parameter cannot be empty")
    case .emptySignature:
      return ("EMPTY_SIGNATURE", "Signature parameter cannot be empty")
    case .emptyKeyAlias:
      return ("EMPTY_KEY_ALIAS", "Key alias cannot be empty")
    case .invalidBase64:
      return ("INVALID_BASE64", "Invalid base64 encoding")
    case .invalidParameters:
      return ("INVALID_PARAMETERS", "Invalid parameters provided")

      // System Errors
    case .secureEnclaveNotAvailable:
      return ("SECURE_ENCLAVE_NOT_AVAILABLE", "Secure Enclave not available")
    case .hardwareNotSupported:
      return ("HARDWARE_NOT_SUPPORTED", "Hardware not supported")
    case .osVersionNotSupported:
      return ("OS_VERSION_NOT_SUPPORTED", "OS version not supported")
    case .memoryAllocationFailed:
      return ("MEMORY_ALLOCATION_FAILED", "Memory allocation failed")
    case .unexpectedError(let message):
      return ("UNEXPECTED_ERROR", "Unexpected error: \(message)")
    case .unknown(let code):
      return ("UNKNOWN_ERROR", "Unknown error with code: \(code)")
    }
  }

  public static func fromLAError(_ error: LAError) -> ReactNativeBiometricsError {
    switch error.code {
    case .userCancel:
      return .userCancel
    case .userFallback:
      return .userFallback
    case .systemCancel:
      return .systemCancel
    case .authenticationFailed:
      return .authenticationFailed
    case .invalidContext:
      return .invalidContext
    case .notInteractive:
      return .notInteractive
    case .biometryNotAvailable:
      return .biometryNotAvailable
    case .biometryNotEnrolled:
      return .biometryNotEnrolled
    case .biometryLockout:
      return .biometryLockout
    case .passcodeNotSet:
      return .passcodeNotSet
    case .touchIDNotAvailable:
      return .touchIDNotAvailable
    case .touchIDNotEnrolled:
      return .touchIDNotEnrolled
    case .touchIDLockout:
      return .touchIDLockout
    case .biometryDisconnected:
      return .biometryDisconnected
    default:
      return .unknown(error.code.rawValue)
    }
  }

  public static func fromOSStatus(_ status: OSStatus) -> ReactNativeBiometricsError {
    switch status {
    case errSecItemNotFound:
      return .keyNotFound
    case errSecAuthFailed:
      return .authenticationFailed
    case errSecUserCanceled:
      return .userCancel
    case errSecNotAvailable:
      return .secureEnclaveNotAvailable
    case errSecParam:
      return .invalidParameters
    case errSecAllocate:
      return .memoryAllocationFailed
    case errSecDuplicateItem:
      return .keyAlreadyExists
    case errSecDecode:
      return .invalidSignatureFormat
    default:
      return .unknown(Int(status))
    }
  }
}
