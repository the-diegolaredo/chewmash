import UIKit
import Capacitor

@objc(ChewmashBridgeViewController)
public final class ChewmashBridgeViewController: CAPBridgeViewController {
    public override var preferredStatusBarStyle: UIStatusBarStyle {
        traitCollection.userInterfaceStyle == .dark ? .lightContent : .darkContent
    }

    public override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = .white
        webView?.scrollView.backgroundColor = .white
        hideSystemTopScrollEdgeEffect()
    }

    public override func viewDidLayoutSubviews() {
        super.viewDidLayoutSubviews()
        hideSystemTopScrollEdgeEffect()
    }

    public override func capacitorDidLoad() {
        bridge?.registerPluginInstance(MobileGetSyncPlugin())
        bridge?.registerPluginInstance(MobileThemePlugin())
        hideSystemTopScrollEdgeEffect()
    }

    private func hideSystemTopScrollEdgeEffect() {
        // Newer iOS versions add a soft scroll-edge treatment at the top of
        // UIScrollView. The CI runner still builds with an older SDK, so access
        // the newer public API dynamically when the running OS provides it.
        guard let scrollView = webView?.scrollView else { return }

        let topEdgeSelector = NSSelectorFromString("topEdgeEffect")
        guard scrollView.responds(to: topEdgeSelector),
              let unmanagedEffect = scrollView.perform(topEdgeSelector),
              let effect = unmanagedEffect.takeUnretainedValue() as? NSObject else {
            return
        }

        if effect.responds(to: NSSelectorFromString("setHidden:")) {
            effect.setValue(true, forKey: "hidden")
        }
    }
}
