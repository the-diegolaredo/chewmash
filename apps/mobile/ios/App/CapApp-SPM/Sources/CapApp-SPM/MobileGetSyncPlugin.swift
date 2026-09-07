import Capacitor
import Foundation
import UIKit
import WebKit

@objc(MobileGetSyncPlugin)
public final class MobileGetSyncPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "MobileGetSyncPlugin"
    public let jsName = "MobileGetSync"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "sync", returnType: CAPPluginReturnPromise)
    ]

    private var activeCall: CAPPluginCall?
    private weak var activeBrowser: MobileGetSyncViewController?

    @objc public func sync(_ call: CAPPluginCall) {
        guard activeCall == nil else {
            call.reject("A GET sync is already in progress.")
            return
        }
        guard let captureScript = call.getString("captureScript"), !captureScript.isEmpty else {
            call.reject("The GET capture script is missing.")
            return
        }
        guard let presentingViewController = bridge?.viewController else {
            call.reject("chewmash could not open the native GET browser.")
            return
        }

        activeCall = call

        DispatchQueue.main.async { [weak self] in
            guard let self else { return }

            let browser = MobileGetSyncViewController(captureScript: captureScript)
            browser.onComplete = { [weak self] payload in
                guard let self else { return }
                self.finish(payload: payload)
            }
            browser.onCancel = { [weak self] in
                guard let self else { return }
                self.finish(payload: ["cancelled": true])
            }
            browser.onFailure = { [weak self] message in
                guard let self else { return }
                self.fail(message)
            }

            let navigation = UINavigationController(rootViewController: browser)
            navigation.modalPresentationStyle = .fullScreen
            self.activeBrowser = browser
            presentingViewController.present(navigation, animated: true)
        }
    }

    private func finish(payload: [String: Any]) {
        let call = activeCall
        activeCall = nil
        dismissBrowser { call?.resolve(payload) }
    }

    private func fail(_ message: String) {
        let call = activeCall
        activeCall = nil
        dismissBrowser { call?.reject(message) }
    }

    private func dismissBrowser(completion: @escaping () -> Void) {
        DispatchQueue.main.async { [weak self] in
            guard let self else {
                completion()
                return
            }
            if let navigation = self.activeBrowser?.navigationController {
                navigation.dismiss(animated: true) {
                    self.activeBrowser = nil
                    completion()
                }
            } else {
                self.activeBrowser = nil
                completion()
            }
        }
    }
}

private final class MobileGetSyncViewController: UIViewController, WKNavigationDelegate, WKUIDelegate {
    private let captureScript: String
    private var webView: WKWebView!
    private var captureInFlight = false
    private var hasCompleted = false

    var onComplete: (([String: Any]) -> Void)?
    var onCancel: (() -> Void)?
    var onFailure: ((String) -> Void)?

    init(captureScript: String) {
        self.captureScript = captureScript
        super.init(nibName: nil, bundle: nil)
    }

    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = .systemBackground
        title = "Connect GET"
        navigationItem.leftBarButtonItem = UIBarButtonItem(
            barButtonSystemItem: .cancel,
            target: self,
            action: #selector(cancelTapped)
        )

        let configuration = WKWebViewConfiguration()
        // Keep credentials/session cookies out of chewmash storage. The first production
        // version intentionally requires a fresh authentication session for each sync.
        configuration.websiteDataStore = .nonPersistent()
        configuration.preferences.javaScriptCanOpenWindowsAutomatically = true

        webView = WKWebView(frame: .zero, configuration: configuration)
        webView.translatesAutoresizingMaskIntoConstraints = false
        webView.navigationDelegate = self
        webView.uiDelegate = self
        webView.allowsBackForwardNavigationGestures = true
        view.addSubview(webView)

