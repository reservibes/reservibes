-- =============================================================================
-- Migración 008: Permisos sobre el esquema app
-- =============================================================================
-- Los roles anon, authenticated y service_role necesitan USAGE sobre el
-- esquema app para poder invocar las funciones helper desde constraints,
-- triggers y políticas RLS.
-- =============================================================================

-- USAGE del esquema app para todos los roles relevantes
grant usage on schema app to anon, authenticated, service_role;

-- EXECUTE en todas las funciones actuales del esquema app
grant execute on all functions in schema app to anon, authenticated, service_role;

-- Por si en el futuro se agregan funciones nuevas al esquema app,
-- hacemos que los permisos se apliquen automáticamente
alter default privileges in schema app
  grant execute on functions to anon, authenticated, service_role;

-- Lectura de la tabla de slugs reservados (usada por el trigger de validación)
grant select on app.reserved_slugs to anon, authenticated, service_role;