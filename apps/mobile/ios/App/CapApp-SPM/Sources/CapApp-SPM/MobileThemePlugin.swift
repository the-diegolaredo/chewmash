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

            let isDark = mode == "dark"
            let style: UIUserInterfaceStyle = isDark ? .dark : .light
            let background = isDark ? UIColor(red: 15 / 255, green: 20 / 255, blue: 17 / 255, alpha: 1) : .white

            viewController.overrideUserInterfaceStyle = style
            viewController.view.window?.overrideUserInterfaceStyle = style
            viewController.view.backgroundColor = background
            if let bridgeController = viewController as? CAPBridgeViewController {
                bridgeController.webView?.scrollView.backgroundColor = background
            }
            viewController.setNeedsStatusBarAppearanceUpdate()
            call.resolve()
        }
    }
}
