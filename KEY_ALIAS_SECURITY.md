# Key Alias Security Enhancement

## Overview

This document describes the comprehensive security enhancements in the React Native Biometrics library, including configurable app-specific key aliases, advanced key integrity validation, signature verification, and enhanced logging capabilities for security monitoring.

## Security Issue Fixed

### Implementation (Secure)
- **App-Specific Default**: Each app gets a unique default key alias based on bundle ID (iOS) or package name (Android)
- **Configurable Aliases**: Developers can set custom key aliases for different use cases
- **Isolation**: Each app's biometric keys are properly isolated

## API Changes

### New Configuration Functions

```typescript
// Configure a custom key alias
await configureKeyAlias('com.myapp.biometric.main');

// Get the current default key alias
const defaultAlias = await getDefaultKeyAlias();

// Configure using a config object
await configure({
  keyAlias: 'com.myapp.biometric.main',
  keyPrefix: 'com.myapp.secure'
});

// Enable security logging for monitoring
import { setDebugMode, enableLogging, LogLevel } from '@sbaiahmed1/react-native-biometrics';

await setDebugMode(true);
enableLogging(true);
setLogLevel(LogLevel.INFO);
```

### Enhanced Key Management

```typescript
// Create keys with default (configured) alias
const keyResult = await createKeys();
console.log('Public key:', keyResult.publicKey);

// Create keys with a specific alias
await createKeys('com.myapp.biometric.backup');

// Get all keys for audit purposes
const allKeys = await getAllKeys();
console.log('Total keys:', allKeys.keys.length);

// Delete keys with default (configured) alias
const deleteResult = await deleteKeys();
console.log('Deletion success:', deleteResult.success);

// Delete keys with a specific alias
await deleteKeys('com.myapp.biometric.backup');
```

## Default Key Alias Generation

### iOS
- **Format**: `{bundleId}.ReactNativeBiometrics`
- **Example**: `com.mycompany.myapp.ReactNativeBiometrics`
- **Storage**: Stored in `UserDefaults` with key `ReactNativeBiometrics_KeyAlias`

### Android
- **Format**: `{packageName}.ReactNativeBiometrics`
- **Example**: `com.mycompany.myapp.ReactNativeBiometrics`
- **Storage**: Stored in `SharedPreferences` with key `keyAlias`

## Migration Guide

### For Existing Apps

1. **No Action Required**: Existing apps will continue to work with the old hardcoded alias until you explicitly configure a new one.

2. **Recommended Migration**:
   ```typescript
   // Get all existing keys
   const existingKeys = await getAllKeys();
   
   // Configure new app-specific alias
   await configureKeyAlias('com.myapp.biometric.main');
   
   // Create new keys with the new alias
   await createKeys();
   
   // Optionally delete old keys (be careful!)
   // await deleteKeys('ReactNativeBiometricsKey');
   ```

3. **Gradual Migration**:
   ```typescript
   // Check if old keys exist
   const allKeys = await getAllKeys();
   const hasOldKeys = allKeys.keys.some(key => 
     key.alias === 'ReactNativeBiometricsKey'
   );
   
   if (hasOldKeys) {
     // Use old keys for now, migrate later
     console.log('Using legacy keys');
   } else {
     // Configure new alias for new installations
     await configureKeyAlias('com.myapp.biometric.main');
   }
   ```

## Advanced Security Features

### Key Integrity Validation

```typescript
// Comprehensive key integrity check
const integrityResult = await validateKeyIntegrity('com.myapp.biometric.main');

if (integrityResult.valid) {
  console.log('Key integrity verified');
  console.log('Hardware-backed:', integrityResult.integrityChecks.hardwareBacked);
  console.log('Key accessible:', integrityResult.integrityChecks.keyAccessible);
  console.log('Signature test:', integrityResult.integrityChecks.signatureTestPassed);
} else {
  console.error('Key integrity compromised:', integrityResult.error);
}
```

### Signature Verification

```typescript
// Generate and verify signatures for data integrity
const data = 'sensitive transaction data';

// Generate signature
const signatureResult = await verifyKeySignature('com.myapp.biometric.main', data);
if (signatureResult.success) {
  const signature = signatureResult.signature;
  
  // Later, validate the signature
  const validationResult = await validateSignature(
    'com.myapp.biometric.main',
    data,
    signature
  );
  
  if (validationResult.valid) {
    console.log('Data integrity verified');
  } else {
    console.error('Data may have been tampered with');
  }
}
```

### Key Attributes and Security Level

