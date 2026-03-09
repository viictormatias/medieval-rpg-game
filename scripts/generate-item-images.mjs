import fs from 'node:fs/promises'
import path from 'node:path'

const ROOT = process.cwd()
const ENV_PATH = path.join(ROOT, '.env.local')
const OUT_DIR = path.join(ROOT, 'public', 'images', 'items')
const MISSING_ONLY = !process.argv.includes('--force')
const ALLOW_REFERENCE_OVERWRITE = process.argv.includes('--allow-reference-overwrite')
const IDS_ARG = process.argv.find(arg => arg.startsWith('--ids='))
const ONLY_IDS = IDS_ARG
  ? new Set(IDS_ARG.split('=')[1].split(',').map(s => s.trim()).filter(Boolean))
  : null

const STYLE_BIBLE = [
  'Super realistic Wild West visual language, grounded and gritty.',
  'Natural skin/leather/linen/metal/wood textures, visible wear, dust, scratches and micro-details.',
  'Dramatic low-key cinematic lighting with deep contrast and controlled highlights.',
  'Studio black background with very subtle texture and no scenery pollution.',
  'Consistent art direction with the original project assets.',
  'Photorealistic rendering, HDR, filmic color grade, fine film grain, ultra-detailed, 8k quality.',
  'No fantasy ornaments, no sci-fi shapes, no cartoon look, no stylized painterly brushwork.'
].join(' ')

const NEGATIVE_PROMPT = [
  'cartoon', 'anime', 'illustration', 'painting', 'concept art',
  'low poly', '3d render look', 'plastic material', 'toy',
  'fantasy armor', 'medieval fantasy', 'sci-fi',
  'neon cyberpunk', 'oversaturated colors',
  'text', 'letters', 'watermark', 'logo', 'signature',
  'blurry', 'lowres', 'artifact', 'deformed'
].join(', ')

const ITEM_EXTRA_NEGATIVE = {
  bandit_mask: 'person, human, face, portrait, cowboy hat, head, model wearing, character, collage, grid, split panel, multiple images, eyes, skin, shirt',
  sheriff_hat: 'person, human, face, portrait, bust, head, character',
  simple_bandolier: 'person, human, model, portrait, face, torso, body, mannequin torso, character, legs, pants, boots, outfit, collage, grid, split panel, multiple images, cuffs, canteen, bottle',
  reinforced_bandolier: 'person, human, model, portrait, face, torso, body, mannequin torso, character, shirt, coat, jacket, vest, pants, boots, full outfit',
  canned_beans: 'person, human, bowl, plate, dish, spoon, restaurant, table scene',
  blood_nugget: 'person, human, portrait, jewelry worn, ring, crown, fantasy gem',
  hangman_noose: 'person, human, neck, hanging body, gallows execution scene, violence scene',
  saint_medallion: 'person, human, portrait, necklace worn on person, fantasy amulet scene',
  phantom_horseshoe: 'person, human, horse body, rider, landscape wide shot',
  devils_coin: 'person, human, devil character, demon face, skull',
  duelist_gloves: 'person, human, full body, portrait, face, gun scene',
  marshal_gloves: 'person, human, full body, portrait, face',
  sheriff_greaves: 'person, human, full body, portrait, face'
}

const TYPE_CONTEXT = {
  weapon: 'Hero prop shot of a western weapon held by a rugged bounty hunter torso, hands visible with worn leather gloves, gunmetal and oiled wood emphasized.',
  shield: 'Standalone defensive accessory only, mounted on mannequin torso or display stand, no person visible, no face, no skin.',
  chest: 'Bust-up portrait framing with a rugged western hunter wearing the garment as the main subject, fabric and stitching in focus.',
  helmet: 'Standalone headgear only on neutral mannequin head or wooden stand, no human face visible, no person portrait.',
  gloves: 'Close-up on hands and forearms wearing the gloves, fingers tense, leather grain and seams highly detailed.',
  legs: 'Waist-to-knee framing with the pants/chaps in action-ready stance, cloth folds and abrasion marks visible.',
  boots: 'Knee-down framing focused on boots planted on dusty ground texture, cracked leather and worn metal details highlighted.',
  relic: 'Macro hero shot of a mystical but grounded frontier relic on dark leather cloth, realistic metal/stone texture, subtle ominous aura only.',
  consumable: 'Macro product shot of the consumable as practical frontier gear, realistic labels/materials but no readable text.'
}

