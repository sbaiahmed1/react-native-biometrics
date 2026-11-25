// swift-tools-version: 6.0

// Swift Package Manager manifest, used by React Native's SwiftPM autolinking
// (React Native 0.88 and newer). CocoaPods builds use the podspec instead.
//
// SwiftPM cannot compile Swift and Objective-C++ in one target, so ios/ builds
// as two: the Swift implementation, and the Objective-C++ TurboModule that
// forwards to it.

import Foundation
import PackageDescription

let reactHeaders: [Target.Dependency] = [
    .product(name: "ReactHeaders", package: "ReactNative"),
    .product(name: "ReactNativeHeaders", package: "ReactNative"),
    .product(name: "ReactNativeDependenciesHeaders", package: "ReactNative"),
    .product(name: "ReactAppHeaders", package: "React-GeneratedCode"),
]

let swiftSources = [
    "ios/ReactNativeBiometrics.swift",
    "ios/ReactNativeBiometricsError.swift",
    "ios/ReactNativeBiometricDebug.swift",
    "ios/Utils.swift",
]

let usedRootEntries: Set<String> = ["ios", "spm-headers", "spm-support", "Package.swift"]
let unusedRootEntries = try! FileManager.default.contentsOfDirectory(atPath: Context.packageDirectory)
    .filter { !usedRootEntries.contains($0) }
    .sorted()

let reactNativeSettings: [CSetting] = [
    .define("DEBUG", .when(configuration: .debug)),
    .define("NDEBUG", .when(configuration: .release)),
    .headerSearchPath("spm-headers"),
]

let reactNativeCxxSettings: [CXXSetting] = [
    .define("DEBUG", .when(configuration: .debug)),
    .define("NDEBUG", .when(configuration: .release)),
    .headerSearchPath("spm-headers"),
]

let package = Package(
    name: "ReactNativeBiometrics",
    platforms: [.iOS("15.1")],
    products: [
        .library(
            name: "ReactNativeBiometrics",
            targets: ["ReactNativeBiometrics", "ReactNativeBiometricsObjC"]
        ),
    ],
    dependencies: [
        .package(name: "ReactNative", path: "../../../../xcframeworks"),
        .package(name: "React-GeneratedCode", path: "../../../ios"),
    ],
    targets: [
        .target(
            name: "ReactNativeBiometrics",
            path: ".",
            exclude: unusedRootEntries + [
                "spm-headers",
                "ios/ReactNativeBiometrics.h",
                "ios/ReactNativeBiometrics.mm",
            ],
            sources: swiftSources + ["spm-support"]
        ),
        .target(
            name: "ReactNativeBiometricsObjC",
            dependencies: ["ReactNativeBiometrics"] + reactHeaders,
            path: ".",
            exclude: unusedRootEntries + swiftSources + [
                "spm-support",
                "spm-headers/react_native_biometrics-Swift.h",
            ],
            sources: ["ios/ReactNativeBiometrics.mm"],
            publicHeadersPath: "spm-headers/public",
            cSettings: reactNativeSettings,
            cxxSettings: reactNativeCxxSettings
        ),
    ],
    swiftLanguageModes: [.v5],
    cxxLanguageStandard: .cxx20
)
