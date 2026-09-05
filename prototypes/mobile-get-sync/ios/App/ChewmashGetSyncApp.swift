import SwiftUI

@main
struct ChewmashGetSyncApp: App {
    @StateObject private var model = GetSyncModel()

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(model)
        }
    }
}
