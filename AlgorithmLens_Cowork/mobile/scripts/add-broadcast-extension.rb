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

begin
  require 'xcodeproj'
  require 'fileutils'

  PREFIX = "[xcodeproj-gem]"

  # ── Paths (all relative to mobile/) ──
  proj_path = "ios/AlgorithmLens.xcodeproj"
  ext_dir   = "ios/BroadcastExtension"

  # Source files live in two adjacent locations under modules/broadcast/ios/:
  #   • SampleHandler / Info.plist / entitlements live in the BroadcastExtension/
  #     subfolder (extension-specific assets).
  #   • FrameProcessor and SharedContainer live in the parent ios/ folder
  #     because they're shared between the main module and the extension.
  ext_src_dir    = "modules/broadcast/ios/BroadcastExtension"
  shared_src_dir = "modules/broadcast/ios"

  puts "#{PREFIX} Working directory: #{Dir.pwd}"
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

  # ── Also remove any existing BroadcastExtension group to avoid duplicates ──
  existing_group = project.main_group.children.find { |g| g.display_name == "BroadcastExtension" }
  if existing_group
    puts "#{PREFIX} Removing pre-existing BroadcastExtension group..."
    existing_group.remove_from_project
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

  # ── Create ios/BroadcastExtension/ directory ──
  FileUtils.mkdir_p(ext_dir)
  puts "#{PREFIX} Created directory: #{ext_dir}"

  # ── Copy ALL files from modules source into ios/BroadcastExtension/ (flat) ──
  swift_files = ["SampleHandler.swift", "FrameProcessor.swift", "SharedContainer.swift"]

  # Per-file source map. SampleHandler / Info.plist / entitlements live in the
  # BroadcastExtension/ subfolder; FrameProcessor and SharedContainer live one
  # directory up because they're shared with the main broadcast module. A single
  # src_dir constant misses the two shared files and the script silently builds
  # a target that fails to compile.
  file_sources = {
    "SampleHandler.swift"             => ext_src_dir,
    "FrameProcessor.swift"            => shared_src_dir,
    "SharedContainer.swift"           => shared_src_dir,
    "Info.plist"                      => ext_src_dir,
    "BroadcastExtension.entitlements" => ext_src_dir,
  }

  puts "#{PREFIX} Extension source dir: #{ext_src_dir} (exists=#{File.directory?(ext_src_dir)})"
  puts "#{PREFIX} Shared source dir:    #{shared_src_dir} (exists=#{File.directory?(shared_src_dir)})"
  if File.directory?(ext_src_dir)
    puts "#{PREFIX}   #{ext_src_dir}/: #{Dir.entries(ext_src_dir).reject { |e| e.start_with?('.') }.join(', ')}"
  end
  if File.directory?(shared_src_dir)
    puts "#{PREFIX}   #{shared_src_dir}/: #{Dir.entries(shared_src_dir).reject { |e| e.start_with?('.') }.join(', ')}"
  end

  file_sources.each do |filename, source_dir|
    src = File.join(source_dir, filename)
    dst = File.join(ext_dir, filename)
    if File.exist?(src)
      FileUtils.cp(src, dst)
      puts "#{PREFIX} Copied #{filename} -> #{dst}"
    else
      puts "#{PREFIX} WARNING: #{src} not found"
    end
  end

  # ── Create fallback Info.plist if not present ──
  unless File.exist?(File.join(ext_dir, "Info.plist"))
    puts "#{PREFIX} Creating fallback Info.plist"
    File.write(File.join(ext_dir, "Info.plist"), <<~PLIST)
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

  # ── Create fallback entitlements if not present ──
  unless File.exist?(File.join(ext_dir, "BroadcastExtension.entitlements"))
    puts "#{PREFIX} Creating fallback entitlements"
    File.write(File.join(ext_dir, "BroadcastExtension.entitlements"), <<~ENT)
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

  # ── Log what ended up in ios/BroadcastExtension/ ──
  puts "#{PREFIX} Files in #{ext_dir}/: #{Dir.entries(ext_dir).reject { |e| e.start_with?('.') }.join(', ')}"

  # ── Create PBX group for BroadcastExtension ──
  # The group path is "BroadcastExtension" relative to the ios/ directory,
  # which matches where Xcode resolves paths from (the project root = ios/).
  ext_group = project.main_group.new_group("BroadcastExtension", "BroadcastExtension")
  puts "#{PREFIX} Created PBX group: BroadcastExtension (path: BroadcastExtension)"

  # ── Add Swift source files by filename only (they live in ios/BroadcastExtension/) ──
  swift_files.each do |filename|
    dst = File.join(ext_dir, filename)
    if File.exist?(dst)
      # new_file with just the filename — Xcode resolves relative to group path
      ref = ext_group.new_file(filename)
      ext_target.source_build_phase.add_file_reference(ref)
      puts "#{PREFIX} Added source file: #{filename} (resolved via group path)"
    else
      puts "#{PREFIX} WARNING: #{dst} not found -- skipping"
    end
  end

  # ── Add Info.plist and entitlements as file references (not compiled) ──
  ext_group.new_file("Info.plist")
  ext_group.new_file("BroadcastExtension.entitlements")
  puts "#{PREFIX} Added Info.plist and entitlements as file references"

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
  src_files = ext_target.source_build_phase.files.map { |f| f.display_name rescue f.to_s }
  fw_files = ext_target.frameworks_build_phase.files.map { |f| f.display_name rescue f.to_s }
  puts "#{PREFIX} BroadcastExtension source files: #{src_files}"
  puts "#{PREFIX} BroadcastExtension frameworks: #{fw_files}"
  puts "#{PREFIX} Done!"

  exit 0

rescue => e
  $stderr.puts "[xcodeproj-gem] FATAL ERROR: #{e.class}: #{e.message}"
  $stderr.puts e.backtrace.first(10).map { |line| "  #{line}" }.join("\n")
  exit 1
end
