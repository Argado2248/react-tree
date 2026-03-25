import path from 'path'
import { parseFile } from './parser.js'

/**
 * Recursively build a component tree starting from entryFile.
 *
 * Returns a node:
 * {
 *   name: string,       // filename, e.g. "App.jsx"
 *   path: string,       // absolute path
 *   children: Node[],
 *   circular?: true     // if this node was already visited (cycle)
 * }
 */
export function buildTree(entryFile, visited = new Set()) {
  const absPath = path.resolve(entryFile)
  const name = path.basename(absPath)

  if (visited.has(absPath)) {
    return { name, path: absPath, children: [], circular: true }
  }

  visited.add(absPath)

  let imports, usedComponents
  try {
    ;({ imports, usedComponents } = parseFile(absPath))
  } catch {
    return { name, path: absPath, children: [], error: true }
  }

  const children = []
  for (const [localName, childPath] of imports) {
    if (usedComponents.has(localName)) {
      children.push(buildTree(childPath, visited))
    }
  }

  return { name, path: absPath, children }
}
