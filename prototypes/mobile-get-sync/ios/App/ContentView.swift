import SwiftUI

struct ContentView: View {
    @EnvironmentObject private var model: GetSyncModel

    var body: some View {
        NavigationStack {
            ZStack {
                Color(red: 0.965, green: 0.972, blue: 0.957)
                    .ignoresSafeArea()

                ScrollView {
                    VStack(spacing: 22) {
                        VStack(spacing: 8) {
                            Text("chewmash")
                                .font(.system(size: 48, weight: .black, design: .rounded))
                                .foregroundStyle(
                                    LinearGradient(
                                        colors: [Color(hex: 0x3AC651), Color(hex: 0xCAFA41)],
                                        startPoint: .topLeading,
                                        endPoint: .bottomTrailing
                                    )
                                )
                            Text("Mobile GET sync prototype")
                                .font(.headline)
                                .foregroundStyle(.secondary)
                        }
                        .padding(.top, 34)

                        VStack(alignment: .leading, spacing: 14) {
                            Text("One-tap GET sync")
                                .font(.title2.bold())
                            Text("This prototype opens GET inside a temporary in-app browser. Sign in normally. Once the GET Transaction History page loads, chewmash reads only the transaction fields, saves the sanitized result locally, and closes the browser automatically.")
                                .foregroundStyle(.secondary)

                            Button(action: model.beginSync) {
                                HStack {
                                    Image(systemName: "arrow.triangle.2.circlepath")
                                    Text("Sync GET")
                                        .fontWeight(.bold)
                                }
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 14)
                            }
                            .buttonStyle(GradientButtonStyle())
                        }
                        .cardStyle()

                        VStack(alignment: .leading, spacing: 12) {
                            Text("Prototype status")
                                .font(.headline)
                            Text(model.statusText)
                                .foregroundStyle(.secondary)

                            if let capture = model.latestCapture {
                                Divider()
                                HStack {
                                    Stat(label: "Transactions", value: "\(capture.matchedTransactions)")
                                    Spacer()
                                    Stat(label: "Tables", value: "\(capture.tableCount)")
                                    Spacer()
                                    Stat(label: "Balance", value: capture.balance.map { String(format: "$%.2f", $0) } ?? "—")
                                }
                            }
                        }
                        .cardStyle()

                        VStack(alignment: .leading, spacing: 10) {
                            Label("Privacy boundary", systemImage: "lock.shield")
                                .font(.headline)
                            Text("The parser is never injected into Cal Poly login, Duo, or other authentication pages. It only runs on the exact GET history URL after that page finishes loading. This prototype does not read passwords, form fields, cookies, session tokens, student IDs, or raw page HTML.")
                                .font(.footnote)
                                .foregroundStyle(.secondary)
                        }
                        .cardStyle()
                    }
                    .padding(20)
                }
            }
            .fullScreenCover(isPresented: $model.isPresentingSync) {
                GetSyncBrowserView(
                    onCapture: { model.completeSync($0) },
                    onStatus: { model.report($0) },
                    onCancel: { model.isPresentingSync = false }
                )
            }
        }
    }
}

private struct Stat: View {
    let label: String
    let value: String

    var body: some View {
        VStack(alignment: .leading, spacing: 3) {
            Text(value)
                .font(.headline)
            Text(label)
                .font(.caption)
                .foregroundStyle(.secondary)
        }
    }
}

private struct GradientButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .foregroundStyle(Color.black.opacity(0.8))
            .background(
                LinearGradient(
                    colors: [Color(hex: 0x3AC651), Color(hex: 0xCAFA41)],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
            )
            .clipShape(RoundedRectangle(cornerRadius: 15, style: .continuous))
            .opacity(configuration.isPressed ? 0.82 : 1)
    }
}

private extension View {
    func cardStyle() -> some View {
        self
            .padding(20)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(Color.white)
            .clipShape(RoundedRectangle(cornerRadius: 20, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: 20, style: .continuous)
                    .stroke(Color.black.opacity(0.06), lineWidth: 1)
            )
    }
}

private extension Color {
    init(hex: UInt32) {
        self.init(
            red: Double((hex >> 16) & 0xFF) / 255,
            green: Double((hex >> 8) & 0xFF) / 255,
            blue: Double(hex & 0xFF) / 255
        )
    }
}
