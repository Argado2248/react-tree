// ANSI color helpers — no external dependencies
const c = {
  cyan: s => `\x1b[36m${s}\x1b[0m`,
  yellow: s => `\x1b[33m${s}\x1b[0m`,
  gray: s => `\x1b[90m${s}\x1b[0m`,
  red: s => `\x1b[31m${s}\x1b[0m`,
  bold: s => `\x1b[1m${s}\x1b[0m`,
}

/**
 * Render a tree node as an ASCII string.
 *
 * @param {object} node    - tree node from buildTree()
 * @param {string} prefix  - current line prefix (used in recursion)
 * @param {boolean} isLast - whether this is the last sibling
 * @param {boolean} isRoot - true only for the entry node
 * @returns {string}
 */
export function renderTree(node, prefix = '', isLast = true, isRoot = true) {
  const connector = isRoot ? '' : isLast ? '└── ' : '├── '
  // continuation bar passed down to children
  const continuation = isRoot ? '' : isLast ? '    ' : '│   '

  let label = c.cyan(node.name)
  if (node.circular) label += ' ' + c.yellow('(circular)')
  if (node.error) label += ' ' + c.red('(unreadable)')

  let lines = `${c.gray(prefix + connector)}${label}\n`

  const childPrefix = prefix + continuation
  node.children.forEach((child, i) => {
    const last = i === node.children.length - 1
    lines += renderTree(child, childPrefix, last, false)
  })

  return lines
}

/**
 * Print the tree to stdout with a header.
 */
export function printTree(tree) {
  console.log('')
  console.log(c.bold('  React Component Tree'))
  console.log(c.gray('  ─────────────────────'))
  process.stdout.write('  ' + renderTree(tree).replace(/\n/g, '\n  ').trimEnd())
  console.log('\n')
}
