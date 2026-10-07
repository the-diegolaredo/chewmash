import UIKit
import Capacitor

@objc(ChewmashBridgeViewController)
public final class ChewmashBridgeViewController: CAPBridgeViewController {
    public override var preferredStatusBarStyle: UIStatusBarStyle {
        .darkContent
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
        hideSystemTopScrollEdgeEffect()
    }

    private func hideSystemTopScrollEdgeEffect() {
        // iOS 26 adds a soft scroll-edge treatment at the top of scroll views.
        // ChewMash already provides a solid white safe area and sticky header, so
        // hiding this native effect prevents the gray shadow/gradient above them.
        if #available(iOS 26.0, *) {
            webView?.scrollView.topEdgeEffect.isHidden = true
        }
    }
}
