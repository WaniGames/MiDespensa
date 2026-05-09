-- =====================================================
-- miDespensa v2 — Migración de base de datos
-- Ejecutar en Supabase > SQL Editor
-- =====================================================

-- 1. Añadir fecha de caducidad a productos existentes
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS expiry_date date DEFAULT NULL;

-- 2. Crear tabla de lista de la compra manual
CREATE TABLE IF NOT EXISTS shopping_list (
  id          text        PRIMARY KEY,
  pantry_id   text        NOT NULL REFERENCES pantries(id) ON DELETE CASCADE,
  name        text        NOT NULL,
  emoji       text        NOT NULL DEFAULT '📦',
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- 3. Índice para acelerar consultas por despensa
CREATE INDEX IF NOT EXISTS idx_shopping_list_pantry
  ON shopping_list(pantry_id);

CREATE INDEX IF NOT EXISTS idx_products_expiry
  ON products(pantry_id, expiry_date)
  WHERE expiry_date IS NOT NULL;

-- 4. Row Level Security para shopping_list (igual que products)
ALTER TABLE shopping_list ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "shopping_list_public_access"
  ON shopping_list FOR ALL
  USING (true)
  WITH CHECK (true);

-- 5. Habilitar realtime para la nueva tabla
-- (Ejecutar desde Dashboard > Database > Replication si no funciona por SQL)
ALTER PUBLICATION supabase_realtime ADD TABLE shopping_list;

-- =====================================================
-- Verificación: comprueba que todo se ha aplicado
-- =====================================================
SELECT
  column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'products'
  AND column_name = 'expiry_date';

SELECT table_name
FROM information_schema.tables
WHERE table_name = 'shopping_list';


npm install
