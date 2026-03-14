"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import {
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
  Star,
  FolderPlus,
  LogIn,
  LogOut,
  User,
  Loader2,
  Edit3,
  Check,
  X,
  GripVertical,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AuthModal } from "@/components/auth/AuthModal";
import { useAppStore } from "@/store";
import { useHydration } from "@/hooks/useHydration";
import { signalToColor } from "@/types";
import type { WatchlistRow, WatchlistItemRow } from "@/lib/supabase/watchlists";
import type { SupabaseClient } from "@supabase/supabase-js";

export function Sidebar() {
  const { user, loading: authLoading, configured, signIn, signUp, signOut } = useAuth();
  const hydrated = useHydration();
  const [showAuth, setShowAuth] = useState(false);

  // Zustand watchlist (source principale)
  const watchlist = useAppStore((s) => s.watchlist);
  const removeFromWatchlist = useAppStore((s) => s.removeFromWatchlist);

  // Supabase lists
  const [customLists, setCustomLists] = useState<WatchlistRow[]>([]);
  const [listItems, setListItems] = useState<Record<string, WatchlistItemRow[]>>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ watchlist: true });
  const [loading, setLoading] = useState(false);
  const [showNewList, setShowNewList] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  // Drag & Drop
  const [dragTicker, setDragTicker] = useState<string | null>(null);
  const [dragName, setDragName] = useState<string>("");
  const [dragOver, setDragOver] = useState<string | null>(null);

  const supabase = (configured ? createClient() : null) as SupabaseClient | null;

  // Fetch custom lists
  const fetchLists = useCallback(async () => {
    if (!user || !supabase) return;
    setLoading(true);
    const { data } = await supabase
      .from("watchlists")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });
    setCustomLists(data ?? []);
    setLoading(false);
  }, [user, supabase]);

  const fetchItems = useCallback(async (listId: string) => {
    if (!supabase) return;
    const { data } = await supabase
      .from("watchlist_items")
      .select("*")
      .eq("watchlist_id", listId)
      .order("added_at", { ascending: true });
    setListItems((prev) => ({ ...prev, [listId]: data ?? [] }));
  }, [supabase]);

  useEffect(() => {
    if (user) fetchLists();
  }, [user, fetchLists]);

  // Toggle expand
  const toggle = (id: string) => {
    const next = !expanded[id];
    setExpanded((p) => ({ ...p, [id]: next }));
    if (next && id !== "watchlist" && !listItems[id]) fetchItems(id);
  };

  // CRUD custom lists
  const createList = async () => {
    if (!user || !supabase || !newListName.trim()) return;
    await supabase.from("watchlists").insert({ user_id: user.id, name: newListName.trim() });
    setNewListName("");
    setShowNewList(false);
    fetchLists();
  };

  const deleteList = async (id: string) => {
    if (!supabase) return;
    await supabase.from("watchlists").delete().eq("id", id);
    setCustomLists((p) => p.filter((w) => w.id !== id));
    setListItems((p) => { const n = { ...p }; delete n[id]; return n; });
  };

  const renameList = async (id: string) => {
    if (!supabase || !editName.trim()) return;
    await supabase.from("watchlists").update({ name: editName.trim() }).eq("id", id);
    setEditingId(null);
    fetchLists();
  };

  const removeItem = async (listId: string, itemId: string) => {
    if (!supabase) return;
    await supabase.from("watchlist_items").delete().eq("id", itemId);
    setListItems((p) => ({
      ...p,
      [listId]: (p[listId] ?? []).filter((i) => i.id !== itemId),
    }));
  };

  // Drag & Drop handlers
  const onDragStart = (ticker: string, name: string) => {
    setDragTicker(ticker);
    setDragName(name);
  };

  const onDragEnd = () => {
    setDragTicker(null);
    setDragName("");
    setDragOver(null);
  };

  const onDropOnList = async (listId: string) => {
    if (!dragTicker || !supabase) return;
    setDragOver(null);

    const existing = listItems[listId] ?? [];
    if (existing.some((i) => i.ticker === dragTicker)) return;

    const { data } = await supabase
      .from("watchlist_items")
      .insert({ watchlist_id: listId, ticker: dragTicker, name: dragName })
      .select()
      .single();

    if (data) {
      setListItems((p) => ({ ...p, [listId]: [...(p[listId] ?? []), data] }));
    }

    if (!expanded[listId]) {
      setExpanded((p) => ({ ...p, [listId]: true }));
      if (!listItems[listId]) fetchItems(listId);
    }
  };

  // Draggable item component
  const DraggableItem = ({
    ticker,
    name,
    color,
    badge,
    onRemove,
  }: {
    ticker: string;
    name: string;
    color?: string;
    badge?: string;
    onRemove?: () => void;
  }) => (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = "copy";
        onDragStart(ticker, name);
      }}
      onDragEnd={onDragEnd}
      className="flex items-center justify-between py-1 px-1 rounded group/item cursor-grab active:cursor-grabbing transition-colors"
      style={{ marginLeft: 4, marginRight: 4 }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-hover)")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      <div className="flex items-center gap-1.5 min-w-0">
        <GripVertical className="h-3 w-3 shrink-0 opacity-30 group-hover/item:opacity-70" style={{ color: "var(--text-muted)" }} />
        <Link
          href={`/stock/${ticker}`}
          className="text-xs font-mono font-medium hover:underline truncate"
          style={{ color: "var(--accent)" }}
          onClick={(e) => e.stopPropagation()}
        >
          {ticker}
        </Link>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        {badge && (
          <span className="text-xs font-mono" style={{ color: color || "var(--text-muted)" }}>
            {badge}
          </span>
        )}
        {onRemove && (
          <button
            onClick={(e) => { e.stopPropagation(); onRemove(); }}
            className="p-0.5 cursor-pointer opacity-0 group-hover/item:opacity-100 transition-opacity"
            style={{ color: "var(--red)" }}
          >
            <Trash2 className="h-3 w-3" />
          </button>
        )}
      </div>
    </div>
  );

  // Droppable list header
  const ListHeader = ({
    id,
    name,
    icon,
    count,
    isDefault,
  }: {
    id: string;
    name: string;
    icon: React.ReactNode;
    count: number;
    isDefault?: boolean;
  }) => {
    const isOver = dragOver === id && dragTicker !== null;
    return (
      <div
        className="flex items-center gap-1 px-3 py-1.5 group transition-colors"
        style={{
          cursor: "pointer",
          background: isOver ? "rgba(59,130,246,0.1)" : "transparent",
          borderLeft: isOver ? "2px solid var(--accent)" : "2px solid transparent",
        }}
        onDragOver={(e) => {
          if (!isDefault && dragTicker) {
            e.preventDefault();
            e.dataTransfer.dropEffect = "copy";
            setDragOver(id);
          }
        }}
        onDragLeave={() => setDragOver(null)}
        onDrop={(e) => {
          e.preventDefault();
          if (!isDefault) onDropOnList(id);
        }}
      >
        <button onClick={() => toggle(id)} className="p-0.5 cursor-pointer" style={{ color: "var(--text-muted)" }}>
          {expanded[id] ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
        </button>
        {icon}

        {editingId === id ? (
          <div className="flex items-center gap-1 flex-1 min-w-0">
            <input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") renameList(id);
                if (e.key === "Escape") setEditingId(null);
              }}
              className="flex-1 text-xs rounded px-1.5 py-0.5 outline-none min-w-0"
              style={{ background: "var(--bg-tertiary)", border: "1px solid var(--accent)", color: "var(--text-primary)" }}
              autoFocus
            />
            <button onClick={() => renameList(id)} className="p-0.5 cursor-pointer" style={{ color: "var(--emerald)" }}>
              <Check className="h-3 w-3" />
            </button>
            <button onClick={() => setEditingId(null)} className="p-0.5 cursor-pointer" style={{ color: "var(--text-muted)" }}>
              <X className="h-3 w-3" />
            </button>
          </div>
        ) : (
          <>
            <span onClick={() => toggle(id)} className="flex-1 text-xs font-medium truncate" style={{ color: "var(--text-primary)" }}>
              {name}
            </span>
            <span className="text-xs tabular-nums" style={{ color: "var(--text-muted)" }}>
              {count}
            </span>
          </>
        )}

        {!isDefault && editingId !== id && (
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-1">
            <button onClick={(e) => { e.stopPropagation(); setEditingId(id); setEditName(name); }} className="p-0.5 cursor-pointer" style={{ color: "var(--text-muted)" }}>
              <Edit3 className="h-3 w-3" />
            </button>
            <button onClick={(e) => { e.stopPropagation(); deleteList(id); }} className="p-0.5 cursor-pointer" style={{ color: "var(--red)" }}>
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <aside
        className="h-full overflow-y-auto flex flex-col shrink-0"
        style={{
          width: 260,
          background: "var(--bg-secondary)",
          borderRight: "1px solid var(--border)",
        }}
      >
        {/* ── Watchlist principale (Zustand, toujours visible) ── */}
        <div style={{ borderBottom: "1px solid var(--border)" }}>
          <ListHeader
            id="watchlist"
            name="Watchlist"
            icon={<Star className="h-3.5 w-3.5 shrink-0" style={{ color: "#f59e0b" }} />}
            count={hydrated ? watchlist.length : 0}
            isDefault
          />
          {expanded["watchlist"] && hydrated && (
            <div className="pb-2">
              {watchlist.length === 0 ? (
                <p className="text-xs px-7 py-1" style={{ color: "var(--text-muted)" }}>
                  Ctrl+K pour ajouter
                </p>
              ) : (
                watchlist.map((entry) => (
                  <DraggableItem
                    key={entry.ticker}
                    ticker={entry.ticker}
                    name={entry.name}
                    color={entry.signal ? signalToColor(entry.signal) : undefined}
                    badge={
                      entry.safetyMargin != null
                        ? `${(entry.safetyMargin * 100).toFixed(0)}%`
                        : entry.currentPrice > 0
                          ? `$${entry.currentPrice.toFixed(0)}`
                          : undefined
                    }
                    onRemove={() => removeFromWatchlist(entry.ticker)}
                  />
                ))
              )}
            </div>
          )}
        </div>

        {/* ── Section listes custom (Supabase) ── */}
        <div className="flex-1 overflow-y-auto">
          {!configured ? (
            <div className="px-4 py-4">
              <p className="text-xs text-center leading-relaxed" style={{ color: "var(--text-muted)" }}>
                Connectez-vous pour créer des listes personnalisées.
              </p>
            </div>
          ) : authLoading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="h-4 w-4 animate-spin" style={{ color: "var(--text-muted)" }} />
            </div>
          ) : !user ? (
            <div className="flex flex-col items-center gap-3 px-4 py-6">
              <p className="text-xs text-center leading-relaxed" style={{ color: "var(--text-muted)" }}>
                Connectez-vous pour créer des listes personnalisées et glisser-déposer vos actifs.
              </p>
              <button
                onClick={() => setShowAuth(true)}
                className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium cursor-pointer"
                style={{ background: "var(--accent)", color: "#fff" }}
              >
                <LogIn className="h-3.5 w-3.5" />
                Se connecter
              </button>
            </div>
          ) : (
            <>
              {loading ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-4 w-4 animate-spin" style={{ color: "var(--text-muted)" }} />
                </div>
              ) : customLists.length === 0 && !showNewList ? (
                <p className="text-xs text-center px-4 py-4" style={{ color: "var(--text-muted)" }}>
                  Glissez un ticker depuis la Watchlist vers une liste custom.
                </p>
              ) : (
                customLists.map((wl) => (
                  <div key={wl.id} style={{ borderBottom: "1px solid var(--border)" }}>
                    <ListHeader
                      id={wl.id}
                      name={wl.name}
                      icon={<FolderPlus className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--accent)" }} />}
                      count={listItems[wl.id]?.length ?? 0}
                    />
                    {expanded[wl.id] && (
                      <div className="pb-2">
                        {!listItems[wl.id] ? (
                          <div className="px-7 py-1">
                            <Loader2 className="h-3 w-3 animate-spin" style={{ color: "var(--text-muted)" }} />
                          </div>
                        ) : listItems[wl.id].length === 0 ? (
                          <p
                            className="text-xs px-7 py-2 rounded mx-3"
                            style={{
                              color: "var(--text-muted)",
                              background: dragTicker ? "rgba(59,130,246,0.05)" : "transparent",
                              border: dragTicker ? "1px dashed var(--accent)" : "1px dashed transparent",
                            }}
                          >
                            {dragTicker ? "Déposez ici" : "Vide — glissez un actif ici"}
                          </p>
                        ) : (
                          listItems[wl.id].map((item) => (
                            <DraggableItem
                              key={item.id}
                              ticker={item.ticker}
                              name={item.name}
                              badge={
                                item.safety_margin != null
                                  ? `${(Number(item.safety_margin) * 100).toFixed(0)}%`
                                  : undefined
                              }
                              color={item.signal ? signalToColor(item.signal as "STRONG_BUY") : undefined}
                              onRemove={() => removeItem(wl.id, item.id)}
                            />
                          ))
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </>
          )}
        </div>

        {/* ── Footer : nouvelle liste + auth ── */}
        <div style={{ borderTop: "1px solid var(--border)" }}>
          {user && (
            <div className="px-3 py-2">
              {showNewList ? (
                <div className="flex items-center gap-1">
                  <input
                    value={newListName}
                    onChange={(e) => setNewListName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") createList();
                      if (e.key === "Escape") { setShowNewList(false); setNewListName(""); }
                    }}
                    placeholder="Nom de la liste"
                    className="flex-1 text-xs rounded px-2 py-1.5 outline-none"
                    style={{ background: "var(--bg-tertiary)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
                    autoFocus
                  />
                  <button onClick={createList} className="p-1.5 rounded cursor-pointer" style={{ background: "var(--accent)", color: "#fff" }}>
                    <Check className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => { setShowNewList(false); setNewListName(""); }} className="p-1.5 rounded cursor-pointer" style={{ color: "var(--text-muted)" }}>
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowNewList(true)}
                  className="flex items-center gap-1.5 text-xs cursor-pointer w-full px-2 py-1.5 rounded-lg transition-colors"
                  style={{ color: "var(--text-muted)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-primary)")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
                >
                  <Plus className="h-3.5 w-3.5" />
                  Nouvelle liste
                </button>
              )}
            </div>
          )}

          {user && (
            <div
              className="flex items-center justify-between px-4 py-2"
              style={{ borderTop: "1px solid var(--border)" }}
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
          )}
        </div>
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
