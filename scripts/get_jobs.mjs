import { createClient } from '@supabase/supabase-js'
import fs from 'node:fs/promises'
import path from 'node:path'

const ENV_PATH = path.join(process.cwd(), '.env.local')

async function loadEnv() {
  const raw = await fs.readFile(ENV_PATH, 'utf8')
  const env = {}
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const [key, ...rest] = trimmed.split('=')
    env[key.trim()] = rest.join('=').trim()
  }
  return env
}

async function main() {
  const env = await loadEnv()
  const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL']
  const supabaseKey = env['SUPABASE_SERVICE_ROLE_KEY']

  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase config')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, supabaseKey)
  const { data, error } = await supabase.from('jobs').select('*')

  if (error) {
    console.error('Error fetching jobs:', error)
    process.exit(1)
  }

  await fs.writeFile('tmp/jobs.json', JSON.stringify(data, null, 2))
  console.log('Jobs saved to tmp/jobs.json')
}

main()
