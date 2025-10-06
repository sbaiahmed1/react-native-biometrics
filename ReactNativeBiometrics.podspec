require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))

Pod::Spec.new do |s|
  s.name         = "ReactNativeBiometrics"
  s.version      = package["version"]
  s.summary      = package["description"]
  s.homepage     = package["homepage"]
  s.license      = package["license"]
  s.authors      = package["author"]

  s.platforms    = { :ios => min_ios_version_supported }
  s.source       = { :git => "https://github.com/sbaiahmed1/sbaiahmed1-react-native-biometrics.git", :tag => "#{s.version}" }

  s.source_files = "ios/**/*.{h,m,mm,cpp,swift}"
  s.exclude_files = "ios/generated/**/*"
  s.private_header_files = "ios/**/*.h"
  s.swift_version = "5.0"
  s.dependency "React-Core"
  s.module_name = "react_native_biometrics"
  s.xcconfig = { 'HEADER_SEARCH_PATHS' => '$(inherited)' }

 install_modules_dependencies(s)
end
