-- =============================================================================
-- Migración 006: Políticas RLS (aislamiento multi-tenant)
-- =============================================================================
-- Reglas que garantizan:
--   1. Cada usuario solo ve/edita SU perfil.
--   2. Cada comercio solo ve/edita SUS datos (servicios, staff, reservas, etc.).
--   3. El público (anon) solo ve lo necesario para reservar en una Booking Page.
--   4. La service_role ignora RLS (por diseño de Supabase).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Helpers
-- -----------------------------------------------------------------------------

-- Devuelve true si el usuario actual es dueño del comercio indicado.
create or replace function app.is_business_owner(business_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.businesses b
    where b.id = business_id
      and b.owner_id = auth.uid()
  );
$$;

comment on function app.is_business_owner(uuid) is
  'Devuelve true si auth.uid() es el dueño del comercio indicado.';

-- Devuelve true si el usuario actual tiene acceso a la reserva indicada.
create or replace function app.is_booking_of_my_business(booking_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.bookings bk
    join public.businesses b on b.id = bk.business_id
    where bk.id = booking_id
      and b.owner_id = auth.uid()
  );
$$;

comment on function app.is_booking_of_my_business(uuid) is
  'Devuelve true si la reserva pertenece a un comercio del usuario actual.';

-- Devuelve el business_id del comercio del usuario actual (o null).
create or replace function app.my_business_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select b.id
  from public.businesses b
  where b.owner_id = auth.uid()
  limit 1;
$$;

comment on function app.my_business_id() is
  'Devuelve el id del comercio del usuario actual (o null si no tiene).';

-- -----------------------------------------------------------------------------
-- Grants: permitir a anon y authenticated ejecutar los helpers
-- -----------------------------------------------------------------------------

grant execute on function app.is_business_owner(uuid) to anon, authenticated;
grant execute on function app.is_booking_of_my_business(uuid) to authenticated;
grant execute on function app.my_business_id() to authenticated;

-- -----------------------------------------------------------------------------
-- profiles
-- -----------------------------------------------------------------------------
-- Cada usuario solo ve y edita su propio perfil.

create policy "profiles_select_own"
  on public.profiles for select
  to authenticated
  using (id = auth.uid());

create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- -----------------------------------------------------------------------------
-- businesses
-- -----------------------------------------------------------------------------
-- El dueño ve/edita su comercio. El público ve solo comercios activos
-- (para mostrar su Booking Page). El INSERT lo hace el propio usuario
-- autenticado (se vuelve dueño).

create policy "businesses_select_public"
  on public.businesses for select
  to anon, authenticated
  using (status in ('active', 'trial_expired'));

create policy "businesses_select_own"
  on public.businesses for select
  to authenticated
  using (owner_id = auth.uid());

create policy "businesses_insert_own"
  on public.businesses for insert
  to authenticated
  with check (owner_id = auth.uid());

create policy "businesses_update_own"
  on public.businesses for update
  to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy "businesses_delete_own"
  on public.businesses for delete
  to authenticated
  using (owner_id = auth.uid());

-- -----------------------------------------------------------------------------
-- business_settings
-- -----------------------------------------------------------------------------

create policy "business_settings_select_public"
  on public.business_settings for select
  to anon, authenticated
  using (
    exists (
      select 1 from public.businesses b
      where b.id = business_id
        and b.status in ('active', 'trial_expired')
    )
  );

create policy "business_settings_select_own"
  on public.business_settings for select
  to authenticated
  using (app.is_business_owner(business_id));

create policy "business_settings_update_own"
  on public.business_settings for update
  to authenticated
  using (app.is_business_owner(business_id))
  with check (app.is_business_owner(business_id));

-- -----------------------------------------------------------------------------
-- slug_redirects
-- -----------------------------------------------------------------------------
-- Público para redirigir visitas al slug nuevo.

create policy "slug_redirects_select_public"
  on public.slug_redirects for select
  to anon, authenticated
  using (true);

create policy "slug_redirects_manage_own"
  on public.slug_redirects for all
  to authenticated
  using (app.is_business_owner(business_id))
  with check (app.is_business_owner(business_id));

-- -----------------------------------------------------------------------------
-- services
-- -----------------------------------------------------------------------------
-- Público ve los activos (para Booking Page). El dueño gestiona todos.

create policy "services_select_public_active"
  on public.services for select
  to anon, authenticated
  using (
    is_active = true
    and exists (
      select 1 from public.businesses b
      where b.id = business_id
        and b.status in ('active', 'trial_expired')
    )
  );

create policy "services_select_own"
  on public.services for select
  to authenticated
  using (app.is_business_owner(business_id));

create policy "services_insert_own"
  on public.services for insert
  to authenticated
  with check (app.is_business_owner(business_id));

create policy "services_update_own"
  on public.services for update
  to authenticated
  using (app.is_business_owner(business_id))
  with check (app.is_business_owner(business_id));

create policy "services_delete_own"
  on public.services for delete
  to authenticated
  using (app.is_business_owner(business_id));

-- -----------------------------------------------------------------------------
-- staff
-- -----------------------------------------------------------------------------

create policy "staff_select_public_active"
  on public.staff for select
  to anon, authenticated
  using (
    is_active = true
    and exists (
      select 1 from public.businesses b
      where b.id = business_id
        and b.status in ('active', 'trial_expired')
    )
  );

