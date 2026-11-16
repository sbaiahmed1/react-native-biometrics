#import "ReactNativeBiometrics.h"

#import <React/RCTInvalidating.h>

#if __has_include(<react_native_biometrics/react_native_biometrics-Swift.h>)
#import <react_native_biometrics/react_native_biometrics-Swift.h>
#else
#import "react_native_biometrics-Swift.h"
#endif

// The Swift implementation reads its options from a dictionary, so the codegen
// structs are converted back. Unset optional fields are left out, which is what
// the Swift parsing expects for "not provided".
static void SetString(NSMutableDictionary *dict, NSString *key, NSString *value)
{
  if (value != nil) {
    dict[key] = value;
  }
}

static void SetBool(NSMutableDictionary *dict, NSString *key, std::optional<bool> value)
{
  if (value.has_value()) {
    dict[key] = @(value.value());
  }
}

@interface ReactNativeBiometrics () <RCTInvalidating>
@end

@implementation ReactNativeBiometrics {
  ReactNativeBiometricsImpl *_impl;
}

RCT_EXPORT_MODULE()

- (instancetype)init
{
  if (self = [super init]) {
    _impl = [ReactNativeBiometricsImpl new];
    __weak ReactNativeBiometrics *weakSelf = self;
    _impl.onBiometricChange = ^(NSDictionary<NSString *, id> *event) {
      [weakSelf emitOnBiometricChange:event];
    };
  }
  return self;
}

- (void)invalidate
{
  // The event emitter callback is gone once the runtime is torn down.
  _impl.onBiometricChange = nil;
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
  return std::make_shared<facebook::react::NativeReactNativeBiometricsSpecJSI>(params);
}

#pragma mark - Sensor and authentication

// biometricStrength only applies on Android.
- (void)isSensorAvailable:(NSString *)biometricStrength
                  resolve:(RCTPromiseResolveBlock)resolve
                   reject:(RCTPromiseRejectBlock)reject
{
  [_impl isSensorAvailable:resolve rejecter:reject];
}

// biometricStrength only applies on Android.
- (void)simplePrompt:(NSString *)promptMessage
   biometricStrength:(NSString *)biometricStrength
             resolve:(RCTPromiseResolveBlock)resolve
              reject:(RCTPromiseRejectBlock)reject
{
  [_impl simplePrompt:promptMessage resolver:resolve rejecter:reject];
}

- (void)authenticateWithOptions:(JS::NativeReactNativeBiometrics::SpecAuthenticateWithOptionsOptions &)options
                        resolve:(RCTPromiseResolveBlock)resolve
                         reject:(RCTPromiseRejectBlock)reject
{
  NSMutableDictionary *dict = [NSMutableDictionary new];
  SetString(dict, @"title", options.title());
  SetString(dict, @"subtitle", options.subtitle());
  SetString(dict, @"description", options.description());
  SetString(dict, @"fallbackLabel", options.fallbackLabel());
  SetString(dict, @"cancelLabel", options.cancelLabel());
  SetBool(dict, @"disableDeviceFallback", options.disableDeviceFallback());
  SetBool(dict, @"allowDeviceCredentials", options.allowDeviceCredentials());
  SetString(dict, @"biometricStrength", options.biometricStrength());
  [_impl authenticateWithOptions:dict resolver:resolve rejecter:reject];
}

#pragma mark - Keys

- (void)createKeys:(NSString *_Nullable)keyAlias
                   keyType:(NSString *_Nullable)keyType
         biometricStrength:(NSString *_Nullable)biometricStrength
    allowDeviceCredentials:(NSNumber *)allowDeviceCredentials
              failIfExists:(NSNumber *)failIfExists
                   resolve:(RCTPromiseResolveBlock)resolve
                    reject:(RCTPromiseRejectBlock)reject
{
  [_impl createKeys:keyAlias
                    keyType:keyType
          biometricStrength:biometricStrength
     allowDeviceCredentials:allowDeviceCredentials
               failIfExists:failIfExists
                   resolver:resolve
                   rejecter:reject];
}

- (void)createKeysWithOptions:(JS::NativeReactNativeBiometrics::SpecCreateKeysWithOptionsOptions &)options
                      resolve:(RCTPromiseResolveBlock)resolve
                       reject:(RCTPromiseRejectBlock)reject
{
  NSMutableDictionary *dict = [NSMutableDictionary new];
  SetString(dict, @"keyAlias", options.keyAlias());
  SetString(dict, @"keyType", options.keyType());
  SetBool(dict, @"requireAuthentication", options.requireAuthentication());
  SetString(dict, @"biometricStrength", options.biometricStrength());
  SetBool(dict, @"allowDeviceCredentials", options.allowDeviceCredentials());
  SetBool(dict, @"failIfExists", options.failIfExists());
  [_impl createKeysWithOptions:dict resolver:resolve rejecter:reject];
}

- (void)getPublicKey:(NSString *_Nullable)keyAlias
             resolve:(RCTPromiseResolveBlock)resolve
              reject:(RCTPromiseRejectBlock)reject
{
  [_impl getPublicKey:keyAlias resolver:resolve rejecter:reject];
}

- (void)deleteKeys:(NSString *_Nullable)keyAlias
           resolve:(RCTPromiseResolveBlock)resolve
            reject:(RCTPromiseRejectBlock)reject
{
  [_impl deleteKeys:keyAlias resolver:resolve rejecter:reject];
}

- (void)configureKeyAlias:(NSString *)keyAlias
                  resolve:(RCTPromiseResolveBlock)resolve
                   reject:(RCTPromiseRejectBlock)reject
{
  [_impl configureKeyAlias:keyAlias resolver:resolve rejecter:reject];
}