```typescript
// Get detailed key attributes for security assessment
const keyAttributes = await getKeyAttributes('com.myapp.biometric.main');

if (keyAttributes.exists) {
  const attrs = keyAttributes.attributes;
  console.log('Algorithm:', attrs.algorithm);
  console.log('Key size:', attrs.keySize);
  console.log('Security level:', attrs.securityLevel);
  console.log('Hardware-backed:', attrs.hardwareBacked);
  console.log('User auth required:', attrs.userAuthenticationRequired);
  console.log('Creation date:', attrs.creationDate);
}
```

## Security Best Practices

### 1. Use Descriptive Key Aliases
```typescript
// Good: Descriptive and app-specific
await configureKeyAlias('com.myapp.biometric.login');
await configureKeyAlias('com.myapp.biometric.payment');

// Avoid: Generic or potentially conflicting
await configureKeyAlias('biometric');
await configureKeyAlias('key');
```

### 2. Multiple Key Aliases for Different Purposes
```typescript
// Different aliases for different security contexts
const LOGIN_KEY_ALIAS = 'com.myapp.biometric.login';
const PAYMENT_KEY_ALIAS = 'com.myapp.biometric.payment';
const ADMIN_KEY_ALIAS = 'com.myapp.biometric.admin';

// Create keys for different purposes
await createKeys(LOGIN_KEY_ALIAS);
await createKeys(PAYMENT_KEY_ALIAS);
```

### 3. Key Rotation Strategy
```typescript
// Implement secure key rotation with integrity validation
const rotateKeys = async () => {
  const oldAlias = 'com.myapp.biometric.v1';
  const newAlias = 'com.myapp.biometric.v2';
  
  try {
    // Create new keys
    const newKeyResult = await createKeys(newAlias);
    
    // Validate new key integrity
    const integrityCheck = await validateKeyIntegrity(newAlias);
    if (!integrityCheck.valid) {
      throw new Error('New key integrity validation failed');
    }
    
    // Update configuration
    await configureKeyAlias(newAlias);
    
    // Test signature with new key
    const testData = 'key rotation test';
    const signatureTest = await verifyKeySignature(newAlias, testData);
    if (!signatureTest.success) {
      throw new Error('New key signature test failed');
    }
    
    // Delete old keys after successful validation
    await deleteKeys(oldAlias);
    
    console.log('Key rotation completed successfully');
  } catch (error) {
    console.error('Key rotation failed:', error);
    // Rollback if necessary
    await deleteKeys(newAlias);
    throw error;
  }
};
```

## Validation Rules

### Key Alias Requirements
- **Minimum Length**: 3 characters
- **Maximum Length**: 100 characters
- **Allowed Characters**: Letters, numbers, dots, hyphens, underscores
- **Pattern**: Must match `^[a-zA-Z0-9._-]+$`

### Examples
```typescript
// Valid aliases
'com.myapp.biometric'
'myapp_biometric_key'
'biometric-key-v1'
'app.biometric.2024'

// Invalid aliases
''                    // Too short
'a'                   // Too short
'key with spaces'     // Contains spaces
'key@domain.com'      // Contains @
'key#1'              // Contains #
```

## Error Handling and Security Monitoring

### Enhanced Error Handling

```typescript
import { logger, getLogs, clearLogs } from '@sbaiahmed1/react-native-biometrics';

try {
  await configureKeyAlias('com.myapp.biometric');
} catch (error) {
  if (error.message.includes('Invalid key alias')) {
    // Handle validation error
    logger.error('Key alias format is invalid', 'configureKeyAlias', error);
  } else if (error.message.includes('Key already exists')) {
    // Handle key collision
    logger.warn('Key alias already in use', 'configureKeyAlias', error);
  } else {
    // Handle other errors
    logger.error('Failed to configure key alias', 'configureKeyAlias', error);
  }
}
```

### Security Event Logging

```typescript
// Monitor security events
const monitorSecurityEvents = async () => {
  try {
    // Enable comprehensive logging
    await setDebugMode(true);
    
    // Perform security operations
    await createKeys('com.myapp.secure.key');
    const integrity = await validateKeyIntegrity('com.myapp.secure.key');
    
    // Get security logs for analysis
    const logs = getLogs();
    const securityLogs = logs.filter(log => 
      log.context.includes('security') || 
      log.context.includes('integrity') ||
      log.context.includes('signature')
    );
    
    // Send to security monitoring system
    await sendToSecurityMonitoring(securityLogs);
    
    // Clear logs after processing
    clearLogs();
  } catch (error) {
    logger.error('Security monitoring failed', 'monitorSecurityEvents', error);
  }
};
```

