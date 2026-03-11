import fs from 'node:fs/promises'
import path from 'node:path'

const ROOT = process.cwd()
const ENV_PATH = path.join(ROOT, '.env.local')
const OUT_DIR = path.join(ROOT, 'public', 'images', 'jobs')

async function loadEnvLocal() {
  const raw = await fs.readFile(ENV_PATH, 'utf8')
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const idx = trimmed.indexOf('=')
    if (idx === -1) continue
    const key = trimmed.slice(0, idx).trim()
    const value = trimmed.slice(idx + 1).trim()
    if (!process.env[key]) process.env[key] = value
  }
}

async function generateImage({ apiKey, prompt, negativePrompt }) {
  const submitRes = await fetch('https://cloud.leonardo.ai/api/rest/v1/generations', {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      height: 512,
      width: 512,
      modelId: '5c232a9e-9061-4777-980a-ddc8e65647c6', // Leonardo Diffusion XL
      prompt,
      negative_prompt: negativePrompt,
      num_images: 1,
    }),
  })

  if (!submitRes.ok) {
    const body = await submitRes.text()
    throw new Error(`Leonardo Submission Error ${submitRes.status}: ${body}`)
  }

  const submitJson = await submitRes.json()
  const generationId = submitJson.sdGenerationJob.generationId
  let imageUrl = null
  let attempts = 0

  while (!imageUrl && attempts < 30) {
    await new Promise((resolve) => setTimeout(resolve, 2000))
    attempts++
    const pollRes = await fetch(`https://cloud.leonardo.ai/api/rest/v1/generations/${generationId}`, {
      headers: { accept: 'application/json', authorization: `Bearer ${apiKey}` },
    })
    if (!pollRes.ok) continue
    const pollJson = await pollRes.json()
    const generation = pollJson.generations_by_pk
    if (generation.status === 'COMPLETE') imageUrl = generation.generated_images[0].url
    else if (generation.status === 'FAILED') throw new Error(`Leonardo Generation failed for ID: ${generationId}`)
  }

  if (!imageUrl) throw new Error(`Timeout waiting for Leonardo generation: ${generationId}`)
  const imgDataRes = await fetch(imageUrl)
  const arrayBuffer = await imgDataRes.arrayBuffer()
  return Buffer.from(arrayBuffer)
}

const JOBS = [
  { id: 'farm_tobacco', title: 'Coletar Fumo', prompt: 'Cinematic Wild West illustration of a vast tobacco plantation at sunset, workers picking large leaves, realistic 8k, gritty atmosphere, earthy colors.' },
  { id: 'frontier_patrol', title: 'Patrulha da Fronteira', prompt: 'Cinematic Wild West illustration of a lone rider on a horse patrolling a desert ridge, dusty atmosphere, intense sun, realistic 8k, grounded.' },
  { id: 'black_market', title: 'Vender Objetos Roubados', prompt: 'Cinematic Wild West illustration of a shady back-alley trade in a dusty town at night, crates, old lanterns, realistic 8k, noir western style.' },
  { id: 'bounty_hunt', title: 'Caça de Recompensa', prompt: 'Cinematic Wild West illustration of a rugged bounty hunter standing in a rocky canyon, holding a wanted poster, realistic 8k, dramatic shadows.' },
  { id: 'stagecoach_escort', title: 'Escolta de Diligência', prompt: 'Cinematic Wild West illustration of a horse-drawn stagecoach speeding through a dusty trail, guards armed with rifles, action shot, realistic 8k.' },
  { id: 'salt_caravan', title: 'Escolta de Caravana de Sal', prompt: 'Cinematic Wild West illustration of a slow-moving caravan of wagons crossing a bright white salt flat, heat haze, realistic 8k, high contrast.' },
  { id: 'bounty_hunt_legendary', title: 'Caçada a Fugitivo Lendário', prompt: 'Cinematic Wild West illustration of an intense face-off in a ghost town, legendary outlaw silhouette, dust blowing, realistic 8k, cinematic lighting.' },
  { id: 'train_heist', title: 'Assalto ao Trem Express de Prata', prompt: 'Cinematic Wild West illustration of a steam train chugging across a wooden bridge, masked men on horses alongside, smoke, realistic 8k, action.' },
  { id: 'bank_heist', title: 'O Último Grande Assalto', prompt: 'Cinematic Wild West illustration of a classic stone bank exterior during a robbery, dynamic action, dust, scattered money, realistic 8k.' },
  { id: 'fort_vigil', title: 'Vigilia no Forte Abandonado', prompt: 'Cinematic Wild West illustration of a ruined wooden fort at night under a full moon, a guard with a lantern, mysterious shadows, realistic 8k.' },
  { id: 'contraband_route', title: 'Rota Longa de Contrabando', prompt: 'Cinematic Wild West illustration of mules carrying heavy packs through a narrow mountain pass at dawn, blue and orange sky, realistic 8k.' },
  { id: 'forgotten_canyon', title: 'Expedicao ao Canyon Esquecido', prompt: 'Cinematic Wild West illustration of explorers standing at the edge of a massive, ancient canyon, golden hour light, epic landscape, realistic 8k.' }
]

const NEGATIVE = 'cartoon, anime, 3d render look, plastic, toy, text, watermark, signature, blurry, lowres'

async function main() {
  await loadEnvLocal()
  const apiKey = process.env.LEONARDO_API_KEY
  if (!apiKey) throw new Error('LEONARDO_API_KEY not found in .env.local')

  await fs.mkdir(OUT_DIR, { recursive: true })

  for (const job of JOBS) {
    const outPath = path.join(OUT_DIR, `${job.id}.jpg`)
    
    try {
      const stats = await fs.stat(outPath);
      if (stats.size > 1024) {
        console.log(`Skipping (already exists): ${job.title}`);
        continue;
      }
    } catch {}

    console.log(`Generating: ${job.title}...`)
    try {
      const buffer = await generateImage({ apiKey, prompt: job.prompt, negativePrompt: NEGATIVE })
      await fs.writeFile(outPath, buffer)
      console.log(`  Saved ${outPath}`)
    } catch (err) {
      console.error(`  FAIL ${job.id}: ${err.message}`)
    }
    await new Promise(r => setTimeout(r, 1000))
  }
}

main().catch(console.error)
