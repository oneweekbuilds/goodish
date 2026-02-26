/**
 * withBroadcastExtension — Expo config plugin that adds the ReplayKit
 * Broadcast Upload Extension as a separate iOS target.
 *
 * This plugin runs during `npx expo prebuild` and modifies the generated
 * Xcode project to include:
 *
 * 1. A new "BroadcastExtension" target with ReplayKit + Vision frameworks
 * 2. App Group entitlements on BOTH the main app and extension
 * 3. The SampleHandler.swift, FrameProcessor.swift, and SharedContainer.swift
 *    source files copied into the extension target
 * 4. Proper Info.plist for the broadcast extension
 * 5. Correct bundle identifier: com.algorithmlens.app.BroadcastExtension
 *
 * Without this plugin, `npx expo prebuild` generates only the main app
 * target, and the native broadcast module has no extension to communicate with.
 */

const {
  withXcodeProject,
  withEntitlementsPlist,
  withInfoPlist,
  IOSConfig,
} = require('expo/config-plugins');
const path = require('path');
const fs = require('fs');

const EXTENSION_NAME = 'BroadcastExtension';
const EXTENSION_BUNDLE_ID = 'com.algorithmlens.app.BroadcastExtension';
const APP_GROUP = 'group.com.algorithmlens.broadcast';
const TEAM_ID = undefined; // Set via EAS build or Xcode signing

/**
 * Main plugin entry point.
 */