const ITEM_PROMPT_OVERRIDE = {
  bandit_mask: 'ONLY one rugged outlaw cloth face mask accessory item, NOT worn by anyone. Hanging from a rusty metal hook on dark wooden wall. Eye openings and stitched seams visible, dusty worn fabric, western outlaw style. Product shot, single object only.',
  sheriff_hat: 'ONLY a sheriff western hat item, isolated product shot on wooden stand. Structured brim, weathered leather/felt, and a visible sheriff star badge pinned on the crown band. No head, no bust, no person.',
  simple_bandolier: 'ONLY one simple bandolier accessory item, isolated product shot. Brown leather shoulder strap crossing diagonally with visible ammo loops and one small utility pouch. Hanging on a single metal hook on dark wooden wall. Single object only.',
  reinforced_sling: 'Single reinforced sling bandolier item only, leather strap with rivets and light metal inserts, hanging on rustic wooden display hook. No person, no mannequin torso, no body parts.',
  reinforced_bandolier: 'ONLY the reinforced bandolier accessory item. Isolated leather strap harness with buckles, ammo loops and reinforcement plates, hanging on one metal hook against dark neutral background. No mannequin, no torso, no body, no clothing.',
  sheriff_arm_shield: 'Single heavy sheriff forearm guard accessory, leather and metal bracer with lawman engraving, mounted on a display arm stand, no person visible.',
  iron_star_buckler: 'Single compact round buckler shield with iron sheriff star emblem in center, visible metal rim and rear leather hand straps, displayed on dark wooden stand, no person visible.',
  canned_beans: 'ONLY one frontier canned beans consumable item, isolated product shot. Tin can with worn vintage western label, slight dents, dusty metal, opened lid slightly visible. Dark neutral background, single object only.',
  blood_nugget: 'ONLY one blood nugget relic item, isolated macro product shot. Rough golden nugget with deep reddish stains and subtle engraved marks, placed on dark leather cloth. Single object only, no person.',
  hangman_noose: 'ONLY one old execution rope relic item, isolated product shot. Frayed noose made of weathered hemp rope, hanging from an iron hook against dark wooden wall. Single object only, no person.',
  saint_medallion: 'ONLY one pilgrim medallion relic item, isolated macro product shot. Aged silver-gold medallion with sacred engraving and worn chain, placed on dark velvet cloth. Single object only, no person.',
  phantom_horseshoe: 'ONLY one phantom horseshoe relic item, isolated product shot. Weathered iron horseshoe with faint blue spectral glow around edges, placed on dark wooden table. Single object only, no person, no horse.',
  devils_coin: 'ONLY one devil coin relic item, isolated macro product shot. Old tarnished silver coin with profane symbols and micro scratches, dramatic side lighting, dark background. Single object only, no person.',
  duelist_gloves: 'ONLY one pair of duelist gloves item, isolated product shot. Worn leather shooting gloves with fine stitching and fast-draw finger design, placed on dark wooden table. Single object set only, no person.',
  marshal_gloves: 'ONLY one pair of marshal gloves item, isolated product shot. Heavy reinforced leather gloves with brass studs and thick wrist support, placed on dark wooden table. Single object set only, no person.',
  sheriff_greaves: 'ONLY one pair of sheriff greaves item, isolated product shot. Heavy leather-and-metal leg guards with sheriff law detailing, placed upright on dark wooden stand. Single object set only, no person.'
}

// Original project images that should remain as quality/style reference.
// These are never regenerated unless --allow-reference-overwrite is provided.
const PROTECTED_REFERENCE_IDS = new Set([
  'rusty_dagger',
  'short_revolver',
  'sawed_off',
  'duelist_revolver',
  'precision_rifle',
  'medical_kit'
])

const SAFE_PROMPT_ALIAS = {
  sheriff_arm_shield: {
    name: 'Sheriff Reinforced Arm Guard',
    description: 'Heavy reinforced forearm protection used by frontier law officers to absorb impacts and glancing shots.'
  }
}

async function loadEnvLocal() {
  try {
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
  } catch (err) {
    console.warn('.env.local not found or unreadable')
  }
}

