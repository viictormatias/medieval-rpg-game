-- Security hardening baseline (client write lock-down)
-- Objetivo: bloquear escrita direta via cliente autenticado e manter apenas leitura necessária no front.
-- As mutações passam pelo backend (service role) via /api/game/action.

-- 1) Habilitar RLS nas tabelas principais
alter table if exists public.profiles enable row level security;
alter table if exists public.inventory enable row level security;
alter table if exists public.jobs enable row level security;
alter table if exists public.npc_enemies enable row level security;

-- 2) Restringir privilégios do role authenticated a leitura
revoke all on table public.profiles from authenticated;
revoke all on table public.inventory from authenticated;
revoke all on table public.jobs from authenticated;
revoke all on table public.npc_enemies from authenticated;

grant select on table public.profiles to authenticated;
grant select on table public.inventory to authenticated;
grant select on table public.jobs to authenticated;
grant select on table public.npc_enemies to authenticated;

-- 3) Policies mínimas de leitura para o cliente
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'profiles_select_own'
  ) THEN
    CREATE POLICY profiles_select_own
      ON public.profiles
      FOR SELECT
      USING (auth.uid() = id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'inventory' AND policyname = 'inventory_select_own'
  ) THEN
    CREATE POLICY inventory_select_own
      ON public.inventory
      FOR SELECT
      USING (auth.uid() = profile_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'jobs' AND policyname = 'jobs_select_all'
  ) THEN
    CREATE POLICY jobs_select_all
      ON public.jobs
      FOR SELECT
      USING (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'npc_enemies' AND policyname = 'npc_enemies_select_all'
  ) THEN
    CREATE POLICY npc_enemies_select_all
      ON public.npc_enemies
      FOR SELECT
      USING (true);
  END IF;
END $$;

-- 4) Constraints de sanidade de progressão
ALTER TABLE IF EXISTS public.profiles
  DROP CONSTRAINT IF EXISTS profiles_level_check;
ALTER TABLE IF EXISTS public.profiles
  ADD CONSTRAINT profiles_level_check CHECK (level >= 1);

ALTER TABLE IF EXISTS public.profiles
  DROP CONSTRAINT IF EXISTS profiles_energy_check;
ALTER TABLE IF EXISTS public.profiles
  ADD CONSTRAINT profiles_energy_check CHECK (energy >= 0 AND energy <= 100);

ALTER TABLE IF EXISTS public.profiles
  DROP CONSTRAINT IF EXISTS profiles_hp_check;
ALTER TABLE IF EXISTS public.profiles
  ADD CONSTRAINT profiles_hp_check CHECK (hp_current >= 0 AND hp_current <= hp_max);

ALTER TABLE IF EXISTS public.profiles
  DROP CONSTRAINT IF EXISTS profiles_stat_points_check;
ALTER TABLE IF EXISTS public.profiles
  ADD CONSTRAINT profiles_stat_points_check CHECK (stat_points_available >= 0);

-- 5) Opcional recomendado: limitar múltiplos itens não-consumíveis iguais por jogador
-- Crie índice parcial somente se sua regra de negócio realmente impedir duplicidade.
-- CREATE UNIQUE INDEX IF NOT EXISTS ux_inventory_profile_item_unique_non_consumable
--   ON public.inventory (profile_id, item_id)
--   WHERE item_id NOT IN (
--     SELECT id FROM public.items_catalog WHERE type = 'consumable'
--   );
