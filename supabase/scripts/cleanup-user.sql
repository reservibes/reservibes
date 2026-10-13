-- =============================================================================
-- LIMPIEZA TOTAL DE UN USUARIO
-- =============================================================================
-- Elimina absolutamente todo lo relacionado con un email: usuario, comercios,
-- servicios, staff, clientes, reservas, suscripciones, logs y archivos.
--
-- USO:
--   1. Cambiar el email en la línea marcada abajo.
--   2. Pegar todo este bloque en el SQL Editor de Supabase.
--   3. Ejecutar.
--
-- Ejecutar con rol postgres (el SQL Editor de Supabase lo usa por defecto).
-- =============================================================================

do $$
declare
  -- ⬇️⬇️⬇️ CAMBIAR SOLO ESTA LÍNEA ⬇️⬇️⬇️
  v_email text := 'reservibes@gmail.com';
  -- ⬆️⬆️⬆️ CAMBIAR SOLO ESTA LÍNEA ⬆️⬆️⬆️

  v_user_id uuid;
  v_business_ids uuid[];
  v_storage_paths text[];
begin
  -- 1. Buscar el usuario
  select id into v_user_id from auth.users where email = v_email;

  if v_user_id is null then
    raise notice 'No existe usuario con email %.', v_email;
    return;
  end if;

  raise notice 'Usuario encontrado: % (id=%)', v_email, v_user_id;

  -- 2. Obtener business_ids del usuario
  select coalesce(array_agg(id), '{}') into v_business_ids
  from public.businesses
  where owner_id = v_user_id;

  raise notice 'Comercios a eliminar: %', array_length(v_business_ids, 1);

  -- 3. Eliminar archivos de Storage (antes de borrar businesses,
  --    porque necesitamos sus IDs para mapear las rutas)
  if array_length(v_business_ids, 1) > 0 then
    -- Business assets (logos y portadas)
    delete from storage.objects
    where bucket_id = 'business-assets'
      and (storage.foldername(name))[1] = any(v_business_ids::text[]);

    -- Staff photos
    delete from storage.objects
    where bucket_id = 'staff-photos'
      and (storage.foldername(name))[1] = any(v_business_ids::text[]);

    raise notice 'Archivos de Storage eliminados.';
  end if;

  -- 4. Eliminar email_logs (antes de borrar businesses, porque la FK
  --    es ON DELETE SET NULL y quedarían huérfanos)
  if array_length(v_business_ids, 1) > 0 then
    delete from public.email_logs
    where business_id = any(v_business_ids);
  end if;

  delete from public.email_logs where recipient_email = v_email;

  -- 5. Eliminar audit_logs
  delete from public.audit_logs where user_id = v_user_id;
  if array_length(v_business_ids, 1) > 0 then
    delete from public.audit_logs
    where business_id = any(v_business_ids);
  end if;

  -- 6. Eliminar businesses (esto borra en cascada: services, staff,
  --    staff_services, working_hours, time_off, customers, bookings,
  --    business_settings, subscriptions, notifications, slug_redirects,
  --    payment_events)
  if array_length(v_business_ids, 1) > 0 then
    delete from public.businesses where id = any(v_business_ids);
  end if;

  -- 7. Eliminar el usuario (borra en cascada: profiles,
  --    password_recovery_tokens, notifications)
  delete from auth.users where id = v_user_id;

  raise notice '✅ Limpieza completa para %.', v_email;
end $$;

-- =============================================================================
-- VERIFICACIÓN: Todas las filas deben devolver 0.
-- =============================================================================

select 'auth.users'            as tabla, count(*) from auth.users            where email = 'reservibes@gmail.com'
union all
select 'profiles',                        count(*) from public.profiles       where email = 'reservibes@gmail.com'
union all
select 'email_logs',                      count(*) from public.email_logs     where recipient_email = 'reservibes@gmail.com'
union all
select 'businesses',                      count(*) from public.businesses     where owner_id = (
  select id from auth.users where email = 'reservibes@gmail.com'
);