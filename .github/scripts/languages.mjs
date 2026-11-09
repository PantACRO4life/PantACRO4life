// Draws assets/languages.svg: a "Most used languages" card with one color bar
// and the top 6 languages, sized by the bytes of code GitHub counts per repo.
// Reads public repos by default. If the LANG_TOKEN secret (a personal access
// token with repo read access) is set, private repos are counted too.
import { writeFileSync, mkdirSync } from 'node:fs'

const user = process.env.GH_USER
const token = process.env.LANG_TOKEN || process.env.GITHUB_TOKEN
const usePrivate = Boolean(process.env.LANG_TOKEN)
const out = process.argv[2] || 'assets/languages.svg'

const headers = { Accept: 'application/vnd.github+json', 'User-Agent': 'profile-languages' }
if (token) headers.Authorization = `Bearer ${token}`

async function get(url) {
  const r = await fetch(url, { headers })
  if (!r.ok) throw new Error(`${r.status} ${url}`)
  return r.json()
}

const repos = []
for (let page = 1; ; page++) {
  const url = usePrivate
    ? `https://api.github.com/user/repos?affiliation=owner&per_page=100&page=${page}`
    : `https://api.github.com/users/${user}/repos?type=owner&per_page=100&page=${page}`
  const batch = await get(url)
  repos.push(...batch)
  if (batch.length < 100) break
}

const totals = {}
for (const repo of repos) {
  if (repo.fork || repo.archived) continue
  const langs = await get(repo.languages_url)
  for (const [lang, bytes] of Object.entries(langs)) totals[lang] = (totals[lang] || 0) + bytes
}

const COLORS = {
  JavaScript: '#f1e05a', TypeScript: '#3178c6', Rust: '#dea584', Python: '#3572A5',
  'C#': '#178600', 'C++': '#f34b7d', C: '#555555', HTML: '#e34c26', CSS: '#663399',
  PowerShell: '#5391FE', Shell: '#89e051', Batchfile: '#C1F12E', Lua: '#6b7cff',
  Java: '#b07219', Kotlin: '#A97BFF', Go: '#00ADD8', Dockerfile: '#384d54',
  Vue: '#41b883', SCSS: '#c6538c', HLSL: '#aace60', GLSL: '#5686a5', 'Objective-C': '#438eff',
  Makefile: '#427819', CMake: '#DA3434', Swift: '#F05138', PHP: '#4F5D95', Ruby: '#701516',
  TeX: '#3D6117', Svelte: '#ff3e00', Dart: '#00B4AB', Assembly: '#6E4C13', Nix: '#7e7eff',
}
const color = (l) => COLORS[l] || '#8b949e'

const sum = Object.values(totals).reduce((a, b) => a + b, 0)
const top = Object.entries(totals).sort((a, b) => b[1] - a[1]).slice(0, 6)
const size = (b) => b >= 1e6 ? `${(b / 1e6).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1e3))} KB`
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;')

const W = 800, barX = 40, barW = 720, barY = 70
let x = barX
const segs = top.map(([l, b], i) => {
  const w = (b / sum) * barW
  const r = `<rect x="${x.toFixed(1)}" y="${barY}" width="${Math.max(w, 2).toFixed(1)}" height="8" fill="${color(l)}"/>`
  x += w
  return r
}).join('')
const rest = barX + barW - x
const restSeg = rest > 1 ? `<rect x="${x.toFixed(1)}" y="${barY}" width="${rest.toFixed(1)}" height="8" fill="#30363d"/>` : ''

const items = top.map(([l, b], i) => {
  const col = i % 2, row = Math.floor(i / 2)
  const ix = 40 + col * 370, iy = 118 + row * 52
  const pct = ((b / sum) * 100).toFixed(1)
  return `<g class="item" style="animation-delay:${(i * 0.12).toFixed(2)}s">
    <circle cx="${ix + 6}" cy="${iy - 5}" r="6" fill="${color(l)}"/>
    <text x="${ix + 22}" y="${iy}" class="name">${esc(l)}</text>
    <text x="${ix + 330}" y="${iy}" class="pct" text-anchor="end">${pct}%</text>
    <text x="${ix + 22}" y="${iy + 20}" class="sub">${size(b)} of code</text>
  </g>`
}).join('\n  ')

const H = 118 + Math.ceil(top.length / 2) * 52
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <style>
    text { font-family: -apple-system, "Segoe UI", Helvetica, Arial, sans-serif; }
    .title { font-size: 22px; font-weight: 700; fill: #e6edf3; }
    .name { font-size: 16px; fill: #e6edf3; }
    .pct { font-size: 16px; fill: #e6edf3; }
    .sub { font-size: 14px; fill: #8b949e; }
    .bar { animation: grow 1.2s ease-out both; transform-origin: ${barX}px 0; }
    .item { animation: fade 0.6s ease-out both; }
    @keyframes grow { from { transform: scaleX(0); } to { transform: scaleX(1); } }
    @keyframes fade { from { opacity: 0; } to { opacity: 1; } }
  </style>
  <text x="40" y="44" class="title">Most used languages</text>
  <clipPath id="round"><rect x="${barX}" y="${barY}" width="${barW}" height="8" rx="4"/></clipPath>
  <g clip-path="url(#round)" class="bar">${segs}${restSeg}</g>
  ${items}
</svg>
`
mkdirSync(out.replace(/[\\/][^\\/]*$/, ''), { recursive: true })
writeFileSync(out, svg)
console.log(`languages: ${repos.length} repos, ${top.map(([l]) => l).join(', ')}`)