create policy "staff_select_own"
  on public.staff for select
  to authenticated
  using (app.is_business_owner(business_id));

create policy "staff_insert_own"
  on public.staff for insert
  to authenticated
  with check (app.is_business_owner(business_id));

create policy "staff_update_own"
  on public.staff for update
  to authenticated
  using (app.is_business_owner(business_id))
  with check (app.is_business_owner(business_id));

create policy "staff_delete_own"
  on public.staff for delete
  to authenticated
  using (app.is_business_owner(business_id));

-- -----------------------------------------------------------------------------
-- staff_services
-- -----------------------------------------------------------------------------

create policy "staff_services_select_public"
  on public.staff_services for select
  to anon, authenticated
  using (
    exists (
      select 1 from public.businesses b
      where b.id = business_id
        and b.status in ('active', 'trial_expired')
    )
  );

create policy "staff_services_manage_own"
  on public.staff_services for all
  to authenticated
  using (app.is_business_owner(business_id))
  with check (app.is_business_owner(business_id));

-- -----------------------------------------------------------------------------
-- working_hours
-- -----------------------------------------------------------------------------

create policy "working_hours_select_public"
  on public.working_hours for select
  to anon, authenticated
  using (
    exists (
      select 1 from public.businesses b
      where b.id = business_id
        and b.status in ('active', 'trial_expired')
    )
  );

create policy "working_hours_manage_own"
  on public.working_hours for all
  to authenticated
  using (app.is_business_owner(business_id))
  with check (app.is_business_owner(business_id));

-- -----------------------------------------------------------------------------
-- time_off
-- -----------------------------------------------------------------------------

create policy "time_off_select_public"
  on public.time_off for select
  to anon, authenticated
  using (
    exists (
      select 1 from public.businesses b
      where b.id = business_id
        and b.status in ('active', 'trial_expired')
    )
  );

create policy "time_off_manage_own"
  on public.time_off for all
  to authenticated
  using (app.is_business_owner(business_id))
  with check (app.is_business_owner(business_id));

-- -----------------------------------------------------------------------------
-- customers
-- -----------------------------------------------------------------------------
-- Solo el dueño del comercio ve sus clientes. Nunca son públicos.
-- Los crea el servidor (service_role) cuando alguien reserva.

create policy "customers_select_own"
  on public.customers for select
  to authenticated
  using (app.is_business_owner(business_id));

create policy "customers_update_own"
  on public.customers for update
  to authenticated
  using (app.is_business_owner(business_id))
  with check (app.is_business_owner(business_id));

create policy "customers_delete_own"
  on public.customers for delete
  to authenticated
  using (app.is_business_owner(business_id));

-- -----------------------------------------------------------------------------
-- bookings
-- -----------------------------------------------------------------------------
-- El dueño ve/gestiona las reservas de su comercio.
-- El público NO puede insertar directo: se hace vía RPC controlada.

create policy "bookings_select_own"
  on public.bookings for select
  to authenticated
  using (app.is_business_owner(business_id));

create policy "bookings_update_own"
  on public.bookings for update
  to authenticated
  using (app.is_business_owner(business_id))
  with check (app.is_business_owner(business_id));

create policy "bookings_delete_own"
  on public.bookings for delete
  to authenticated
  using (app.is_business_owner(business_id));

-- -----------------------------------------------------------------------------
-- plans
-- -----------------------------------------------------------------------------
-- Catálogo público de planes.

create policy "plans_select_public"
  on public.plans for select
  to anon, authenticated
  using (is_active = true);

-- -----------------------------------------------------------------------------
-- subscriptions
-- -----------------------------------------------------------------------------
-- Solo el dueño ve su suscripción. Nunca es pública.

create policy "subscriptions_select_own"
  on public.subscriptions for select
  to authenticated
  using (app.is_business_owner(business_id));

-- -----------------------------------------------------------------------------
-- payment_events
-- -----------------------------------------------------------------------------
-- Sin políticas para anon/authenticated → solo service_role accede.

-- -----------------------------------------------------------------------------
-- password_recovery_tokens
-- -----------------------------------------------------------------------------
-- Sin políticas para anon/authenticated → solo service_role accede.

-- -----------------------------------------------------------------------------
-- email_logs
-- -----------------------------------------------------------------------------
-- Solo el dueño ve los emails de su comercio.

create policy "email_logs_select_own"
  on public.email_logs for select
  to authenticated
  using (
    business_id is not null
    and app.is_business_owner(business_id)
  );

-- -----------------------------------------------------------------------------
-- email_quota
-- -----------------------------------------------------------------------------
-- Sin políticas para anon/authenticated → solo service_role accede.

-- -----------------------------------------------------------------------------
-- notifications
-- -----------------------------------------------------------------------------

create policy "notifications_select_own"
  on public.notifications for select
  to authenticated
  using (user_id = auth.uid());

create policy "notifications_update_own"
  on public.notifications for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "notifications_delete_own"
  on public.notifications for delete
  to authenticated
  using (user_id = auth.uid());

-- -----------------------------------------------------------------------------
-- audit_logs
-- -----------------------------------------------------------------------------
-- Solo el dueño ve los logs de su comercio.

create policy "audit_logs_select_own"
  on public.audit_logs for select
  to authenticated
  using (
    business_id is not null
    and app.is_business_owner(business_id)
  );