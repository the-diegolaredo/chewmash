import Foundation

struct CapturedTransaction: Codable, Hashable, Identifiable {
    var id: String { "\(date)|\(time)|\(rawLocation)|\(amount)" }
    let date: String
    let time: String
    let rawLocation: String
    let location: String
    let amount: Double
    let source: String
}

struct GetCapturePayload: Codable {
    let version: Int
    let capturedAt: String
    let tableCount: Int
    let rowCount: Int
    let matchedTransactions: Int
    let balance: Double?
    let transactions: [CapturedTransaction]
}

@MainActor
final class GetSyncModel: ObservableObject {
    @Published var isPresentingSync = false
    @Published private(set) var latestCapture: GetCapturePayload?
    @Published private(set) var statusText = "Not synced yet"

    private let storageKey = "chewmash.mobile.prototype.capture.v1"

    init() {
        if let data = UserDefaults.standard.data(forKey: storageKey),
           let payload = try? JSONDecoder().decode(GetCapturePayload.self, from: data) {
            latestCapture = payload
            statusText = "Last capture: \(payload.matchedTransactions) transactions"
        }
    }

    func beginSync() {
        statusText = "Waiting for GET sign-in…"
        isPresentingSync = true
    }

    func completeSync(_ payload: GetCapturePayload) {
        latestCapture = payload
        statusText = "Synced \(payload.matchedTransactions) transactions"
        if let data = try? JSONEncoder().encode(payload) {
            UserDefaults.standard.set(data, forKey: storageKey)
        }
        isPresentingSync = false
    }

    func report(_ message: String) {
        statusText = message
    }
}
