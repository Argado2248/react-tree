import fs from 'fs'
import path from 'path'

const CRA_BOILERPLATE = [
  'src/logo.svg',
  'src/reportWebVitals.js',
  'src/reportWebVitals.ts',
  'src/setupTests.js',
  'src/setupTests.ts',
  'src/App.test.js',
  'src/App.test.jsx',
  'src/App.test.ts',
  'src/App.test.tsx',
  'public/logo192.png',
  'public/logo512.png',
  'public/manifest.json',
  'public/robots.txt',
  'src/App.css',
  'src/index.css',
]

const VITE_BOILERPLATE = [
  'public/vite.svg',
  'public/favicon.svg',
  'public/icons.svg',
  'src/assets/react.svg',
  'src/assets/vite.svg',
  'src/assets/hero.png',
  'src/App.css',
  'src/index.css',
]

const MINIMAL_APP = `function App() {
  return <h1>Hello World</h1>
}

export default App
`

function detectProjectType(cwd) {
  const pkgPath = path.join(cwd, 'package.json')
  if (!fs.existsSync(pkgPath)) return null

  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'))

  if (pkg.dependencies?.['react-scripts']) return 'cra'

  if (pkg.devDependencies?.['vite'] || pkg.dependencies?.['vite']) return 'vite'

  const viteConfigs = ['vite.config.js', 'vite.config.ts', 'vite.config.mjs']
  for (const conf of viteConfigs) {
    if (fs.existsSync(path.join(cwd, conf))) return 'vite'
  }

  return null
}

function deleteBoilerplateFiles(cwd, projectType) {
  const fileList = projectType === 'cra' ? CRA_BOILERPLATE : VITE_BOILERPLATE
  let count = 0

  for (const rel of fileList) {
    const abs = path.join(cwd, rel)
    if (fs.existsSync(abs)) {
      try {
        fs.unlinkSync(abs)
        console.log(`  \x1b[31m\u2717\x1b[0m  Deleted ${rel}`)
        count++
      } catch (e) {
        console.log(`  \x1b[31m!\x1b[0m  Failed to delete ${rel}: ${e.message}`)
      }
    }
  }

  // Remove src/assets/ if empty (Vite)
  if (projectType === 'vite') {
    const assetsDir = path.join(cwd, 'src/assets')
    if (fs.existsSync(assetsDir)) {
      try {
        const entries = fs.readdirSync(assetsDir)
        if (entries.length === 0) {
          fs.rmdirSync(assetsDir)
          console.log(`  \x1b[31m\u2717\x1b[0m  Removed empty directory src/assets/`)
        }
      } catch { /* ignore */ }
    }
  }

  return count
}

function replaceAppFile(cwd) {
  const candidates = ['src/App.jsx', 'src/App.tsx']
  for (const rel of candidates) {
    const abs = path.join(cwd, rel)
    if (fs.existsSync(abs)) {
      fs.writeFileSync(abs, MINIMAL_APP, 'utf8')
      console.log(`  \x1b[36m\u2713\x1b[0m  Replaced ${rel} with minimal starter`)
      return
    }
  }
  console.log(`  \x1b[33m!\x1b[0m  No App.jsx or App.tsx found — skipped`)
}

function collapseBlankLines(str) {
  return str.replace(/\n{3,}/g, '\n\n')
}

function cleanEntryFile(cwd, projectType) {
  const candidates = projectType === 'cra'
    ? ['src/index.js', 'src/index.jsx', 'src/index.ts', 'src/index.tsx']
    : ['src/main.jsx', 'src/main.tsx', 'src/main.js', 'src/main.ts']

  const removePatternsForCRA = [
    /^\s*import\s.*['"]\.\/reportWebVitals['"]/,
    /^\s*import\s+['"]\.\/index\.css['"]/,
    /^\s*reportWebVitals\s*\(/,
  ]

  const removePatternsForVite = [
    /^\s*import\s+['"]\.\/index\.css['"]/,
  ]

  const patterns = projectType === 'cra' ? removePatternsForCRA : removePatternsForVite

  for (const rel of candidates) {
    const abs = path.join(cwd, rel)
    if (fs.existsSync(abs)) {
      const original = fs.readFileSync(abs, 'utf8')
      const lines = original.split('\n')
      const filtered = lines.filter(line => !patterns.some(p => p.test(line)))
      const cleaned = collapseBlankLines(filtered.join('\n'))
      if (cleaned !== original) {
        fs.writeFileSync(abs, cleaned, 'utf8')
        console.log(`  \x1b[36m\u2713\x1b[0m  Cleaned up ${rel}`)
      }
      return
    }
  }
  console.log(`  \x1b[33m!\x1b[0m  No entry file found — skipped`)
}

function cleanIndexHtml(cwd, projectType) {
  const rel = projectType === 'cra' ? 'public/index.html' : 'index.html'
  const abs = path.join(cwd, rel)

  if (!fs.existsSync(abs)) {
    console.log(`  \x1b[33m!\x1b[0m  No ${rel} found — skipped`)
    return
  }

  const removePatterns = projectType === 'cra'
    ? [/manifest\.json/, /logo192\.png/, /logo512\.png/]
    : [/vite\.svg/, /favicon\.svg/]

  const original = fs.readFileSync(abs, 'utf8')
  const lines = original.split('\n')
  const filtered = lines.filter(line => !removePatterns.some(p => p.test(line)))
  const cleaned = collapseBlankLines(filtered.join('\n'))

  if (cleaned !== original) {
    fs.writeFileSync(abs, cleaned, 'utf8')
    console.log(`  \x1b[36m\u2713\x1b[0m  Cleaned up ${rel}`)
  }
}

export function cleanProject(cwd) {
  console.log(`\n  \x1b[1mreact-tree clean\x1b[0m`)
  console.log(`  \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500`)

  const projectType = detectProjectType(cwd)
  if (!projectType) {
    console.error(`\n  \x1b[31mError:\x1b[0m Could not detect project type (CRA or Vite).`)
    console.error(`  \x1b[90mMake sure you're in a React project directory with a package.json.\x1b[0m\n`)
    process.exit(1)
  }

  const label = projectType === 'cra' ? 'Create React App' : 'Vite'
  console.log(`\n  \x1b[90mDetected:\x1b[0m ${label} project\n`)

  deleteBoilerplateFiles(cwd, projectType)
  replaceAppFile(cwd)
  cleanEntryFile(cwd, projectType)
  cleanIndexHtml(cwd, projectType)

  console.log(`\n  \x1b[32mDone! Your project is clean.\x1b[0m\n`)
}
