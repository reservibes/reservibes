-- =============================================================================
-- Migración 005: Suscripciones, pagos, emails, notificaciones y auditoría
-- =============================================================================
-- Todo lo que queda del esquema base. La lógica de pago se activa recién
-- en la Etapa 1 (cuando empiece el cobro real), pero las tablas y estados
-- ya están listos para no tener que migrar después.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Table: plans
-- -----------------------------------------------------------------------------
-- Catálogo de planes. Los precios se cambian desde acá, sin tocar código.

create table public.plans (
  id text primary key,
  name text not null,
  description text,
  price_cents_ars int not null,
  price_cents_usd int not null,
  interval text not null default 'month',
  trial_days int not null default 15,
  features jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint plans_interval_values check (interval in ('month', 'year')),
  constraint plans_price_ars_non_negative check (price_cents_ars >= 0),
  constraint plans_price_usd_non_negative check (price_cents_usd >= 0),
  constraint plans_trial_days_range check (trial_days between 0 and 90)
);

comment on table public.plans is
  'Catálogo de planes de suscripción. Editable sin tocar código.';

create trigger plans_set_updated_at
  before update on public.plans
  for each row execute function app.set_updated_at();

-- -----------------------------------------------------------------------------
-- Table: subscriptions
-- -----------------------------------------------------------------------------
-- Estados: trialing, active, past_due, canceled, expired.
-- Un comercio puede tener una sola suscripción vigente (índice único parcial).

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  plan_id text not null references public.plans(id) on delete restrict,
  provider text not null,
  provider_subscription_id text,
  provider_customer_id text,
  status text not null default 'trialing',
  currency text not null default 'ARS',
  amount_cents int not null default 0,
  current_period_start timestamptz,
  current_period_end timestamptz,
  trial_ends_at timestamptz,
  canceled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint subscriptions_provider_values check (
    provider in ('mercadopago', 'paddle', 'manual')
  ),
  constraint subscriptions_status_values check (
    status in ('trialing', 'active', 'past_due', 'canceled', 'expired')
  ),
  constraint subscriptions_amount_non_negative check (amount_cents >= 0)
);

comment on table public.subscriptions is
  'Estado de suscripción de cada comercio. Un comercio activo por vez.';

create index subscriptions_business_id_idx on public.subscriptions(business_id);
create index subscriptions_status_idx on public.subscriptions(status);
create index subscriptions_provider_id_idx on public.subscriptions(provider, provider_subscription_id);

-- Un comercio solo puede tener una suscripción activa/trialing a la vez
create unique index subscriptions_one_active_per_business
  on public.subscriptions(business_id)
  where status in ('trialing', 'active', 'past_due');

create trigger subscriptions_set_updated_at
  before update on public.subscriptions
  for each row execute function app.set_updated_at();

-- -----------------------------------------------------------------------------
-- Table: payment_events
-- -----------------------------------------------------------------------------
-- Log crudo de webhooks. La idempotencia se garantiza con el índice único
-- (provider, provider_event_id). Si llega dos veces el mismo evento, se ignora.

create table public.payment_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  provider_event_id text not null,
  event_type text not null,
  subscription_id uuid references public.subscriptions(id) on delete set null,
  business_id uuid references public.businesses(id) on delete set null,
  payload jsonb not null,
  processed_at timestamptz,
  error text,
  created_at timestamptz not null default now(),

  constraint payment_events_provider_values check (
    provider in ('mercadopago', 'paddle', 'manual')
  )
);

comment on table public.payment_events is
  'Log crudo de eventos de pasarelas de pago. Idempotencia por (provider, provider_event_id).';

create unique index payment_events_provider_event_unique
  on public.payment_events(provider, provider_event_id);

create index payment_events_business_id_idx on public.payment_events(business_id);
create index payment_events_created_at_idx on public.payment_events(created_at desc);

-- -----------------------------------------------------------------------------
-- Table: password_recovery_tokens
-- -----------------------------------------------------------------------------
-- Clave provisoria hasheada, un solo uso, vence en 30 minutos.
-- NUNCA se guarda la clave en texto plano, solo su hash (bcrypt).

create table public.password_recovery_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  token_hash text not null,
  expires_at timestamptz not null,
  used_at timestamptz,
  requested_ip inet,
  created_at timestamptz not null default now()
);

comment on table public.password_recovery_tokens is
  'Claves provisorias de recuperación, hasheadas y de un solo uso.';

