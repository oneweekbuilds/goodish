import AppIntents
import Foundation

// ─────────────────────────────────────────────────────────────
// ScanFeedIntent — iOS Shortcuts action: "Scan [Platform] Feed"
//
// Opens AlgorithmLens and starts a broadcast capture session
// for the chosen social media platform. The user picks the
// platform in the Shortcuts editor, then one tap triggers
// the full broadcast → capture → analysis flow.
//
// Requires iOS 16+ (AppIntents framework).
// ─────────────────────────────────────────────────────────────

/// Enum of supported platforms, surfaced as a Shortcuts parameter.
enum ScanPlatform: String, AppEnum {
    case instagram = "instagram"
    case twitter   = "twitter"
    case youtube   = "youtube"
    case tiktok    = "tiktok"
    case facebook  = "facebook"
    case reddit    = "reddit"

    static var typeDisplayRepresentation = TypeDisplayRepresentation(name: "Platform")

    static var caseDisplayRepresentations: [ScanPlatform: DisplayRepresentation] = [
        .instagram: DisplayRepresentation(title: "Instagram",  image: .init(systemName: "camera")),
        .twitter:   DisplayRepresentation(title: "X (Twitter)", image: .init(systemName: "bird")),
        .youtube:   DisplayRepresentation(title: "YouTube",    image: .init(systemName: "play.rectangle")),
        .tiktok:    DisplayRepresentation(title: "TikTok",     image: .init(systemName: "music.note")),
        .facebook:  DisplayRepresentation(title: "Facebook",   image: .init(systemName: "person.2")),
        .reddit:    DisplayRepresentation(title: "Reddit",     image: .init(systemName: "text.bubble")),
    ]
}

/// Main AppIntent: opens the app and starts a broadcast scan.
@available(iOS 16.0, *)
struct ScanFeedIntent: AppIntent {

    static var title: LocalizedStringResource = "Scan Social Feed"

    static var description = IntentDescription(
        "Start a screen broadcast capture to analyze your social media feed.",
        categoryName: "Scanning"
    )

    /// The platform to scan — user picks in Shortcuts editor.
    @Parameter(title: "Platform", description: "Which social media platform to scan")
    var platform: ScanPlatform

    /// Whether to auto-start the broadcast immediately upon opening.
    @Parameter(title: "Auto-Start", description: "Start broadcast automatically", default: true)
    var autoStart: Bool

    /// Opens the app when this intent runs.
    static var openAppWhenRun: Bool = true

    @MainActor
    func perform() async throws -> some IntentResult {
        // Write intent data to UserDefaults so the app can read it on launch.
        // The app's deep link handler checks for pending shortcut data.
        let defaults = UserDefaults.standard
        defaults.set(platform.rawValue, forKey: "shortcut_pending_platform")
        defaults.set(autoStart, forKey: "shortcut_pending_autostart")
        defaults.set(Date().timeIntervalSince1970, forKey: "shortcut_pending_timestamp")
        defaults.synchronize()

        // Also open via URL scheme for expo-router navigation.
        // The app will read from UserDefaults AND handle the URL.
        if let url = URL(string: "algorithmlens://broadcast/\(platform.rawValue)?autostart=\(autoStart ? "1" : "0")&source=shortcut") {
            await UIApplication.shared.open(url)
        }

        return .result()
    }
}

/// Quick Scan — starts a broadcast for the most recently used platform.
@available(iOS 16.0, *)
struct QuickScanIntent: AppIntent {

    static var title: LocalizedStringResource = "Quick Scan"

    static var description = IntentDescription(
        "Quickly start a broadcast scan using your most recently used platform.",
        categoryName: "Scanning"
    )

    static var openAppWhenRun: Bool = true

    @MainActor
    func perform() async throws -> some IntentResult {
        // Read last-used platform from UserDefaults, default to Instagram.
        let defaults = UserDefaults.standard
        let lastPlatform = defaults.string(forKey: "last_broadcast_platform") ?? "instagram"

        defaults.set(lastPlatform, forKey: "shortcut_pending_platform")
        defaults.set(true, forKey: "shortcut_pending_autostart")
        defaults.set(Date().timeIntervalSince1970, forKey: "shortcut_pending_timestamp")
        defaults.synchronize()

        if let url = URL(string: "algorithmlens://broadcast/\(lastPlatform)?autostart=1&source=shortcut") {
            await UIApplication.shared.open(url)
        }

        return .result()
    }
}
