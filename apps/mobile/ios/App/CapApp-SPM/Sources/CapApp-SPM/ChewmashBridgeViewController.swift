import Capacitor

@objc(ChewmashBridgeViewController)
public final class ChewmashBridgeViewController: CAPBridgeViewController {
    public override func capacitorDidLoad() {
        bridge?.registerPluginInstance(MobileGetSyncPlugin())
    }
}
