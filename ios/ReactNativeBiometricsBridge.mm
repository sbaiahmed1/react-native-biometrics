#import "React/RCTBridgeModule.h"
#import "React/RCTEventEmitter.h"

@interface RCT_EXTERN_MODULE(ReactNativeBiometrics, RCTEventEmitter)

RCT_EXTERN_METHOD(isSensorAvailable:
    (RCTPromiseResolveBlock)resolve
    rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(simplePrompt:
    (NSString *)reason
    resolver:(RCTPromiseResolveBlock)resolve
    rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(authenticateWithOptions:
    (NSDictionary *)options
    resolver:(RCTPromiseResolveBlock)resolve
    rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(createKeys:
    (NSString *)keyAlias
    keyType:(NSString *)keyType
    biometricStrength:(NSString *)biometricStrength
    resolver:(RCTPromiseResolveBlock)resolve
    rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(deleteKeys:
    (NSString *)keyAlias
    resolver:(RCTPromiseResolveBlock)resolve
    rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(getAllKeys:
    (NSString *)customAlias
    resolver:(RCTPromiseResolveBlock)resolve
    rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(getDiagnosticInfo:
    (RCTPromiseResolveBlock)resolve
    rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(runBiometricTest:
    (RCTPromiseResolveBlock)resolve
    rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(setDebugMode:
    (BOOL)enabled
    resolver:(RCTPromiseResolveBlock)resolve
    rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(configureKeyAlias:
    (NSString *)keyAlias
    resolver:(RCTPromiseResolveBlock)resolve
    rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(getDefaultKeyAlias:
    (RCTPromiseResolveBlock)resolve
    rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(validateKeyIntegrity:
    (NSString *)keyAlias
    resolver:(RCTPromiseResolveBlock)resolve
    rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(verifyKeySignature:
    (NSString *)keyAlias
    data:(NSString *)data
    promptTitle:(NSString *)promptTitle
    promptSubtitle:(NSString *)promptSubtitle
    cancelButtonText:(NSString *)cancelButtonText
    resolver:(RCTPromiseResolveBlock)resolve
    rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(verifyKeySignatureWithOptions:
    (NSString *)keyAlias
    data:(NSString *)data
    promptTitle:(NSString *)promptTitle
    promptSubtitle:(NSString *)promptSubtitle
    cancelButtonText:(NSString *)cancelButtonText
    biometricStrength:(NSString *)biometricStrength
    disableDeviceFallback:(NSNumber *)disableDeviceFallback
    inputEncoding:(NSString *)inputEncoding
    resolver:(RCTPromiseResolveBlock)resolve
    rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(verifyKeySignatureWithEncoding:
    (NSString *)keyAlias
    data:(NSString *)data
    promptTitle:(NSString *)promptTitle
    promptSubtitle:(NSString *)promptSubtitle
    cancelButtonText:(NSString *)cancelButtonText
    inputEncoding:(NSString *)inputEncoding
    resolver:(RCTPromiseResolveBlock)resolve
    rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(validateSignature:
    (NSString *)keyAlias
    data:(NSString *)data
    signature:(NSString *)signature
    resolver:(RCTPromiseResolveBlock)resolve
    rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(getKeyAttributes:
    (NSString *)keyAlias
    resolver:(RCTPromiseResolveBlock)resolve
    rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(getDeviceIntegrityStatus:
    (RCTPromiseResolveBlock)resolve
    rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(startBiometricChangeDetection:
    (RCTPromiseResolveBlock)resolve
    rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(stopBiometricChangeDetection:
    (RCTPromiseResolveBlock)resolve
    rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(addListener:(NSString *)eventName)
RCT_EXTERN_METHOD(removeListeners:(double)count)

@end
