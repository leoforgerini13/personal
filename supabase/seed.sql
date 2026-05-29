-- ============================================================
-- Seed data for Finanças app
--
-- IMPORTANT: Replace every occurrence of
--   '00000000-0000-0000-0000-000000000000'
-- with your actual Supabase user UUID before running.
--
-- To find your UUID: Supabase dashboard → Authentication → Users
-- ============================================================

-- ── Fixed bills (contas fixas recorrentes) ───────────────────
INSERT INTO fixed_bills (user_id, nome, valor, dia_vencimento, ativo) VALUES
  ('00000000-0000-0000-0000-000000000000', 'Financiamento',     2269.00, 10, true),
  ('00000000-0000-0000-0000-000000000000', 'Psicólogo',         1920.00, 15, true),
  ('00000000-0000-0000-0000-000000000000', 'Condomínio',         633.00,  5, true),
  ('00000000-0000-0000-0000-000000000000', 'Plano de saúde',     250.00,  1, true),
  ('00000000-0000-0000-0000-000000000000', 'Contador',           200.00, 10, true),
  ('00000000-0000-0000-0000-000000000000', 'Gympass',            140.00,  1, true),
  ('00000000-0000-0000-0000-000000000000', 'Contas Mãe',         128.00,  5, true),
  ('00000000-0000-0000-0000-000000000000', 'Claude',             115.00,  1, true),
  ('00000000-0000-0000-0000-000000000000', 'Basquete FFLCH',      60.00, 15, true),
  ('00000000-0000-0000-0000-000000000000', 'Apple',               50.00,  1, true),
  ('00000000-0000-0000-0000-000000000000', 'Nubank',              50.00,  1, true);

-- ── Installments (parceladas em andamento) ───────────────────
INSERT INTO installments (user_id, nome, valor_parcela, parcela_atual, total_parcelas, dia_da_fatura, ativo) VALUES
  ('00000000-0000-0000-0000-000000000000', 'Sousmiles',             388.00, 16, 18, 10, true),
  ('00000000-0000-0000-0000-000000000000', 'Moletom Corinthians',   250.00,  2,  2, 10, true),
  ('00000000-0000-0000-0000-000000000000', 'Lacoste',               200.00,  2,  2, 10, true);

-- ── Monthly summary — 2026 ────────────────────────────────────
-- Columns: mes, ano, entrada_total, economizado
-- (imposto_pago and fatura_cartao left NULL — update as needed)
INSERT INTO monthly_summary (user_id, mes, ano, entrada_total, economizado) VALUES
  ('00000000-0000-0000-0000-000000000000', 1, 2026, 18000.00,  2950.00),
  ('00000000-0000-0000-0000-000000000000', 2, 2026, 18000.00,  4200.00),
  ('00000000-0000-0000-0000-000000000000', 3, 2026, 20500.00,  6363.63),
  ('00000000-0000-0000-0000-000000000000', 4, 2026, 23212.00,  5760.00),
  ('00000000-0000-0000-0000-000000000000', 5, 2026, 32118.00, 20168.00),
  ('00000000-0000-0000-0000-000000000000', 6, 2026, 26500.00,  7500.00);
