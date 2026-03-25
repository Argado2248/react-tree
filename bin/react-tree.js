#!/usr/bin/env node
import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'
import { buildTree } from '../src/tree.js'
import { printTree } from '../src/terminal.js'
import { generateHTML } from '../src/html.js'

const args = process.argv.slice(2)

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

// Build the tree
const tree = buildTree(entryAbs)

if (htmlFlag) {
  // Write HTML file and open it
  const html = generateHTML(tree)
  const outAbs = path.resolve(process.cwd(), outPath)
  fs.writeFileSync(outAbs, html, 'utf8')
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
  printTree(tree)
}