function buildRealisticPrompt(item) {
  const alias = SAFE_PROMPT_ALIAS[item.id]
  const itemName = alias?.name || item.name
  const itemDescription = alias?.description || item.description
  const typeContext = TYPE_CONTEXT[item.type] || 'Hero prop shot with western framing.'
  const itemOverride = ITEM_PROMPT_OVERRIDE[item.id]
  return [
    `Super realistic western item render for a Wild West RPG asset.`,
    `Item name: ${itemName}.`,
    `Item description: ${itemDescription}.`,
    itemOverride || '',
    typeContext,
    `The subject is centered, dominant in frame, physically plausible and battle-worn.`,
    `Lighting: key light from left, soft rim light from right, deep shadows shaping form.`,
    `Material fidelity: worn leather, heavy linen, tarnished steel, aged wood, dust and trail grime.`,
    `Background: deep black with subtle texture, no distracting elements.`,
    STYLE_BIBLE
  ].join(' ')
}

async function generateImage({ apiKey, prompt, width = 512, height = 512, negativePrompt = NEGATIVE_PROMPT }) {
  // 1. Submit Generation Request
  const submitUrl = 'https://cloud.leonardo.ai/api/rest/v1/generations'
  const submitRes = await fetch(submitUrl, {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'content-type': 'application/json',
      'authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      height,
      width,
      modelId: '5c232a9e-9061-4777-980a-ddc8e65647c6', // Leonardo Vision XL
      prompt,
      negative_prompt: negativePrompt,
      num_images: 1,
      alchemy: true,
      photoReal: true,
      photoRealVersion: 'v2',
      presetStyle: 'CINEMATIC'
    })
  })

  if (!submitRes.ok) {
    const body = await submitRes.text()
    throw new Error(`Leonardo Submission Error ${submitRes.status}: ${body}`)
  }

  const submitJson = await submitRes.json()
  const generationId = submitJson.sdGenerationJob.generationId

  console.log(`Generation submitted, ID: ${generationId}. Polling...`)

  // 2. Poll for Results
  const pollUrl = `https://cloud.leonardo.ai/api/rest/v1/generations/${generationId}`
  let imageUrl = null
  let attempts = 0
  const maxAttempts = 30 // 60 seconds total

  while (!imageUrl && attempts < maxAttempts) {
    await new Promise(r => setTimeout(r, 2000))
    attempts++

    const pollRes = await fetch(pollUrl, {
      method: 'GET',
      headers: {
        'accept': 'application/json',
        'authorization': `Bearer ${apiKey}`
      }
    })

    if (!pollRes.ok) continue

    const pollJson = await pollRes.json()
    const generation = pollJson.generations_by_pk
    
    if (generation.status === 'COMPLETE') {
      imageUrl = generation.generated_images[0].url
    } else if (generation.status === 'FAILED') {
      throw new Error(`Leonardo Generation failed for ID: ${generationId}`)
    }
  }

  if (!imageUrl) {
    throw new Error(`Timeout waiting for Leonardo generation: ${generationId}`)
  }

  // 3. Download the actual image
  const imgDataRes = await fetch(imageUrl)
  if (!imgDataRes.ok) {
    throw new Error(`Failed to download image from ${imageUrl}`)
  }
  
  const arrayBuffer = await imgDataRes.arrayBuffer()
  return {
    mimeType: imgDataRes.headers.get('content-type') || 'image/png',
    data: Buffer.from(arrayBuffer).toString('base64')
  }
}

function buildNegativePrompt(item) {
  const extra = ITEM_EXTRA_NEGATIVE[item.id]
  if (!extra) return NEGATIVE_PROMPT
  return `${NEGATIVE_PROMPT}, ${extra}`
}

