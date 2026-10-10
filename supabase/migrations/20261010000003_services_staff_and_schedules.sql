-- =============================================================================
-- Migración 003: Servicios, personal y horarios
-- =============================================================================
-- Crea las tablas que definen QUÉ se ofrece (servicios), QUIÉN lo hace
-- (staff) y CUÁNDO (working_hours, time_off).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Table: services
-- -----------------------------------------------------------------------------

create table public.services (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null,
  description text,
  duration_minutes int not null,
  price_cents int not null default 0,
  currency text not null default 'ARS',
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint services_name_length check (length(name) between 2 and 120),
  constraint services_duration_range check (duration_minutes between 5 and 720),
  constraint services_price_non_negative check (price_cents >= 0),
  constraint services_currency_format check (currency ~ '^[A-Z]{3}$')
);

comment on table public.services is
  'Servicios ofrecidos por cada comercio (con duración y precio).';

create index services_business_id_idx on public.services(business_id);
create index services_business_active_idx on public.services(business_id, is_active);

create trigger services_set_updated_at
  before update on public.services
  for each row execute function app.set_updated_at();

-- -----------------------------------------------------------------------------
-- Table: staff
-- -----------------------------------------------------------------------------

create table public.staff (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null,
  photo_url text,
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint staff_name_length check (length(name) between 2 and 120)
);

comment on table public.staff is
  'Profesionales que atienden en cada comercio.';

create index staff_business_id_idx on public.staff(business_id);
create index staff_business_active_idx on public.staff(business_id, is_active);

create trigger staff_set_updated_at
  before update on public.staff
  for each row execute function app.set_updated_at();

-- -----------------------------------------------------------------------------
-- Table: staff_services (relación muchos-a-muchos)
-- -----------------------------------------------------------------------------
-- Qué servicios puede realizar cada profesional.
-- Si un profesional no tiene filas acá, se interpreta como "hace todos".

create table public.staff_services (
  staff_id uuid not null references public.staff(id) on delete cascade,
  service_id uuid not null references public.services(id) on delete cascade,
  business_id uuid not null references public.businesses(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (staff_id, service_id)
);

comment on table public.staff_services is
  'Relación entre profesionales y los servicios que pueden realizar.';

create index staff_services_business_id_idx on public.staff_services(business_id);
create index staff_services_service_id_idx on public.staff_services(service_id);

-- -----------------------------------------------------------------------------
-- Table: working_hours
-- -----------------------------------------------------------------------------
-- Horario semanal. staff_id NULL = aplica a todo el comercio.
-- Varias filas por día permiten representar pausas (ej: 09-13 y 15-19).

create table public.working_hours (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  staff_id uuid references public.staff(id) on delete cascade,
  weekday int not null,
  start_time time not null,
  end_time time not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint working_hours_weekday_range check (weekday between 0 and 6),
  constraint working_hours_time_order check (start_time < end_time)
);

comment on table public.working_hours is
  'Horario semanal del comercio o de un profesional. Varias filas por día = pausas.';

create index working_hours_business_id_idx on public.working_hours(business_id);
create index working_hours_staff_id_idx on public.working_hours(staff_id);
create index working_hours_lookup_idx on public.working_hours(business_id, staff_id, weekday);

create trigger working_hours_set_updated_at
  before update on public.working_hours
  for each row execute function app.set_updated_at();

-- -----------------------------------------------------------------------------
-- Table: time_off
-- -----------------------------------------------------------------------------
-- Bloqueos puntuales: vacaciones, feriados, ausencias, almuerzos largos.
-- staff_id NULL = bloquea a todo el comercio.

create table public.time_off (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  staff_id uuid references public.staff(id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint time_off_order check (starts_at < ends_at)
);

comment on table public.time_off is
  'Bloqueos puntuales de agenda: vacaciones, feriados, ausencias.';

create index time_off_business_id_idx on public.time_off(business_id);
create index time_off_staff_id_idx on public.time_off(staff_id);
create index time_off_range_idx on public.time_off(business_id, starts_at, ends_at);

create trigger time_off_set_updated_at
  before update on public.time_off
  for each row execute function app.set_updated_at();

-- -----------------------------------------------------------------------------
-- Trigger: validar que staff_services pertenezca al mismo comercio
-- -----------------------------------------------------------------------------
-- Evita que por error se relacione un staff de un comercio con un service
-- de otro comercio.

create or replace function app.validate_staff_service_same_business()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_staff_business uuid;
  v_service_business uuid;
begin
  select business_id into v_staff_business from public.staff where id = new.staff_id;
  select business_id into v_service_business from public.services where id = new.service_id;

  if v_staff_business is null or v_service_business is null then
    raise exception 'staff_id o service_id inexistente';
  end if;

  if v_staff_business <> v_service_business then
    raise exception 'El profesional y el servicio deben pertenecer al mismo comercio.'
      using errcode = '23514';
  end if;

  if new.business_id <> v_staff_business then
    raise exception 'business_id no coincide con el del profesional/servicio.'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

comment on function app.validate_staff_service_same_business() is
  'Trigger: asegura que staff_services no mezcle comercios distintos.';

create trigger staff_services_validate_business
  before insert or update on public.staff_services
  for each row execute function app.validate_staff_service_same_business();

-- -----------------------------------------------------------------------------
-- Trigger: validar working_hours y time_off con staff del mismo comercio
-- -----------------------------------------------------------------------------

create or replace function app.validate_staff_belongs_to_business()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_staff_business uuid;
begin
  if new.staff_id is null then
    return new;
  end if;

  select business_id into v_staff_business from public.staff where id = new.staff_id;

  if v_staff_business is null then
    raise exception 'staff_id inexistente';
  end if;

  if v_staff_business <> new.business_id then
    raise exception 'El profesional no pertenece a este comercio.'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

comment on function app.validate_staff_belongs_to_business() is
  'Trigger: valida que el staff referenciado pertenezca al comercio indicado.';

create trigger working_hours_validate_business
  before insert or update on public.working_hours
  for each row execute function app.validate_staff_belongs_to_business();

create trigger time_off_validate_business
  before insert or update on public.time_off
  for each row execute function app.validate_staff_belongs_to_business();

-- -----------------------------------------------------------------------------
-- RLS: habilitar en todas las tablas nuevas
-- -----------------------------------------------------------------------------

alter table public.services enable row level security;
alter table public.staff enable row level security;
alter table public.staff_services enable row level security;
alter table public.working_hours enable row level security;
alter table public.time_off enable row level security;