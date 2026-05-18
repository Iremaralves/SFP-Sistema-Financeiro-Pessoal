-- ── Tabela: fiscal_notes ───────────────────────────────────────────────────
-- Notas Fiscais vinculadas aos recebimentos (income_records) da i2 Soluções.
-- Suporta upload de PDF via Supabase Storage.

create table if not exists fiscal_notes (
  id               uuid primary key default gen_random_uuid(),
  household_id     uuid not null references households(id) on delete cascade,
  income_record_id uuid not null references income_records(id) on delete cascade,

  -- Dados principais da NF
  nf_number        text not null,              -- ex: "000042"
  nf_amount        numeric(10,2) not null,      -- valor bruto da nota
  nf_issued_at     date not null,               -- data de emissão
  competencia      text,                        -- "2026-05" (mês do serviço)
  tomador          text,                        -- razão social do cliente/tomador

  -- Tributos (opcionais)
  aliquota_iss     numeric(5,2),               -- % ISS (ex: 2.00)
  iss_amount       numeric(10,2),              -- R$ ISS retido
  net_amount       numeric(10,2),              -- nf_amount - iss_amount

  -- Arquivo PDF (Supabase Storage)
  file_url         text,                        -- URL pública ou signed URL
  file_path        text,                        -- path interno para deleção

  notes            text,                        -- observações livres
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

-- Índices
create index if not exists fiscal_notes_household_idx
  on fiscal_notes (household_id);
create index if not exists fiscal_notes_income_record_idx
  on fiscal_notes (income_record_id);

-- RLS
alter table fiscal_notes enable row level security;

create policy "Users see own household fiscal notes"
  on fiscal_notes for select
  using (household_id = get_my_household_id());

create policy "Admin can insert fiscal notes"
  on fiscal_notes for insert
  with check (
    household_id = get_my_household_id()
    and get_my_role() = 'admin'
  );

create policy "Admin can update fiscal notes"
  on fiscal_notes for update
  using (
    household_id = get_my_household_id()
    and get_my_role() = 'admin'
  );

create policy "Admin can delete fiscal notes"
  on fiscal_notes for delete
  using (
    household_id = get_my_household_id()
    and get_my_role() = 'admin'
  );

-- ── Storage Bucket: fiscal-notes ───────────────────────────────────────────
-- Execute este bloco via Supabase Dashboard → Storage → New bucket
-- ou via API. A migration SQL não cria buckets diretamente.
--
-- Nome: fiscal-notes
-- Público: NÃO (acesso via signed URLs de 60 minutos)
-- Path convention: {household_id}/{income_record_id}/{nf_number}_{timestamp}.pdf
