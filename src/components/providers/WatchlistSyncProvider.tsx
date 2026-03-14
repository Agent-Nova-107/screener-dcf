"use client";

import { useWatchlistSync } from "@/hooks/useWatchlistSync";

export function WatchlistSyncProvider() {
  useWatchlistSync();
  return null;
}
