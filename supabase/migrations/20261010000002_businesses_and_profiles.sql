-- =============================================================================
-- Migración 002: Perfiles, comercios y configuración
-- =============================================================================
-- Crea las tablas base de la plataforma: perfiles de usuario, comercios,
-- su configuración visual y el historial de slugs anteriores.
--
-- NOTA: citext está instalado en el esquema "extensions", por eso se
-- referencia como extensions.citext en lugar de citext a secas.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Table: profiles
-- -----------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email extensions.citext not null unique,
  full_name text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is
  'Perfil de usuario, uno por cada cuenta en auth.users.';

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function app.set_updated_at();

-- Trigger: crear perfil automáticamente al registrarse
create or replace function app.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', '')
  );
  return new;
end;
$$;

comment on function app.handle_new_user() is
  'Trigger: crea un perfil automáticamente cuando se registra un usuario.';

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function app.handle_new_user();

-- -----------------------------------------------------------------------------
-- Table: businesses
-- -----------------------------------------------------------------------------

create table public.businesses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete restrict,
  slug extensions.citext not null unique,
  name text not null,
  category text,
  timezone text not null default 'America/Argentina/Buenos_Aires',
  status text not null default 'active',
  trial_ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint businesses_slug_format check (app.is_valid_slug(slug::text)),
  constraint businesses_name_length check (length(name) between 2 and 100),
  constraint businesses_status_values check (status in ('active', 'suspended', 'trial_expired', 'canceled'))
);

comment on table public.businesses is
  'Comercios (marcas) registrados en Reservibes.';

create index businesses_owner_id_idx on public.businesses(owner_id);
create index businesses_status_idx on public.businesses(status);

create trigger businesses_set_updated_at
  before update on public.businesses
  for each row execute function app.set_updated_at();

-- Trigger: impedir uso de slugs reservados
create or replace function app.check_slug_not_reserved()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if exists (select 1 from app.reserved_slugs where slug = new.slug::text) then
    raise exception 'El slug "%" está reservado y no puede usarse.', new.slug
      using errcode = '23514';
  end if;
  return new;
end;
$$;

comment on function app.check_slug_not_reserved() is
  'Trigger: bloquea la creación/edición de comercios con slugs reservados.';

create trigger businesses_check_slug
  before insert or update of slug on public.businesses
  for each row execute function app.check_slug_not_reserved();

-- -----------------------------------------------------------------------------
-- Table: business_settings
-- -----------------------------------------------------------------------------

create table public.business_settings (
  business_id uuid primary key references public.businesses(id) on delete cascade,
  logo_url text,
  cover_url text,
  accent_color text not null default '#18181b',
  description text,
  address text,
  phone text,
  whatsapp text,
  instagram text,
  facebook text,
  website text,
  public_email extensions.citext,
  confirmation_mode text not null default 'auto',
  min_advance_minutes int not null default 60,
  max_advance_days int not null default 60,
  slot_interval_minutes int not null default 15,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint business_settings_confirmation_mode check (confirmation_mode in ('auto', 'manual')),
  constraint business_settings_min_advance check (min_advance_minutes between 0 and 43200),
  constraint business_settings_max_advance check (max_advance_days between 1 and 365),
  constraint business_settings_slot_interval check (slot_interval_minutes between 5 and 120)
);

comment on table public.business_settings is
  'Configuración visual y de comportamiento de cada comercio.';

create trigger business_settings_set_updated_at
  before update on public.business_settings
  for each row execute function app.set_updated_at();

-- Trigger: crear business_settings automáticamente al crear un business
create or replace function app.handle_new_business()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.business_settings (business_id)
  values (new.id);
  return new;
end;
$$;

comment on function app.handle_new_business() is
  'Trigger: crea la configuración por defecto al crear un comercio.';

create trigger on_business_created
  after insert on public.businesses
  for each row execute function app.handle_new_business();

-- -----------------------------------------------------------------------------
-- Table: slug_redirects
-- -----------------------------------------------------------------------------

create table public.slug_redirects (
  id uuid primary key default gen_random_uuid(),
  old_slug extensions.citext not null unique,
  business_id uuid not null references public.businesses(id) on delete cascade,
  created_at timestamptz not null default now()
);

comment on table public.slug_redirects is
  'Historial de slugs anteriores para redirigir al slug actual del comercio.';

create index slug_redirects_business_id_idx on public.slug_redirects(business_id);

-- Trigger: registrar automáticamente el slug anterior al cambiarlo
create or replace function app.handle_slug_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.slug <> new.slug then
    insert into public.slug_redirects (old_slug, business_id)
    values (old.slug, new.id)
    on conflict (old_slug) do nothing;
  end if;
  return new;
end;
$$;

comment on function app.handle_slug_change() is
  'Trigger: guarda el slug anterior para redirecciones automáticas.';

create trigger businesses_track_slug_change
  after update of slug on public.businesses
  for each row execute function app.handle_slug_change();

-- -----------------------------------------------------------------------------
-- RLS: habilitar en todas las tablas nuevas
-- -----------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.businesses enable row level security;
alter table public.business_settings enable row level security;
alter table public.slug_redirects enable row level security;