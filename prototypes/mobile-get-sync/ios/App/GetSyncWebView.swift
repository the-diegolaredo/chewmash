import SwiftUI
import UIKit
import WebKit

struct GetSyncBrowserView: View {
    let onCapture: (GetCapturePayload) -> Void
    let onStatus: (String) -> Void
    let onCancel: () -> Void

    var body: some View {
        ZStack(alignment: .topTrailing) {
            GetSyncWebView(onCapture: onCapture, onStatus: onStatus)
                .ignoresSafeArea()

            Button(action: onCancel) {
                Image(systemName: "xmark")
                    .font(.system(size: 15, weight: .bold))
                    .frame(width: 38, height: 38)
                    .background(.ultraThinMaterial)
                    .clipShape(Circle())
            }
            .padding(.top, 10)
            .padding(.trailing, 14)
            .accessibilityLabel("Cancel GET sync")
        }
    }
}

private struct GetSyncWebView: UIViewRepresentable {
    let onCapture: (GetCapturePayload) -> Void
    let onStatus: (String) -> Void

    func makeCoordinator() -> Coordinator {
        Coordinator(onCapture: onCapture, onStatus: onStatus)
    }

    func makeUIView(context: Context) -> WKWebView {
        let configuration = WKWebViewConfiguration()
        // The prototype deliberately uses an ephemeral store. Authentication can
        // work during this sync session, but cookies/session data are not retained
        // by chewmash after the in-app browser is destroyed.
        configuration.websiteDataStore = .nonPersistent()
        configuration.preferences.javaScriptCanOpenWindowsAutomatically = true

        let webView = WKWebView(frame: .zero, configuration: configuration)
        webView.navigationDelegate = context.coordinator
        webView.uiDelegate = context.coordinator
        webView.allowsBackForwardNavigationGestures = true

        let request = URLRequest(
            url: URL(string: "https://get.cbord.com/calpoly/full/history.php")!,
            cachePolicy: .reloadIgnoringLocalCacheData
        )
        webView.load(request)
        return webView
    }

    func updateUIView(_ webView: WKWebView, context: Context) {}

    final class Coordinator: NSObject, WKNavigationDelegate, WKUIDelegate {
        private let onCapture: (GetCapturePayload) -> Void
        private let onStatus: (String) -> Void
        private var captureInFlight = false

        init(onCapture: @escaping (GetCapturePayload) -> Void, onStatus: @escaping (String) -> Void) {
            self.onCapture = onCapture
            self.onStatus = onStatus
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

            // Login/SSO/Duo pages are allowed to navigate normally. No parsing or
            // page inspection happens here. The privacy boundary is enforced in
            // didFinish, which only injects JS on the exact GET history URL.
            decisionHandler(.allow)
        }

        func webView(_ webView: WKWebView, didStartProvisionalNavigation navigation: WKNavigation!) {
            onStatus("GET browser open — sign in normally")
        }

        func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
            guard isExactGetHistoryURL(webView.url) else { return }
            captureExactHistoryPage(in: webView)
        }

        func webView(
            _ webView: WKWebView,
            didFail navigation: WKNavigation!,
            withError error: Error
        ) {
            onStatus("GET navigation error: \(error.localizedDescription)")
        }

        func webView(
            _ webView: WKWebView,
            didFailProvisionalNavigation navigation: WKNavigation!,
            withError error: Error
        ) {
            onStatus("GET could not load: \(error.localizedDescription)")
        }

        func webView(
            _ webView: WKWebView,
            createWebViewWith configuration: WKWebViewConfiguration,
            for navigationAction: WKNavigationAction,
            windowFeatures: WKWindowFeatures
        ) -> WKWebView? {
            // Keep SSO links that request a new window inside the same controlled
            // browser instead of spawning an untracked second WKWebView.
            if navigationAction.targetFrame == nil, let requestURL = navigationAction.request.url {
                webView.load(URLRequest(url: requestURL))
            }
            return nil
        }

        private func captureExactHistoryPage(in webView: WKWebView) {
            guard !captureInFlight else { return }
            captureInFlight = true
            onStatus("GET history detected — syncing…")

            guard let scriptURL = Bundle.main.url(forResource: "mobile-capture", withExtension: "js"),
                  let script = try? String(contentsOf: scriptURL, encoding: .utf8) else {
                captureInFlight = false
                onStatus("Prototype error: capture script is missing")
                return
            }

            webView.evaluateJavaScript(script) { [weak self, weak webView] _, installError in
                guard let self, let webView else { return }
                if let installError {
                    self.captureInFlight = false
                    self.onStatus("Prototype parser could not load: \(installError.localizedDescription)")
                    return
                }

                webView.evaluateJavaScript("JSON.stringify(globalThis.chewmashCaptureGet(document))") { [weak self] result, captureError in
                    guard let self else { return }
                    self.captureInFlight = false

                    if let captureError {
                        self.onStatus("GET capture failed: \(captureError.localizedDescription)")
                        return
                    }
                    guard let json = result as? String,
                          let data = json.data(using: .utf8),
                          let payload = try? JSONDecoder().decode(GetCapturePayload.self, from: data) else {
                        self.onStatus("GET history loaded, but the sanitized result could not be decoded")
                        return
                    }

                    guard payload.matchedTransactions > 0 else {
                        self.onStatus("GET history loaded, but no debit transactions were detected")
                        return
                    }

                    // No raw HTML, credentials, cookie values, or session tokens are
                    // returned to native code — only the sanitized payload above.
                    DispatchQueue.main.asyncAfter(deadline: .now() + 0.25) {
                        self.onCapture(payload)
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
    }
}
