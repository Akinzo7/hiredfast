"use client"

import { useAuth } from "@/contexts/auth-context"

export default function SettingsPage() {
  const { user } = useAuth()

  const providers = user?.providerData.map((p) => p.providerId) ?? []
  const hasGoogle = providers.includes("google.com")
  const hasFacebook = providers.includes("facebook.com")

  return (
    <div className="p-6 md:p-8 max-w-2xl">
      <h1 className="text-2xl font-bold mb-8">Settings</h1>

      <div className="space-y-6">
        {/* Profile */}
        <div className="rounded-xl border bg-card p-6">
          <h2 className="font-semibold mb-4">Profile</h2>
          <div className="flex items-center gap-4 mb-6">
            <div className="h-16 w-16 rounded-full bg-blue-600 flex items-center justify-center shrink-0 overflow-hidden">
              {user?.photoURL ? (
                <img src={user.photoURL} alt=""
                  className="h-full w-full rounded-full object-cover"
                  referrerPolicy="no-referrer" />
              ) : (
                <span className="text-xl font-bold text-white">
                  {user?.displayName
                    ?.split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2) ?? "U"}
                </span>
              )}
            </div>
            <div>
              <p className="font-medium">{user?.displayName}</p>
              <p className="text-sm text-muted-foreground">
                {user?.email}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Profile managed by your sign-in provider
              </p>
            </div>
          </div>

          <p className="text-sm font-medium mb-3">
            Connected Accounts
          </p>
          <div className="space-y-2">
            {[
              { id: "google.com", label: "Google", connected: hasGoogle },
              { id: "facebook.com", label: "Facebook", connected: hasFacebook },
            ].map((provider) => (
              <div key={provider.id}
                className="flex items-center justify-between rounded-lg border p-3">
                <span className="text-sm">{provider.label}</span>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    provider.connected
                      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                      : "bg-muted text-muted-foreground"
                  }`}>
                  {provider.connected ? "Connected" : "Not connected"}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Plan */}
        <div className="rounded-xl border bg-card p-6">
          <h2 className="font-semibold mb-4">Plan</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Free Plan</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Upgrade for unlimited interviews and advanced features
              </p>
            </div>
            <button disabled
              className="h-9 px-4 rounded-lg bg-muted text-muted-foreground/50 text-sm font-medium cursor-not-allowed">
              Upgrade (Coming Soon)
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
