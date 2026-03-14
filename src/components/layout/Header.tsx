"use client";

import Link from "next/link";
import { BarChart3, Search } from "lucide-react";

export function Header() {
  return (
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
          <span style={{ color: "var(--text-primary)" }}>Screener DCF</span>
        </Link>

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
          <span>Rechercher…</span>
          <kbd
            className="ml-2 rounded px-1.5 py-0.5 text-xs font-mono"
            style={{
              background: "var(--bg-primary)",
              border: "1px solid var(--border)",
              color: "var(--text-muted)",
            }}
          >
            Ctrl+K
          </kbd>
        </button>
      </div>
    </header>
  );
}
