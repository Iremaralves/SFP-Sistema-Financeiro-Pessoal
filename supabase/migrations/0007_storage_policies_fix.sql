-- P0-01: Corrigir policies do bucket fiscal-notes para isolamento por household_id
-- Antes: qualquer usuário autenticado podia acessar PDFs de qualquer household
-- Depois: apenas usuários do mesmo household podem acessar seus próprios arquivos
-- O path dos arquivos é: {household_id}/{income_record_id}/{filename}
-- Isolamento via: (storage.foldername(name))[1] = get_my_household_id()::text

-- Remove policies antigas (sem isolamento)
drop policy if exists "Authenticated users can upload fiscal notes" on storage.objects;
drop policy if exists "Authenticated users can read fiscal notes" on storage.objects;
drop policy if exists "Authenticated users can update fiscal notes" on storage.objects;
drop policy if exists "Authenticated users can delete fiscal notes" on storage.objects;

-- Policy de SELECT: só lê arquivos do próprio household
create policy "Users can read own household fiscal notes"
  on storage.objects for select
  using (
    bucket_id = 'fiscal-notes'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = get_my_household_id()::text
  );

-- Policy de INSERT: só faz upload na pasta do próprio household
create policy "Users can upload own household fiscal notes"
  on storage.objects for insert
  with check (
    bucket_id = 'fiscal-notes'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = get_my_household_id()::text
  );

-- Policy de UPDATE: só atualiza arquivos do próprio household
create policy "Users can update own household fiscal notes"
  on storage.objects for update
  using (
    bucket_id = 'fiscal-notes'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = get_my_household_id()::text
  )
  with check (
    bucket_id = 'fiscal-notes'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = get_my_household_id()::text
  );

-- Policy de DELETE: só remove arquivos do próprio household
create policy "Users can delete own household fiscal notes"
  on storage.objects for delete
  using (
    bucket_id = 'fiscal-notes'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = get_my_household_id()::text
  );

-- P0-01b: Corrigir policy UPDATE de fiscal_notes (faltava WITH CHECK)
drop policy if exists "Users can update own fiscal notes" on fiscal_notes;

create policy "Users can update own fiscal notes"
  on fiscal_notes for update
  using (household_id = get_my_household_id())
  with check (household_id = get_my_household_id());
