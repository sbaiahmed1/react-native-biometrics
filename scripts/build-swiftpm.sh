#!/usr/bin/env bash
#
# Builds the library with Swift Package Manager.
#
# The example app builds with CocoaPods, so this script creates a throwaway
# React Native app, installs the packed library into it, converts the app to
# SwiftPM and builds it for the iOS simulator.
#
# It catches what a CocoaPods build cannot: a Swift method that
# ios/ReactNativeBiometrics.mm calls but spm-headers/react_native_biometrics-Swift.h
# does not declare, or a Swift file that only compiles with CocoaPods' settings.
#
# Usage: scripts/build-swiftpm.sh [work-dir]
#   work-dir              Where to create the test app. It is kept afterwards.
#                         Without it, a temporary directory is used and removed.
#   REACT_NATIVE_VERSION  React Native version of the test app (default 0.88.1)
#   CONFIGURATION         Debug or Release (default Debug)

set -euo pipefail

REACT_NATIVE_VERSION="${REACT_NATIVE_VERSION:-0.88.1}"
RN_CLI_VERSION="20.2.0"
CONFIGURATION="${CONFIGURATION:-Debug}"
APP_NAME="SwiftPMTest"

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
if [ $# -ge 1 ]; then
  # A work directory passed on the command line is kept for inspection.
  WORK_DIR="$1"
  mkdir -p "$WORK_DIR"
else
  WORK_DIR="$(mktemp -d)"
  trap 'rm -rf "$WORK_DIR"' EXIT
fi
WORK_DIR="$(cd "$WORK_DIR" && pwd)"

echo "==> Packing the library"
cd "$REPO_ROOT"
yarn prepare
rm -f "$WORK_DIR"/*.tgz
npm pack --ignore-scripts --pack-destination "$WORK_DIR"
TARBALL="$(ls "$WORK_DIR"/*.tgz)"

echo "==> Creating a React Native $REACT_NATIVE_VERSION app in $WORK_DIR"
cd "$WORK_DIR"
rm -rf "$APP_NAME"
npx --yes "@react-native-community/cli@$RN_CLI_VERSION" init "$APP_NAME" \
  --version "$REACT_NATIVE_VERSION" --skip-install --skip-git-init

cd "$APP_NAME"
npm install --no-audit --no-fund
npm install --no-audit --no-fund "$TARBALL"

echo "==> Converting the app to Swift Package Manager"
npx react-native spm add --deintegrate --yes

echo "==> Building ($CONFIGURATION)"
xcodebuild \
  -project "ios/$APP_NAME.xcodeproj" \
  -scheme "$APP_NAME" \
  -configuration "$CONFIGURATION" \
  -sdk iphonesimulator \
  -destination 'generic/platform=iOS Simulator' \
  -derivedDataPath ios/build/swiftpm \
  ONLY_ACTIVE_ARCH=YES ARCHS=arm64 \
  -quiet \
  build

echo "==> SwiftPM build succeeded"
