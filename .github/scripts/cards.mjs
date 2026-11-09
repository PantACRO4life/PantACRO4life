// Draws every profile image in the RIS theme (red #e01b31 on #14171b, faint
// grid, red diagonal streaks like the RIS logo, Chakra Petch font):
//   header.svg divider.svg footer.svg   decoration
//   stats.svg contributions.svg languages.svg   live numbers
// and recolors the Pac-Man / Breakout / snake graphs from green to red.
// Uses LANG_TOKEN when set (counts private repos), else GITHUB_TOKEN.
import { writeFileSync, readFileSync, mkdirSync, readdirSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const user = process.env.GH_USER
const token = process.env.LANG_TOKEN || process.env.GITHUB_TOKEN
const out = process.argv[2] || 'assets'
const CW = 850 // every card is this wide
mkdirSync(out, { recursive: true })

const C = {
  bg: '#14171b', panel: '#1c2026', border: '#2a2f37', red: '#e01b31', red2: '#ff2a3d',
  text: '#f2f4f7', dim: '#8d949e',
  levels: ['#1f242b', '#4a0d14', '#7a1220', '#b3172a', '#ff2a3d'],
}
const fontB64 = readFileSync(join(here, '..', 'fonts', 'ChakraPetch-Bold.ttf')).toString('base64')
const FONT_FACE = `@font-face { font-family: "Chakra"; src: url(data:font/ttf;base64,${fontB64}) format("truetype"); font-weight: 700; }`
const BODY = `-apple-system, "Segoe UI", Helvetica, Arial, sans-serif`
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
const fmt = (n) => n.toLocaleString('en-US')

// Faint grid + red glow, shared by every panel.
const defs = (w, h) => `<defs>
    <pattern id="grid" width="24" height="24" patternUnits="userSpaceOnUse">
      <path d="M24 0H0V24" fill="none" stroke="#ffffff" stroke-opacity="0.04"/>
    </pattern>
    <radialGradient id="glow" cx="0.85" cy="0" r="0.9">
      <stop offset="0" stop-color="${C.red}" stop-opacity="0.22"/><stop offset="1" stop-color="${C.red}" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="uline" x1="0" x2="1"><stop offset="0" stop-color="${C.red2}"/><stop offset="1" stop-color="${C.red}" stop-opacity="0"/></linearGradient>
    <linearGradient id="streak" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${C.red2}"/><stop offset="1" stop-color="${C.red}" stop-opacity="0.15"/></linearGradient>
  </defs>`

// Three short red slashes, like the streaks beside the RIS "P".
const streaks = (x, y, s = 1, cls = 'streak') => [0, 1, 2].map((i) =>
  `<line x1="${x + i * 14 * s}" y1="${y}" x2="${x + i * 14 * s + 18 * s}" y2="${y + 30 * s}" stroke="url(#streak)" stroke-width="${3.5 * s}" stroke-linecap="round" class="${cls}" style="animation-delay:${i * 0.15}s"/>`).join('')

const BASE_STYLE = `${FONT_FACE}
    text { font-family: ${BODY}; }
    .h { font-family: "Chakra", ${BODY}; font-weight: 700; }
    .title { font-size: 21px; fill: ${C.text}; letter-spacing: 1px; }
    .fade { animation: fade .6s ease-out both; }
    @keyframes fade { from { opacity: 0; } to { opacity: 1; } }
    .streak { animation: slash 2.8s ease-in-out infinite; }
    @keyframes slash { 0%, 100% { opacity: .35; } 50% { opacity: 1; } }`

function card(w, h, title, body, extraStyle = '') {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <style>${BASE_STYLE}${extraStyle}</style>
  ${defs(w, h)}
  <rect x="0.5" y="0.5" width="${w - 1}" height="${h - 1}" rx="10" fill="${C.bg}" stroke="${C.border}"/>
  <rect x="1" y="1" width="${w - 2}" height="${h - 2}" rx="10" fill="url(#grid)"/>
  <rect x="1" y="1" width="${w - 2}" height="${h - 2}" rx="10" fill="url(#glow)"/>
  <rect x="0" y="18" width="4" height="34" fill="${C.red}"/>
  <text x="28" y="44" class="h title">${esc(title.toUpperCase())}</text>
  <rect x="28" y="54" width="150" height="3" rx="1.5" fill="url(#uline)"/>
  ${streaks(w - 90, 18, 0.8)}
  ${body}
</svg>
`
}

// ---------- decoration ----------
{
  const W = 1000, H = 260
  const header = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <style>${BASE_STYLE}
    .name { font-size: 96px; fill: ${C.text}; letter-spacing: 10px; }
    .ghost { font-size: 96px; letter-spacing: 10px; fill: ${C.red}; opacity: 0; animation: glitch 4s steps(1) infinite; }
    @keyframes glitch { 0%, 88%, 100% { opacity: 0; transform: none; } 90% { opacity: .9; transform: translate(-6px, 2px); } 93% { opacity: .9; transform: translate(5px, -2px); } 96% { opacity: 0; } }
    .sub { font-size: 20px; fill: ${C.dim}; letter-spacing: 4px; }
    .scan { animation: scan 5s linear infinite; }
    @keyframes scan { from { transform: translateX(-300px); } to { transform: translateX(${W + 300}px); } }
    .big { animation: slash 2.8s ease-in-out infinite; }
  </style>
  ${defs(W, H)}
  <linearGradient id="beam" x1="0" x2="1"><stop offset="0" stop-color="${C.red2}" stop-opacity="0"/><stop offset=".5" stop-color="${C.red2}" stop-opacity=".9"/><stop offset="1" stop-color="${C.red2}" stop-opacity="0"/></linearGradient>
  <rect width="${W}" height="${H}" rx="12" fill="${C.bg}"/>
  <rect width="${W}" height="${H}" rx="12" fill="url(#grid)"/>
  <rect width="${W}" height="${H}" rx="12" fill="url(#glow)"/>
  ${streaks(120, 70, 2.2, 'big')}
  ${streaks(800, 120, 2.2, 'big')}
  <text x="${W / 2}" y="140" text-anchor="middle" class="h ghost">JAY</text>
  <text x="${W / 2}" y="140" text-anchor="middle" class="h name">JAY</text>
  <rect x="${W / 2 - 120}" y="160" width="240" height="4" rx="2" fill="${C.red}"/>
  <text x="${W / 2}" y="200" text-anchor="middle" class="h sub">IT SPECIALIST  /  TOOL BUILDER  /  GAME MODDER</text>
  <rect x="0" y="${H - 3}" width="300" height="3" fill="url(#beam)" class="scan"/>
</svg>
`
  writeFileSync(`${out}/header.svg`, header)

  const dW = 1000, dH = 24
  const divider = `<svg xmlns="http://www.w3.org/2000/svg" width="${dW}" height="${dH}" viewBox="0 0 ${dW} ${dH}">
  <style>.run { animation: run 3.5s linear infinite; } @keyframes run { from { transform: translateX(-200px); } to { transform: translateX(${dW + 200}px); } }</style>
  <defs>
    <linearGradient id="fadeLine" x1="0" x2="1"><stop offset="0" stop-color="${C.red}" stop-opacity="0"/><stop offset=".5" stop-color="${C.red}"/><stop offset="1" stop-color="${C.red}" stop-opacity="0"/></linearGradient>
    <linearGradient id="spark" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
  </defs>
  <rect x="0" y="11" width="${dW}" height="2" fill="url(#fadeLine)"/>
  <rect x="0" y="11" width="160" height="2" fill="url(#spark)" class="run"/>
  <g transform="translate(${dW / 2 - 18} 4)">
    <line x1="0" y1="0" x2="8" y2="16" stroke="${C.red2}" stroke-width="3" stroke-linecap="round"/>
    <line x1="14" y1="0" x2="22" y2="16" stroke="${C.red2}" stroke-width="3" stroke-linecap="round"/>
    <line x1="28" y1="0" x2="36" y2="16" stroke="${C.red2}" stroke-width="3" stroke-linecap="round"/>
  </g>
</svg>
`
  writeFileSync(`${out}/divider.svg`, divider)

  const fH = 90
  const footer = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${fH}" viewBox="0 0 ${W} ${fH}">
  <style>${BASE_STYLE} .msg { font-size: 16px; fill: ${C.dim}; letter-spacing: 6px; } .big { animation: slash 2.8s ease-in-out infinite; }</style>
  ${defs(W, fH)}
  <rect width="${W}" height="${fH}" rx="12" fill="${C.bg}"/>
  <rect width="${W}" height="${fH}" rx="12" fill="url(#grid)"/>
  <rect x="0" y="0" width="${W}" height="3" fill="${C.red}"/>
  ${streaks(60, 28, 1.1, 'big')}
  ${streaks(W - 110, 28, 1.1, 'big')}
  <text x="${W / 2}" y="54" text-anchor="middle" class="h msg">THANKS FOR STOPPING BY</text>
</svg>
`
  writeFileSync(`${out}/footer.svg`, footer)
}

// ---------- data ----------
const headers = { Accept: 'application/vnd.github+json', 'User-Agent': 'profile-cards' }
if (token) headers.Authorization = `Bearer ${token}`
async function rest(url) {
  const r = await fetch(url, { headers })
  if (!r.ok) throw new Error(`${r.status} ${url}`)
  return r.json()
}
async function gql(query, variables) {
  const r = await fetch('https://api.github.com/graphql', { method: 'POST', headers, body: JSON.stringify({ query, variables }) })
  const j = await r.json()
  if (j.errors) throw new Error(JSON.stringify(j.errors))
  return j.data
}

const data = await gql(`query($login: String!) {
  user(login: $login) {
    repositories(ownerAffiliations: OWNER, first: 100, isFork: false) { totalCount nodes { stargazerCount } }
    contributionsCollection {
      totalCommitContributions totalPullRequestContributions totalIssueContributions
      contributionCalendar { totalContributions weeks { contributionDays { contributionCount date } } }
    }
  }
}`, { login: user })

const u = data.user
const cc = u.contributionsCollection
const cal = cc.contributionCalendar
const days = cal.weeks.flatMap((w) => w.contributionDays)
const stars = u.repositories.nodes.reduce((a, r) => a + r.stargazerCount, 0)

let longest = 0, run = 0
for (const d of days) { run = d.contributionCount > 0 ? run + 1 : 0; longest = Math.max(longest, run) }
let current = 0
for (let i = days.length - 1; i >= 0; i--) {
  if (days[i].contributionCount > 0) current++
  else if (i === days.length - 1) continue // today not done yet
  else break
}

// ---------- stats.svg ----------
{
  const W = CW, H = 250
  const rows = [
    ['CONTRIBUTIONS / YEAR', cal.totalContributions], ['COMMITS', cc.totalCommitContributions],
    ['PULL REQUESTS', cc.totalPullRequestContributions], ['ISSUES', cc.totalIssueContributions],
    ['REPOSITORIES', u.repositories.totalCount], ['STARS EARNED', stars],
  ]
  const list = rows.map(([label, n], i) => {
    const col = i % 2, row = Math.floor(i / 2)
    const x = 28 + col * 250, y = 100 + row * 50
    return `<g class="fade" style="animation-delay:${(i * 0.1).toFixed(1)}s">
      <polygon points="${x},${y - 14} ${x + 6},${y - 14} ${x + 2},${y + 22} ${x - 4},${y + 22}" fill="${C.red}"/>
      <text x="${x + 14}" y="${y}" font-size="12" fill="${C.dim}" class="h" letter-spacing="1">${label}</text>
      <text x="${x + 14}" y="${y + 22}" font-size="22" fill="${C.text}" class="h">${fmt(n)}</text>
    </g>`
  }).join('\n  ')
  const cx = W - 140, cy = 130, r = 56, circ = 2 * Math.PI * r
  const ring = `
  <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${C.panel}" stroke-width="10"/>
  <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${C.red}" stroke-width="10" stroke-linecap="round"
    stroke-dasharray="${circ.toFixed(1)}" stroke-dashoffset="${circ.toFixed(1)}" transform="rotate(-90 ${cx} ${cy})" class="draw"/>
  <circle cx="${cx}" cy="${cy}" r="${r + 14}" fill="none" stroke="${C.red2}" stroke-width="2" class="pulse"/>
  <text x="${cx}" y="${cy + 12}" text-anchor="middle" font-size="40" fill="${C.text}" class="h">${current}</text>
  <text x="${cx}" y="${cy + r + 36}" text-anchor="middle" font-size="14" fill="${C.red2}" class="h" letter-spacing="1">CURRENT STREAK</text>
  <text x="${cx}" y="${cy + r + 54}" text-anchor="middle" font-size="12" fill="${C.dim}">Longest: ${longest} days</text>`
  const style = `
    .draw { animation: draw 1.6s ease-out forwards; }
    @keyframes draw { to { stroke-dashoffset: 0; } }
    .pulse { transform-origin: ${cx}px ${cy}px; animation: pulse 2.4s ease-out infinite; }
    @keyframes pulse { 0% { opacity: .8; transform: scale(.85); } 100% { opacity: 0; transform: scale(1.18); } }`
  writeFileSync(`${out}/stats.svg`, card(W, H, 'GitHub stats', list + ring, style))
}

// ---------- contributions.svg ----------
{
  const cell = 12, gap = 3, step = cell + gap, left = 28, top = 86
  const gridW = cal.weeks.length * step - gap
  const W = CW, H = top + 7 * step + 46
  const counts = days.map((d) => d.contributionCount).filter((n) => n > 0).sort((a, b) => a - b)
  const q = (p) => counts.length ? counts[Math.min(counts.length - 1, Math.floor(p * counts.length))] : 1
  const t1 = q(0.25), t2 = q(0.5), t3 = q(0.75)
  const level = (n) => n === 0 ? 0 : n <= t1 ? 1 : n <= t2 ? 2 : n <= t3 ? 3 : 4
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']
  const ox = (W - gridW) / 2
  let lastMonth = -1
  const parts = cal.weeks.map((w, wi) => {
    const x = ox + wi * step
    const first = new Date(w.contributionDays[0].date)
    let label = ''
    if (first.getUTCMonth() !== lastMonth && first.getUTCDate() <= 7) {
      lastMonth = first.getUTCMonth()
      label = `<text x="${x}" y="${top - 8}" font-size="11" fill="${C.dim}" class="h">${months[lastMonth]}</text>`
    }
    const cells = w.contributionDays.map((d) => {
      const y = top + new Date(d.date).getUTCDay() * step
      return `<rect x="${x}" y="${y}" width="${cell}" height="${cell}" rx="2" fill="${C.levels[level(d.contributionCount)]}"><title>${d.date}: ${d.contributionCount}</title></rect>`
    }).join('')
    return `${label}<g class="col" style="animation-delay:${(wi * 0.025).toFixed(3)}s">${cells}</g>`
  }).join('\n  ')
  const legend = C.levels.map((c, i) => `<rect x="${W - 64 - (5 - i) * 16}" y="${H - 32}" width="12" height="12" rx="2" fill="${c}"/>`).join('')
  const body = `${parts}
  <text x="${ox}" y="${H - 21}" font-size="13" fill="${C.dim}">${fmt(cal.totalContributions)} contributions in the last year</text>
  <text x="${W - 64 - 5 * 16 - 8}" y="${H - 21}" text-anchor="end" font-size="11" fill="${C.dim}">Less</text>${legend}
  <text x="${W - 58}" y="${H - 21}" font-size="11" fill="${C.dim}">More</text>`
  const style = `
    .col { animation: pop .5s ease-out both; }
    @keyframes pop { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }`
  writeFileSync(`${out}/contributions.svg`, card(W, H, 'Contributions', body, style))
}

// ---------- languages.svg ----------
{
  // Net lines per language from lines.mjs (vendor code and bulk imports skipped).
  const lines = JSON.parse(readFileSync(join(out, "lines.json"), "utf8"))
  const totals = {}
  for (const [lang, t] of Object.entries(lines.totals)) {
    const net = t.added - t.deleted
    if (net > 0) totals[lang] = net
  }
  // Linguist colors, near-black ones lifted so they show on dark.
  const COLORS = {
    JavaScript: '#f1e05a', TypeScript: '#3178c6', Rust: '#dea584', Python: '#3572A5',
    'C#': '#178600', 'C++': '#f34b7d', C: '#9a9a9a', HTML: '#e34c26', CSS: '#7a4fbf',
    PowerShell: '#5391FE', Shell: '#89e051', Batchfile: '#C1F12E', Lua: '#6b7cff',
    Java: '#b07219', Kotlin: '#A97BFF', Go: '#00ADD8', Dockerfile: '#5b8fa3',
    Vue: '#41b883', SCSS: '#c6538c', HLSL: '#aace60', GLSL: '#5686a5',
    Makefile: '#427819', CMake: '#DA3434', Swift: '#F05138', PHP: '#4F5D95', Ruby: '#c22d2d',
    TeX: '#3D6117', Svelte: '#ff3e00', Dart: '#00B4AB', Assembly: '#a07a4a',
  }
  const color = (l) => COLORS[l] || '#8b949e'
  const sum = Object.values(totals).reduce((a, b) => a + b, 0) || 1
  const top = Object.entries(totals).sort((a, b) => b[1] - a[1]).slice(0, 6)
  const size = (n) => `+${fmt(n)} net lines`
  const W = CW, barX = 28, barW = W - 56, barY = 78
  let x = barX
  const segs = top.map(([l, b]) => {
    const w = (b / sum) * barW
    const s = `<rect x="${x.toFixed(1)}" y="${barY}" width="${Math.max(w, 2).toFixed(1)}" height="10" fill="${color(l)}"/>`
    x += w
    return s
  }).join('')
  const rest_ = barX + barW - x
  const restSeg = rest_ > 1 ? `<rect x="${x.toFixed(1)}" y="${barY}" width="${rest_.toFixed(1)}" height="10" fill="${C.border}"/>` : ''
  const items = top.map(([l, b], i) => {
    const col = i % 2, row = Math.floor(i / 2)
    const ix = 28 + col * ((W - 56) / 2 + 14), iy = 128 + row * 52
    return `<g class="fade" style="animation-delay:${(0.6 + i * 0.12).toFixed(2)}s">
      <rect x="${ix}" y="${iy - 11}" width="12" height="12" rx="2" fill="${color(l)}"/>
      <text x="${ix + 22}" y="${iy}" font-size="17" fill="${C.text}" class="h">${esc(l)}</text>
      <text x="${ix + (W - 56) / 2 - 36}" y="${iy}" font-size="17" fill="${C.text}" class="h" text-anchor="end">${((b / sum) * 100).toFixed(1)}%</text>
      <text x="${ix + 22}" y="${iy + 20}" font-size="13" fill="${C.dim}">${size(b)}</text>
    </g>`
  }).join('\n  ')
  const H = 128 + Math.ceil(top.length / 2) * 52 + 4
  const body = `<clipPath id="round"><rect x="${barX}" y="${barY}" width="${barW}" height="10" rx="5"/></clipPath>
  <g clip-path="url(#round)" class="bar">${segs}${restSeg}</g>
  ${items}`
  const style = `
    .bar { animation: grow 1.2s ease-out both; transform-origin: ${barX}px 0; }
    @keyframes grow { from { transform: scaleX(0); } to { transform: scaleX(1); } }`
  writeFileSync(`${out}/languages.svg`, card(W, H, 'Most used languages', body, style))
  console.log(`languages: ${lines.repos} repos, ${top.map(([l]) => l).join(', ')}`)
}

// ---------- recolor the arcade graphs (GitHub green -> RIS red) ----------
{
  const map = {
    // GitHub dark contribution greens
    '#0e4429': C.levels[1], '#006d32': C.levels[2], '#26a641': C.levels[3], '#39d353': C.levels[4],
    // GitHub light contribution greens
    '#9be9a8': C.levels[1], '#40c463': C.levels[2], '#30a14e': C.levels[3], '#216e39': C.levels[4],
  }
  for (const f of existsSync(out) ? readdirSync(out) : []) {
    if (!/^(pacman|breakout|github-snake).*\.svg$/.test(f)) continue
    let s = readFileSync(join(out, f), 'utf8')
    for (const [from, to] of Object.entries(map)) s = s.replace(new RegExp(from, 'gi'), to)
    writeFileSync(join(out, f), s)
  }
}

console.log(`stats: ${cal.totalContributions} contributions, streak ${current}, longest ${longest}`)
