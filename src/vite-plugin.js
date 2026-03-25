import fs from 'fs'
import path from 'path'
import { buildTree } from './tree.js'
import { generateHTML } from './html.js'

const ENTRY_CANDIDATES = [
  'src/App.jsx', 'src/App.tsx', 'src/app.jsx', 'src/app.tsx',
  'src/main.jsx', 'src/main.tsx', 'src/index.jsx', 'src/index.tsx',
  'app/page.jsx', 'app/page.tsx',
  'pages/index.jsx', 'pages/index.tsx', 'pages/_app.jsx', 'pages/_app.tsx',
]

function detectEntry(root) {
  for (const candidate of ENTRY_CANDIDATES) {
    const abs = path.resolve(root, candidate)
    if (fs.existsSync(abs)) return abs
  }
  return null
}

/**
 * Vite plugin that adds a /__react-tree route to the dev server.
 *
 * Usage in vite.config.js of the target project:
 *
 *   import reactTree from 'react-tree/vite'
 *   export default { plugins: [reactTree()] }
 *
 * Entry is auto-detected. To override:
 *
 *   reactTree({ entry: 'src/MyApp.tsx' })
 *
 * Then visit: http://localhost:5173/__react-tree
 *
 * @param {{ entry?: string }} options
 */
export default function reactTreePlugin(options = {}) {
  let projectRoot = process.cwd()

  return {
    name: 'react-tree',

    configResolved(config) {
      projectRoot = config.root
    },

    configureServer(server) {
      server.middlewares.use('/__react-tree', (_req, res) => {
        let entryAbs
        if (options.entry) {
          entryAbs = path.resolve(projectRoot, options.entry)
        } else {
          entryAbs = detectEntry(projectRoot)
        }

        if (!entryAbs) {
          res.setHeader('Content-Type', 'text/html')
          res.end(`<pre style="color:red;padding:2rem">Could not auto-detect entry file.\nPass { entry: 'src/YourApp.jsx' } to the plugin.</pre>`)
          return
        }

        let html
        try {
          const tree = buildTree(entryAbs)
          html = generateHTML(tree)
        } catch (err) {
          html = `<pre style="color:red;padding:2rem">Error building tree:\n${err.message}</pre>`
        }

        res.setHeader('Content-Type', 'text/html')
        res.end(html)
      })

      // Print a friendly hint when the dev server starts
      server.httpServer?.once('listening', () => {
        const addr = server.httpServer.address()
        const port = typeof addr === 'object' ? addr?.port : 5173
        console.log(`\n  \x1b[36m➜  react-tree:\x1b[0m  http://localhost:${port}/__react-tree\n`)
      })
    },
  }
}
