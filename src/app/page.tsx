"use client";

import { WatchlistTable } from "@/components/dashboard/WatchlistTable";
import { BarChart3 } from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <BarChart3 className="h-6 w-6" style={{ color: "var(--accent)" }} />
        <div>
          <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
            True Stock Screener
          </h1>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Watchlist et signaux de valorisation
          </p>
        </div>
      </div>
      <WatchlistTable />
    </div>
  );
}
