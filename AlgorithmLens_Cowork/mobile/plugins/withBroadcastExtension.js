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
  withDangerousMod,
  IOSConfig,
} = require('expo/config-plugins');
const path = require('path');
const fs = require('fs');

const EXTENSION_NAME = 'BroadcastExtension';
const EXTENSION_BUNDLE_ID = 'com.algorithmlens.app.BroadcastExtension';
const APP_GROUP = 'group.com.algorithmlens.broadcast';
const TEAM_ID = '4GDJ3HXF72';

// Fallback Swift sources — used only if the real files can't be found
const FALLBACK_SAMPLE_HANDLER = `import ReplayKit

class SampleHandler: RPBroadcastSampleHandler {
    override func broadcastStarted(withSetupInfo setupInfo: [String: NSObject]?) {
        // Broadcast started
    }

    override func broadcastPaused() {
        // Broadcast paused
    }

    override func broadcastResumed() {
        // Broadcast resumed
    }

    override func broadcastFinished() {
        // Broadcast finished
    }

    override func processSampleBuffer(_ sampleBuffer: CMSampleBuffer, with sampleBufferType: RPSampleBufferType) {
        switch sampleBufferType {
        case .video:
            break
        case .audioApp:
            break
        case .audioMic:
            break
        @unknown default:
            break
        }
    }
}
`;

const FALLBACK_FRAME_PROCESSOR = `import Foundation
import CoreMedia

class FrameProcessor {
    static let shared = FrameProcessor()
    private init() {}
}
`;

const FALLBACK_SHARED_CONTAINER = `import Foundation

class SharedContainer {
    static let appGroup = "${APP_GROUP}"

    static var sharedDefaults: UserDefaults? {
        return UserDefaults(suiteName: appGroup)
    }
}
`;

const FALLBACK_INFO_PLIST = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleDevelopmentRegion</key>
    <string>$(DEVELOPMENT_LANGUAGE)</string>
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
    <string>$(PRODUCT_BUNDLE_PACKAGE_TYPE)</string>
    <key>CFBundleShortVersionString</key>
    <string>$(MARKETING_VERSION)</string>
    <key>CFBundleVersion</key>
    <string>$(CURRENT_PROJECT_VERSION)</string>
    <key>NSExtension</key>
    <dict>
        <key>NSExtensionPointIdentifier</key>
        <string>com.apple.broadcast-services-upload</string>
        <key>NSExtensionPrincipalClass</key>
        <string>$(PRODUCT_MODULE_NAME).SampleHandler</string>
    </dict>
