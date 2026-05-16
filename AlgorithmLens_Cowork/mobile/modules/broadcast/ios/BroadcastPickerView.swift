import ExpoModulesCore
import ReplayKit
import UIKit

/**
 * BroadcastPickerView — Wraps RPSystemBroadcastPickerView as an Expo native view.
 *
 * RPSystemBroadcastPickerView is the ONLY way to programmatically present
 * the broadcast extension picker on iOS. It's a system-controlled button
 * that, when tapped, shows a small popup letting the user start or stop
 * a broadcast to a registered Broadcast Upload Extension.
 *
 * This view renders the system picker as an invisible overlay. The actual
 * visual button is rendered by React Native (BroadcastPickerButton.tsx).
 * When the React Native button is tapped, it calls `triggerPicker()`,
 * which programmatically taps the hidden system picker button.
 *
 * Why invisible? Because RPSystemBroadcastPickerView has a fixed visual
 * style that doesn't match the app's design. By hiding it and overlaying
 * our own styled button, we get the system behavior with custom UI.
 */
public class BroadcastPickerViewModule: Module {

    public func definition() -> ModuleDefinition {
        Name("BroadcastPickerView")

        View(BroadcastPickerExpoView.self) {
            Prop("preferredExtension") { (view: BroadcastPickerExpoView, extensionBundleId: String?) in
                view.extensionBundleId = extensionBundleId
                view.setupPicker()
            }
        }

        /// Programmatically triggers the broadcast picker.
        /// Call this from React Native when the user taps the styled button.
        Function("triggerPicker") { () in
            DispatchQueue.main.async {
                BroadcastPickerExpoView.triggerGlobalPicker()
            }
        }
    }
}

/**
 * The actual UIView wrapper for RPSystemBroadcastPickerView.
 */
class BroadcastPickerExpoView: ExpoView {

    /// Singleton reference for triggering from the module function.
    private static weak var activePicker: BroadcastPickerExpoView?

    var extensionBundleId: String?
    private var pickerView: RPSystemBroadcastPickerView?

    required init(appContext: AppContext? = nil) {
        super.init(appContext: appContext)
        BroadcastPickerExpoView.activePicker = self
        setupPicker()
    }

    func setupPicker() {
        // Remove old picker if reconfiguring
        pickerView?.removeFromSuperview()

        guard #available(iOS 12.0, *) else { return }

        let picker = RPSystemBroadcastPickerView(frame: CGRect(x: 0, y: 0, width: 60, height: 60))
        picker.preferredExtension = extensionBundleId ?? "com.algorithmlens.app.BroadcastExtension"
        picker.showsMicrophoneButton = false

        // Make the picker invisible — we'll trigger it programmatically
        picker.alpha = 0.01
        picker.isUserInteractionEnabled = true

        addSubview(picker)
        pickerView = picker

        // Pin to fill the view
        picker.translatesAutoresizingMaskIntoConstraints = false
        NSLayoutConstraint.activate([
            picker.leadingAnchor.constraint(equalTo: leadingAnchor),
            picker.trailingAnchor.constraint(equalTo: trailingAnchor),
            picker.topAnchor.constraint(equalTo: topAnchor),
            picker.bottomAnchor.constraint(equalTo: bottomAnchor),
        ])
    }

    /// Programmatically tap the hidden RPSystemBroadcastPickerView button.
    /// Performs a recursive search through the view hierarchy because on
    /// iOS 14+ the UIButton is no longer a direct child of the picker view —
    /// it is nested deeper and a shallow subviews loop finds nothing.
    func triggerPicker() {
        guard let picker = pickerView else { return }
        findAndTriggerButton(in: picker)
    }

    /// Recursively walks the view tree rooted at `view` and fires
    /// touchUpInside on the first UIButton found.
    private func findAndTriggerButton(in view: UIView) {
        for subview in view.subviews {
            if let button = subview as? UIButton {
                button.sendActions(for: .touchUpInside)
                return
            }
            findAndTriggerButton(in: subview)
        }
    }

    /// Static method for the module to trigger the picker.
    static func triggerGlobalPicker() {
        activePicker?.triggerPicker()
    }
}