const ITEMS = [
    // { id: 'rusty_dagger', name: 'Faca de Saloon', type: 'weapon', description: 'Lâmina gasta para briga de bar.', has_realistic: true },
    // { id: 'short_revolver', name: 'Revólver de Cano Curto', type: 'weapon', description: 'Confiável para duelos no meio da rua.', has_realistic: true },
    // { id: 'sawed_off', name: 'Espingarda de Cano Serrado', type: 'weapon', description: 'Brutal de perto e intimidadora.', has_realistic: true },
    // { id: 'duelist_revolver', name: 'Revólver de Duelista', type: 'weapon', description: 'Saque veloz e tiro preciso.', has_realistic: true },
    // { id: 'precision_rifle', name: 'Rifle de Precisão', type: 'weapon', description: 'Longo alcance e alto impacto.', has_realistic: true },
    { id: 'dusty_poncho', name: 'Poncho Empoeirado', type: 'chest', description: 'Tecido grosso, já gasto pela estrada. Protege do vento e de alguns estilhaços.', has_realistic: false },
    { id: 'reinforced_poncho', name: 'Poncho Reforçado', type: 'chest', description: 'Forrado com couro cru e placas discretas de metal.', has_realistic: false },
    { id: 'steel_lined_coat', name: 'Casaco Forrado de Aço', type: 'chest', description: 'Placas de aço escondidas sob o tecido pesado, ideal para duelos urbanos.', has_realistic: false },
    { id: 'marshal_trenchcoat', name: 'Sobretudo do Marechal', type: 'chest', description: 'Peça oficial dos marechais federais, feita para aguentar chuva de chumbo.', has_realistic: false },
    { id: 'sheriff_coat', name: 'Casaco do Xerife', type: 'chest', description: 'Respeito e proteção em um só traje.', has_realistic: false },
    { id: 'cloth_hat', name: 'Chapéu de Pano', type: 'helmet', description: 'Protege do sol e da poeira.', has_realistic: false },
    { id: 'leather_hat', name: 'Chapéu de Couro Duro', type: 'helmet', description: 'Resistente para patrulha bruta.', has_realistic: false },
    { id: 'sheriff_hat', name: 'Chapéu do Xerife', type: 'helmet', description: 'Marca de autoridade no condado.', has_realistic: false },
    { id: 'bandit_mask', name: 'Máscara de Bandido', type: 'helmet', description: 'Intimida e esconde a identidade.', has_realistic: false },
    { id: 'trigger_king_hat', name: 'Chapéu da Lenda do Gatilho', type: 'helmet', description: 'Marca de uma lenda viva entre os pistoleiros.', has_realistic: false },
    { id: 'leather_gloves', name: 'Luvas de Couro', type: 'gloves', description: 'Aderência e controle no saque.', has_realistic: false },
    { id: 'reinforced_gloves', name: 'Luvas Reforçadas', type: 'gloves', description: 'Boas para pancada e recoil pesado.', has_realistic: false },
    { id: 'duelist_gloves', name: 'Luvas do Duelista', type: 'gloves', description: 'Feitas para tiro rápido.', has_realistic: false },
    { id: 'marshal_gloves', name: 'Luvas do Marechal', type: 'gloves', description: 'Aguentam briga longa sem tremer.', has_realistic: false },
    { id: 'nightfang_grips', name: 'Empunhadura Noturna', type: 'gloves', description: 'Controle fino para tiros letais.', has_realistic: false },
    { id: 'traveler_pants', name: 'Calça de Viajante', type: 'legs', description: 'Confortável para longas cavalgadas.', has_realistic: false },
    { id: 'leather_chaps', name: 'Perneira de Couro', type: 'legs', description: 'Proteção básica contra estilhaços.', has_realistic: false },
    { id: 'lined_pants', name: 'Calça Forrada', type: 'legs', description: 'Boa defesa sem travar o movimento.', has_realistic: false },
    { id: 'sheriff_greaves', name: 'Perneira do Xerife', type: 'legs', description: 'Equipamento de alto nível da lei.', has_realistic: false },
    { id: 'ghost_step_pants', name: 'Calça Passo Fantasma', type: 'legs', description: 'Feita para aproximação silenciosa.', has_realistic: false },
    { id: 'cloth_boots', name: 'Botas de Pano', type: 'boots', description: 'Leves para iniciar na trilha.', has_realistic: false },
    { id: 'mercenary_boots', name: 'Botas de Mercenário', type: 'boots', description: 'Firmes para duelo em rua de terra.', has_realistic: false },
    { id: 'iron_boots', name: 'Botas Ferradas', type: 'boots', description: 'Passada pesada, difícil derrubar.', has_realistic: false },
    { id: 'ranger_boots', name: 'Botas do Ranger', type: 'boots', description: 'Resistentes para vigia da fronteira.', has_realistic: false },
    { id: 'raven_boots', name: 'Botas do Corvo', type: 'boots', description: 'Mobilidade extrema para emboscadas.', has_realistic: false },
    { id: 'simple_bandolier', name: 'Bandoleira Simples', type: 'shield', description: 'Peitoral lateral para segurar suprimentos e impacto.', has_realistic: false },
    { id: 'reinforced_sling', name: 'Bandoleira Rebitada', type: 'shield', description: 'Correias reforçadas e placas leves para aguentar os primeiros tiroteios sérios.', has_realistic: false },
    { id: 'reinforced_bandolier', name: 'Bandoleira Reforçada', type: 'shield', description: 'Proteção extra para trocas de tiro longas.', has_realistic: false },
    { id: 'sheriff_arm_shield', name: 'Braçadeira Reforçada do Xerife', type: 'shield', description: 'Protetor de braço pesado para aguentar disparos.', has_realistic: false },
    { id: 'iron_star_buckler', name: 'Broquel Estrela de Ferro', type: 'shield', description: 'Um escudo compacto com a estrela do condado, feito para quem nunca recua.', has_realistic: false },
    // { id: 'medical_kit', name: 'Kit Médico', type: 'consumable', description: 'Ataduras e remédios.', has_realistic: true },
    { id: 'canned_beans', name: 'Feijão Enlatado', type: 'consumable', description: 'Recupera o fôlego e a energia.', has_realistic: false },
    { id: 'blood_nugget', name: 'Pepita de Sangue', type: 'relic', description: 'Uma pepita manchada de vermelho que pulsa com vitalidade sombria.', has_realistic: false },
    { id: 'hangman_noose', name: 'Corda do Carrasco', type: 'relic', description: 'Fragmento de corda antiga usada em enforcamentos na fronteira.', has_realistic: false },
    { id: 'saint_medallion', name: 'Medalhão do Peregrino', type: 'relic', description: 'Relíquia sagrada de metal envelhecido com símbolos de proteção.', has_realistic: false },
    { id: 'phantom_horseshoe', name: 'Ferradura Fantasma', type: 'relic', description: 'Ferradura espectral envolta em poeira e energia etérea.', has_realistic: false },
    { id: 'devils_coin', name: 'Moeda do Diabo', type: 'relic', description: 'Moeda amaldiçoada marcada com sigilos profanos.', has_realistic: false },
]

