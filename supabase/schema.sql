-- ════════════════════════════════════════════════════════════════════
--  KoraFête — base de données Supabase
--  À exécuter UNE FOIS dans Supabase : SQL Editor → New query → coller → Run
-- ════════════════════════════════════════════════════════════════════

-- ─── Administrateurs ────────────────────────────────────────────────
create table if not exists public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.admins enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

drop policy if exists "admins: lecture de soi" on public.admins;
create policy "admins: lecture de soi" on public.admins
  for select using (user_id = auth.uid());

-- ─── Prestataires (un profil par compte) ────────────────────────────
create table if not exists public.providers (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null unique references auth.users (id) on delete cascade,
  business_name text not null,
  tagline text not null default '',
  presentation text not null default '',
  category_id text not null,
  city text not null default '',
  coverage_area text not null default '',
  phone text not null default '',
  email text not null default '',
  cover_image text not null default '',
  gallery_images text[] not null default '{}',
  availability_summary text not null default '',
  booking_conditions text not null default '',
  cancellation_policy text not null default '',
  deposit_percent int not null default 30 check (deposit_percent between 0 and 100),
  verified boolean not null default false,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.providers enable row level security;

-- Seul un administrateur peut changer le badge « vérifié ».
create or replace function public.providers_protect_verified()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    if tg_op = 'INSERT' then
      new.verified := false;
    else
      new.verified := old.verified;
      new.owner_id := old.owner_id;
    end if;
  end if;
  new.updated_at := now();
  return new;
end;
$$;
drop trigger if exists providers_protect_verified on public.providers;
create trigger providers_protect_verified
  before insert or update on public.providers
  for each row execute function public.providers_protect_verified();

drop policy if exists "providers: lecture publique" on public.providers;
create policy "providers: lecture publique" on public.providers
  for select using (published or owner_id = auth.uid() or public.is_admin());

drop policy if exists "providers: créer son profil" on public.providers;
create policy "providers: créer son profil" on public.providers
  for insert with check (owner_id = auth.uid());

drop policy if exists "providers: modifier son profil" on public.providers;
create policy "providers: modifier son profil" on public.providers
  for update using (owner_id = auth.uid() or public.is_admin());

drop policy if exists "providers: supprimer" on public.providers;
create policy "providers: supprimer" on public.providers
  for delete using (owner_id = auth.uid() or public.is_admin());

-- ─── Prestations / tarifs ───────────────────────────────────────────
create table if not exists public.packages (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.providers (id) on delete cascade,
  title text not null,
  description text not null default '',
  billing_mode text not null default 'forfait'
    check (billing_mode in ('fixe','horaire','m2','personne','unite','quantite','forfait','sur_devis')),
  unit_price_fcfa int not null default 0 check (unit_price_fcfa >= 0),
  unit_label text not null default '',
  min_quantity int not null default 1 check (min_quantity >= 1),
  max_capacity_label text not null default '',
  included_items text[] not null default '{}',
  extra_fees_label text,
  options jsonb not null default '[]',
  lead_time_days int not null default 0,
  created_at timestamptz not null default now()
);
alter table public.packages enable row level security;

create or replace function public.owns_provider(pid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.providers where id = pid and owner_id = auth.uid());
$$;

drop policy if exists "packages: lecture publique" on public.packages;
create policy "packages: lecture publique" on public.packages for select using (true);

drop policy if exists "packages: gérer les siennes" on public.packages;
create policy "packages: gérer les siennes" on public.packages
  for all using (public.owns_provider(provider_id) or public.is_admin())
  with check (public.owns_provider(provider_id) or public.is_admin());

-- ─── Demandes de devis / réservations (envoyées par les clients) ────
create table if not exists public.inquiries (
  id uuid primary key default gen_random_uuid(),
  reference text not null default ('DEV-' || to_char(now(), 'YYYY') || '-' || lpad((floor(random() * 9000) + 1000)::text, 4, '0')),
  provider_id uuid not null references public.providers (id) on delete cascade,
  package_title text not null default '',
  client_name text not null,
  client_phone text not null,
  event_date date,
  guest_count int not null default 0,
  message text not null default '',
  estimated_total_fcfa int not null default 0,
  is_sur_devis boolean not null default false,
  type text not null default 'devis' check (type in ('devis','reservation')),
  status text not null default 'En attente de réponse'
    check (status in ('En attente de réponse','Disponibilité confirmée','Réservation validée')),
  provider_reply text,
  created_at timestamptz not null default now()
);
alter table public.inquiries enable row level security;

create or replace function public.inquiries_on_insert()
returns trigger language plpgsql as $$
begin
  new.status := 'En attente de réponse';
  new.provider_reply := null;
  return new;
end;
$$;
drop trigger if exists inquiries_on_insert on public.inquiries;
create trigger inquiries_on_insert before insert on public.inquiries
  for each row execute function public.inquiries_on_insert();

drop policy if exists "inquiries: tout le monde peut envoyer" on public.inquiries;
create policy "inquiries: tout le monde peut envoyer" on public.inquiries
  for insert with check (true);

drop policy if exists "inquiries: le prestataire voit les siennes" on public.inquiries;
create policy "inquiries: le prestataire voit les siennes" on public.inquiries
  for select using (public.owns_provider(provider_id) or public.is_admin());

drop policy if exists "inquiries: le prestataire répond" on public.inquiries;
create policy "inquiries: le prestataire répond" on public.inquiries
  for update using (public.owns_provider(provider_id) or public.is_admin());

-- ─── Avis clients ───────────────────────────────────────────────────
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.providers (id) on delete cascade,
  author_name text not null,
  event_label text not null default '',
  rating int not null check (rating between 1 and 5),
  comment text not null default '',
  verified_booking boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.reviews enable row level security;

create or replace function public.reviews_on_insert()
returns trigger language plpgsql as $$
begin
  new.verified_booking := false;
  return new;
end;
$$;
drop trigger if exists reviews_on_insert on public.reviews;
create trigger reviews_on_insert before insert on public.reviews
  for each row execute function public.reviews_on_insert();

drop policy if exists "reviews: lecture publique" on public.reviews;
create policy "reviews: lecture publique" on public.reviews for select using (true);
drop policy if exists "reviews: tout le monde peut publier" on public.reviews;
create policy "reviews: tout le monde peut publier" on public.reviews for insert with check (true);
drop policy if exists "reviews: admin supprime" on public.reviews;
create policy "reviews: admin supprime" on public.reviews for delete using (public.is_admin());

-- ─── Signalements ───────────────────────────────────────────────────
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid references public.providers (id) on delete set null,
  target_name text not null,
  reason text not null,
  reporter_name text not null default 'Visiteur',
  status text not null default 'Ouvert' check (status in ('Ouvert','Résolu')),
  created_at timestamptz not null default now()
);
alter table public.reports enable row level security;

