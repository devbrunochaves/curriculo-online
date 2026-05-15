-- ============================================================
-- CRM BBold — Schema Supabase
-- Cole este arquivo inteiro no SQL Editor do Supabase
-- ============================================================

-- CLIENTES
CREATE TABLE IF NOT EXISTS crm_clientes (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome         TEXT NOT NULL,
  empresa      TEXT,
  nicho        TEXT,
  whatsapp     TEXT,
  email        TEXT,
  status       TEXT DEFAULT 'lead', -- lead, ativo, pausado, encerrado
  notas        TEXT,
  avatar_color TEXT DEFAULT '#f59e0b',
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- CONTRATOS (serviços por cliente)
CREATE TABLE IF NOT EXISTS crm_contratos (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente_id      UUID REFERENCES crm_clientes(id) ON DELETE CASCADE,
  servico         TEXT NOT NULL, -- social_media, trafego_pago, design, site, gmn, gestao_marca
  valor_mensal    DECIMAL(10,2) DEFAULT 0,
  data_inicio     DATE,
  data_renovacao  DATE,
  status          TEXT DEFAULT 'ativo', -- ativo, pausado, encerrado
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ENTREGAS (kanban de tarefas)
CREATE TABLE IF NOT EXISTS crm_entregas (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente_id UUID REFERENCES crm_clientes(id) ON DELETE CASCADE,
  servico    TEXT,
  tipo       TEXT,
  titulo     TEXT NOT NULL,
  status     TEXT DEFAULT 'planejado', -- planejado, em_andamento, revisao, concluido
  prazo      DATE,
  notas      TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- COBRANÇAS (financeiro mensal)
CREATE TABLE IF NOT EXISTS crm_cobrancas (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente_id      UUID REFERENCES crm_clientes(id) ON DELETE CASCADE,
  mes_ref         TEXT NOT NULL, -- formato: 'YYYY-MM'
  valor           DECIMAL(10,2) DEFAULT 0,
  status          TEXT DEFAULT 'aguardando', -- aguardando, pago, atraso
  data_pagamento  DATE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE crm_clientes  ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_contratos ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_entregas  ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_cobrancas ENABLE ROW LEVEL SECURITY;

-- Acesso total apenas para usuários autenticados
CREATE POLICY "crm_clientes_auth"  ON crm_clientes  FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "crm_contratos_auth" ON crm_contratos FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "crm_entregas_auth"  ON crm_entregas  FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "crm_cobrancas_auth" ON crm_cobrancas FOR ALL TO authenticated USING (true) WITH CHECK (true);