async function main() {
  await loadEnvLocal()

  const apiKey = process.env.LEONARDO_API_KEY
  if (!apiKey) {
    throw new Error('LEONARDO_API_KEY not found in .env.local')
  }

  await fs.mkdir(OUT_DIR, { recursive: true })

  console.log(`Starting generation with Leonardo.ai...`)

  const existingFiles = new Set((await fs.readdir(OUT_DIR)).map(name => name.toLowerCase()))
  const hasAny = (prefix) => {
    const p = `${prefix.toLowerCase()}.`
    for (const file of existingFiles) {
      if (file.startsWith(p)) return true
    }
    return false
  }

  let generated = 0
  let skipped = 0
  let failed = 0

  const queue = ONLY_IDS ? ITEMS.filter(item => ONLY_IDS.has(item.id)) : ITEMS
  if (queue.length === 0) {
    console.log('No items selected for generation. Check --ids argument.')
    return
  }

  for (const item of queue) {
    if (PROTECTED_REFERENCE_IDS.has(item.id) && !ALLOW_REFERENCE_OVERWRITE) {
      console.log(`Protected reference item (kept original): ${item.name}`)
      skipped += 1
      continue
    }

    const realisticPrefix = `${item.id}_realistic`

    // 1. Generate Realistic Image (if missing)
    if (!item.has_realistic) {
      if (MISSING_ONLY && hasAny(realisticPrefix)) {
        console.log(`Skipping realistic (already exists): ${item.name}`)
        skipped++
      } else {
      console.log(`Generating realistic image for: ${item.name}...`)
      try {
        const prompt = buildRealisticPrompt(item)
        const result = await generateImage({ apiKey, prompt, negativePrompt: buildNegativePrompt(item) })
        const ext = result.mimeType.includes('jpeg') ? 'jpg' : 'png'
        const out = path.join(OUT_DIR, `${item.id}_realistic.${ext}`)
        await fs.writeFile(out, Buffer.from(result.data, 'base64'))
        existingFiles.add(path.basename(out).toLowerCase())
        generated++
        console.log(`Saved: ${out}`)
      } catch (err) {
        failed++
        const message = err instanceof Error ? err.message : String(err)
        console.error(`Failed realistic image for ${item.name}: ${message}`)
      }
      }
    }
    
    // Tiny delay to avoid hitting rate limits too fast
    await new Promise(r => setTimeout(r, 1000))
  }

  console.log(`Done. generated=${generated}, skipped=${skipped}, failed=${failed}, mode=${MISSING_ONLY ? 'missing-only' : 'force'}`)
}

main().catch(console.error)
