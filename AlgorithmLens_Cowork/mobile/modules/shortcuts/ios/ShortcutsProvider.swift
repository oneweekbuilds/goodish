import AppIntents

// ─────────────────────────────────────────────────────────────
// AppShortcutsProvider — Surfaces AlgorithmLens shortcuts
// in the iOS Shortcuts app and Siri suggestions.
//
// This makes the intents discoverable: users see them in
// the Shortcuts app under "AlgorithmLens" and can add them
// to automations, home screen widgets, or Siri voice triggers.
// ─────────────────────────────────────────────────────────────

@available(iOS 16.0, *)
struct AlgorithmLensShortcutsProvider: AppShortcutsProvider {

    /// Shortcuts that appear in the Shortcuts app gallery.
    static var appShortcuts: [AppShortcut] {
        AppShortcut(
            intent: ScanFeedIntent(),
            phrases: [
                "Scan my \(\.$platform) feed with \(.applicationName)",
                "Analyze my \(\.$platform) with \(.applicationName)",
                "Start \(.applicationName) scan on \(\.$platform)",
                "Check my \(\.$platform) feed",
            ],
            shortTitle: "Scan Feed",
            systemImageName: "antenna.radiowaves.left.and.right"
        )

        AppShortcut(
            intent: QuickScanIntent(),
            phrases: [
                "Quick scan with \(.applicationName)",
                "Scan my feed with \(.applicationName)",
                "Start \(.applicationName)",
            ],
            shortTitle: "Quick Scan",
            systemImageName: "bolt.circle"
        )
    }
}
