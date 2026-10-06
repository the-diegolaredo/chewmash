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
    }

    public override func capacitorDidLoad() {
        bridge?.registerPluginInstance(MobileGetSyncPlugin())
    }
}
