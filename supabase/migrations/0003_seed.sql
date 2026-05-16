-- ─── Seed: household + accounts + rules ───────────────────────────────────────
-- Execute after schema + RLS.
-- Replace the UUIDs below after first run (or use your real Supabase project).

-- NOTE: This seed creates a household with known IDs for development.
-- In production, the signup flow creates household + profile automatically.

do $$
declare
  hh_id uuid := 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'::uuid;
  acc_card uuid := 'b2c3d4e5-f6a7-8901-bcde-f12345678901'::uuid;
  acc_iremar uuid := 'c3d4e5f6-a7b8-9012-cdef-012345678902'::uuid;
  acc_juliana uuid := 'd4e5f6a7-b8c9-0123-def0-123456789003'::uuid;
  acc_i2 uuid := 'e5f6a7b8-c9d0-1234-ef01-234567890004'::uuid;
begin

-- Household
insert into households (id, name) values (hh_id, 'Iremar & Juliana')
  on conflict (id) do nothing;

-- Accounts
insert into accounts (id, household_id, name, kind) values
  (acc_card,    hh_id, 'Cartão Nubank',     'credit_card'),
  (acc_iremar,  hh_id, 'Conta Iremar',      'checking'),
  (acc_juliana, hh_id, 'Conta Juliana',     'checking'),
  (acc_i2,      hh_id, 'i2 Soluções',       'company')
on conflict (id) do nothing;

-- Categorization rules (seed — ver §6.4 do brief)
insert into categorization_rules (household_id, match_pattern, responsible, confidence) values
  (hh_id, 'klingai',                    'i2',      1.0),
  (hh_id, 'freepik',                    'i2',      1.0),
  (hh_id, 'claude\.ai|claude ai',       'i2',      1.0),
  (hh_id, 'google workspace|google one','i2',      1.0),
  (hh_id, 'apple\.com|apple com',       'i2',      1.0),
  (hh_id, 'digitalocean|github|vercel', 'i2',      1.0),
  (hh_id, 'netflix',                    'casal',   1.0),
  (hh_id, 'amazon prime',               'casal',   1.0),
  (hh_id, 'amazon',                     'casal',   0.9),
  (hh_id, 'iof:intl',                   'i2',      0.9),
  (hh_id, 'premmia',                    'casal',   0.9),
  (hh_id, 'drogasil|farmacia|droga',    'casal',   0.7),
  (hh_id, 'atacadao',                   'juliana', 0.8),
  (hh_id, 'acto academia|academia',     'iremar',  0.7),
  (hh_id, 'cinemark|cinema',            'casal',   0.8),
  (hh_id, 'escola|educacao|colegio',    'iremar',  0.9),
  (hh_id, 'pac academia',               'iremar',  0.9)
on conflict (household_id, match_pattern) do update
  set responsible = excluded.responsible,
      confidence = excluded.confidence;

-- Recurring commitments — Iremar pessoais
insert into recurring_commitments (household_id, description, amount, responsible, account_id, due_day) values
  (hh_id, 'Escola Helena',   1393.00, 'iremar', acc_iremar, 5),
  (hh_id, 'Escola Isabela',   950.00, 'iremar', acc_iremar, 19),
  (hh_id, 'Condomínio',       250.00, 'iremar', acc_iremar, 10),
  (hh_id, 'IPTU',             119.35, 'iremar', acc_iremar, 10),
  (hh_id, 'Terapia',          220.00, 'iremar', acc_iremar, 10),
  (hh_id, 'IPVA',             128.01, 'iremar', acc_iremar, 15),
  (hh_id, 'Internet',         100.00, 'iremar', acc_iremar, 20),
  (hh_id, 'Seguro carro',     246.00, 'iremar', acc_iremar, 28)
on conflict do nothing;

-- Recurring commitments — i2 obrigações
insert into recurring_commitments (household_id, description, amount, responsible, account_id, due_day, notes) values
  (hh_id, 'Pagamentos PJ + Pró-labore', 8550.00, 'i2', acc_i2, 5, '7 colaboradores'),
  (hh_id, 'INSS',                        550.00, 'i2', acc_i2, 20, 'DARF pró-labore'),
  (hh_id, 'DAS Simples Nacional',        2600.21, 'i2', acc_i2, 20, 'Valor estimado')
on conflict do nothing;

end $$;
