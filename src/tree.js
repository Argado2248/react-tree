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

/**
 * Walk the tree and collect stats.
 * @returns {{ totalNodes: number, uniqueComponents: number, maxDepth: number, circularCount: number, errorCount: number }}
 */
export function getTreeStats(node, depth = 0, seen = new Set()) {
  seen.add(node.path)
  let totalNodes = 1
  let maxDepth = depth
  let circularCount = node.circular ? 1 : 0
  let errorCount = node.error ? 1 : 0

  for (const child of node.children) {
    const s = getTreeStats(child, depth + 1, seen)
    totalNodes += s.totalNodes
    if (s.maxDepth > maxDepth) maxDepth = s.maxDepth
    circularCount += s.circularCount
    errorCount += s.errorCount
  }

  return { totalNodes, uniqueComponents: seen.size, maxDepth, circularCount, errorCount }
}
