#!/usr/bin/env ruby
# frozen_string_literal: true

# add-broadcast-extension.rb
#
# Uses the xcodeproj gem (the same library CocoaPods uses) to properly
# create the BroadcastExtension target in the Xcode project.
#
# This script runs AFTER `expo prebuild` and the JS config plugin have
# written the pbxproj. It acts as the authoritative source of truth,
# replacing whatever the xcode npm library produced with a clean,
# correctly-structured target.
#
# Run from the `mobile` directory:
#   gem install xcodeproj --no-document
#   ruby scripts/add-broadcast-extension.rb

require 'xcodeproj'
require 'fileutils'

PREFIX = "[xcodeproj-gem]"

# ── Paths (relative to mobile/) ──
proj_path = "ios/AlgorithmLens.xcodeproj"
ext_dir   = "ios/BroadcastExtension"
src_dir   = "modules/broadcast/ios/BroadcastExtension"

puts "#{PREFIX} Opening project: #{proj_path}"
project = Xcodeproj::Project.open(proj_path)

# ── Locate main app target ──
main_target = project.targets.find { |t| t.name == "AlgorithmLens" }
abort "#{PREFIX} ERROR: Could not find main AlgorithmLens target" unless main_target
puts "#{PREFIX} Found main target: #{main_target.name}"

# ── Remove existing BroadcastExtension target if present (idempotent) ──
existing = project.targets.find { |t| t.name == "BroadcastExtension" }
if existing
  puts "#{PREFIX} Removing pre-existing BroadcastExtension target for clean rebuild..."
  existing.remove_from_project
end

# ── Create the app extension target ──
puts "#{PREFIX} Creating BroadcastExtension native target..."
ext_target = project.new_target(
  :app_extension,
  "BroadcastExtension",
  :ios,
  nil,
  nil,
  :swift
)
puts "#{PREFIX} Target created: #{ext_target.name} (UUID: #{ext_target.uuid})"

# ── Copy Info.plist and entitlements into ios/BroadcastExtension/ ──
FileUtils.mkdir_p(ext_dir)
puts "#{PREFIX} Created directory: #{ext_dir}"

infoplist_src    = "#{src_dir}/Info.plist"
entitlements_src = "#{src_dir}/BroadcastExtension.entitlements"

if File.exist?(infoplist_src)
  FileUtils.cp(infoplist_src, "#{ext_dir}/Info.plist")
  puts "#{PREFIX} Copied Info.plist -> #{ext_dir}/Info.plist"
else
  puts "#{PREFIX} WARNING: #{infoplist_src} not found, creating minimal Info.plist"
  File.write("#{ext_dir}/Info.plist", <<~PLIST)
    <?xml version="1.0" encoding="UTF-8"?>
    <!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
    <plist version="1.0">
    <dict>
      <key>CFBundleDisplayName</key>
      <string>BroadcastExtension</string>
      <key>CFBundleExecutable</key>
      <string>$(EXECUTABLE_NAME)</string>
      <key>CFBundleIdentifier</key>
      <string>$(PRODUCT_BUNDLE_IDENTIFIER)</string>
      <key>CFBundleInfoDictionaryVersion</key>
      <string>6.0</string>
      <key>CFBundleName</key>
      <string>$(PRODUCT_NAME)</string>
      <key>CFBundlePackageType</key>
      <string>XPC!</string>
      <key>CFBundleShortVersionString</key>
      <string>1.0</string>
      <key>CFBundleVersion</key>
      <string>1</string>
      <key>NSExtension</key>
      <dict>
        <key>NSExtensionPointIdentifier</key>
        <string>com.apple.broadcast-services-upload</string>
        <key>NSExtensionPrincipalClass</key>
        <string>$(PRODUCT_MODULE_NAME).SampleHandler</string>
      </dict>
    </dict>
    </plist>
  PLIST
end

