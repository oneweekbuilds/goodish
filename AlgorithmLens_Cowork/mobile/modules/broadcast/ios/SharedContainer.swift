import Foundation

/**
 * SharedContainer — App Group shared storage for frame exchange.
 *
 * The broadcast extension and main app communicate through a shared
 * App Group container (group.com.algorithmlens.broadcast). This class
 * provides a clean interface for reading/writing:
 *
 * - Frame JPEG files: {timestamp}_{frameNumber}.jpg
 * - Frame metadata: frame_metadata.json (array of frame info objects)
 * - Session metadata: session_metadata.json (session lifecycle state)
 *
 * The extension writes frames and metadata during broadcast.
 * The main app reads them after broadcast completes.
 *
 * Thread safety: The extension and app run in separate processes, so
 * there are no shared-memory concurrency concerns. File I/O uses
 * atomic writes to prevent partial reads.
 */
class SharedContainer {

    static let appGroupIdentifier = "group.com.algorithmlens.broadcast"

    // MARK: - Container URLs

    /// Returns the shared container URL, or nil if not available.
    static var containerURL: URL? {
        FileManager.default.containerURL(
            forSecurityApplicationGroupIdentifier: appGroupIdentifier
        )
    }

    /// Returns the frames directory URL within the shared container.
    static var framesDirectoryURL: URL? {
        containerURL?.appendingPathComponent("frames")
    }

    /// Returns the session metadata file URL.
    static var sessionMetadataURL: URL? {
        containerURL?.appendingPathComponent("session_metadata.json")
    }

    /// Returns the frame metadata file URL.
    static var frameMetadataURL: URL? {
        containerURL?.appendingPathComponent("frame_metadata.json")
    }

    // MARK: - Directory Management

    /// Creates the frames directory if it doesn't exist.
    static func ensureFramesDirectory() throws {
        guard let framesDir = framesDirectoryURL else {
            throw SharedContainerError.containerNotAvailable
        }
        if !FileManager.default.fileExists(atPath: framesDir.path) {
            try FileManager.default.createDirectory(
                at: framesDir,
                withIntermediateDirectories: true
            )
        }
    }

    // MARK: - Session Metadata

    /// Reads session metadata from the shared container.
    static func readSessionMetadata() -> [String: Any]? {
        guard let url = sessionMetadataURL,
              let data = try? Data(contentsOf: url),
              let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any] else {
            return nil
        }
        return json
    }

    /// Writes session metadata to the shared container (atomic).
    static func writeSessionMetadata(_ metadata: [String: Any]) throws {
        guard let url = sessionMetadataURL else {
            throw SharedContainerError.containerNotAvailable
        }
        let data = try JSONSerialization.data(withJSONObject: metadata, options: .prettyPrinted)
        try data.write(to: url, options: .atomic)
    }

    /// Returns the current session status string, or "IDLE" if unavailable.
    static func currentSessionStatus() -> String {
        guard let metadata = readSessionMetadata(),
              let status = metadata["status"] as? String else {
            return "IDLE"
        }
        return status
    }

    // MARK: - Frame Metadata

    /// Reads the frame metadata array from the shared container.
    /// Returns an empty array if the file doesn't exist or is malformed.
    static func readFrameMetadata() -> [[String: Any]] {
        guard let url = frameMetadataURL,
              FileManager.default.fileExists(atPath: url.path),
              let data = try? Data(contentsOf: url),
              let array = try? JSONSerialization.jsonObject(with: data) as? [[String: Any]] else {
            return []
        }
        return array
    }

    /// Writes the frame metadata array to the shared container (atomic).
    static func writeFrameMetadata(_ frames: [[String: Any]]) throws {
        guard let url = frameMetadataURL else {
            throw SharedContainerError.containerNotAvailable
        }
        let data = try JSONSerialization.data(withJSONObject: frames, options: .prettyPrinted)
        try data.write(to: url, options: .atomic)
    }

    /// Appends a single frame metadata entry to the existing array.
    /// Reads the current array, appends, and writes back atomically.
    static func appendFrameMetadata(_ entry: [String: Any]) throws {
        var existing = readFrameMetadata()
        existing.append(entry)
        try writeFrameMetadata(existing)
    }

    // MARK: - Frame Files

    /// Saves a JPEG frame to the frames directory.
    /// Returns the file URL on success.
    @discardableResult
    static func saveFrame(data: Data, filename: String) throws -> URL {
        guard let framesDir = framesDirectoryURL else {
            throw SharedContainerError.containerNotAvailable
        }

        try ensureFramesDirectory()

        let fileURL = framesDir.appendingPathComponent(filename)
        try data.write(to: fileURL, options: .atomic)
        return fileURL
    }

    /// Returns the file URL for a specific frame by filename.
    static func frameFileURL(filename: String) -> URL? {
        framesDirectoryURL?.appendingPathComponent(filename)
    }

    /// Reads a frame's JPEG data by filename.
    static func readFrameData(filename: String) -> Data? {
        guard let url = frameFileURL(filename: filename) else { return nil }
        return try? Data(contentsOf: url)
    }

    /// Returns sorted list of all JPEG filenames in the frames directory.
    static func allFrameFilenames() -> [String] {
        guard let framesDir = framesDirectoryURL,
              let contents = try? FileManager.default.contentsOfDirectory(atPath: framesDir.path) else {
            return []
        }
        return contents
            .filter { $0.hasSuffix(".jpg") }
            .sorted()
    }

    /// Returns the count of JPEG frame files in the frames directory.
    static func frameCount() -> Int {
        return allFrameFilenames().count
    }

    /// Returns the total size of all frame files in bytes.
    static func totalFrameSize() -> Int {
        guard let framesDir = framesDirectoryURL else { return 0 }
        var total = 0
        for filename in allFrameFilenames() {
            let path = framesDir.appendingPathComponent(filename).path
            if let attrs = try? FileManager.default.attributesOfItem(atPath: path),
               let size = attrs[.size] as? Int {
                total += size
            }
        }
        return total
    }

    // MARK: - Cleanup

    /// Removes all frame files and metadata from the shared container.
    /// Recreates an empty frames directory for the next session.
    static func cleanup() throws {
        // Remove frames directory
        if let framesDir = framesDirectoryURL,
           FileManager.default.fileExists(atPath: framesDir.path) {
            try FileManager.default.removeItem(at: framesDir)
            try FileManager.default.createDirectory(
                at: framesDir,
                withIntermediateDirectories: true
            )
        }

        // Remove frame metadata
        if let metadataURL = frameMetadataURL,
           FileManager.default.fileExists(atPath: metadataURL.path) {
            try FileManager.default.removeItem(at: metadataURL)
        }
    }

    /// Full reset: removes all data including session metadata.
    /// Returns the container to a pristine state.
    static func fullReset() throws {
        try cleanup()

        // Also remove session metadata
        if let sessionURL = sessionMetadataURL,
           FileManager.default.fileExists(atPath: sessionURL.path) {
            try FileManager.default.removeItem(at: sessionURL)
        }
    }
}

// MARK: - Errors

enum SharedContainerError: LocalizedError {
    case containerNotAvailable
    case frameWriteFailed
    case metadataCorrupted
    case frameLimitReached

    var errorDescription: String? {
        switch self {
        case .containerNotAvailable:
            return "App Group shared container is not available. Check entitlements."
        case .frameWriteFailed:
            return "Failed to write frame data to shared container."
        case .metadataCorrupted:
            return "Frame metadata file is corrupted or unreadable."
        case .frameLimitReached:
            return "Maximum frame storage limit reached."
        }
    }
}
