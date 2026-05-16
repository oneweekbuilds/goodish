require 'json'

package = JSON.parse(File.read(File.join(__dir__, '..', 'package.json')))

Pod::Spec.new do |s|
  s.name           = 'ExpoBroadcast'
  s.version        = package['version']
  s.summary        = package['description']
  s.description    = package['description']
  s.license        = package['license']
  s.author         = 'AlgorithmLens'
  s.homepage       = 'https://algorithmlens.com'
  s.platforms      = {
    :ios => '12.0'
  }
  s.swift_version  = '5.9'
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'
  s.frameworks = 'ReplayKit', 'Vision'

  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'SWIFT_COMPILATION_MODE' => 'wholemodule'
  }

  # Top-level *.swift only — must NOT recurse into BroadcastExtension/
  # which compiles separately as the iOS broadcast upload extension target
  # via plugins/withBroadcastExtension.js. Pulling SampleHandler.swift into
  # the main-app pod would link RPBroadcastSampleHandler subclass code into
  # the wrong target.
  s.source_files = "*.swift"
end
