#!/usr/bin/env node
import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'
import { buildTree, getTreeStats } from '../src/tree.js'
import { printTree } from '../src/terminal.js'
import { generateHTML } from '../src/html.js'

const args = process.argv.slice(2)

// ── Self-update ─────────────────────────────────────────────
const REPO_DIR = path.resolve(new URL('.', import.meta.url).pathname, '..')

function selfUpdate() {
  console.log(`\n  \x1b[36m⟳\x1b[0m  Updating react-tree...`)
  try {
    execSync('git pull --ff-only', { cwd: REPO_DIR, stdio: 'pipe' })
    const msg = execSync('git log -1 --pretty=%s', { cwd: REPO_DIR, encoding: 'utf8' }).trim()
    console.log(`  \x1b[32m✓\x1b[0m  Up to date — latest: ${msg}\n`)
  } catch {
    console.error(`  \x1b[31m✗\x1b[0m  Update failed. Run manually:\n      cd ${REPO_DIR} && git pull\n`)
    process.exit(1)
  }
}

// Check for updates once per day (non-blocking, best-effort)
function checkForUpdates() {
  const stampFile = path.join(REPO_DIR, '.last-update-check')
  const ONE_DAY = 24 * 60 * 60 * 1000

  try {
    if (fs.existsSync(stampFile)) {
      const lastCheck = Number(fs.readFileSync(stampFile, 'utf8'))
      if (Date.now() - lastCheck < ONE_DAY) return
    }

    fs.writeFileSync(stampFile, String(Date.now()))

    const local = execSync('git rev-parse HEAD', { cwd: REPO_DIR, encoding: 'utf8' }).trim()
    const remote = execSync('git ls-remote origin HEAD', { cwd: REPO_DIR, encoding: 'utf8', timeout: 5000 })
      .split('\t')[0].trim()

    if (local !== remote) {
      console.log(`\n  \x1b[33m⟳  Update available!\x1b[0m  Run \x1b[1mreact-tree --update\x1b[0m to get the latest version.`)
    }
  } catch {
    // Silently ignore — no network, no git, etc.
  }
}

if (args.includes('--update')) {
  selfUpdate()
  process.exit(0)
}

if (args.includes('--help') || args.includes('-h')) {
  console.log(`
  react-tree — Visualize your React component tree

  Usage:
    react-tree [entry-file] [options]

  Arguments:
    entry-file    Path to your root component (auto-detected if omitted)

  Options:
    --html        Generate react-tree.html and open it in your browser
    --out <path>  Custom output path for --html (default: react-tree.html)
    --watch       Rebuild automatically when source files change
    --update      Pull the latest version from GitHub
    --help        Show this help message

  Examples:
    react-tree src/App.jsx
    react-tree src/main.jsx --html
    react-tree src/App.tsx --html --out /tmp/tree.html

  Vite plugin (add to vite.config.js):
    import reactTree from 'react-tree/vite'
    export default { plugins: [reactTree({ entry: 'src/App.jsx' })] }
    → visit http://localhost:5173/__react-tree
`)
  process.exit(0)
}

// Check for updates in the background (once per day, non-blocking)
checkForUpdates()

// Common React entry points to auto-detect
const ENTRY_CANDIDATES = [
  'src/App.jsx',
  'src/App.tsx',
  'src/app.jsx',
  'src/app.tsx',
  'src/main.jsx',
  'src/main.tsx',
  'src/index.jsx',
  'src/index.tsx',
  'app/page.jsx',     // Next.js App Router
  'app/page.tsx',
  'pages/index.jsx',  // Next.js Pages Router
  'pages/index.tsx',
  'pages/_app.jsx',
  'pages/_app.tsx',
]

function detectEntry(cwd) {
  for (const candidate of ENTRY_CANDIDATES) {
    const abs = path.resolve(cwd, candidate)
    if (fs.existsSync(abs)) return { rel: candidate, abs }
  }
  return null
}

// Resolve entry file
const htmlFlag = args.includes('--html')
const watchFlag = args.includes('--watch')
const outIdx = args.indexOf('--out')
const outPath = outIdx !== -1 ? args[outIdx + 1] : 'react-tree.html'

const positional = args.filter(a => !a.startsWith('--') && args[args.indexOf(a) - 1] !== '--out')
let entryAbs

if (positional[0]) {
  entryAbs = path.resolve(process.cwd(), positional[0])
  if (!fs.existsSync(entryAbs)) {
    console.error(`\n  \x1b[31mError:\x1b[0m File not found: ${entryAbs}\n`)
    process.exit(1)
  }
} else {
  const detected = detectEntry(process.cwd())
  if (detected) {
    entryAbs = detected.abs
    console.log(`\n  \x1b[90mAuto-detected entry:\x1b[0m ${detected.rel}`)
  } else {
    console.error(`\n  \x1b[31mError:\x1b[0m Could not find a React entry file.`)
    console.error(`  \x1b[90mTried: ${ENTRY_CANDIDATES.slice(0, 4).join(', ')} ...\x1b[0m`)
    console.error(`\n  Specify one manually: react-tree src/YourApp.jsx\n`)
    process.exit(1)
  }
}

// Build and output the tree
function run() {
  const tree = buildTree(entryAbs)
  const stats = getTreeStats(tree)

  if (htmlFlag) {
    const html = generateHTML(tree, stats)
    const outAbs = path.resolve(process.cwd(), outPath)
    fs.writeFileSync(outAbs, html, 'utf8')
    return outAbs
  } else {
    printTree(tree, stats)
    return null
  }
}

if (htmlFlag) {
  const outAbs = run()
  console.log(`\n  \x1b[36m✓\x1b[0m  Wrote ${outAbs}`)

  // Open in default browser (cross-platform)
  try {
    const open = process.platform === 'darwin' ? 'open'
      : process.platform === 'win32' ? 'start'
      : 'xdg-open'
    execSync(`${open} "${outAbs}"`)
  } catch {
    console.log(`  Open it manually in your browser.`)
  }
  console.log('')
} else {
  run()
}

// ── Watch mode ──────────────────────────────────────────────
if (watchFlag) {
  const COMPONENT_EXT = /\.(jsx|tsx|js|ts)$/
  const DEBOUNCE_MS = 300
  const watchDir = path.dirname(entryAbs)

  let timeout = null
  const rebuild = () => {
    const time = new Date().toLocaleTimeString()
    try {
      if (htmlFlag) {
        const outAbs = run()
        console.log(`  \x1b[36m✓\x1b[0m  Rebuilt ${path.basename(outAbs)} at ${time}`)
      } else {
        process.stdout.write('\x1b[2J\x1b[H') // clear screen
        run()
        console.log(`\x1b[90m  Rebuilt at ${time} — watching for changes...\x1b[0m\n`)
      }
    } catch (err) {
      console.error(`  \x1b[31m✗\x1b[0m  Rebuild failed at ${time}: ${err.message}`)
    }
  }

  console.log(`\x1b[90m  Watching ${path.relative(process.cwd(), watchDir) || '.'} for changes... (Ctrl+C to stop)\x1b[0m\n`)

  fs.watch(watchDir, { recursive: true }, (_event, filename) => {
    if (!filename || !COMPONENT_EXT.test(filename)) return
    clearTimeout(timeout)
    timeout = setTimeout(rebuild, DEBOUNCE_MS)
  })

  process.on('SIGINT', () => {
    console.log(`\n  \x1b[90mStopped watching.\x1b[0m\n`)
    process.exit(0)
  })
}
