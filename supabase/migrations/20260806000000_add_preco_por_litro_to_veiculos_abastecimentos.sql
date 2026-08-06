-- Adiciona campo para armazenar o preço por litro informado no abastecimento.
-- O valor de litros já é calculado automaticamente (valor / preco_por_litro)
-- antes do INSERT, portanto registros antigos sem preço ficam com NULL.
--
-- Esta coluna não afeta RLS, policies, triggers, índices ou outras tabelas.

ALTER TABLE veiculos_abastecimentos
  ADD COLUMN IF NOT EXISTS preco_por_litro numeric;