</dict>
</plist>`;

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

    // Destination in the iOS project (double-nested: ios/BroadcastExtension/BroadcastExtension/)
    const extensionDestDir = path.join(
      platformProjectRoot,
      EXTENSION_NAME,
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
        console.log(`[withBroadcastExtension] Copied ${file} from ${src}`);
      } else {
        console.warn(`[withBroadcastExtension] Source not found: ${src}`);
      }
    }

    // Copy shared files that the extension needs (FrameProcessor, SharedContainer)
    const sharedFiles = ['FrameProcessor.swift', 'SharedContainer.swift'];
    for (const file of sharedFiles) {
      const src = path.join(sharedSourceDir, file);
      const dst = path.join(extensionDestDir, file);
      if (fs.existsSync(src)) {
        fs.copyFileSync(src, dst);
        console.log(`[withBroadcastExtension] Copied ${file} from ${src}`);
      } else {
        console.warn(`[withBroadcastExtension] Source not found: ${src}`);
      }
    }

    // Verify all required files exist at destination, create stubs if missing
    const requiredSwiftFiles = {
      'SampleHandler.swift': FALLBACK_SAMPLE_HANDLER,
      'FrameProcessor.swift': FALLBACK_FRAME_PROCESSOR,
      'SharedContainer.swift': FALLBACK_SHARED_CONTAINER,
    };
    for (const [fileName, fallbackContent] of Object.entries(requiredSwiftFiles)) {
      const dst = path.join(extensionDestDir, fileName);
      if (!fs.existsSync(dst)) {
        console.warn(`[withBroadcastExtension] ${fileName} missing at ${dst}, writing fallback`);
        fs.writeFileSync(dst, fallbackContent);
      }
    }

    // === INFO.PLIST: place at all 3 required paths ===
    // 1. ios/BroadcastExtension/BroadcastExtension/Info.plist — for Xcode file references
    // 2. ios/BroadcastExtension/Info.plist — for INFOPLIST_FILE build setting
    // 3. ios/BroadcastExtension/BroadcastExtension-Info.plist — for EAS version patching
    const targetRootDir = path.join(platformProjectRoot, EXTENSION_NAME);
    const infoPlistNested = path.join(extensionDestDir, 'Info.plist');
    const infoPlistRoot = path.join(targetRootDir, 'Info.plist');
    const infoPlistEAS = path.join(targetRootDir, `${EXTENSION_NAME}-Info.plist`);

    // Ensure the nested copy exists (may have been copied from source above, or use fallback)
    if (!fs.existsSync(infoPlistNested)) {
      console.warn('[withBroadcastExtension] Info.plist missing at nested path, writing fallback');
      fs.writeFileSync(infoPlistNested, FALLBACK_INFO_PLIST);
    }

    // Copy to target root and EAS path (unconditional — always overwrite to ensure consistency)
    fs.copyFileSync(infoPlistNested, infoPlistRoot);
    fs.copyFileSync(infoPlistNested, infoPlistEAS);
    console.log(`[withBroadcastExtension] Info.plist placed at 3 paths:`);
    console.log(`[withBroadcastExtension]   1. ${infoPlistNested}`);
    console.log(`[withBroadcastExtension]   2. ${infoPlistRoot}`);
    console.log(`[withBroadcastExtension]   3. ${infoPlistEAS}`);

    // Sync extension version with parent app version across ALL 3 Info.plist copies
    const appVersion = config.version || '1.0.0';
    const buildNumber = (config.ios && config.ios.buildNumber) || '1';
    const allPlistPaths = [infoPlistNested, infoPlistRoot, infoPlistEAS];
    for (const plistPath of allPlistPaths) {
      if (fs.existsSync(plistPath)) {
        let plistContent = fs.readFileSync(plistPath, 'utf8');
        plistContent = plistContent.replace(
          /(<key>CFBundleShortVersionString<\/key>\s*<string>)[^<]*/,
          `$1${appVersion}`
        );
        plistContent = plistContent.replace(
          /(<key>CFBundleVersion<\/key>\s*<string>)[^<]*/,
          `$1${buildNumber}`
        );
        fs.writeFileSync(plistPath, plistContent);
      }
    }
    console.log(`[withBroadcastExtension] Version patched: CFBundleShortVersionString=${appVersion}, CFBundleVersion=${buildNumber}`);

    // === ENTITLEMENTS: place at both nested and target root ===
    // CODE_SIGN_ENTITLEMENTS = "BroadcastExtension/BroadcastExtension.entitlements" (target root)
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
    const entitlementsNested = path.join(extensionDestDir, `${EXTENSION_NAME}.entitlements`);
    const entitlementsRoot = path.join(targetRootDir, `${EXTENSION_NAME}.entitlements`);
    fs.writeFileSync(entitlementsNested, entitlementsContent);
    fs.writeFileSync(entitlementsRoot, entitlementsContent);
    console.log(`[withBroadcastExtension] Entitlements placed at 2 paths:`);
    console.log(`[withBroadcastExtension]   1. ${entitlementsNested}`);
    console.log(`[withBroadcastExtension]   2. ${entitlementsRoot}`);

    // === LOG ALL FILES ON DISK ===
    console.log('[withBroadcastExtension] === FILES ON DISK ===');
    const logDirContents = (dir, label) => {
      if (fs.existsSync(dir)) {
        const files = fs.readdirSync(dir);
        console.log(`[withBroadcastExtension] ${label} (${files.length} files): ${files.join(', ')}`);
      } else {
        console.warn(`[withBroadcastExtension] ${label}: DIRECTORY DOES NOT EXIST`);
      }
    };
    logDirContents(targetRootDir, 'ios/BroadcastExtension/');
    logDirContents(extensionDestDir, 'ios/BroadcastExtension/BroadcastExtension/');

    // Add the extension target to the Xcode project
    addBroadcastExtensionTarget(xcodeProject, extensionDestDir, platformProjectRoot);

    return config;
  });

  // Step 3: Raw text patch of the pbxproj AFTER the xcode library serializes it.
  // withDangerousMod runs after withXcodeProject has written the file to disk,
  // so we can read the actual pbxproj text and verify/fix it as a final safety net.
  config = withDangerousMod(config, [
    'ios',
    async (config) => {
      const iosProjRoot = path.join(config.modRequest.projectRoot, 'ios');
      patchPbxprojRawText(iosProjRoot);
      return config;
    },
  ]);

  return config;
}

/**
 * Adds the BroadcastExtension target to the Xcode project using
 * the xcode library's pbxProject API.
 *
 * Key insight: xcode lib's addTarget() creates the target with buildPhases: []
 * (empty array). This means addSourceFile() will crash when it tries to find
 * PBXSourcesBuildPhase via pbxSourcesBuildPhaseObj(). We must manually create
 * the build phases and attach them to the target BEFORE calling addSourceFile.
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

  // Add the extension target (creates target with EMPTY buildPhases: [])
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

  console.log(`[withBroadcastExtension] Created target UUID=${target.uuid}`);

  const objects = xcodeProject.hash.project.objects;

  // === CRITICAL: Manually create build phases BEFORE addSourceFile ===
  // addTarget leaves buildPhases empty, so addSourceFile would crash
  // trying to access null.files on PBXSourcesBuildPhase.

  // Find the target entry to attach phases to
  const nativeTargets = objects['PBXNativeTarget'] || {};
  let targetEntry = null;
  for (const key in nativeTargets) {
    if (key.endsWith('_comment')) continue;
    if (nativeTargets[key].name === EXTENSION_NAME) {
      targetEntry = nativeTargets[key];
      break;
    }
  }

  if (!targetEntry) {
    console.warn('[withBroadcastExtension] Could not find target entry after addTarget');
    return;
  }

  if (!targetEntry.buildPhases) {
    targetEntry.buildPhases = [];
  }

  // Create PBXSourcesBuildPhase
  const sourcesBuildPhases = objects['PBXSourcesBuildPhase'] || {};
  if (!objects['PBXSourcesBuildPhase']) {
    objects['PBXSourcesBuildPhase'] = sourcesBuildPhases;
  }
  const sourcesPhaseId = xcodeProject.generateUuid();
  sourcesBuildPhases[sourcesPhaseId] = {
    isa: 'PBXSourcesBuildPhase',
    buildActionMask: 2147483647,
    files: [],
    runOnlyForDeploymentPostprocessing: 0,
  };
  sourcesBuildPhases[`${sourcesPhaseId}_comment`] = 'Sources';
  targetEntry.buildPhases.push({ value: sourcesPhaseId, comment: 'Sources' });
  console.log(`[withBroadcastExtension] Created PBXSourcesBuildPhase (${sourcesPhaseId})`);

  // Create PBXFrameworksBuildPhase
  const frameworksBuildPhases = objects['PBXFrameworksBuildPhase'] || {};
  if (!objects['PBXFrameworksBuildPhase']) {
    objects['PBXFrameworksBuildPhase'] = frameworksBuildPhases;
  }
  const frameworksPhaseId = xcodeProject.generateUuid();
  frameworksBuildPhases[frameworksPhaseId] = {
    isa: 'PBXFrameworksBuildPhase',
    buildActionMask: 2147483647,
    files: [],
    runOnlyForDeploymentPostprocessing: 0,
  };
  frameworksBuildPhases[`${frameworksPhaseId}_comment`] = 'Frameworks';
  targetEntry.buildPhases.push({ value: frameworksPhaseId, comment: 'Frameworks' });
  console.log(`[withBroadcastExtension] Created PBXFrameworksBuildPhase (${frameworksPhaseId})`);

  console.log(`[withBroadcastExtension] Target now has ${targetEntry.buildPhases.length} build phases`);

  // === Add source files (wrapped in try/catch — ensureSourceFilesInBuildPhase is fallback) ===
  const sourceFiles = [
    'SampleHandler.swift',
    'FrameProcessor.swift',
    'SharedContainer.swift',
  ];

  // Create a PBXGroup for the extension
  const extensionGroupKey = xcodeProject.pbxCreateGroup(EXTENSION_NAME, EXTENSION_NAME);

  // Attempt addSourceFile for each file — may still fail, but won't crash the plugin
  for (const fileName of sourceFiles) {
    const filePath = path.join(EXTENSION_NAME, fileName);
    try {
      xcodeProject.addSourceFile(
        filePath,
        { target: target.uuid },
        extensionGroupKey
      );
      console.log(`[withBroadcastExtension] addSourceFile succeeded for ${fileName}`);
    } catch (err) {
      console.warn(`[withBroadcastExtension] addSourceFile failed for ${fileName}: ${err.message}`);
      console.warn('[withBroadcastExtension] ensureSourceFilesInBuildPhase will handle it as fallback');
    }
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
  // SampleHandler.swift imports: ReplayKit, Vision, CoreMedia
  // FrameProcessor.swift imports: Vision, UIKit
  // SharedContainer.swift imports: Foundation (always available)
  const frameworks = ['ReplayKit.framework', 'Vision.framework', 'CoreMedia.framework', 'UIKit.framework'];
  for (const framework of frameworks) {
    xcodeProject.addFramework(framework, {
      target: target.uuid,
      link: true,
    });
  }
  console.log(`[withBroadcastExtension] Linked frameworks: ${frameworks.join(', ')}`);

  // Apply build settings via target's buildConfigurationList UUID
  applyExtensionBuildSettings(xcodeProject, target);

  // Disable code signing on resource bundle targets (Xcode 14+ fix)
  const allBuildConfigs = xcodeProject.pbxXCBuildConfigurationSection();
  for (const key in allBuildConfigs) {
    const cfg = allBuildConfigs[key];
    if (
      cfg &&
      typeof cfg === 'object' &&
      cfg.buildSettings &&
      (cfg.buildSettings.WRAPPER_EXTENSION === '"bundle"' ||
        cfg.buildSettings.WRAPPER_EXTENSION === 'bundle')
    ) {
      cfg.buildSettings.CODE_SIGNING_ALLOWED = 'NO';
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

  // === FINAL STEP: ensureSourceFilesInBuildPhase as guaranteed fallback ===
  // This runs AFTER everything else to guarantee Swift files are in compile sources,
  // regardless of whether addSourceFile succeeded or failed above.
  ensureSourceFilesInBuildPhase(xcodeProject, target, sourceFiles);

  // === FINAL VALIDATION: confirm everything is wired correctly ===
  validateExtensionTarget(xcodeProject, target, sourceFiles, frameworks);

  // Diagnostic: log all files in the target's compile sources build phase
  logCompileSourcesForTarget(xcodeProject, target);
}

/**
 * Fix 1: Apply build settings by finding the target's buildConfigurationList
 * and iterating its configurations directly. This avoids the fragile
 * PRODUCT_NAME matching that can fail when addTarget sets it differently.
 */
function applyExtensionBuildSettings(xcodeProject, target) {
  // Get the native target object to find its buildConfigurationList
  const nativeTargets = xcodeProject.pbxNativeTargetSection();
  let buildConfigListId = null;

  for (const key in nativeTargets) {
    if (key.endsWith('_comment')) continue;
    const nt = nativeTargets[key];
    if (nt && nt.name === EXTENSION_NAME) {
      buildConfigListId = nt.buildConfigurationList;
      break;
    }
  }

  if (!buildConfigListId) {
    console.warn('[withBroadcastExtension] Could not find buildConfigurationList for target');
    return;
  }

  console.log(`[withBroadcastExtension] Found buildConfigurationList: ${buildConfigListId}`);

  // Get the XCConfigurationList to find its buildConfigurations array
  const configLists = xcodeProject.hash.project.objects['XCConfigurationList'];
  const configList = configLists ? configLists[buildConfigListId] : null;

  if (!configList || !configList.buildConfigurations) {
    console.warn('[withBroadcastExtension] Could not find XCConfigurationList entries');
    return;
  }

  // Iterate each configuration (Debug, Release) in this target's list
  const allConfigs = xcodeProject.pbxXCBuildConfigurationSection();
  for (const configRef of configList.buildConfigurations) {
    const configId = configRef.value;
    const buildConfig = allConfigs[configId];

    if (!buildConfig || !buildConfig.buildSettings) {
      console.warn(`[withBroadcastExtension] No buildSettings for config ${configId}`);
      continue;
    }

    console.log(`[withBroadcastExtension] Applying build settings to ${buildConfig.name} (${configId})`);

    // Core identity
    buildConfig.buildSettings.PRODUCT_NAME = '"$(TARGET_NAME)"';
    buildConfig.buildSettings.PRODUCT_BUNDLE_IDENTIFIER = `"${EXTENSION_BUNDLE_ID}"`;
    buildConfig.buildSettings.PRODUCT_MODULE_NAME = `"${EXTENSION_NAME}"`;

    // Plist and entitlements paths
    buildConfig.buildSettings.INFOPLIST_FILE = `"${EXTENSION_NAME}/Info.plist"`;
    buildConfig.buildSettings.CODE_SIGN_ENTITLEMENTS = `"${EXTENSION_NAME}/${EXTENSION_NAME}.entitlements"`;
    buildConfig.buildSettings.GENERATE_INFOPLIST_FILE = 'NO';

    // Swift and architecture — critical for producing a valid binary
    buildConfig.buildSettings.SWIFT_VERSION = '"5.0"';
    buildConfig.buildSettings.ARCHS = '"arm64"';
    buildConfig.buildSettings.ALWAYS_EMBED_SWIFT_STANDARD_LIBRARIES = 'YES';

    // Deployment
    buildConfig.buildSettings.TARGETED_DEVICE_FAMILY = '"1,2"';
    buildConfig.buildSettings.IPHONEOS_DEPLOYMENT_TARGET = '"16.0"';

    // Versioning
    buildConfig.buildSettings.CURRENT_PROJECT_VERSION = '"1"';
    buildConfig.buildSettings.MARKETING_VERSION = '"1.0"';

    // Extension must not be independently installable
    buildConfig.buildSettings.SKIP_INSTALL = 'YES';

    // Signing — Automatic so EAS/Xcode resolve the profile
    buildConfig.buildSettings.CODE_SIGN_STYLE = '"Automatic"';
    buildConfig.buildSettings.DEVELOPMENT_TEAM = `"${TEAM_ID}"`;

    // Log all applied settings for this configuration
    const bs = buildConfig.buildSettings;
    console.log(`[withBroadcastExtension] === BUILD SETTINGS for ${buildConfig.name} ===`);
    console.log(`[withBroadcastExtension]   PRODUCT_NAME=${bs.PRODUCT_NAME}`);
    console.log(`[withBroadcastExtension]   PRODUCT_BUNDLE_IDENTIFIER=${bs.PRODUCT_BUNDLE_IDENTIFIER}`);
    console.log(`[withBroadcastExtension]   PRODUCT_MODULE_NAME=${bs.PRODUCT_MODULE_NAME}`);
    console.log(`[withBroadcastExtension]   INFOPLIST_FILE=${bs.INFOPLIST_FILE}`);
    console.log(`[withBroadcastExtension]   CODE_SIGN_ENTITLEMENTS=${bs.CODE_SIGN_ENTITLEMENTS}`);
    console.log(`[withBroadcastExtension]   SWIFT_VERSION=${bs.SWIFT_VERSION}`);
    console.log(`[withBroadcastExtension]   ARCHS=${bs.ARCHS}`);
    console.log(`[withBroadcastExtension]   ALWAYS_EMBED_SWIFT_STANDARD_LIBRARIES=${bs.ALWAYS_EMBED_SWIFT_STANDARD_LIBRARIES}`);
    console.log(`[withBroadcastExtension]   TARGETED_DEVICE_FAMILY=${bs.TARGETED_DEVICE_FAMILY}`);
    console.log(`[withBroadcastExtension]   IPHONEOS_DEPLOYMENT_TARGET=${bs.IPHONEOS_DEPLOYMENT_TARGET}`);
    console.log(`[withBroadcastExtension]   CODE_SIGN_STYLE=${bs.CODE_SIGN_STYLE}`);
    console.log(`[withBroadcastExtension]   DEVELOPMENT_TEAM=${bs.DEVELOPMENT_TEAM}`);
    console.log(`[withBroadcastExtension]   SKIP_INSTALL=${bs.SKIP_INSTALL}`);
    console.log(`[withBroadcastExtension]   GENERATE_INFOPLIST_FILE=${bs.GENERATE_INFOPLIST_FILE}`);
    console.log(`[withBroadcastExtension] === END BUILD SETTINGS for ${buildConfig.name} ===`);
  }
}

/**
 * Fix 2: Ensure each Swift source file has a PBXBuildFile entry
 * linking it to the target's PBXSourcesBuildPhase. If addSourceFile
 * didn't create these entries, we add them manually.
 */
function ensureSourceFilesInBuildPhase(xcodeProject, target, sourceFileNames) {
  const objects = xcodeProject.hash.project.objects;

  // Find the target's PBXSourcesBuildPhase
  const nativeTargets = objects['PBXNativeTarget'] || {};
  let sourcesBuildPhaseId = null;
  let targetEntry = null;

  for (const key in nativeTargets) {
    if (key.endsWith('_comment')) continue;
    if (nativeTargets[key].name === EXTENSION_NAME) {
      targetEntry = nativeTargets[key];
      break;
    }
  }

  if (!targetEntry || !targetEntry.buildPhases) {
    console.warn('[withBroadcastExtension] Could not find target buildPhases');
    return;
  }

  // Find the PBXSourcesBuildPhase among the target's build phases
  const sourcesBuildPhases = objects['PBXSourcesBuildPhase'] || {};
  for (const phaseRef of targetEntry.buildPhases) {
    const phaseId = phaseRef.value;
    if (sourcesBuildPhases[phaseId]) {
      sourcesBuildPhaseId = phaseId;
      break;
    }
  }

  if (!sourcesBuildPhaseId) {
    console.warn('[withBroadcastExtension] No PBXSourcesBuildPhase found for target, creating one');
    // Create a sources build phase manually
    const newPhaseId = xcodeProject.generateUuid();
    sourcesBuildPhases[newPhaseId] = {
      isa: 'PBXSourcesBuildPhase',
      buildActionMask: 2147483647,
      files: [],
      runOnlyForDeploymentPostprocessing: 0,
    };
    sourcesBuildPhases[`${newPhaseId}_comment`] = 'Sources';
    targetEntry.buildPhases.push({ value: newPhaseId, comment: 'Sources' });
    sourcesBuildPhaseId = newPhaseId;
  }

  const sourcesPhase = sourcesBuildPhases[sourcesBuildPhaseId];
  if (!sourcesPhase.files) {
    sourcesPhase.files = [];
  }

  // Collect all PBXBuildFile UUIDs already in this build phase
  const existingBuildFileIds = new Set(
    sourcesPhase.files.map((f) => (typeof f === 'object' ? f.value : f))
  );

  // Collect all PBXFileReference UUIDs for our source files
  const fileReferences = objects['PBXFileReference'] || {};
  const buildFiles = objects['PBXBuildFile'] || {};

  // For each source file, check if a PBXBuildFile exists linking it to this phase
  for (const fileName of sourceFileNames) {
    const filePath = path.join(EXTENSION_NAME, fileName);

    // Find the PBXFileReference for this file
    let fileRefId = null;
    for (const refId in fileReferences) {
      if (refId.endsWith('_comment')) continue;
      const ref = fileReferences[refId];
      if (
        ref &&
        (ref.path === `"${filePath}"` ||
          ref.path === filePath ||
          ref.path === `"${fileName}"` ||
          ref.path === fileName ||
          ref.name === `"${fileName}"` ||
          ref.name === fileName)
      ) {
        fileRefId = refId;
        break;
      }
    }

    if (!fileRefId) {
      // Create a PBXFileReference if it doesn't exist
      console.warn(`[withBroadcastExtension] No PBXFileReference for ${fileName}, creating one`);
      fileRefId = xcodeProject.generateUuid();
      fileReferences[fileRefId] = {
        isa: 'PBXFileReference',
        lastKnownFileType: 'sourcecode.swift',
        path: `"${filePath}"`,
        sourceTree: '"<group>"',
      };
      fileReferences[`${fileRefId}_comment`] = fileName;
    }

    // Check if a PBXBuildFile referencing this fileRef already exists in the phase
    let buildFileFound = false;
    for (const bfId of existingBuildFileIds) {
      const bf = buildFiles[bfId];
      if (bf && bf.fileRef === fileRefId) {
        buildFileFound = true;
        console.log(`[withBroadcastExtension] ${fileName} already in compile sources (buildFile=${bfId})`);
        break;
      }
    }

    if (!buildFileFound) {
      // Create a PBXBuildFile and add it to the sources phase
      const newBuildFileId = xcodeProject.generateUuid();
      buildFiles[newBuildFileId] = {
        isa: 'PBXBuildFile',
        fileRef: fileRefId,
        fileRef_comment: fileName,
      };
      buildFiles[`${newBuildFileId}_comment`] = `${fileName} in Sources`;

      sourcesPhase.files.push({
        value: newBuildFileId,
        comment: `${fileName} in Sources`,
      });

      console.log(`[withBroadcastExtension] Added ${fileName} to compile sources (buildFile=${newBuildFileId}, fileRef=${fileRefId})`);
    }
  }

  console.log(`[withBroadcastExtension] Sources build phase now has ${sourcesPhase.files.length} files`);
}

/**
 * Diagnostic: Log all files in the target's PBXSourcesBuildPhase
 * so we can verify in the EAS build logs.
 */
function logCompileSourcesForTarget(xcodeProject, target) {
  const objects = xcodeProject.hash.project.objects;
  const nativeTargets = objects['PBXNativeTarget'] || {};
  const sourcesBuildPhases = objects['PBXSourcesBuildPhase'] || {};
  const buildFiles = objects['PBXBuildFile'] || {};
  const fileReferences = objects['PBXFileReference'] || {};

  let targetEntry = null;
  for (const key in nativeTargets) {
    if (key.endsWith('_comment')) continue;
    if (nativeTargets[key].name === EXTENSION_NAME) {
      targetEntry = nativeTargets[key];
      break;
    }
  }

  if (!targetEntry) {
    console.warn('[withBroadcastExtension] DIAGNOSTIC: Could not find target for logging');
    return;
  }

  for (const phaseRef of targetEntry.buildPhases) {
    const phaseId = phaseRef.value;
    const phase = sourcesBuildPhases[phaseId];
    if (!phase) continue;

    console.log(`[withBroadcastExtension] === COMPILE SOURCES for ${EXTENSION_NAME} (phase=${phaseId}) ===`);
    if (!phase.files || phase.files.length === 0) {
      console.warn('[withBroadcastExtension] WARNING: Compile sources build phase is EMPTY');
      return;
    }
    for (const fileEntry of phase.files) {
      const bfId = typeof fileEntry === 'object' ? fileEntry.value : fileEntry;
      const bf = buildFiles[bfId];
      if (!bf) {
        console.warn(`[withBroadcastExtension]   buildFile ${bfId} — NOT FOUND in PBXBuildFile`);
        continue;
      }
      const fileRef = fileReferences[bf.fileRef];
      const fileName = fileRef
        ? (fileRef.path || fileRef.name || 'unknown').replace(/"/g, '')
        : 'unknown';
      console.log(`[withBroadcastExtension]   ${fileName} (buildFile=${bfId}, fileRef=${bf.fileRef})`);
    }
    console.log(`[withBroadcastExtension] === END COMPILE SOURCES (${phase.files.length} files) ===`);
  }
}

/**
 * Final validation: reads back the pbxproj in-memory and confirms
 * that all critical elements are present. Logs warnings for anything missing.
 */
function validateExtensionTarget(xcodeProject, target, expectedSourceFiles, expectedFrameworks) {
  console.log('[withBroadcastExtension] === FINAL VALIDATION ===');
  const objects = xcodeProject.hash.project.objects;
  let errors = 0;

  // 1. Validate PBXSourcesBuildPhase has all Swift files
  const nativeTargets = objects['PBXNativeTarget'] || {};
  let targetEntry = null;
  for (const key in nativeTargets) {
    if (key.endsWith('_comment')) continue;
    if (nativeTargets[key].name === EXTENSION_NAME) {
      targetEntry = nativeTargets[key];
      break;
    }
  }

  if (!targetEntry) {
    console.error('[withBroadcastExtension] VALIDATION FAIL: Target not found in PBXNativeTarget');
    return;
  }

  // Find sources build phase
  const sourcesBuildPhases = objects['PBXSourcesBuildPhase'] || {};
  let sourcesPhase = null;
  for (const phaseRef of (targetEntry.buildPhases || [])) {
    const phaseId = phaseRef.value;
    if (sourcesBuildPhases[phaseId]) {
      sourcesPhase = sourcesBuildPhases[phaseId];
      break;
    }
  }

  if (!sourcesPhase) {
    console.error('[withBroadcastExtension] VALIDATION FAIL: No PBXSourcesBuildPhase on target');
    errors++;
  } else {
    const sourceFileCount = (sourcesPhase.files || []).length;
    if (sourceFileCount >= expectedSourceFiles.length) {
      console.log(`[withBroadcastExtension] VALIDATION OK: PBXSourcesBuildPhase has ${sourceFileCount} files (expected ${expectedSourceFiles.length})`);
    } else {
      console.error(`[withBroadcastExtension] VALIDATION FAIL: PBXSourcesBuildPhase has ${sourceFileCount} files, expected ${expectedSourceFiles.length}`);
      errors++;
    }
  }

  // 2. Validate PBXFrameworksBuildPhase has frameworks
  const frameworksBuildPhases = objects['PBXFrameworksBuildPhase'] || {};
  let frameworksPhase = null;
  for (const phaseRef of (targetEntry.buildPhases || [])) {
    const phaseId = phaseRef.value;
    if (frameworksBuildPhases[phaseId]) {
      frameworksPhase = frameworksBuildPhases[phaseId];
      break;
    }
  }

  if (!frameworksPhase) {
    console.error('[withBroadcastExtension] VALIDATION FAIL: No PBXFrameworksBuildPhase on target');
    errors++;
  } else {
    const frameworkFileCount = (frameworksPhase.files || []).length;
    if (frameworkFileCount >= expectedFrameworks.length) {
      console.log(`[withBroadcastExtension] VALIDATION OK: PBXFrameworksBuildPhase has ${frameworkFileCount} files (expected ${expectedFrameworks.length})`);
    } else {
      console.error(`[withBroadcastExtension] VALIDATION FAIL: PBXFrameworksBuildPhase has ${frameworkFileCount} files, expected ${expectedFrameworks.length}`);
      errors++;
    }
  }

  // 3. Validate build settings have SWIFT_VERSION
  const configLists = objects['XCConfigurationList'] || {};
  const configList = configLists[targetEntry.buildConfigurationList];
  if (configList && configList.buildConfigurations) {
    const allConfigs = xcodeProject.pbxXCBuildConfigurationSection();
    for (const configRef of configList.buildConfigurations) {
      const config = allConfigs[configRef.value];
      if (config && config.buildSettings) {
        const bs = config.buildSettings;
        const swiftVersion = bs.SWIFT_VERSION;
        if (swiftVersion && swiftVersion.includes('5.0')) {
          console.log(`[withBroadcastExtension] VALIDATION OK: ${config.name} SWIFT_VERSION=${swiftVersion}`);
        } else {
          console.error(`[withBroadcastExtension] VALIDATION FAIL: ${config.name} SWIFT_VERSION=${swiftVersion || 'MISSING'}`);
          errors++;
        }
      }
    }
  }

  // 4. Validate buildPhases array is non-empty
  const phaseCount = (targetEntry.buildPhases || []).length;
  if (phaseCount >= 2) {
    console.log(`[withBroadcastExtension] VALIDATION OK: Target has ${phaseCount} build phases`);
  } else {
    console.error(`[withBroadcastExtension] VALIDATION FAIL: Target has ${phaseCount} build phases (expected >= 2)`);
    errors++;
  }

  if (errors === 0) {
    console.log('[withBroadcastExtension] === VALIDATION PASSED — all checks OK ===');
  } else {
    console.error(`[withBroadcastExtension] === VALIDATION FAILED — ${errors} error(s) ===`);
  }
}

/**
 * Raw text patch of the pbxproj file as a last-resort safety net.
 * Runs AFTER the xcode npm library has serialized the project to disk
 * (via withDangerousMod which executes after withXcodeProject).
 *
 * Reads project.pbxproj as a string, verifies that the BroadcastExtension
 * target's PBXSourcesBuildPhase and PBXFrameworksBuildPhase are correctly
 * populated, and fixes them via string manipulation if not.
 *
 * This does NOT use the xcode npm library — pure fs + regex.
 */
function patchPbxprojRawText(platformProjectRoot) {
  const LOG = '[pbxproj-raw-patch]';

  // --- Locate the pbxproj file ---
  if (!fs.existsSync(platformProjectRoot)) {
    console.warn(`${LOG} ios/ directory does not exist: ${platformProjectRoot}`);
    return;
  }

  const xcodeprojDir = fs.readdirSync(platformProjectRoot).find(f => f.endsWith('.xcodeproj'));
  if (!xcodeprojDir) {
    console.warn(`${LOG} No .xcodeproj directory found in ${platformProjectRoot}`);
    return;
  }

  const pbxprojPath = path.join(platformProjectRoot, xcodeprojDir, 'project.pbxproj');
  if (!fs.existsSync(pbxprojPath)) {
    console.warn(`${LOG} project.pbxproj not found at ${pbxprojPath}`);
    return;
  }

  let content = fs.readFileSync(pbxprojPath, 'utf8');
  const originalSize = content.length;
  let modified = false;
  console.log(`${LOG} Read ${pbxprojPath} (${originalSize} bytes)`);

  // --- UUID generator: 24-char uppercase hex, collision-safe ---
  function genUuid() {
    const hex = '0123456789ABCDEF';
    let id;
    do {
      id = '';
      for (let i = 0; i < 24; i++) id += hex[Math.floor(Math.random() * 16)];
    } while (content.includes(id));
    return id;
  }

  // --- Helper: find or create a PBXBuildFile entry ---
  // Returns the UUID of the PBXBuildFile. Creates one if it doesn't exist.
  function findOrCreateBuildFile(fileName, fileRefUuid, phaseName) {
    const esc = fileName.replace(/\./g, '\\.');
    const existing = content.match(new RegExp(
      `(\\w{24})\\s*\\/\\*\\s*${esc}\\s+in\\s+${phaseName}\\s*\\*\\/`
    ));
    if (existing) {
      console.log(`${LOG} Found existing PBXBuildFile for ${fileName} in ${phaseName}: ${existing[1]}`);
      return existing[1];
    }

    const uuid = genUuid();
    const entry = `\t\t${uuid} /* ${fileName} in ${phaseName} */ = {isa = PBXBuildFile; fileRef = ${fileRefUuid} /* ${fileName} */; };`;
    content = content.replace(
      '/* End PBXBuildFile section */',
      entry + '\n/* End PBXBuildFile section */'
    );
    modified = true;
    console.log(`${LOG} Created PBXBuildFile: ${uuid} (${fileName} in ${phaseName})`);
    return uuid;
  }

  // ============================================================
  // STEP 1: Find BroadcastExtension target in PBXNativeTarget
  // ============================================================
  const targetUuidMatch = content.match(
    /(\w{24})\s*\/\*\s*BroadcastExtension\s*\*\/\s*=\s*\{\s*\n\s*isa\s*=\s*PBXNativeTarget/
  );
  if (!targetUuidMatch) {
    console.warn(`${LOG} BroadcastExtension PBXNativeTarget not found — skipping raw patch`);
    return;
  }
  const targetUuid = targetUuidMatch[1];
  console.log(`${LOG} Found BroadcastExtension target: ${targetUuid}`);

  // Extract the target block (safe to grab ~2000 chars — target blocks are < 1000)
  const targetPos = content.indexOf(targetUuidMatch[0]);
  const targetSlice = content.substring(targetPos, targetPos + 2000);

  // Parse buildPhases = ( ... )
  const bpMatch = targetSlice.match(/buildPhases\s*=\s*\(\n([\s\S]*?)\t*\)/);
  if (!bpMatch) {
    console.warn(`${LOG} buildPhases not found in target block`);
    return;
  }

  const phaseRefs = [];
  const prRegex = /(\w{24})\s*\/\*\s*([\w ]+?)\s*\*\//g;
  let prm;
  while ((prm = prRegex.exec(bpMatch[1])) !== null) {
    phaseRefs.push({ uuid: prm[1], name: prm[2].trim() });
  }
  console.log(`${LOG} buildPhases (${phaseRefs.length}): ${phaseRefs.map(p => p.name + '(' + p.uuid + ')').join(', ')}`);

  const sourcesRef = phaseRefs.find(p => p.name === 'Sources');
  const frameworksRef = phaseRefs.find(p => p.name === 'Frameworks');

  // ============================================================
  // STEP 2: Find PBXFileReference UUIDs for our Swift files
  // ============================================================
  const swiftFileNames = ['SampleHandler.swift', 'FrameProcessor.swift', 'SharedContainer.swift'];
  const swiftFileRefs = {};

  for (const fn of swiftFileNames) {
    const esc = fn.replace(/\./g, '\\.');
    const m = content.match(new RegExp(
      `(\\w{24})\\s*\\/\\*\\s*${esc}\\s*\\*\\/\\s*=\\s*\\{[^}]*PBXFileReference`
    ));
    if (m) {
      swiftFileRefs[fn] = m[1];
      console.log(`${LOG} FileRef ${fn}: ${m[1]}`);
    } else {
      console.warn(`${LOG} No PBXFileReference for ${fn} — will skip this file`);
    }
  }

  // ============================================================
  // STEP 3: Verify / fix PBXSourcesBuildPhase
  // ============================================================
  let sourcesPhaseUuid = sourcesRef ? sourcesRef.uuid : null;
  let sourcesNeedsFix = false;

  if (sourcesPhaseUuid) {
    const spMatch = content.match(new RegExp(
      sourcesPhaseUuid + '\\s*\\/\\*\\s*Sources\\s*\\*\\/\\s*=\\s*\\{[\\s\\S]*?files\\s*=\\s*\\(([^)]*)\\)'
    ));
    if (spMatch) {
      const filesStr = spMatch[1];
      let presentCount = 0;
      for (const fn of swiftFileNames) {
        if (filesStr.includes(fn.replace('.swift', ''))) presentCount++;
      }
      if (presentCount < swiftFileNames.length) {
        sourcesNeedsFix = true;
        console.log(`${LOG} Sources phase has ${presentCount}/${swiftFileNames.length} Swift files — needs fix`);
      } else {
        console.log(`${LOG} Sources phase OK — all ${swiftFileNames.length} Swift files present`);
      }
    } else {
      sourcesNeedsFix = true;
      console.warn(`${LOG} Could not parse Sources phase block — will recreate files list`);
    }
  } else {
    sourcesNeedsFix = true;
    console.log(`${LOG} No Sources phase in target buildPhases — will create one`);
  }

  if (sourcesNeedsFix) {
    console.log(`${LOG} Fixing PBXSourcesBuildPhase...`);

    // Get or create PBXBuildFile entries for each Swift file
    const srcBfEntries = [];
    for (const fn of swiftFileNames) {
      const frUuid = swiftFileRefs[fn];
      if (!frUuid) continue;
      const bfUuid = findOrCreateBuildFile(fn, frUuid, 'Sources');
      srcBfEntries.push({ uuid: bfUuid, name: fn });
    }

    const srcFilesLines = srcBfEntries.map(
      e => `\t\t\t\t${e.uuid} /* ${e.name} in Sources */,`
    ).join('\n');

    if (!sourcesPhaseUuid) {
      // --- Create a brand-new PBXSourcesBuildPhase ---
      sourcesPhaseUuid = genUuid();
      const phaseBlock = [
        `\t\t${sourcesPhaseUuid} /* Sources */ = {`,
        `\t\t\tisa = PBXSourcesBuildPhase;`,
        `\t\t\tbuildActionMask = 2147483647;`,
        `\t\t\tfiles = (`,
        srcFilesLines,
        `\t\t\t);`,
        `\t\t\trunOnlyForDeploymentPostprocessing = 0;`,
        `\t\t};`,
      ].join('\n');

      // Insert into existing section, or create section
      if (content.includes('/* End PBXSourcesBuildPhase section */')) {
        content = content.replace(
          '/* End PBXSourcesBuildPhase section */',
          phaseBlock + '\n/* End PBXSourcesBuildPhase section */'
        );
      } else {
        const anchor = content.includes('/* End PBXShellScriptBuildPhase section */')
          ? '/* End PBXShellScriptBuildPhase section */'
          : '/* End PBXResourcesBuildPhase section */';
        content = content.replace(anchor,
          anchor + '\n\n/* Begin PBXSourcesBuildPhase section */\n' + phaseBlock + '\n/* End PBXSourcesBuildPhase section */'
        );
      }

      // Add the phase UUID to the target's buildPhases array
      const bpInsertRegex = new RegExp(
        `(${targetUuid}[\\s\\S]*?buildPhases\\s*=\\s*\\(\\n)`
      );
      content = content.replace(bpInsertRegex, `$1\t\t\t\t${sourcesPhaseUuid} /* Sources */,\n`);

      modified = true;
      console.log(`${LOG} Created PBXSourcesBuildPhase ${sourcesPhaseUuid} and added to target`);
    } else {
      // --- Replace the files list in the existing Sources phase ---
      const replaceRegex = new RegExp(
        `(${sourcesPhaseUuid}\\s*\\/\\*\\s*Sources\\s*\\*\\/\\s*=\\s*\\{[\\s\\S]*?files\\s*=\\s*\\()([^)]*)(\\))`
      );
      content = content.replace(replaceRegex, `$1\n${srcFilesLines}\n\t\t\t$3`);
      modified = true;
      console.log(`${LOG} Replaced Sources phase files with ${srcBfEntries.length} entries`);
    }
  }

  // ============================================================
  // STEP 4: Verify / fix PBXFrameworksBuildPhase
  // ============================================================
  const expectedFw = ['ReplayKit.framework', 'Vision.framework', 'UIKit.framework', 'Foundation.framework'];
  let fwPhaseUuid = frameworksRef ? frameworksRef.uuid : null;
  let fwNeedsFix = false;

  if (fwPhaseUuid) {
    const fwMatch = content.match(new RegExp(
      fwPhaseUuid + '\\s*\\/\\*\\s*Frameworks\\s*\\*\\/\\s*=\\s*\\{[\\s\\S]*?files\\s*=\\s*\\(([^)]*)\\)'
    ));
    if (fwMatch) {
      const fwFilesStr = fwMatch[1];
      const missing = expectedFw.filter(fw => !fwFilesStr.includes(fw.replace('.framework', '')));
      if (missing.length > 0) {
        fwNeedsFix = true;
        console.log(`${LOG} Frameworks phase missing: ${missing.join(', ')}`);
      } else {
        console.log(`${LOG} Frameworks phase OK — all expected frameworks present`);
      }
    } else {
      fwNeedsFix = true;
      console.warn(`${LOG} Could not parse Frameworks phase block`);
    }
  } else {
    fwNeedsFix = true;
    console.log(`${LOG} No Frameworks phase in target buildPhases — will create one`);
  }

  if (fwNeedsFix) {
    console.log(`${LOG} Fixing PBXFrameworksBuildPhase...`);

    // Find or create PBXFileReference for each framework
    const fwFileRefs = {};
    for (const fw of expectedFw) {
      const esc = fw.replace(/\./g, '\\.');
      const m = content.match(new RegExp(
        `(\\w{24})\\s*\\/\\*\\s*${esc}\\s*\\*\\/\\s*=\\s*\\{[^}]*PBXFileReference`
      ));
      if (m) {
        fwFileRefs[fw] = m[1];
        console.log(`${LOG} FileRef ${fw}: ${m[1]}`);
      } else {
        const uuid = genUuid();
        const entry = `\t\t${uuid} /* ${fw} */ = {isa = PBXFileReference; lastKnownFileType = wrapper.framework; name = ${fw}; path = System/Library/Frameworks/${fw}; sourceTree = SDKROOT; };`;
        content = content.replace(
          '/* End PBXFileReference section */',
          entry + '\n/* End PBXFileReference section */'
        );
        fwFileRefs[fw] = uuid;
        modified = true;
        console.log(`${LOG} Created PBXFileReference for ${fw}: ${uuid}`);
      }
    }

    // Determine which frameworks are already in the phase vs missing
    let existingFwFilesStr = '';
    if (fwPhaseUuid) {
      const fwMatch2 = content.match(new RegExp(
        fwPhaseUuid + '\\s*\\/\\*\\s*Frameworks\\s*\\*\\/\\s*=\\s*\\{[\\s\\S]*?files\\s*=\\s*\\(([^)]*)\\)'
      ));
      if (fwMatch2) existingFwFilesStr = fwMatch2[1];
    }

    const newFwBfEntries = [];
    for (const fw of expectedFw) {
      // Skip if already present in the phase
      if (existingFwFilesStr.includes(fw.replace('.framework', ''))) {
        console.log(`${LOG} ${fw} already in Frameworks phase`);
        continue;
      }
      const frUuid = fwFileRefs[fw];
      if (!frUuid) continue;
      const bfUuid = findOrCreateBuildFile(fw, frUuid, 'Frameworks');
      newFwBfEntries.push({ uuid: bfUuid, name: fw });
    }

    if (!fwPhaseUuid) {
      // --- Create brand-new PBXFrameworksBuildPhase with ALL expected frameworks ---
      fwPhaseUuid = genUuid();

      // Collect ALL framework build file UUIDs (existing + new)
      const allFwBfEntries = [];
      for (const fw of expectedFw) {
        const esc = fw.replace(/\./g, '\\.');
        const m = content.match(new RegExp(
          `(\\w{24})\\s*\\/\\*\\s*${esc}\\s+in\\s+Frameworks\\s*\\*\\/`
        ));
        if (m) allFwBfEntries.push({ uuid: m[1], name: fw });
      }

      const allFwLines = allFwBfEntries.map(
        e => `\t\t\t\t${e.uuid} /* ${e.name} in Frameworks */,`
      ).join('\n');

      const fwPhaseBlock = [
        `\t\t${fwPhaseUuid} /* Frameworks */ = {`,
        `\t\t\tisa = PBXFrameworksBuildPhase;`,
        `\t\t\tbuildActionMask = 2147483647;`,
        `\t\t\tfiles = (`,
        allFwLines,
        `\t\t\t);`,
        `\t\t\trunOnlyForDeploymentPostprocessing = 0;`,
        `\t\t};`,
      ].join('\n');

      if (content.includes('/* End PBXFrameworksBuildPhase section */')) {
        content = content.replace(
          '/* End PBXFrameworksBuildPhase section */',
          fwPhaseBlock + '\n/* End PBXFrameworksBuildPhase section */'
        );
      } else {
        const anchor = '/* End PBXFileReference section */';
        content = content.replace(anchor,
          anchor + '\n\n/* Begin PBXFrameworksBuildPhase section */\n' + fwPhaseBlock + '\n/* End PBXFrameworksBuildPhase section */'
        );
      }

      // Add to target's buildPhases
      const bpRegex = new RegExp(`(${targetUuid}[\\s\\S]*?buildPhases\\s*=\\s*\\(\\n)`);
      content = content.replace(bpRegex, `$1\t\t\t\t${fwPhaseUuid} /* Frameworks */,\n`);

      modified = true;
      console.log(`${LOG} Created PBXFrameworksBuildPhase ${fwPhaseUuid} and added to target`);
    } else if (newFwBfEntries.length > 0) {
      // --- Append only the MISSING frameworks to the existing phase ---
      const appendLines = newFwBfEntries.map(
        e => `\t\t\t\t${e.uuid} /* ${e.name} in Frameworks */,`
      ).join('\n');

      const fwFilesRegex = new RegExp(
        `(${fwPhaseUuid}\\s*\\/\\*\\s*Frameworks\\s*\\*\\/\\s*=\\s*\\{[\\s\\S]*?files\\s*=\\s*\\([^)]*)(\\))`
      );
      content = content.replace(fwFilesRegex, `$1\n${appendLines}\n\t\t\t$2`);
      modified = true;
      console.log(`${LOG} Appended ${newFwBfEntries.length} missing frameworks to existing phase`);
    }
  }

  // ============================================================
  // STEP 5: Write back to disk
  // ============================================================
  if (modified) {
    fs.writeFileSync(pbxprojPath, content);
    console.log(`${LOG} Wrote patched pbxproj (${content.length} bytes, delta +${content.length - originalSize})`);
  } else {
    console.log(`${LOG} No patches needed — pbxproj already correct`);
  }
}

module.exports = withBroadcastExtension;
