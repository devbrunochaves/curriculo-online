-- ============================================================
-- CONTAS APP - Schema Supabase
-- Cole este arquivo inteiro no SQL Editor do Supabase
-- ============================================================

-- CARTÕES
CREATE TABLE IF NOT EXISTS cards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#6366f1',
  limit_amount DECIMAL(10,2),
  closing_day INTEGER,
  due_day INTEGER,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- PESSOAS
CREATE TABLE IF NOT EXISTS people (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#10b981',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- CATEGORIAS
CREATE TABLE IF NOT EXISTS categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT DEFAULT '🛒',
  color TEXT DEFAULT '#6366f1',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- LANÇAMENTOS (despesas)
CREATE TABLE IF NOT EXISTS expenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  description TEXT NOT NULL,
  card_id UUID REFERENCES cards(id) ON DELETE SET NULL,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  month_ref TEXT NOT NULL,
  is_fixed BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- DIVISÃO DOS LANÇAMENTOS
CREATE TABLE IF NOT EXISTS expense_splits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  expense_id UUID REFERENCES expenses(id) ON DELETE CASCADE,
  person_id UUID REFERENCES people(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ENTRADAS (receitas)
CREATE TABLE IF NOT EXISTS income (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  description TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  month_ref TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- HABILITAR ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE people ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_splits ENABLE ROW LEVEL SECURITY;
ALTER TABLE income ENABLE ROW LEVEL SECURITY;

-- Policies: acesso total para usuários autenticados
CREATE POLICY "Authenticated full access" ON cards FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated full access" ON people FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated full access" ON categories FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated full access" ON expenses FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated full access" ON expense_splits FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated full access" ON income FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- DADOS INICIAIS - Cartões (baseado na sua planilha atual)
-- ============================================================
INSERT INTO cards (name, color, closing_day, due_day) VALUES
  ('Nubank Bruno',    '#8B5CF6', 11, 18),
  ('Mercado Pago',    '#00B4D8',  1,  7),
  ('Caixa Bruno',     '#2563EB',  4, 11),
  ('Santander',       '#DC2626',  1,  8),
  ('Nubank Gabriela', '#EC4899', 11, 18),
  ('Itaú Click',      '#F97316',  4, 11),
  ('Itaú Azul',       '#1D4ED8',  4, 11),
  ('Caixa Gabi',      '#059669',  4, 11);

-- ============================================================
-- DADOS INICIAIS - Pessoas
-- ============================================================
INSERT INTO people (name, color) VALUES
  ('Bruno',    '#6366f1'),
  ('Gabriela', '#EC4899'),
  ('Carmem',   '#F97316'),
  ('Ivan',     '#10b981'),
  ('Diego',    '#14B8A6'),
  ('Rafael',   '#EAB308'),
  ('Fátima',   '#8B5CF6'),
  ('Didica',   '#F43F5E');

-- ============================================================
-- DADOS INICIAIS - Categorias
-- ============================================================
INSERT INTO categories (name, icon, color) VALUES
  ('Alimentação',   '🍽️', '#F97316'),
  ('Mercado',       '🛒', '#10b981'),
  ('Combustível',   '⛽', '#EAB308'),
  ('Saúde',         '💊', '#EC4899'),
  ('Moradia',       '🏠', '#6366f1'),
  ('Transporte',    '🚗', '#14B8A6'),
  ('Lazer',         '🎬', '#8B5CF6'),
  ('Assinaturas',   '📱', '#2563EB'),
  ('Vestuário',     '👕', '#F43F5E'),
  ('Educação',      '📚', '#0EA5E9'),
  ('Parcelamento',  '💳', '#64748b'),
  ('Transferência', '💸', '#71717a'),
  ('Outros',        '📦', '#94a3b8');
