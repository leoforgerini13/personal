-- ============================================================
-- Migration: 001_initial
-- Creates the core tables for the Finanças app and enables RLS.
-- ============================================================

-- ── transactions ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS transactions (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  data             date NOT NULL,
  tipo             text NOT NULL CHECK (tipo IN ('entrada', 'saida')),
  valor            numeric(12, 2) NOT NULL,
  categoria        text,
  descricao        text,
  forma_pagamento  text CHECK (forma_pagamento IN ('dinheiro_pix', 'cartao')),
  criado_em        timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own transactions"
  ON transactions
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ── fixed_bills ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS fixed_bills (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  nome             text NOT NULL,
  valor            numeric(12, 2) NOT NULL,
  dia_vencimento   int,
  ativo            bool NOT NULL DEFAULT true
);

ALTER TABLE fixed_bills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own fixed_bills"
  ON fixed_bills
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ── installments ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS installments (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  nome             text NOT NULL,
  valor_parcela    numeric(12, 2) NOT NULL,
  parcela_atual    int NOT NULL,
  total_parcelas   int NOT NULL,
  dia_da_fatura    int,
  ativo            bool NOT NULL DEFAULT true
);

ALTER TABLE installments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own installments"
  ON installments
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ── monthly_summary ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS monthly_summary (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  mes              int NOT NULL,
  ano              int NOT NULL,
  entrada_total    numeric(12, 2),
  economizado      numeric(12, 2),
  imposto_pago     numeric(12, 2),
  fatura_cartao    numeric(12, 2),
  created_at       timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, mes, ano)
);

ALTER TABLE monthly_summary ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own monthly_summary"
  ON monthly_summary
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ── savings ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS savings (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  data             date NOT NULL,
  tipo             text NOT NULL CHECK (tipo IN ('aporte', 'resgate')),
  valor            numeric(12, 2) NOT NULL,
  descricao        text,
  criado_em        timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE savings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own savings"
  ON savings
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
