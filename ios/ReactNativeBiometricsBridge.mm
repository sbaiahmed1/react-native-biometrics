#import <React/RCTBridgeModule.h>

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
    (RCTPromiseResolveBlock)resolve
    rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(deleteKeys:
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
@end