create index password_recovery_tokens_user_id_idx on public.password_recovery_tokens(user_id);
create index password_recovery_tokens_expires_at_idx on public.password_recovery_tokens(expires_at);

-- -----------------------------------------------------------------------------
-- Table: email_logs
-- -----------------------------------------------------------------------------

create table public.email_logs (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references public.businesses(id) on delete set null,
  recipient_email extensions.citext not null,
  email_type text not null,
  priority text not null,
  status text not null default 'queued',
  provider text not null default 'resend',
  provider_message_id text,
  error text,
  attempts int not null default 0,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint email_logs_priority_values check (priority in ('p1', 'p2', 'p3')),
  constraint email_logs_status_values check (
    status in ('queued', 'sending', 'sent', 'failed', 'skipped_quota')
  )
);

comment on table public.email_logs is
  'Registro de cada email enviado, con prioridad y estado.';

create index email_logs_business_id_idx on public.email_logs(business_id);
create index email_logs_status_idx on public.email_logs(status);
create index email_logs_created_at_idx on public.email_logs(created_at desc);

create trigger email_logs_set_updated_at
  before update on public.email_logs
  for each row execute function app.set_updated_at();

-- -----------------------------------------------------------------------------
-- Table: email_quota
-- -----------------------------------------------------------------------------
-- Contador diario/mensual compartido por TODA la plataforma (el tope de
-- Resend es por cuenta, no por comercio).

create table public.email_quota (
  day date primary key,
  sent_count int not null default 0,
  failed_count int not null default 0,
  skipped_count int not null default 0,
  updated_at timestamptz not null default now()
);

comment on table public.email_quota is
  'Contador de emails enviados por día. Compartido por toda la plataforma.';

create trigger email_quota_set_updated_at
  before update on public.email_quota
  for each row execute function app.set_updated_at();

-- -----------------------------------------------------------------------------
-- Table: notifications
-- -----------------------------------------------------------------------------
-- Centro de avisos dentro del panel del comercio.

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null,
  title text not null,
  body text,
  link text,
  read_at timestamptz,
  created_at timestamptz not null default now(),

  constraint notifications_type_length check (length(type) between 2 and 60)
);

comment on table public.notifications is
  'Avisos dentro del panel del comercio (nuevas reservas, cancelaciones, etc.).';

create index notifications_user_id_idx on public.notifications(user_id, read_at);
create index notifications_business_id_idx on public.notifications(business_id);
create index notifications_created_at_idx on public.notifications(created_at desc);

-- -----------------------------------------------------------------------------
-- Table: audit_logs
-- -----------------------------------------------------------------------------

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references public.businesses(id) on delete set null,
  user_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  ip inet,
  user_agent text,
  created_at timestamptz not null default now()
);

comment on table public.audit_logs is
  'Registro de acciones sensibles (login, cambios de contraseña, cambios de plan, etc.).';

create index audit_logs_business_id_idx on public.audit_logs(business_id);
create index audit_logs_user_id_idx on public.audit_logs(user_id);
create index audit_logs_created_at_idx on public.audit_logs(created_at desc);
create index audit_logs_action_idx on public.audit_logs(action);

-- -----------------------------------------------------------------------------
-- Seed inicial de planes
-- -----------------------------------------------------------------------------

insert into public.plans (id, name, description, price_cents_ars, price_cents_usd, interval, trial_days, features, sort_order)
values
  (
    'basic',
    'Básico',
    'Para empezar. Todo lo esencial para gestionar tus turnos.',
    990000,
    999,
    'month',
    15,
    '{"max_services": 20, "max_staff": 3, "emails_per_day": 200}'::jsonb,
    1
  ),
  (
    'pro',
    'Pro',
    'Para comercios en crecimiento. Más profesionales y servicios.',
    1990000,
    1999,
    'month',
    15,
    '{"max_services": 100, "max_staff": 15, "emails_per_day": 1000}'::jsonb,
    2
  );

-- -----------------------------------------------------------------------------
-- RLS: habilitar en todas las tablas nuevas
-- -----------------------------------------------------------------------------

alter table public.plans enable row level security;
alter table public.subscriptions enable row level security;
alter table public.payment_events enable row level security;
alter table public.password_recovery_tokens enable row level security;
alter table public.email_logs enable row level security;
alter table public.email_quota enable row level security;
alter table public.notifications enable row level security;
alter table public.audit_logs enable row level security;