if File.exist?(entitlements_src)
  FileUtils.cp(entitlements_src, "#{ext_dir}/BroadcastExtension.entitlements")
  puts "#{PREFIX} Copied entitlements -> #{ext_dir}/BroadcastExtension.entitlements"
else
  puts "#{PREFIX} WARNING: #{entitlements_src} not found, creating minimal entitlements"
  File.write("#{ext_dir}/BroadcastExtension.entitlements", <<~ENT)
    <?xml version="1.0" encoding="UTF-8"?>
    <!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
    <plist version="1.0">
    <dict>
      <key>com.apple.security.application-groups</key>
      <array>
        <string>group.com.algorithmlens.app</string>
      </array>
    </dict>
    </plist>
  ENT
end

# ── Add Swift source files ──
swift_files = ["SampleHandler.swift", "FrameProcessor.swift", "SharedContainer.swift"]
ext_group = project.main_group.new_group("BroadcastExtension", ext_dir)
puts "#{PREFIX} Created PBX group: BroadcastExtension"

swift_files.each do |filename|
  src = "#{src_dir}/#{filename}"
  if File.exist?(src)
    ref = ext_group.new_file(src)
    ext_target.source_build_phase.add_file_reference(ref)
    puts "#{PREFIX} Added source file: #{filename}"
  else
    puts "#{PREFIX} WARNING: #{src} not found -- skipping"
  end
end

# ── Add frameworks ──
frameworks = ["ReplayKit.framework", "Vision.framework", "UIKit.framework", "Foundation.framework"]
frameworks.each do |fw|
  ext_target.frameworks_build_phase.add_file_reference(
    project.frameworks_group.new_file("System/Library/Frameworks/#{fw}")
  )
  puts "#{PREFIX} Linked framework: #{fw}"
end

# ── Build settings ──
puts "#{PREFIX} Configuring build settings..."
ext_target.build_configurations.each do |config|
  config.build_settings["SWIFT_VERSION"]              = "5.0"
  config.build_settings["TARGETED_DEVICE_FAMILY"]     = "1,2"
  config.build_settings["INFOPLIST_FILE"]             = "BroadcastExtension/Info.plist"
  config.build_settings["CODE_SIGN_ENTITLEMENTS"]     = "BroadcastExtension/BroadcastExtension.entitlements"
  config.build_settings["PRODUCT_BUNDLE_IDENTIFIER"]  = "com.algorithmlens.app.BroadcastExtension"
  config.build_settings["PRODUCT_NAME"]               = "BroadcastExtension"
  config.build_settings["SKIP_INSTALL"]               = "YES"
  config.build_settings["GENERATE_INFOPLIST_FILE"]    = "NO"
  puts "#{PREFIX}   Configured: #{config.name}"
end

# ── Add as dependency of main app target ──
main_target.add_dependency(ext_target)
puts "#{PREFIX} Added BroadcastExtension as dependency of #{main_target.name}"

# ── Add embed extension build phase ──
embed_phase = main_target.new_copy_files_build_phase("Embed App Extensions")
embed_phase.dst_subfolder_spec = "13" # PlugIns folder
embed_phase.add_file_reference(ext_target.product_reference)
puts "#{PREFIX} Added 'Embed App Extensions' copy phase to main target"

# ── Save ──
project.save
puts "#{PREFIX} Project saved successfully!"

# ── Summary ──
puts ""
puts "#{PREFIX} ============================================"
puts "#{PREFIX} SUMMARY"
puts "#{PREFIX} ============================================"
puts "#{PREFIX} Targets in project:"
project.targets.each { |t| puts "#{PREFIX}   - #{t.name} (#{t.product_type})" }
puts "#{PREFIX} BroadcastExtension source files: #{ext_target.source_build_phase.files.map { |f| f.display_name }}"
puts "#{PREFIX} BroadcastExtension frameworks: #{ext_target.frameworks_build_phase.files.map { |f| f.display_name }}"
puts "#{PREFIX} Done!"