- (void)getDefaultKeyAlias:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject
{
  [_impl getDefaultKeyAlias:resolve rejecter:reject];
}

- (void)getAllKeys:(NSString *_Nullable)customAlias
           resolve:(RCTPromiseResolveBlock)resolve
            reject:(RCTPromiseRejectBlock)reject
{
  [_impl getAllKeys:customAlias resolver:resolve rejecter:reject];
}

- (void)validateKeyIntegrity:(NSString *_Nullable)keyAlias
                     resolve:(RCTPromiseResolveBlock)resolve
                      reject:(RCTPromiseRejectBlock)reject
{
  [_impl validateKeyIntegrity:keyAlias resolver:resolve rejecter:reject];
}

- (void)getKeyAttributes:(NSString *_Nullable)keyAlias
                 resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject
{
  [_impl getKeyAttributes:keyAlias resolver:resolve rejecter:reject];
}

#pragma mark - Signing

- (void)signData:(JS::NativeReactNativeBiometrics::SpecSignDataOptions &)options
         resolve:(RCTPromiseResolveBlock)resolve
          reject:(RCTPromiseRejectBlock)reject
{
  NSMutableDictionary *dict = [NSMutableDictionary new];
  SetString(dict, @"keyAlias", options.keyAlias());
  SetString(dict, @"data", options.data());
  SetString(dict, @"inputEncoding", options.inputEncoding());
  SetString(dict, @"algorithm", options.algorithm());
  [_impl signData:dict resolver:resolve rejecter:reject];
}

- (void)verifyKeySignature:(NSString *_Nullable)keyAlias
                      data:(NSString *)data
               promptTitle:(NSString *)promptTitle
            promptSubtitle:(NSString *)promptSubtitle
          cancelButtonText:(NSString *)cancelButtonText
                   resolve:(RCTPromiseResolveBlock)resolve
                    reject:(RCTPromiseRejectBlock)reject
{
  [_impl verifyKeySignature:keyAlias
                       data:data
                promptTitle:promptTitle
             promptSubtitle:promptSubtitle
           cancelButtonText:cancelButtonText
                   resolver:resolve
                   rejecter:reject];
}

- (void)verifyKeySignatureWithOptions:(NSString *_Nullable)keyAlias
                                 data:(NSString *)data
                          promptTitle:(NSString *_Nullable)promptTitle
                       promptSubtitle:(NSString *_Nullable)promptSubtitle
                     cancelButtonText:(NSString *_Nullable)cancelButtonText
                    biometricStrength:(NSString *_Nullable)biometricStrength
                disableDeviceFallback:(NSNumber *)disableDeviceFallback
                        inputEncoding:(NSString *_Nullable)inputEncoding
                              resolve:(RCTPromiseResolveBlock)resolve
                               reject:(RCTPromiseRejectBlock)reject
{
  [_impl verifyKeySignatureWithOptions:keyAlias
                                  data:data
                           promptTitle:promptTitle
                        promptSubtitle:promptSubtitle
                      cancelButtonText:cancelButtonText
                     biometricStrength:biometricStrength
                 disableDeviceFallback:disableDeviceFallback
                         inputEncoding:inputEncoding
                              resolver:resolve
                              rejecter:reject];
}

- (void)verifyKeySignatureWithEncoding:(NSString *_Nullable)keyAlias
                                  data:(NSString *)data
                           promptTitle:(NSString *_Nullable)promptTitle
                        promptSubtitle:(NSString *_Nullable)promptSubtitle
                      cancelButtonText:(NSString *_Nullable)cancelButtonText
                         inputEncoding:(NSString *_Nullable)inputEncoding
                               resolve:(RCTPromiseResolveBlock)resolve
                                reject:(RCTPromiseRejectBlock)reject
{
  [_impl verifyKeySignatureWithEncoding:keyAlias
                                   data:data
                            promptTitle:promptTitle
                         promptSubtitle:promptSubtitle
                       cancelButtonText:cancelButtonText
                          inputEncoding:inputEncoding
                               resolver:resolve
                               rejecter:reject];
}

- (void)validateSignature:(NSString *)keyAlias
                     data:(NSString *)data
                signature:(NSString *)signature
                  resolve:(RCTPromiseResolveBlock)resolve
                   reject:(RCTPromiseRejectBlock)reject
{
  [_impl validateSignature:keyAlias data:data signature:signature resolver:resolve rejecter:reject];
}

- (void)sha256:(NSString *)data
    inputEncoding:(NSString *_Nullable)inputEncoding
          resolve:(RCTPromiseResolveBlock)resolve
           reject:(RCTPromiseRejectBlock)reject
{
  [_impl sha256:data inputEncoding:inputEncoding resolver:resolve rejecter:reject];
}

#pragma mark - Diagnostics

- (void)getDiagnosticInfo:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject
{
  [_impl getDiagnosticInfo:resolve rejecter:reject];
}

- (void)runBiometricTest:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject
{
  [_impl runBiometricTest:resolve rejecter:reject];
}

- (void)setDebugMode:(BOOL)enabled
             resolve:(RCTPromiseResolveBlock)resolve
              reject:(RCTPromiseRejectBlock)reject
{
  [_impl setDebugMode:enabled resolver:resolve rejecter:reject];
}

- (void)getDeviceIntegrityStatus:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject
{
  [_impl getDeviceIntegrityStatus:resolve rejecter:reject];
}

#pragma mark - Biometric change detection

- (void)startBiometricChangeDetection:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject
{
  [_impl startBiometricChangeDetection:resolve rejecter:reject];
}

- (void)stopBiometricChangeDetection:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject
{
  [_impl stopBiometricChangeDetection:resolve rejecter:reject];
}

@end