function withBroadcastExtension(config) {
  // Step 1: Ensure main app has App Group entitlement
  config = withEntitlementsPlist(config, (config) => {
    config.modResults['com.apple.security.application-groups'] = [APP_GROUP];
    return config;
  });

  // Step 2: Add Xcode project modifications
  config = withXcodeProject(config, async (config) => {
    const xcodeProject = config.modResults;
    const projectRoot = config.modRequest.projectRoot;
    const platformProjectRoot = config.modRequest.platformProjectRoot;

    // Path to the extension source files in the local modules directory
    const extensionSourceDir = path.join(
      projectRoot,
      'modules',
      'broadcast',
      'ios',
      'BroadcastExtension'
    );

    // Path to shared Swift files used by both main app module and extension
    const sharedSourceDir = path.join(
      projectRoot,
      'modules',
      'broadcast',
      'ios'
    );

    // Destination in the iOS project
    const extensionDestDir = path.join(
      platformProjectRoot,
      EXTENSION_NAME
    );

    // Create the extension directory in the iOS project
    if (!fs.existsSync(extensionDestDir)) {
      fs.mkdirSync(extensionDestDir, { recursive: true });
    }

    // Copy extension source files
    const extensionFiles = ['SampleHandler.swift', 'Info.plist'];
    for (const file of extensionFiles) {
      const src = path.join(extensionSourceDir, file);
      const dst = path.join(extensionDestDir, file);
      if (fs.existsSync(src)) {
        fs.copyFileSync(src, dst);
      }
    }

    // Copy shared files that the extension needs (FrameProcessor, SharedContainer)
    const sharedFiles = ['FrameProcessor.swift', 'SharedContainer.swift'];
    for (const file of sharedFiles) {
      const src = path.join(sharedSourceDir, file);
      const dst = path.join(extensionDestDir, file);
      if (fs.existsSync(src)) {
        fs.copyFileSync(src, dst);
      }
    }

    // Write the extension entitlements file
    const entitlementsContent = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>com.apple.security.application-groups</key>
    <array>
        <string>${APP_GROUP}</string>
    </array>
</dict>
</plist>`;
    fs.writeFileSync(
      path.join(extensionDestDir, `${EXTENSION_NAME}.entitlements`),
      entitlementsContent
    );

    // Add the extension target to the Xcode project
    addBroadcastExtensionTarget(xcodeProject, extensionDestDir, platformProjectRoot);

    return config;
  });

  return config;
}

/**
 * Adds the BroadcastExtension target to the Xcode project using
 * the xcode library's pbxProject API.
 */
function addBroadcastExtensionTarget(xcodeProject, extensionDir, platformProjectRoot) {
  // Check if target already exists
  const targets = xcodeProject.pbxNativeTargetSection();
  for (const key in targets) {
    if (targets[key].name === EXTENSION_NAME) {
      // Target already exists — skip
      return;
    }
  }

  // Add the extension target
  const target = xcodeProject.addTarget(
    EXTENSION_NAME,
    'app_extension',
    EXTENSION_NAME,
    EXTENSION_BUNDLE_ID
  );

  if (!target) {
    console.warn('[withBroadcastExtension] Failed to add target to Xcode project');
    return;
  }

  // Add source files to the target's build phase
  const sourceFiles = [
    'SampleHandler.swift',
    'FrameProcessor.swift',
    'SharedContainer.swift',
  ];

  // Create a PBXGroup for the extension
  const extensionGroupKey = xcodeProject.pbxCreateGroup(EXTENSION_NAME, EXTENSION_NAME);

  // Add files to the extension group and compile sources
  for (const fileName of sourceFiles) {
    const filePath = path.join(EXTENSION_NAME, fileName);
    xcodeProject.addSourceFile(
      filePath,
      { target: target.uuid },
      extensionGroupKey
    );
  }

  // Add Info.plist reference
  xcodeProject.addFile(
    `${EXTENSION_NAME}/Info.plist`,
    extensionGroupKey
  );

  // Add entitlements reference
  xcodeProject.addFile(
    `${EXTENSION_NAME}/${EXTENSION_NAME}.entitlements`,
    extensionGroupKey
  );

  // Add the extension group to the main project group
  const mainGroupKey = xcodeProject.getFirstProject().firstProject.mainGroup;
  xcodeProject.addToPbxGroup(extensionGroupKey, mainGroupKey);

  // Add frameworks to the extension target
  const frameworks = ['ReplayKit.framework', 'Vision.framework', 'CoreMedia.framework'];
  for (const framework of frameworks) {
    xcodeProject.addFramework(framework, {
      target: target.uuid,
      link: true,
    });
  }

  // Set build settings for the extension target
  const buildConfigs = xcodeProject.pbxXCBuildConfigurationSection();
  for (const key in buildConfigs) {
    const config = buildConfigs[key];
    if (
      config &&
      typeof config === 'object' &&
      config.buildSettings &&
      config.name &&
      config.baseConfigurationReference !== undefined
    ) {
      // Check if this config belongs to our extension target
      // by looking at the PRODUCT_NAME or INFOPLIST_FILE
      if (
        config.buildSettings.PRODUCT_NAME === `"${EXTENSION_NAME}"` ||
        config.buildSettings.PRODUCT_NAME === EXTENSION_NAME
      ) {
        // Set required build settings for broadcast extension
        config.buildSettings.PRODUCT_BUNDLE_IDENTIFIER = `"${EXTENSION_BUNDLE_ID}"`;
        config.buildSettings.INFOPLIST_FILE = `"${EXTENSION_NAME}/Info.plist"`;
        config.buildSettings.CODE_SIGN_ENTITLEMENTS = `"${EXTENSION_NAME}/${EXTENSION_NAME}.entitlements"`;
        config.buildSettings.SWIFT_VERSION = '"5.0"';
        config.buildSettings.TARGETED_DEVICE_FAMILY = '"1"'; // iPhone only
        config.buildSettings.IPHONEOS_DEPLOYMENT_TARGET = '"16.0"';
        config.buildSettings.GENERATE_INFOPLIST_FILE = 'NO';
        config.buildSettings.CURRENT_PROJECT_VERSION = '"1"';
        config.buildSettings.MARKETING_VERSION = '"1.0"';
        config.buildSettings.SKIP_INSTALL = 'YES';

        // Development language
        config.buildSettings.DEVELOPMENT_TEAM = TEAM_ID ? `"${TEAM_ID}"` : '""';

        // Code signing
        config.buildSettings.CODE_SIGN_STYLE = '"Automatic"';
      }
    }
  }

  // Add the extension to the main app's "Embed App Extensions" build phase
  // This ensures the extension .appex is copied into the main app bundle
  const mainTarget = xcodeProject.getFirstTarget();
  if (mainTarget) {
    xcodeProject.addBuildPhase(
      [],
      'PBXCopyFilesBuildPhase',
      'Embed App Extensions',
      mainTarget.uuid,
      'app_extension'
    );
  }
}

module.exports = withBroadcastExtension;
