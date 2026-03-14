-- ═══════════════════════════════════════════════════════════════════════════
-- Screener DCF — Schema Supabase
-- À exécuter dans le SQL Editor du dashboard Supabase
-- ═══════════════════════════════════════════════════════════════════════════

-- Watchlists (une par utilisateur, nommées)
create table if not exists public.watchlists (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null default 'Ma Watchlist',
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Items dans une watchlist
create table if not exists public.watchlist_items (
  id uuid default gen_random_uuid() primary key,
  watchlist_id uuid references public.watchlists(id) on delete cascade not null,
  ticker text not null,
  name text not null default '',
  added_at timestamptz default now() not null,
  current_price numeric,
  fair_value numeric,
  safety_margin numeric,
  signal text,
  unique(watchlist_id, ticker)
);

-- Index pour les requêtes fréquentes
create index if not exists idx_watchlists_user on public.watchlists(user_id);
create index if not exists idx_watchlist_items_wl on public.watchlist_items(watchlist_id);

-- Row Level Security
alter table public.watchlists enable row level security;
alter table public.watchlist_items enable row level security;

-- Policies : un user ne voit que ses propres watchlists
create policy "Users can view own watchlists"
  on public.watchlists for select
  using (auth.uid() = user_id);

create policy "Users can insert own watchlists"
  on public.watchlists for insert
  with check (auth.uid() = user_id);

create policy "Users can update own watchlists"
  on public.watchlists for update
  using (auth.uid() = user_id);

create policy "Users can delete own watchlists"
  on public.watchlists for delete
  using (auth.uid() = user_id);

-- Policies items : accessible si la watchlist appartient au user
create policy "Users can view own items"
  on public.watchlist_items for select
  using (
    watchlist_id in (
      select id from public.watchlists where user_id = auth.uid()
    )
  );

create policy "Users can insert own items"
  on public.watchlist_items for insert
  with check (
    watchlist_id in (
      select id from public.watchlists where user_id = auth.uid()
    )
  );

create policy "Users can update own items"
  on public.watchlist_items for update
  using (
    watchlist_id in (
      select id from public.watchlists where user_id = auth.uid()
    )
  );

create policy "Users can delete own items"
  on public.watchlist_items for delete
  using (
    watchlist_id in (
      select id from public.watchlists where user_id = auth.uid()
    )
  );
