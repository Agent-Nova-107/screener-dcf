"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
  List,
  LogIn,
  LogOut,
  User,
  Loader2,
  Edit3,
  Check,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AuthModal } from "@/components/auth/AuthModal";
import type { WatchlistRow, WatchlistItemRow } from "@/lib/supabase/watchlists";
import type { SupabaseClient } from "@supabase/supabase-js";

export function Sidebar() {
  const { user, loading: authLoading, configured, signIn, signUp, signOut } = useAuth();
  const [showAuth, setShowAuth] = useState(false);
  const [watchlists, setWatchlists] = useState<WatchlistRow[]>([]);
  const [items, setItems] = useState<Record<string, WatchlistItemRow[]>>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [showNewList, setShowNewList] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const supabase = (configured ? createClient() : null) as SupabaseClient | null;

  const fetchWatchlists = useCallback(async () => {
    if (!user || !supabase) return;
    setLoading(true);
    const { data } = await supabase
      .from("watchlists")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });
    setWatchlists(data ?? []);
    setLoading(false);
  }, [user, supabase]);

  const fetchItems = useCallback(async (watchlistId: string) => {
    if (!supabase) return;
    const { data } = await supabase
      .from("watchlist_items")
      .select("*")
      .eq("watchlist_id", watchlistId)
      .order("added_at", { ascending: true });
    setItems((prev) => ({ ...prev, [watchlistId]: data ?? [] }));
  }, [supabase]);

  useEffect(() => {
    if (user) fetchWatchlists();
  }, [user, fetchWatchlists]);

  const toggleExpand = (id: string) => {
    const newExpanded = !expanded[id];
    setExpanded((prev) => ({ ...prev, [id]: newExpanded }));
    if (newExpanded && !items[id]) {
      fetchItems(id);
    }
  };

  const createList = async () => {
    if (!user || !newListName.trim() || !supabase) return;
    await supabase.from("watchlists").insert({ user_id: user.id, name: newListName.trim() });
    setNewListName("");
    setShowNewList(false);
    fetchWatchlists();
  };

  const deleteList = async (id: string) => {
    if (!supabase) return;
    await supabase.from("watchlists").delete().eq("id", id);
    setWatchlists((prev) => prev.filter((w) => w.id !== id));
    setItems((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const renameList = async (id: string) => {
    if (!editName.trim() || !supabase) return;
    await supabase.from("watchlists").update({ name: editName.trim() }).eq("id", id);
    setEditingId(null);
    fetchWatchlists();
  };

  const removeItem = async (watchlistId: string, itemId: string) => {
    if (!supabase) return;
    await supabase.from("watchlist_items").delete().eq("id", itemId);
    setItems((prev) => ({
      ...prev,
      [watchlistId]: (prev[watchlistId] ?? []).filter((i) => i.id !== itemId),
    }));
  };

  return (
    <>
      <aside
        className="h-full overflow-y-auto flex flex-col"
        style={{
          width: 260,
          background: "var(--bg-secondary)",
          borderRight: "1px solid var(--border)",
        }}
      >
        <div
          className="flex items-center gap-2 px-4 py-3"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <List className="h-4 w-4" style={{ color: "var(--accent)" }} />
          <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            Mes Listes
          </span>
        </div>

        {!configured ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-2 px-4">
            <p className="text-xs text-center leading-relaxed" style={{ color: "var(--text-muted)" }}>
              Base de données non configurée. Ajoutez les variables Supabase pour activer les listes.
            </p>
          </div>
        ) : authLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin" style={{ color: "var(--text-muted)" }} />
          </div>
        ) : !user ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 px-4">
            <p className="text-xs text-center leading-relaxed" style={{ color: "var(--text-muted)" }}>
              Connectez-vous pour créer et sauvegarder des listes personnalisées.
            </p>
            <button
              onClick={() => setShowAuth(true)}
              className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium cursor-pointer"
              style={{ background: "var(--accent)", color: "#fff" }}
            >
              <LogIn className="h-4 w-4" />
              Se connecter
            </button>
          </div>
        ) : (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* User info */}
            <div
              className="flex items-center justify-between px-4 py-2"
              style={{ borderBottom: "1px solid var(--border)" }}
            >
              <div className="flex items-center gap-2 min-w-0">
                <User className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--accent)" }} />
                <span className="text-xs truncate" style={{ color: "var(--text-secondary)" }}>
                  {user.email}
                </span>
              </div>
              <button
                onClick={signOut}
                className="p-1 rounded cursor-pointer shrink-0"
                style={{ color: "var(--text-muted)" }}
                title="Déconnexion"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Lists */}
            <div className="flex-1 overflow-y-auto py-2">
              {loading ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-4 w-4 animate-spin" style={{ color: "var(--text-muted)" }} />
                </div>
              ) : watchlists.length === 0 ? (
                <p className="text-xs text-center px-4 py-4" style={{ color: "var(--text-muted)" }}>
                  Aucune liste. Créez-en une ci-dessous.
                </p>
              ) : (
                watchlists.map((wl) => (
                  <div key={wl.id}>
                    <div
                      className="flex items-center gap-1 px-3 py-1.5 group"
                      style={{ cursor: "pointer" }}
                    >
                      <button
                        onClick={() => toggleExpand(wl.id)}
                        className="p-0.5 cursor-pointer"
                        style={{ color: "var(--text-muted)" }}
                      >
                        {expanded[wl.id] ? (
                          <ChevronDown className="h-3.5 w-3.5" />
                        ) : (
                          <ChevronRight className="h-3.5 w-3.5" />
                        )}
                      </button>

                      {editingId === wl.id ? (
                        <div className="flex items-center gap-1 flex-1 min-w-0">
                          <input
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && renameList(wl.id)}
                            className="flex-1 text-xs rounded px-1.5 py-0.5 outline-none min-w-0"
                            style={{
                              background: "var(--bg-tertiary)",
                              border: "1px solid var(--accent)",
                              color: "var(--text-primary)",
                            }}
                            autoFocus
                          />
                          <button
                            onClick={() => renameList(wl.id)}
                            className="p-0.5 cursor-pointer"
                            style={{ color: "var(--emerald)" }}
                          >
                            <Check className="h-3 w-3" />
                          </button>
                        </div>
                      ) : (
                        <span
                          onClick={() => toggleExpand(wl.id)}
                          className="flex-1 text-xs font-medium truncate"
                          style={{ color: "var(--text-primary)" }}
                        >
                          {wl.name}
                        </span>
                      )}

                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingId(wl.id);
                            setEditName(wl.name);
                          }}
                          className="p-0.5 cursor-pointer"
                          style={{ color: "var(--text-muted)" }}
                        >
                          <Edit3 className="h-3 w-3" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteList(wl.id);
                          }}
                          className="p-0.5 cursor-pointer"
                          style={{ color: "var(--red)" }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>

                    {expanded[wl.id] && (
                      <div className="pl-7 pr-2 pb-1">
                        {!items[wl.id] ? (
                          <Loader2 className="h-3 w-3 animate-spin my-1" style={{ color: "var(--text-muted)" }} />
                        ) : items[wl.id].length === 0 ? (
                          <p className="text-xs py-1" style={{ color: "var(--text-muted)" }}>
                            Vide. Ctrl+K pour ajouter.
                          </p>
                        ) : (
                          items[wl.id].map((item) => (
                            <div
                              key={item.id}
                              className="flex items-center justify-between py-0.5 group/item"
                            >
                              <Link
                                href={`/stock/${item.ticker}`}
                                className="text-xs font-mono hover:underline"
                                style={{ color: "var(--accent)" }}
                              >
                                {item.ticker}
                              </Link>
                              <div className="flex items-center gap-2">
                                {item.signal && (
                                  <span
                                    className="text-xs"
                                    style={{
                                      color: item.signal === "STRONG_BUY" ? "var(--emerald)"
                                        : item.signal === "UNDERVALUED" ? "#4ade80"
                                        : item.signal === "FAIR_VALUE" ? "var(--text-muted)"
                                        : "var(--red)",
                                    }}
                                  >
                                    {item.safety_margin != null
                                      ? `${(item.safety_margin * 100).toFixed(0)}%`
                                      : "–"}
                                  </span>
                                )}
                                <button
                                  onClick={() => removeItem(wl.id, item.id)}
                                  className="p-0.5 cursor-pointer opacity-0 group-hover/item:opacity-100 transition-opacity"
                                  style={{ color: "var(--red)" }}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* New list button */}
            <div
              className="px-3 py-2"
              style={{ borderTop: "1px solid var(--border)" }}
            >
              {showNewList ? (
                <div className="flex items-center gap-1">
                  <input
                    value={newListName}
                    onChange={(e) => setNewListName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && createList()}
                    placeholder="Nom de la liste"
                    className="flex-1 text-xs rounded px-2 py-1.5 outline-none"
                    style={{
                      background: "var(--bg-tertiary)",
                      border: "1px solid var(--border)",
                      color: "var(--text-primary)",
                    }}
                    autoFocus
                  />
                  <button
                    onClick={createList}
                    className="p-1.5 rounded cursor-pointer"
                    style={{ background: "var(--accent)", color: "#fff" }}
                  >
                    <Check className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowNewList(true)}
                  className="flex items-center gap-1.5 text-xs cursor-pointer w-full px-2 py-1.5 rounded-lg transition-colors"
                  style={{ color: "var(--text-muted)" }}
                >
                  <Plus className="h-3.5 w-3.5" />
                  Nouvelle liste
                </button>
              )}
            </div>
          </div>
        )}
      </aside>

      <AuthModal
        open={showAuth}
        onClose={() => setShowAuth(false)}
        onSignIn={signIn}
        onSignUp={signUp}
      />
    </>
  );
}
