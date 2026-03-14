"use client";

import { useState } from "react";
import Link from "next/link";
import { BarChart3, Search, LogIn, LogOut, User, ChevronDown } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { AuthModal } from "@/components/auth/AuthModal";

export function Header() {
  const { user, loading, configured, signIn, signUp, signOut } = useAuth();
  const [showAuth, setShowAuth] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  return (
    <>
      <header
        className="sticky top-0 z-40 border-b"
        style={{
          background: "var(--bg-secondary)",
          borderColor: "var(--border)",
        }}
      >
        <div className="mx-auto flex h-14 max-w-[1440px] items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <BarChart3 className="h-5 w-5" style={{ color: "var(--accent)" }} />
            <span style={{ color: "var(--text-primary)" }}>True Stocks</span>
          </Link>

          <div className="flex items-center gap-3">
            <button
              onClick={() =>
                document.dispatchEvent(new CustomEvent("open-command-palette"))
              }
              className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm transition-colors cursor-pointer"
              style={{
                background: "var(--bg-tertiary)",
                border: "1px solid var(--border)",
                color: "var(--text-secondary)",
              }}
            >
              <Search className="h-4 w-4" />
              <span className="hidden sm:inline">Rechercher…</span>
              <kbd
                className="ml-1 rounded px-1.5 py-0.5 text-xs font-mono hidden sm:inline"
                style={{
                  background: "var(--bg-primary)",
                  border: "1px solid var(--border)",
                  color: "var(--text-muted)",
                }}
              >
                Ctrl+K
              </kbd>
            </button>

            {/* Auth area */}
            {!configured || loading ? null : !user ? (
              <button
                onClick={() => setShowAuth(true)}
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium cursor-pointer transition-colors"
                style={{ background: "var(--accent)", color: "#fff" }}
              >
                <LogIn className="h-4 w-4" />
                <span className="hidden sm:inline">Se connecter</span>
              </button>
            ) : (
              <div className="relative">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm cursor-pointer transition-colors"
                  style={{
                    background: "var(--bg-tertiary)",
                    border: "1px solid var(--border)",
                    color: "var(--text-secondary)",
                  }}
                >
                  <div
                    className="h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{ background: "var(--accent)", color: "#fff" }}
                  >
                    {(user.email?.[0] ?? "U").toUpperCase()}
                  </div>
                  <span className="hidden sm:inline max-w-[120px] truncate text-xs">
                    {user.email}
                  </span>
                  <ChevronDown className="h-3 w-3" />
                </button>

                {showMenu && (
                  <>
                    <div className="fixed inset-0 z-50" onClick={() => setShowMenu(false)} />
                    <div
                      className="absolute right-0 top-full mt-1 z-50 rounded-lg shadow-xl overflow-hidden"
                      style={{
                        background: "var(--bg-secondary)",
                        border: "1px solid var(--border)",
                        minWidth: 200,
                      }}
                    >
                      <div className="px-4 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
                        <p className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>
                          Mon compte
                        </p>
                        <p className="text-xs truncate mt-0.5" style={{ color: "var(--text-muted)" }}>
                          {user.email}
                        </p>
                      </div>
                      <button
                        onClick={() => { signOut(); setShowMenu(false); }}
                        className="flex items-center gap-2 w-full px-4 py-2.5 text-xs cursor-pointer transition-colors"
                        style={{ color: "var(--red)" }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-hover)")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                      >
                        <LogOut className="h-3.5 w-3.5" />
                        Se déconnecter
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      <AuthModal
        open={showAuth}
        onClose={() => setShowAuth(false)}
        onSignIn={signIn}
        onSignUp={signUp}
      />
    </>
  );
}
