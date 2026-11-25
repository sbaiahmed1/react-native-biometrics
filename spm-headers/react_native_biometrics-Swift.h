// Swift Package Manager builds only. CocoaPods uses the header Xcode generates.
//
// Under SwiftPM the Swift and Objective-C++ sources build as separate targets,
// so ios/ReactNativeBiometrics.mm cannot import a generated Swift header. This
// file declares the @objc API of ReactNativeBiometricsImpl by hand.
//
// If spm-support/SwiftHeaderPin.swift fails to compile, the Swift API changed:
// update ios/ReactNativeBiometrics.swift, this header and the pin file together.
#pragma once

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

typedef void (^RNBPromiseResolveBlock)(id _Nullable result);
typedef void (^RNBPromiseRejectBlock)(NSString *_Nullable code, NSString *_Nullable message, NSError *_Nullable error);

@interface ReactNativeBiometricsImpl : NSObject
@property (nonatomic, copy) void (^ _Nullable onBiometricChange)(NSDictionary<NSString *, id> * _Nonnull);
- (nonnull instancetype)init;
- (void)startBiometricChangeDetection:(RNBPromiseResolveBlock)resolve rejecter:(RNBPromiseRejectBlock)reject;
- (void)stopBiometricChangeDetection:(RNBPromiseResolveBlock)resolve rejecter:(RNBPromiseRejectBlock)reject;
- (void)isSensorAvailable:(RNBPromiseResolveBlock)resolve rejecter:(RNBPromiseRejectBlock)reject;
- (void)simplePrompt:(NSString * _Nonnull)reason resolver:(RNBPromiseResolveBlock)resolve rejecter:(RNBPromiseRejectBlock)reject;
- (void)authenticateWithOptions:(NSDictionary * _Nonnull)options resolver:(RNBPromiseResolveBlock)resolve rejecter:(RNBPromiseRejectBlock)reject;
- (void)getDiagnosticInfo:(RNBPromiseResolveBlock)resolve rejecter:(RNBPromiseRejectBlock)reject;
- (void)runBiometricTest:(RNBPromiseResolveBlock)resolve rejecter:(RNBPromiseRejectBlock)reject;
- (void)setDebugMode:(BOOL)enabled resolver:(RNBPromiseResolveBlock)resolve rejecter:(RNBPromiseRejectBlock)reject;
- (void)configureKeyAlias:(NSString * _Nonnull)keyAlias resolver:(RNBPromiseResolveBlock)resolve rejecter:(RNBPromiseRejectBlock)reject;
- (void)getDefaultKeyAlias:(RNBPromiseResolveBlock)resolve rejecter:(RNBPromiseRejectBlock)reject;
- (void)createKeys:(NSString * _Nullable)keyAlias keyType:(NSString * _Nullable)keyType biometricStrength:(NSString * _Nullable)biometricStrength allowDeviceCredentials:(NSNumber * _Nullable)allowDeviceCredentials failIfExists:(NSNumber * _Nullable)failIfExists resolver:(RNBPromiseResolveBlock)resolve rejecter:(RNBPromiseRejectBlock)reject;
- (void)createKeysWithOptions:(NSDictionary * _Nonnull)options resolver:(RNBPromiseResolveBlock)resolve rejecter:(RNBPromiseRejectBlock)reject;
- (void)deleteKeys:(NSString * _Nullable)keyAlias resolver:(RNBPromiseResolveBlock)resolve rejecter:(RNBPromiseRejectBlock)reject;
- (void)getPublicKey:(NSString * _Nullable)keyAlias resolver:(RNBPromiseResolveBlock)resolve rejecter:(RNBPromiseRejectBlock)reject;
- (void)getAllKeys:(NSString * _Nullable)customAlias resolver:(RNBPromiseResolveBlock)resolve rejecter:(RNBPromiseRejectBlock)reject;
- (void)validateKeyIntegrity:(NSString * _Nullable)keyAlias resolver:(RNBPromiseResolveBlock)resolve rejecter:(RNBPromiseRejectBlock)reject;
- (void)verifyKeySignature:(NSString * _Nullable)keyAlias data:(NSString * _Nonnull)data promptTitle:(NSString * _Nullable)promptTitle promptSubtitle:(NSString * _Nullable)promptSubtitle cancelButtonText:(NSString * _Nullable)cancelButtonText resolver:(RNBPromiseResolveBlock)resolve rejecter:(RNBPromiseRejectBlock)reject;
- (void)verifyKeySignatureWithOptions:(NSString * _Nullable)keyAlias data:(NSString * _Nonnull)data promptTitle:(NSString * _Nullable)promptTitle promptSubtitle:(NSString * _Nullable)promptSubtitle cancelButtonText:(NSString * _Nullable)cancelButtonText biometricStrength:(NSString * _Nullable)biometricStrength disableDeviceFallback:(NSNumber * _Nullable)disableDeviceFallback inputEncoding:(NSString * _Nullable)inputEncoding resolver:(RNBPromiseResolveBlock)resolve rejecter:(RNBPromiseRejectBlock)reject;
- (void)verifyKeySignatureWithEncoding:(NSString * _Nullable)keyAlias data:(NSString * _Nonnull)data promptTitle:(NSString * _Nullable)promptTitle promptSubtitle:(NSString * _Nullable)promptSubtitle cancelButtonText:(NSString * _Nullable)cancelButtonText inputEncoding:(NSString * _Nullable)inputEncoding resolver:(RNBPromiseResolveBlock)resolve rejecter:(RNBPromiseRejectBlock)reject;
- (void)signData:(NSDictionary * _Nonnull)options resolver:(RNBPromiseResolveBlock)resolve rejecter:(RNBPromiseRejectBlock)reject;
- (void)validateSignature:(NSString * _Nullable)keyAlias data:(NSString * _Nonnull)data signature:(NSString * _Nonnull)signature resolver:(RNBPromiseResolveBlock)resolve rejecter:(RNBPromiseRejectBlock)reject;
- (void)sha256:(NSString * _Nonnull)data inputEncoding:(NSString * _Nullable)inputEncoding resolver:(RNBPromiseResolveBlock)resolve rejecter:(RNBPromiseRejectBlock)reject;
- (void)getKeyAttributes:(NSString * _Nullable)keyAlias resolver:(RNBPromiseResolveBlock)resolve rejecter:(RNBPromiseRejectBlock)reject;
- (void)getDeviceIntegrityStatus:(RNBPromiseResolveBlock)resolver rejecter:(RNBPromiseRejectBlock)reject;
@end

NS_ASSUME_NONNULL_END
