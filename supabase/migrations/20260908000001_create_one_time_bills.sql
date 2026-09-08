-- Contas Avulsas: contas de valor variável para um mês específico
create table if not exists one_time_bills (
  id          uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces(id) on delete cascade,
  name        text        not null,
  amount      numeric(12,2) not null default 0,
  month_ref   text        not null,  -- 'yyyy-MM'
  paid        boolean     not null default false,
  paid_at     date,
  notes       text,
  created_at  timestamptz not null default now()
);

-- Divisão por pessoa (igual ao padrão bill_entry_splits)
create table if not exists one_time_bill_splits (
  id              uuid primary key default gen_random_uuid(),
  bill_id         uuid not null references one_time_bills(id) on delete cascade,
  person_id       uuid not null references people(id) on delete cascade,
  amount          numeric(12,2) not null default 0,
  created_at      timestamptz not null default now()
);

-- Índices
create index if not exists one_time_bills_month_ref_idx       on one_time_bills(month_ref);
create index if not exists one_time_bills_workspace_idx       on one_time_bills(workspace_id);
create index if not exists one_time_bill_splits_bill_id_idx   on one_time_bill_splits(bill_id);
create index if not exists one_time_bill_splits_person_id_idx on one_time_bill_splits(person_id);
