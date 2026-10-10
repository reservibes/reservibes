-- =============================================================================
-- Migración 001: Extensiones y funciones utilitarias
-- =============================================================================
-- Esta migración crea las bases sobre las que se construirá el resto del
-- esquema. No crea tablas de negocio todavía; solo habilita capacidades
-- y funciones que las migraciones posteriores usarán.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Extensiones requeridas
-- -----------------------------------------------------------------------------

-- btree_gist: permite combinar tipos escalares (uuid, text, etc.) con rangos
-- en un índice GiST. Es IMPRESCINDIBLE para la restricción anti-doble-reserva
-- que usa EXCLUDE USING gist (staff_id WITH =, time_range WITH &&).
create extension if not exists btree_gist with schema extensions;

-- pgcrypto: provee gen_random_uuid() y funciones de hashing (crypt, gen_salt).
-- La usaremos para generar IDs únicos y para hashear claves provisorias de
-- recuperación de contraseña.
create extension if not exists pgcrypto with schema extensions;

-- citext: tipo de dato "case-insensitive text". Útil para emails y slugs,
-- para que "Usuario@X.com" y "usuario@x.com" se consideren iguales en
-- comparaciones e índices únicos.
create extension if not exists citext with schema extensions;

-- -----------------------------------------------------------------------------
-- Esquema para utilidades propias
-- -----------------------------------------------------------------------------
-- Mantener las funciones propias en un esquema separado evita colisiones
-- con funciones de extensiones y facilita su identificación.

create schema if not exists app;

comment on schema app is 'Esquema para funciones y utilidades propias de Reservibes.';

-- -----------------------------------------------------------------------------
-- Función: actualizar automáticamente updated_at
-- -----------------------------------------------------------------------------
-- Uso: se asigna como trigger BEFORE UPDATE en cualquier tabla que tenga
-- columnas created_at y updated_at. Así nunca hay que acordarse de
-- actualizar updated_at manualmente.

create or replace function app.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

comment on function app.set_updated_at() is
  'Trigger function: actualiza updated_at = now() en cada UPDATE.';

-- -----------------------------------------------------------------------------
-- Función: validar formato de slug
-- -----------------------------------------------------------------------------
-- Reglas del slug (deben coincidir con la validación de la capa core):
--   - Solo minúsculas, números y guiones.
--   - No puede empezar ni terminar con guión.
--   - Longitud entre 3 y 40 caracteres.

create or replace function app.is_valid_slug(candidate text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select
    candidate is not null
    and length(candidate) between 3 and 40
    and candidate ~ '^[a-z0-9]([a-z0-9-]*[a-z0-9])?$';
$$;

comment on function app.is_valid_slug(text) is
  'Valida que un slug cumpla las reglas de Reservibes (minúsculas, números, guiones, 3-40 chars).';

-- -----------------------------------------------------------------------------
-- Lista de slugs reservados
-- -----------------------------------------------------------------------------
-- Estos slugs no pueden ser usados por ningún comercio porque chocarían
-- con rutas del sistema (/admin, /api, /login, etc.).

create table app.reserved_slugs (
  slug text primary key,
  reason text not null
);

comment on table app.reserved_slugs is
  'Slugs que ningún comercio puede usar porque colisionan con rutas del sistema.';

insert into app.reserved_slugs (slug, reason) values
  ('admin',       'Ruta del panel de administración'),
  ('api',         'Rutas de API del sistema'),
  ('login',       'Ruta de inicio de sesión'),
  ('logout',      'Ruta de cierre de sesión'),
  ('registro',    'Ruta de registro'),
  ('signup',      'Ruta de registro (inglés)'),
  ('signin',      'Ruta de inicio de sesión (inglés)'),
  ('precios',     'Página de precios'),
  ('pricing',     'Página de precios (inglés)'),
  ('terminos',    'Página de términos y condiciones'),
  ('terms',       'Página de términos (inglés)'),
  ('privacidad',  'Página de política de privacidad'),
  ('privacy',     'Página de privacidad (inglés)'),
  ('reembolsos',  'Página de política de reembolsos'),
  ('refunds',     'Página de reembolsos (inglés)'),
  ('ayuda',       'Página de ayuda'),
  ('help',        'Página de ayuda (inglés)'),
  ('soporte',     'Página de soporte'),
  ('support',     'Página de soporte (inglés)'),
  ('contacto',    'Página de contacto'),
  ('contact',     'Página de contacto (inglés)'),
  ('blog',        'Blog'),
  ('docs',        'Documentación'),
  ('status',      'Estado del sistema'),
  ('_next',       'Ruta interna de Next.js'),
  ('static',      'Ruta interna de Next.js'),
  ('favicon.ico', 'Recurso del navegador'),
  ('robots.txt',  'Recurso de SEO'),
  ('sitemap.xml', 'Recurso de SEO'),
  ('manifest.json', 'Recurso de PWA'),
  ('apple-touch-icon.png', 'Recurso de iOS'),
  ('icon',        'Recurso interno'),
  ('images',      'Recurso interno'),
  ('assets',      'Recurso interno'),
  ('public',      'Recurso interno'),
  ('www',         'Subdominio reservado'),
  ('mail',        'Subdominio reservado'),
  ('email',       'Subdominio reservado'),
  ('smtp',        'Subdominio reservado'),
  ('ftp',         'Subdominio reservado'),
  ('cpanel',      'Subdominio reservado'),
  ('webmail',     'Subdominio reservado'),
  ('ns1',         'Subdominio reservado'),
  ('ns2',         'Subdominio reservado'),
  ('reservibes',  'Nombre de la plataforma');