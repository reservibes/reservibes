-- =============================================================================
-- Migración 007: Storage buckets para logos, portadas y fotos
-- =============================================================================
-- Crea dos buckets públicos para servir imágenes sin autenticación:
--   - business-assets: logos y portadas de los comercios
--   - staff-photos:    fotos de los profesionales
--
-- Lectura: pública (cualquiera con la URL puede ver la imagen).
-- Escritura: solo el dueño del comercio, y solo dentro de su carpeta.
--
-- Convención de rutas:
--   business-assets/{business_id}/logo.webp
--   business-assets/{business_id}/cover.webp
--   staff-photos/{business_id}/{staff_id}.webp
--
-- El primer nivel de carpeta SIEMPRE es el business_id. Esto permite que las
-- políticas de Storage validen la propiedad de forma simple.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Bucket: business-assets
-- -----------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'business-assets',
  'business-assets',
  true,
  2 * 1024 * 1024,
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- -----------------------------------------------------------------------------
-- Bucket: staff-photos
-- -----------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'staff-photos',
  'staff-photos',
  true,
  2 * 1024 * 1024,
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- -----------------------------------------------------------------------------
-- Helper: extraer el business_id (primer segmento) de una ruta de Storage
-- -----------------------------------------------------------------------------
-- Ej: 'pxlejrluunpdbuxghlen/logo.webp' → 'pxlejrluunpdbuxghlen'

create or replace function app.storage_path_business_id(object_name text)
returns uuid
language plpgsql
immutable
set search_path = ''
as $$
declare
  v_first_segment text;
begin
  v_first_segment := split_part(object_name, '/', 1);

  -- Validación defensiva: si no es un uuid válido, devolvemos null
  begin
    return v_first_segment::uuid;
  exception when others then
    return null;
  end;
end;
$$;

comment on function app.storage_path_business_id(text) is
  'Extrae el business_id del primer segmento de una ruta de Storage.';

grant execute on function app.storage_path_business_id(text) to anon, authenticated;

-- -----------------------------------------------------------------------------
-- Políticas de Storage: business-assets
-- -----------------------------------------------------------------------------
-- Lectura: pública (bucket marcado como public).
-- Escritura: solo el dueño del comercio, y solo en su propia carpeta.

create policy "business_assets_select_public"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'business-assets');

create policy "business_assets_insert_own"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'business-assets'
    and app.is_business_owner(app.storage_path_business_id(name))
  );

create policy "business_assets_update_own"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'business-assets'
    and app.is_business_owner(app.storage_path_business_id(name))
  )
  with check (
    bucket_id = 'business-assets'
    and app.is_business_owner(app.storage_path_business_id(name))
  );

create policy "business_assets_delete_own"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'business-assets'
    and app.is_business_owner(app.storage_path_business_id(name))
  );

-- -----------------------------------------------------------------------------
-- Políticas de Storage: staff-photos
-- -----------------------------------------------------------------------------

create policy "staff_photos_select_public"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'staff-photos');

create policy "staff_photos_insert_own"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'staff-photos'
    and app.is_business_owner(app.storage_path_business_id(name))
  );

create policy "staff_photos_update_own"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'staff-photos'
    and app.is_business_owner(app.storage_path_business_id(name))
  )
  with check (
    bucket_id = 'staff-photos'
    and app.is_business_owner(app.storage_path_business_id(name))
  );

create policy "staff_photos_delete_own"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'staff-photos'
    and app.is_business_owner(app.storage_path_business_id(name))
  );