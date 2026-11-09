// Counts net lines (added minus deleted) per language across every commit in
// the owner's own repos (forks skipped) and writes <out>/lines.json for
// cards.mjs. Private repos are included when LANG_TOKEN is set.
//
// Copied-in third-party code is kept out two ways:
// - commits adding more than BULK_LIMIT lines in total are skipped (bulk imports)
// - files under vendor/build folders, minified files and lock files are skipped
import { execFileSync } from 'node:child_process'
import { writeFileSync, mkdirSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

const user = process.env.GH_USER
const token = process.env.LANG_TOKEN || ''
const out = process.argv[2] || 'dist'
const BULK_LIMIT = Number(process.env.BULK_LIMIT || 25000)
const SKIP_REPOS = (process.env.SKIP_REPOS || '').split(',').map((s) => s.trim().toLowerCase()).filter(Boolean)

const EXT = {
  js: 'JavaScript', mjs: 'JavaScript', cjs: 'JavaScript', jsx: 'JavaScript',
  ts: 'TypeScript', tsx: 'TypeScript', mts: 'TypeScript', rs: 'Rust', py: 'Python',
  cs: 'C#', cpp: 'C++', cc: 'C++', cxx: 'C++', hpp: 'C++', hh: 'C++', hxx: 'C++', c: 'C', h: 'C',
  html: 'HTML', htm: 'HTML', css: 'CSS', scss: 'SCSS', ps1: 'PowerShell', psm1: 'PowerShell',
  sh: 'Shell', bash: 'Shell', bat: 'Batchfile', cmd: 'Batchfile', lua: 'Lua', java: 'Java',
  kt: 'Kotlin', go: 'Go', vue: 'Vue', svelte: 'Svelte', hlsl: 'HLSL', fx: 'HLSL', glsl: 'GLSL',
  asm: 'Assembly', s: 'Assembly', swift: 'Swift', php: 'PHP', rb: 'Ruby', dart: 'Dart', sql: 'SQL',
}
const SKIP_PATH = /(^|\/)(node_modules|vendor|vendors|third_party|thirdparty|external|deps|dist|build|out|target|bin|obj|\.next|coverage)\//i
const SKIP_FILE = /(\.min\.(js|css)$|(^|\/)(package-lock\.json|yarn\.lock|pnpm-lock\.yaml)$)/i

const headers = { Accept: 'application/vnd.github+json', 'User-Agent': 'profile-lines' }
if (token) headers.Authorization = `Bearer ${token}`
async function get(url) {
  const r = await fetch(url, { headers })
  if (!r.ok) throw new Error(`${r.status} ${url}`)
  return r.json()
}

const repos = []
for (let page = 1; ; page++) {
  const url = token
    ? `https://api.github.com/user/repos?affiliation=owner&per_page=100&page=${page}`
    : `https://api.github.com/users/${user}/repos?type=owner&per_page=100&page=${page}`
  const batch = await get(url)
  repos.push(...batch)
  if (batch.length < 100) break
}

const totals = {}
const work = join(tmpdir(), 'lines-work')
let counted = 0, skippedBulk = 0
for (const repo of repos) {
  if (repo.fork || repo.size === 0 || SKIP_REPOS.includes(repo.name.toLowerCase())) continue
  const dir = join(work, repo.name)
  const url = token
    ? `https://x-access-token:${token}@github.com/${repo.full_name}.git`
    : repo.clone_url
  try {
    execFileSync('git', ['clone', '--bare', '--quiet', url, dir], { stdio: 'ignore' })
    const log = execFileSync('git', ['-C', dir, 'log', '--no-merges', '--numstat', '--format=@@%H'],
      { maxBuffer: 1024 * 1024 * 1024 }).toString()
    for (const commit of log.split('@@').slice(1)) {
      const rows = commit.split('\n').slice(1).filter(Boolean).map((l) => l.split('\t'))
      const added = rows.reduce((a, [ad]) => a + (Number(ad) || 0), 0)
      if (added > BULK_LIMIT) { skippedBulk++; continue }
      for (const [ad, de, path] of rows) {
        if (ad === '-' || !path) continue // binary file
        const p = path.includes('=>') ? path.replace(/\{[^}]*=> ([^}]*)\}/, '$1').replace(/.*=> /, '') : path
        if (SKIP_PATH.test(p) || SKIP_FILE.test(p)) continue
        const lang = EXT[p.split('.').pop().toLowerCase()]
        if (!lang) continue
        const t = (totals[lang] ||= { added: 0, deleted: 0 })
        t.added += Number(ad); t.deleted += Number(de)
      }
    }
    counted++
  } catch (e) {
    console.log(`skip ${repo.name}: ${String(e.message).split('\n')[0].replace(token, '***')}`)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
}

mkdirSync(out, { recursive: true })
writeFileSync(join(out, 'lines.json'), JSON.stringify({ repos: counted, skippedBulk, totals }, null, 2))
const top = Object.entries(totals).map(([l, t]) => [l, t.added - t.deleted]).sort((a, b) => b[1] - a[1]).slice(0, 6)
console.log(`lines: ${counted} repos, ${skippedBulk} bulk commits skipped, top: ${top.map(([l, n]) => `${l} ${n}`).join(', ')}`)
