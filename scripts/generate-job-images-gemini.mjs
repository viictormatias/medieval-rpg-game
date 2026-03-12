import fs from 'node:fs/promises'
import path from 'node:path'

const ROOT = process.cwd()
const ENV_PATH = path.join(ROOT, '.env.local')
const OUT_DIR = path.join(ROOT, 'public', 'images', 'jobs')

const STYLE_BIBLE = [
  'Super realistic Wild West visual language, grounded and gritty.',
  'Cinematic atmosphere, dust, sunlight, dramatic shadows.',
  'Photorealistic rendering, HDR, filmic color grade, ultra-detailed, 8k quality.',
  'No characters looking directly at camera, focus on the environment and action.',
].join(' ')

const NEGATIVE_PROMPT = [
  'cartoon', 'anime', 'illustration', 'painting', 'concept art',
  'low poly', '3d render look', 'plastic material', 'toy',
  'text', 'letters', 'watermark', 'logo', 'signature',
  'blurry', 'lowres', 'artifact', 'deformed',
].join(', ')

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
  // Using the model ID for Imagen 4 as seen in generate-gemini-images.mjs
  // The user calls it "Nano Banana"
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      instances: [{ prompt: `${prompt}. Negative prompt: ${negativePrompt}` }],
      parameters: { sampleCount: 1, aspectRatio: '16:9', outputMimeType: 'image/jpeg' },
    }),
  })

  if (!response.ok) {
    const errorBody = await response.text()
    throw new Error(`Gemini (Nano Banana) API Error ${response.status}: ${errorBody}`)
  }

  const data = await response.json()
  const bytesBase64 = data.predictions?.[0]?.bytesBase64
  if (!bytesBase64) throw new Error('No image bytes returned from Gemini API')
  return Buffer.from(bytesBase64, 'base64')
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
  { id: 'bank_heist', title: 'Grande Assalto ao Banco de Santa Fé', prompt: 'Cinematic Wild West illustration of a classic stone bank exterior during a robbery, dynamic action, dust, scattered money, realistic 8k.' },
  { id: 'fort_vigil', title: 'Vigilia no Forte Abandonado', prompt: 'Cinematic Wild West illustration of a ruined wooden fort at night under a full moon, a guard with a lantern, mysterious shadows, realistic 8k.' },
  { id: 'contraband_route', title: 'Rota Longa de Contrabando', prompt: 'Cinematic Wild West illustration of mules carrying heavy packs through a narrow mountain pass at dawn, blue and orange sky, realistic 8k.' },
  { id: 'forgotten_canyon', title: 'Expedicao ao Canyon Esquecido', prompt: 'Cinematic Wild West illustration of explorers standing at the edge of a massive, ancient canyon, golden hour light, epic landscape, realistic 8k.' }
]

async function main() {
  await loadEnvLocal()
  const apiKey = process.env.GOOGLE_AI_API_KEY
  if (!apiKey) throw new Error('GOOGLE_AI_API_KEY not found in .env.local')

  await fs.mkdir(OUT_DIR, { recursive: true })

  for (const job of JOBS) {
    const outPath = path.join(OUT_DIR, `${job.id}.jpg`)
    
    // We want to overwrite them if they are small or if we want "unique" fresh images as requested
    // But usually we skip if they exist and are valid. 
    // The user said "crie uma imagem única", so I'll force creation if I want, but I'll stick to skipping valid ones to save quota unless I see they are placeholders.
    
    console.log(`Generating (Gemini/Nano Banana): ${job.title}...`)
    try {
      const fullPrompt = `${job.prompt} ${STYLE_BIBLE}`
      const buffer = await generateImage({ apiKey, prompt: fullPrompt, negativePrompt: NEGATIVE_PROMPT })
      await fs.writeFile(outPath, buffer)
      console.log(`  Saved ${outPath}`)
    } catch (err) {
      console.error(`  FAIL ${job.id}: ${err.message}`)
    }
    // Wait a bit to avoid rate limits
    await new Promise(r => setTimeout(r, 2000))
  }

  console.log('Done.')
}

main().catch(console.error)