        NSLayoutConstraint.activate([
            webView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            webView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            webView.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor),
            webView.bottomAnchor.constraint(equalTo: view.bottomAnchor)
        ])

        loadGet()
    }

    private func loadGet() {
        guard let url = URL(string: "https://get.cbord.com/calpoly/full/history.php") else {
            fail("The GET Transaction History address is invalid.")
            return
        }
        let request = URLRequest(url: url, cachePolicy: .reloadIgnoringLocalCacheData)
        webView.load(request)
    }

    @objc private func cancelTapped() {
        guard !hasCompleted else { return }
        hasCompleted = true
        onCancel?()
    }

    func webView(
        _ webView: WKWebView,
        decidePolicyFor navigationAction: WKNavigationAction,
        decisionHandler: @escaping (WKNavigationActionPolicy) -> Void
    ) {
        guard let url = navigationAction.request.url else {
            decisionHandler(.cancel)
            return
        }

        if let scheme = url.scheme?.lowercased(), scheme != "https" && scheme != "http" {
            if UIApplication.shared.canOpenURL(url) {
                UIApplication.shared.open(url)
            }
            decisionHandler(.cancel)
            return
        }

        // Cal Poly SSO and Duo are allowed to navigate normally. Nothing is parsed
        // until the exact GET Transaction History URL has finished loading.
        decisionHandler(.allow)
    }

    func webView(_ webView: WKWebView, didStartProvisionalNavigation navigation: WKNavigation!) {
        if !isExactGetHistoryURL(webView.url) {
            title = "Sign in to GET"
        }
    }

    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        guard isExactGetHistoryURL(webView.url) else { return }
        title = "Syncing GET…"
        captureExactHistoryPage(in: webView)
    }

    func webView(
        _ webView: WKWebView,
        didFail navigation: WKNavigation!,
        withError error: Error
    ) {
        navigationItem.prompt = "GET navigation error: \(error.localizedDescription)"
    }

    func webView(
        _ webView: WKWebView,
        didFailProvisionalNavigation navigation: WKNavigation!,
        withError error: Error
    ) {
        navigationItem.prompt = "GET could not load: \(error.localizedDescription)"
    }

    func webView(
        _ webView: WKWebView,
        createWebViewWith configuration: WKWebViewConfiguration,
        for navigationAction: WKNavigationAction,
        windowFeatures: WKWindowFeatures
    ) -> WKWebView? {
        // Some SSO flows request a new window. Keep those requests inside this same
        // controlled browser rather than creating an untracked second web view.
        if navigationAction.targetFrame == nil, let url = navigationAction.request.url {
            webView.load(URLRequest(url: url))
        }
        return nil
    }

    private func captureExactHistoryPage(in webView: WKWebView) {
        guard !captureInFlight, !hasCompleted else { return }
        captureInFlight = true
        navigationItem.prompt = "Reading dining transactions locally…"

        webView.evaluateJavaScript(captureScript) { [weak self, weak webView] _, installError in
            guard let self, let webView else { return }
            if let installError {
                self.captureInFlight = false
                self.navigationItem.prompt = "Could not load the dining parser"
                self.fail("GET loaded, but chewmash could not load its local parser: \(installError.localizedDescription)")
                return
            }

            webView.evaluateJavaScript("JSON.stringify(globalThis.chewmashCaptureGet(document))") { [weak self] result, captureError in
                guard let self else { return }
                self.captureInFlight = false

                if let captureError {
                    self.navigationItem.prompt = "Could not read Transaction History"
                    self.fail("GET capture failed: \(captureError.localizedDescription)")
                    return
                }
                guard let json = result as? String,
                      let data = json.data(using: .utf8),
                      let object = try? JSONSerialization.jsonObject(with: data),
                      let payload = object as? [String: Any] else {
                    self.navigationItem.prompt = "Could not decode Transaction History"
                    self.fail("GET history loaded, but the sanitized result could not be decoded.")
                    return
                }

                let matched = payload["matchedTransactions"] as? Int
                    ?? (payload["matchedTransactions"] as? NSNumber)?.intValue
                    ?? 0
                guard matched > 0 else {
                    // Stay on the page so the student can retry or cancel. This can happen
                    // if GET changes its table markup or the history has not rendered yet.
                    self.navigationItem.prompt = "No Dining Dollars purchases found yet"
                    self.title = "GET Transaction History"
                    return
                }

                self.hasCompleted = true
                self.navigationItem.prompt = "Synced \(matched) purchase\(matched == 1 ? "" : "s")"
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.2) {
                    self.onComplete?(payload)
                }
            }
        }
    }

    private func isExactGetHistoryURL(_ url: URL?) -> Bool {
        guard let url else { return false }
        return url.scheme?.lowercased() == "https"
            && url.host?.lowercased() == "get.cbord.com"
            && url.path.lowercased() == "/calpoly/full/history.php"
    }

    private func fail(_ message: String) {
        guard !hasCompleted else { return }
        hasCompleted = true
        onFailure?(message)
    }
}