drop policy if exists "reports: tout le monde peut signaler" on public.reports;
create policy "reports: tout le monde peut signaler" on public.reports for insert with check (true);
drop policy if exists "reports: admin lit" on public.reports;
create policy "reports: admin lit" on public.reports for select using (public.is_admin());
drop policy if exists "reports: admin traite" on public.reports;
create policy "reports: admin traite" on public.reports for update using (public.is_admin());

-- ─── Photos des prestataires (stockage) ─────────────────────────────
insert into storage.buckets (id, name, public)
values ('provider-images', 'provider-images', true)
on conflict (id) do nothing;

drop policy if exists "images: lecture publique" on storage.objects;
create policy "images: lecture publique" on storage.objects
  for select using (bucket_id = 'provider-images');

drop policy if exists "images: envoyer dans son dossier" on storage.objects;
create policy "images: envoyer dans son dossier" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'provider-images' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "images: gérer son dossier" on storage.objects;
create policy "images: gérer son dossier" on storage.objects
  for delete to authenticated
  using (bucket_id = 'provider-images' and (storage.foldername(name))[1] = auth.uid()::text);

-- ════════════════════════════════════════════════════════════════════
--  Pour te donner le rôle administrateur (après avoir créé ton compte
--  sur le site), remplace l'e-mail ci-dessous puis exécute :
--
--  insert into public.admins (user_id)
--  select id from auth.users where email = 'ton-email@exemple.com';
-- ════════════════════════════════════════════════════════════════════
