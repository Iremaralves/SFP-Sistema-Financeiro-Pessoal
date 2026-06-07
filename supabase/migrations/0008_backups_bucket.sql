-- Bucket "backups" para snapshots JSON do app.
-- Storage privado (não público). Acesso apenas via service_role ou via
-- usuários admin do household ao qual o backup pertence.
--
-- Path convention: {household_id}/{folder_name}/{file}.json
-- O folder_name é YYYYMMDD-HHmmss[-slug].

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'backups',
  'backups',
  false,
  524288000, -- 500 MB
  array['application/json']::text[]
)
on conflict (id) do nothing;

-- Limpa policies antigas (idempotente).
drop policy if exists "backups: admin read own household" on storage.objects;
drop policy if exists "backups: admin write own household" on storage.objects;
drop policy if exists "backups: admin update own household" on storage.objects;
drop policy if exists "backups: admin delete own household" on storage.objects;

-- SELECT: admins podem ler backups do próprio household
create policy "backups: admin read own household"
on storage.objects for select
to authenticated
using (
  bucket_id = 'backups'
  and exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
      and p.household_id::text = split_part(name, '/', 1)
  )
);

-- INSERT: admins podem criar backups no próprio household
create policy "backups: admin write own household"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'backups'
  and exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
      and p.household_id::text = split_part(name, '/', 1)
  )
);

-- UPDATE: admins podem sobrescrever (necessário para upsert)
create policy "backups: admin update own household"
on storage.objects for update
to authenticated
using (
  bucket_id = 'backups'
  and exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
      and p.household_id::text = split_part(name, '/', 1)
  )
);

-- DELETE: admins podem remover backups antigos do próprio household
create policy "backups: admin delete own household"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'backups'
  and exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
      and p.household_id::text = split_part(name, '/', 1)
  )
);
