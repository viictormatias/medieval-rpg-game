-- Cap de progressao: nivel maximo 60 e limites por atributo base do personagem.
ALTER TABLE IF EXISTS public.profiles
  DROP CONSTRAINT IF EXISTS profiles_level_check;
ALTER TABLE IF EXISTS public.profiles
  ADD CONSTRAINT profiles_level_check CHECK (level >= 1 AND level <= 60);

ALTER TABLE IF EXISTS public.profiles
  DROP CONSTRAINT IF EXISTS profiles_strength_check;
ALTER TABLE IF EXISTS public.profiles
  ADD CONSTRAINT profiles_strength_check CHECK (strength >= 0 AND strength <= 80);

ALTER TABLE IF EXISTS public.profiles
  DROP CONSTRAINT IF EXISTS profiles_defense_check;
ALTER TABLE IF EXISTS public.profiles
  ADD CONSTRAINT profiles_defense_check CHECK (defense >= 0 AND defense <= 80);

ALTER TABLE IF EXISTS public.profiles
  DROP CONSTRAINT IF EXISTS profiles_agility_check;
ALTER TABLE IF EXISTS public.profiles
  ADD CONSTRAINT profiles_agility_check CHECK (agility >= 0 AND agility <= 80);

ALTER TABLE IF EXISTS public.profiles
  DROP CONSTRAINT IF EXISTS profiles_accuracy_check;
ALTER TABLE IF EXISTS public.profiles
  ADD CONSTRAINT profiles_accuracy_check CHECK (accuracy >= 0 AND accuracy <= 80);

ALTER TABLE IF EXISTS public.profiles
  DROP CONSTRAINT IF EXISTS profiles_vigor_check;
ALTER TABLE IF EXISTS public.profiles
  ADD CONSTRAINT profiles_vigor_check CHECK (vigor >= 0 AND vigor <= 80);
