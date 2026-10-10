-- =============================================================================
-- Migración 004: Clientes y reservas (con anti-doble-reserva)
-- =============================================================================
-- Esta migración crea los clientes finales de cada comercio y el corazón
-- del sistema: la tabla bookings con una restricción EXCLUDE que impide
-- a nivel de base de datos que dos reservas activas se superpongan para
-- el mismo profesional.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Table: customers
-- -----------------------------------------------------------------------------
-- Clientes finales, agrupados por comercio. El mismo cliente puede existir
-- en dos comercios distintos sin problema (son independientes).

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null,
  phone text,
  email extensions.citext,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint customers_name_length check (length(name) between 2 and 120)
);

comment on table public.customers is
  'Clientes finales de cada comercio. Aislados por business_id.';

create index customers_business_id_idx on public.customers(business_id);
create index customers_phone_idx on public.customers(business_id, phone);
create index customers_email_idx on public.customers(business_id, email);

create trigger customers_set_updated_at
  before update on public.customers
  for each row execute function app.set_updated_at();

-- -----------------------------------------------------------------------------
-- Table: bookings
-- -----------------------------------------------------------------------------
-- Estados posibles:
--   pending    → esperando aprobación del comercio (modo "manual")
--   confirmed  → confirmada, bloquea el horario
--   completed  → ya atendida
--   cancelled  → cancelada, libera el horario
--   rejected   → rechazada por el comercio, libera el horario
--   no_show    → el cliente no se presentó
--
-- La restricción EXCLUDE solo considera pending y confirmed como activas.
-- Es decir: cancelled, rejected, completed y no_show NO bloquean el horario.

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete restrict,
  service_id uuid not null references public.services(id) on delete restrict,
  staff_id uuid not null references public.staff(id) on delete restrict,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status text not null default 'pending',
  notes text,
  price_cents int not null default 0,
  currency text not null default 'ARS',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint bookings_time_order check (starts_at < ends_at),
  constraint bookings_status_values check (
    status in ('pending', 'confirmed', 'completed', 'cancelled', 'rejected', 'no_show')
  ),
  constraint bookings_price_non_negative check (price_cents >= 0)
);

comment on table public.bookings is
  'Reservas de turnos. La restricción EXCLUDE evita superposiciones activas por profesional.';

create index bookings_business_id_idx on public.bookings(business_id);
create index bookings_staff_id_idx on public.bookings(staff_id);
create index bookings_customer_id_idx on public.bookings(customer_id);
create index bookings_starts_at_idx on public.bookings(business_id, starts_at);
create index bookings_status_idx on public.bookings(business_id, status);

create trigger bookings_set_updated_at
  before update on public.bookings
  for each row execute function app.set_updated_at();

-- -----------------------------------------------------------------------------
-- RESTRICCIÓN ANTI-DOBLE-RESERVA (la más importante del sistema)
-- -----------------------------------------------------------------------------
-- EXCLUDE USING gist:
--   staff_id WITH =         → solo aplica a reservas del MISMO profesional.
--   tstzrange(...) WITH &&  → rechaza si los rangos se SUPERPONEN.
-- WHERE status IN (...)     → solo considera reservas ACTIVAS.
--
-- Consecuencias:
--   - Dos reservas pending/confirmed del mismo profesional NO pueden solaparse.
--   - Al pasar a cancelled/rejected/completed/no_show, la reserva sale del
--     filtro y el horario queda libre automáticamente.
--   - Si dos clientes reservan al mismo tiempo, PostgreSQL rechaza la segunda
--     con error '23P01' (exclusion_violation) y la app muestra un mensaje claro.

alter table public.bookings
  add constraint bookings_no_overlap
  exclude using gist (
    staff_id with =,
    tstzrange(starts_at, ends_at, '[)') with &&
  )
  where (status in ('pending', 'confirmed'));

comment on constraint bookings_no_overlap on public.bookings is
  'Impide que dos reservas activas del mismo profesional se superpongan en el tiempo.';

-- -----------------------------------------------------------------------------
-- Trigger: validar que customer, service y staff pertenezcan al mismo comercio
-- -----------------------------------------------------------------------------

create or replace function app.validate_booking_same_business()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_customer_business uuid;
  v_service_business uuid;
  v_staff_business uuid;
begin
  select business_id into v_customer_business from public.customers where id = new.customer_id;
  select business_id into v_service_business from public.services where id = new.service_id;
  select business_id into v_staff_business from public.staff where id = new.staff_id;

  if v_customer_business is null or v_service_business is null or v_staff_business is null then
    raise exception 'customer_id, service_id o staff_id inexistente'
      using errcode = '23503';
  end if;

  if v_customer_business <> new.business_id
     or v_service_business <> new.business_id
     or v_staff_business <> new.business_id then
    raise exception 'Cliente, servicio y profesional deben pertenecer al mismo comercio.'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

comment on function app.validate_booking_same_business() is
  'Trigger: asegura que una reserva no mezcle entidades de comercios distintos.';

create trigger bookings_validate_business
  before insert or update on public.bookings
  for each row execute function app.validate_booking_same_business();

-- -----------------------------------------------------------------------------
-- Trigger: si la reserva pasa a completed, actualizar el precio final desde
-- el servicio (por si el precio cambió desde que se creó la reserva).
-- -----------------------------------------------------------------------------

create or replace function app.set_booking_final_price()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.status = 'completed' and old.status <> 'completed' then
    -- No tocamos price_cents ni currency: se congelan al momento de la reserva.
    -- Este trigger queda como punto de extensión para futuras reglas.
  end if;
  return new;
end;
$$;

comment on function app.set_booking_final_price() is
  'Punto de extensión para reglas al pasar una reserva a completed.';

create trigger bookings_finalize
  before update of status on public.bookings
  for each row execute function app.set_booking_final_price();

-- -----------------------------------------------------------------------------
-- RLS: habilitar en las tablas nuevas
-- -----------------------------------------------------------------------------

alter table public.customers enable row level security;
alter table public.bookings enable row level security;