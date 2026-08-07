---
title: Error Codes
---

Common error codes returned by authentication methods:

| Code | Description | Platform |
|------|-------------|----------|
| `SENSOR_NOT_AVAILABLE` | Biometric sensor not available | Both |
| `USER_CANCEL` | User cancelled authentication | Both |
| `USER_FALLBACK` | User chose fallback method | Both |
| `SYSTEM_CANCEL` | System cancelled authentication | Both |
| `PASSCODE_NOT_SET` | Device passcode not set | Both |
| `BIOMETRY_NOT_AVAILABLE` | Biometry not available | iOS |
| `BIOMETRY_NOT_ENROLLED` | No biometrics enrolled | iOS |
| `BIOMETRY_LOCKOUT` | Too many failed attempts | Both |
| `KEY_USER_NOT_AUTHENTICATED` | Keystore rejected the signing operation despite successful authentication (OEM auth-token delivery bug; automatically retried before this is returned — prompt the user to try again) | Android |
