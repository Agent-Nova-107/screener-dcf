import type { SupabaseClient } from "@supabase/supabase-js";

export interface WatchlistRow {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface WatchlistItemRow {
  id: string;
  watchlist_id: string;
  ticker: string;
  name: string;
  added_at: string;
  current_price: number | null;
  fair_value: number | null;
  safety_margin: number | null;
  signal: string | null;
}

export async function getUserWatchlists(
  supabase: SupabaseClient,
  userId: string,
): Promise<WatchlistRow[]> {
  const { data, error } = await supabase
    .from("watchlists")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function createWatchlist(
  supabase: SupabaseClient,
  userId: string,
  name: string,
): Promise<WatchlistRow> {
  const { data, error } = await supabase
    .from("watchlists")
    .insert({ user_id: userId, name })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteWatchlist(
  supabase: SupabaseClient,
  watchlistId: string,
): Promise<void> {
  const { error } = await supabase
    .from("watchlists")
    .delete()
    .eq("id", watchlistId);

  if (error) throw error;
}

export async function renameWatchlist(
  supabase: SupabaseClient,
  watchlistId: string,
  name: string,
): Promise<void> {
  const { error } = await supabase
    .from("watchlists")
    .update({ name, updated_at: new Date().toISOString() })
    .eq("id", watchlistId);

  if (error) throw error;
}

export async function getWatchlistItems(
  supabase: SupabaseClient,
  watchlistId: string,
): Promise<WatchlistItemRow[]> {
  const { data, error } = await supabase
    .from("watchlist_items")
    .select("*")
    .eq("watchlist_id", watchlistId)
    .order("added_at", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function addToWatchlistDB(
  supabase: SupabaseClient,
  watchlistId: string,
  ticker: string,
  name: string,
): Promise<WatchlistItemRow> {
  const { data, error } = await supabase
    .from("watchlist_items")
    .insert({ watchlist_id: watchlistId, ticker, name })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function removeFromWatchlistDB(
  supabase: SupabaseClient,
  itemId: string,
): Promise<void> {
  const { error } = await supabase
    .from("watchlist_items")
    .delete()
    .eq("id", itemId);

  if (error) throw error;
}

export async function updateWatchlistItemValuation(
  supabase: SupabaseClient,
  itemId: string,
  currentPrice: number,
  fairValue: number | null,
  safetyMargin: number | null,
  signal: string | null,
): Promise<void> {
  const { error } = await supabase
    .from("watchlist_items")
    .update({ current_price: currentPrice, fair_value: fairValue, safety_margin: safetyMargin, signal })
    .eq("id", itemId);

  if (error) throw error;
}