## Testing

### Unit Tests
```typescript
// Test key alias validation
it('should reject invalid key aliases', async () => {
  await expect(configureKeyAlias('')).rejects.toThrow('Invalid key alias');
  await expect(configureKeyAlias('a')).rejects.toThrow('Invalid key alias');
  await expect(configureKeyAlias('key with spaces')).rejects.toThrow('Invalid key alias');
});

// Test key isolation
it('should isolate keys by alias', async () => {
  await createKeys('alias1');
  await createKeys('alias2');
  
  const keys = await getAllKeys();
  expect(keys.keys).toHaveLength(2);
  
  await deleteKeys('alias1');
  const remainingKeys = await getAllKeys();
  expect(remainingKeys.keys).toHaveLength(1);
  expect(remainingKeys.keys[0].alias).toBe('alias2');
});
```

## Performance Considerations

- **Configuration Persistence**: Key alias configuration is persisted locally and loaded once during module initialization
- **No Network Calls**: All key alias operations are local
- **Minimal Overhead**: Key alias resolution adds negligible performance overhead

## Security Audit Checklist

- ✅ Hardcoded key aliases removed
- ✅ App-specific default aliases implemented
- ✅ Key alias validation implemented
- ✅ Secure storage for configuration
- ✅ Cross-app key isolation verified
- ✅ Migration path documented
- ✅ Error handling implemented
- ✅ Input validation added

## Security Compliance and Auditing

### Compliance Checklist

```typescript
// Security compliance validation
const validateSecurityCompliance = async (keyAlias: string) => {
  const compliance = {
    keyExists: false,
    hardwareBacked: false,
    integrityValid: false,
    signatureWorking: false,
    userAuthRequired: false,
    securityLevel: 'unknown'
  };
  
  try {
    // Check key existence and attributes
    const attributes = await getKeyAttributes(keyAlias);
    if (attributes.exists) {
      compliance.keyExists = true;
      compliance.hardwareBacked = attributes.attributes?.hardwareBacked || false;
      compliance.userAuthRequired = attributes.attributes?.userAuthenticationRequired || false;
      compliance.securityLevel = attributes.attributes?.securityLevel || 'unknown';
    }
    
    // Validate key integrity
    const integrity = await validateKeyIntegrity(keyAlias);
    compliance.integrityValid = integrity.valid;
    compliance.signatureWorking = integrity.integrityChecks.signatureTestPassed;
    
    return compliance;
  } catch (error) {
    logger.error('Security compliance check failed', 'validateSecurityCompliance', error);
    return compliance;
  }
};
```

### Audit Trail

```typescript
// Generate security audit report
const generateSecurityAudit = async () => {
  const audit = {
    timestamp: new Date().toISOString(),
    keys: [],
    securityEvents: [],
    complianceStatus: 'unknown'
  };
  
  try {
    // Get all keys for audit
    const allKeys = await getAllKeys();
    
    for (const key of allKeys.keys) {
      const compliance = await validateSecurityCompliance(key.alias);
      audit.keys.push({
        alias: key.alias,
        compliance
      });
    }
    
    // Get security-related logs
    const logs = getLogs();
    audit.securityEvents = logs.filter(log => 
      log.level === 'error' || log.level === 'warn'
    );
    
    // Determine overall compliance status
    const allCompliant = audit.keys.every(key => 
      key.compliance.keyExists && 
      key.compliance.hardwareBacked && 
      key.compliance.integrityValid
    );
    
    audit.complianceStatus = allCompliant ? 'compliant' : 'non-compliant';
    
    return audit;
  } catch (error) {
    logger.error('Security audit generation failed', 'generateSecurityAudit', error);
    return audit;
  }
};
```

## Future Enhancements

1. **Key Alias Encryption**: Encrypt key alias configuration in storage
2. **Automatic Key Rotation**: Scheduled key rotation policies with integrity validation
3. **Advanced Audit Logging**: Comprehensive security event logging with tamper detection
4. **Remote Security Policies**: Support for remote security configuration and compliance policies
5. **Key Alias Templates**: Predefined templates for industry-specific security requirements
6. **Biometric Template Protection**: Enhanced protection for biometric template data
7. **Multi-Factor Key Validation**: Combine multiple validation methods for enhanced security
8. **Real-time Security Monitoring**: Live monitoring of key integrity and usage patterns