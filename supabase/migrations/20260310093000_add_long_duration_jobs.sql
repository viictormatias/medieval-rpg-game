-- Adiciona 3 trabalhos de longa duracao para jogadores que querem farm de horas.

insert into public.jobs (
  id,
  title,
  description,
  duration_seconds,
  reward_xp,
  reward_gold,
  energy_cost,
  min_level
)
values
  (
    '9ab1b6f2-4bc9-4a32-90cf-7ed9f4f4cd10',
    'Vigilia no Forte Abandonado',
    'Passe a noite inteira guardando um forte antigo contra saqueadores e predadores.',
    21600, -- 6h
    520,
    1250,
    32,
    14
  ),
  (
    '20d68d94-23a4-4d82-a7be-b08f17d4a1bc',
    'Rota Longa de Contrabando',
    'Conduza carga ilegal por trilhas remotas e retorne sem chamar atencao da lei.',
    28800, -- 8h
    690,
    1680,
    40,
    18
  ),
  (
    '4f55f34d-6f4d-45ec-9ccf-c17b6b171f69',
    'Expedicao ao Canyon Esquecido',
    'Uma expedicao extensa por regioes perigosas para recuperar artefatos e ouro bruto.',
    43200, -- 12h
    980,
    2450,
    52,
    24
  )
on conflict (id) do nothing;

