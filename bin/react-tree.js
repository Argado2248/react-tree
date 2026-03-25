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
    entry-file    Path to your root component (default: src/App.jsx)

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

// Resolve entry file
const htmlFlag = args.includes('--html')
const outIdx = args.indexOf('--out')
const outPath = outIdx !== -1 ? args[outIdx + 1] : 'react-tree.html'

const positional = args.filter(a => !a.startsWith('--') && args[args.indexOf(a) - 1] !== '--out')
const entry = positional[0] ?? 'src/App.jsx'
const entryAbs = path.resolve(process.cwd(), entry)

if (!fs.existsSync(entryAbs)) {
  console.error(`\n  \x1b[31mError:\x1b[0m File not found: ${entryAbs}\n`)
  console.error('  Usage: react-tree [entry-file]  (default: src/App.jsx)\n')
  process.exit(1)
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
