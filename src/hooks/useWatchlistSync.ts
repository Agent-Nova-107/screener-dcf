"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { createClient } from "@/lib/supabase/client";
import { useAppStore } from "@/store";
import type { WatchlistEntry } from "@/types";

const DEFAULT_WATCHLIST_NAME = "__default__";

export function useWatchlistSync() {
  const { user, loading, configured } = useAuth();
  const setWatchlist = useAppStore((s) => s.setWatchlist);
  const setSyncConfig = useAppStore((s) => s.setSyncConfig);
  const prevUserId = useRef<string | null>(null);

  useEffect(() => {
    if (loading) return;

    const userId = user?.id ?? null;

    if (userId === prevUserId.current) return;
    prevUserId.current = userId;

    if (!userId || !configured) {
      setSyncConfig(null);
      setWatchlist([]);
      return;
    }

    const supabase = createClient();
    if (!supabase) {
      setWatchlist([]);
      return;
    }

    let cancelled = false;

    async function init() {
      const { data: lists } = await supabase!
        .from("watchlists")
        .select("*")
        .eq("user_id", userId)
        .eq("name", DEFAULT_WATCHLIST_NAME);

      if (cancelled) return;

      let watchlistId: string;

      if (lists && lists.length > 0) {
        watchlistId = lists[0].id;
      } else {
        const { data: newList, error } = await supabase!
          .from("watchlists")
          .insert({ user_id: userId, name: DEFAULT_WATCHLIST_NAME })
          .select()
          .single();

        if (error || !newList || cancelled) return;
        watchlistId = newList.id;
      }

      const { data: items } = await supabase!
        .from("watchlist_items")
        .select("*")
        .eq("watchlist_id", watchlistId)
        .order("added_at", { ascending: true });

      if (cancelled) return;

      const entries: WatchlistEntry[] = (items ?? []).map((item: any) => ({
        ticker: item.ticker,
        name: item.name || item.ticker,
        addedAt: item.added_at,
        currentPrice: item.current_price ?? 0,
        finalFairValue: item.fair_value ?? undefined,
        safetyMargin: item.safety_margin != null ? Number(item.safety_margin) : undefined,
        signal: item.signal ?? undefined,
      }));

      setWatchlist(entries);
      setSyncConfig({ supabase, watchlistId });
    }

    init();

    return () => {
      cancelled = true;
    };
  }, [user, loading, configured, setWatchlist, setSyncConfig]);
}
