#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(ReactNativeBiometrics, NSObject)

RCT_EXTERN_METHOD(isSensorAvailable:
    (RCTPromiseResolveBlock)resolve
    rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(simplePrompt:
    (NSString *)reason
    resolver:(RCTPromiseResolveBlock)resolve
    rejecter:(RCTPromiseRejectBlock)reject)
@end