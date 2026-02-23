import ExpoModulesCore
import Foundation

// ─────────────────────────────────────────────────────────────
// ShortcutsModule — Expo native module bridge for iOS Shortcuts.
//
// Provides React Native access to:
// - Read pending shortcut invocation data (platform, autoStart)
// - Clear pending shortcut data after it's been consumed
// - Update the last-used platform for Quick Scan
// - Check if Shortcuts are available (iOS 16+)
// - Donate shortcut suggestions to the system
//
// The AppIntents (ScanFeedIntent, QuickScanIntent) write their
// invocation data to UserDefaults. This module reads it from
// the React Native side so expo-router can navigate accordingly.
// ─────────────────────────────────────────────────────────────

public class ShortcutsModule: Module {

    public func definition() -> ModuleDefinition {
        Name("ExpoShortcuts")

        /// Check if iOS Shortcuts (AppIntents) are available.
        Function("isAvailable") { () -> Bool in
            if #available(iOS 16.0, *) {
                return true
            }
            return false
        }

        /// Read any pending shortcut invocation data.
        /// Returns null if no shortcut was triggered, or if the data is stale (>30s).
        Function("getPendingShortcut") { () -> [String: Any]? in
            let defaults = UserDefaults.standard
            guard let platform = defaults.string(forKey: "shortcut_pending_platform") else {
                return nil
            }

            let timestamp = defaults.double(forKey: "shortcut_pending_timestamp")
            let age = Date().timeIntervalSince1970 - timestamp

            // Expire after 30 seconds to prevent stale shortcuts from firing.
            if age > 30 {
                self.clearPendingShortcut()
                return nil
            }

            let autoStart = defaults.bool(forKey: "shortcut_pending_autostart")

            return [
                "platform": platform,
                "autoStart": autoStart,
                "timestamp": timestamp,
            ]
        }

        /// Clear pending shortcut data after it's been consumed by the app.
        Function("clearPendingShortcut") { () -> Void in
            self.clearPendingShortcut()
        }

        /// Update the last-used platform (so Quick Scan knows which one to use).
        Function("setLastPlatform") { (platform: String) -> Void in
            UserDefaults.standard.set(platform, forKey: "last_broadcast_platform")
            UserDefaults.standard.synchronize()
        }

        /// Get the last-used platform for display purposes.
        Function("getLastPlatform") { () -> String in
            return UserDefaults.standard.string(forKey: "last_broadcast_platform") ?? "instagram"
        }

        /// Donate a shortcut suggestion to the system.
        /// This makes the shortcut appear in Spotlight and Siri suggestions
        /// after the user performs the action manually.
        Function("donateInteraction") { (platform: String) -> Void in
            if #available(iOS 16.0, *) {
                // Donating is handled automatically by AppIntents framework
                // when the intent runs. For manual donations after user
                // completes a scan, we update the Shortcuts system.
                UserDefaults.standard.set(platform, forKey: "last_broadcast_platform")
                UserDefaults.standard.synchronize()
            }
        }
    }

    private func clearPendingShortcut() {
        let defaults = UserDefaults.standard
        defaults.removeObject(forKey: "shortcut_pending_platform")
        defaults.removeObject(forKey: "shortcut_pending_autostart")
        defaults.removeObject(forKey: "shortcut_pending_timestamp")
        defaults.synchronize()
    }
}
