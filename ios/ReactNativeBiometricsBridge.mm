#import "React/RCTBridgeModule.h"

@interface RCT_EXTERN_MODULE(ReactNativeBiometrics, NSObject)

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
    resolver:(RCTPromiseResolveBlock)resolve
    rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(deleteKeys:
    (NSString *)keyAlias
    resolver:(RCTPromiseResolveBlock)resolve
    rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(getAllKeys:
    (RCTPromiseResolveBlock)resolve
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

@end
