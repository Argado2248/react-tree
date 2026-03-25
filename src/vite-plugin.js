import path from 'path'
import { buildTree } from './tree.js'
import { generateHTML } from './html.js'

/**
 * Vite plugin that adds a /__react-tree route to the dev server.
 *
 * Usage in vite.config.js of the target project:
 *
 *   import reactTree from 'react-tree/vite'
 *   export default { plugins: [reactTree({ entry: 'src/App.jsx' })] }
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
        const entryRel = options.entry ?? 'src/App.jsx'
        const entryAbs = path.resolve(projectRoot, entryRel)

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
