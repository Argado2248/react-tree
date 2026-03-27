import fs from 'fs'
import path from 'path'

const EXTENSIONS = ['.jsx', '.tsx', '.js', '.ts']
const INDEX_FILES = EXTENSIONS.map(e => `index${e}`)

/**
 * Resolve a bare import specifier (e.g. './components/Navbar') to an
 * absolute file path, trying common React extensions.
 */
export function resolveImport(specifier, fromDir) {
  if (!specifier.startsWith('.')) return null // skip node_modules

  const base = path.resolve(fromDir, specifier)

  // Try exact path first (e.g. already has extension)
  if (fs.existsSync(base) && fs.statSync(base).isFile()) return base

  // Try appending extensions
  for (const ext of EXTENSIONS) {
    const candidate = base + ext
    if (fs.existsSync(candidate)) return candidate
  }

  // Try as directory with index file
  for (const index of INDEX_FILES) {
    const candidate = path.join(base, index)
    if (fs.existsSync(candidate)) return candidate
  }

  return null
}

/**
 * Strip comments and template literals so the import / JSX regexes
 * don't match code inside non-executable text.
 * Regular strings are kept intact (import paths are string literals).
 */
function stripNonCode(src) {
  return src.replace(
    /\/\/.*$|\/\*[\s\S]*?\*\/|`(?:\\[\s\S]|[^`])*`|'(?:\\[\s\S]|[^'])*'|"(?:\\[\s\S]|[^"])*"/gm,
    (match) => {
      // Keep single/double-quoted strings (needed for import paths)
      if (match[0] === "'" || match[0] === '"') return match
      // Replace comments and template literals with spaces
      return match.replace(/[^\n]/g, ' ')
    }
  )
}

/**
 * Parse a JSX/TSX file and return:
 * - imports: Map<localName, absoluteFilePath>  (only local relative imports)
 * - usedComponents: Set<localName>  (uppercase tags used in JSX)
 */
export function parseFile(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8')
  const src = stripNonCode(raw)
  const dir = path.dirname(filePath)
  const imports = new Map()

  // Match: import DefaultExport from './path'
  const defaultImportRe = /import\s+(\w+)\s+from\s+['"]([^'"]+)['"]/g
  for (const [, name, spec] of src.matchAll(defaultImportRe)) {
    const resolved = resolveImport(spec, dir)
    if (resolved) imports.set(name, resolved)
  }

  // Match: import { Foo, Bar as Baz } from './path'
  const namedImportRe = /import\s+\{([^}]+)\}\s+from\s+['"]([^'"]+)['"]/g
  for (const [, names, spec] of src.matchAll(namedImportRe)) {
    const resolved = resolveImport(spec, dir)
    if (!resolved) continue
    for (const part of names.split(',')) {
      // handle "Foo as LocalName"
      const alias = part.trim().split(/\s+as\s+/).pop().trim()
      if (/^[A-Z]/.test(alias)) imports.set(alias, resolved)
    }
  }

  // Find JSX component usage: any <UppercaseName tag
  const usedComponents = new Set()
  const jsxTagRe = /<([A-Z]\w*)/g
  for (const [, name] of src.matchAll(jsxTagRe)) {
    usedComponents.add(name)
  }

  return { imports, usedComponents }
}
