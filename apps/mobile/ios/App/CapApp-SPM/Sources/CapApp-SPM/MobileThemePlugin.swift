import Capacitor
import UIKit

@objc(MobileThemePlugin)
public final class MobileThemePlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "MobileThemePlugin"
    public let jsName = "MobileTheme"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "setTheme", returnType: CAPPluginReturnPromise)
    ]

    @objc public func setTheme(_ call: CAPPluginCall) {
        let mode = call.getString("mode") == "dark" ? "dark" : "light"

        DispatchQueue.main.async { [weak self] in
            guard let viewController = self?.bridge?.viewController else {
                call.reject("Could not update the app appearance.")
                return
            }

            let style: UIUserInterfaceStyle = mode == "dark" ? .dark : .light
            viewController.overrideUserInterfaceStyle = style
            viewController.view.window?.overrideUserInterfaceStyle = style
            viewController.setNeedsStatusBarAppearanceUpdate()
            call.resolve()
        }
    }
}
