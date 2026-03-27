/**
 * Generate a self-contained HTML page that renders an interactive
 * collapsible component tree. No external CDN dependencies.
 */
export function generateHTML(tree, stats) {
  const treeJson = JSON.stringify(tree, null, 2)
  const statsJson = stats ? JSON.stringify(stats) : 'null'

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>React Component Tree</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: 'Menlo', 'Consolas', 'Monaco', monospace;
      font-size: 14px;
      background: #0d1117;
      color: #c9d1d9;
      padding: 32px;
      min-height: 100vh;
    }

    h1 {
      font-size: 18px;
      font-weight: 600;
      color: #58a6ff;
      margin-bottom: 8px;
    }

    .subtitle {
      color: #6e7681;
      font-size: 12px;
      margin-bottom: 16px;
    }

    .legend {
      display: flex;
      gap: 16px;
      align-items: center;
      font-size: 12px;
      color: #6e7681;
      margin-bottom: 24px;
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .stats {
      display: flex;
      gap: 12px;
      font-size: 12px;
      color: #8b949e;
      margin-bottom: 20px;
    }

    .stat-item {
      background: #161b22;
      border: 1px solid #21262d;
      border-radius: 6px;
      padding: 4px 10px;
    }

    .stat-value { color: #58a6ff; font-weight: 600; }
    .stat-item.warn .stat-value { color: #e3b341; }
    .stat-item.error .stat-value { color: #f85149; }

    .toolbar {
      display: flex;
      gap: 8px;
      align-items: center;
      margin-bottom: 16px;
      position: sticky;
      top: 0;
      background: #0d1117;
      padding: 8px 0;
      z-index: 50;
    }

    .search-box {
      flex: 1;
      max-width: 320px;
      background: #161b22;
      border: 1px solid #30363d;
      border-radius: 6px;
      padding: 6px 10px;
      font-family: inherit;
      font-size: 13px;
      color: #c9d1d9;
      outline: none;
    }

    .search-box:focus { border-color: #58a6ff; }
    .search-box::placeholder { color: #484f58; }

    .toolbar-btn {
      background: #21262d;
      border: 1px solid #30363d;
      border-radius: 6px;
      padding: 6px 12px;
      font-family: inherit;
      font-size: 12px;
      color: #c9d1d9;
      cursor: pointer;
      white-space: nowrap;
    }

    .toolbar-btn:hover { background: #30363d; }

    .node.dimmed > .node-row { opacity: 0.25; }
    .node.highlighted > .node-row .filename { background: #2d1f00; border-radius: 3px; padding: 0 3px; }

    .tree { user-select: none; }

    .node { position: relative; }

    .node-row {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 3px 6px;
      border-radius: 4px;
      cursor: pointer;
      white-space: nowrap;
    }

    .node-row:hover { background: #161b22; }

    .toggle {
      width: 14px;
      height: 14px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      color: #6e7681;
      font-size: 10px;
      flex-shrink: 0;
    }

    .toggle.leaf { visibility: hidden; }

    .filename { color: #79c0ff; }
    .filename.circular { color: #e3b341; }
    .filename.error { color: #f85149; }

    .badge {
      font-size: 10px;
      padding: 1px 6px;
      border-radius: 10px;
      background: #21262d;
      color: #6e7681;
    }

    .badge.circular { background: #2d2208; color: #e3b341; }
    .badge.error { background: #2d1b1b; color: #f85149; }

    .children {
      padding-left: 20px;
      border-left: 1px solid #21262d;
      margin-left: 13px;
    }

    .children.collapsed { display: none; }

    .path-tooltip {
      position: fixed;
      background: #161b22;
      border: 1px solid #30363d;
      border-radius: 6px;
      padding: 6px 10px;
      font-size: 11px;
      color: #8b949e;
      pointer-events: none;
      display: none;
      z-index: 100;
      max-width: 600px;
      word-break: break-all;
    }
  </style>
</head>
<body>
  <h1>React Component Tree</h1>
  <p class="subtitle">Click any node to expand / collapse &nbsp;·&nbsp; Hover to see file path</p>
  <div class="legend">
    <span class="legend-item"><span class="badge circular">circular</span> component already appears higher in the tree</span>
    <span class="legend-item"><span class="badge error">unreadable</span> file could not be read or parsed</span>
  </div>
  <div class="stats" id="stats"></div>
  <div class="toolbar">
    <input class="search-box" id="search" type="text" placeholder="Search components..." />
    <button class="toolbar-btn" id="expand-all">Expand All</button>
    <button class="toolbar-btn" id="collapse-all">Collapse All</button>
  </div>
  <div class="tree" id="tree"></div>
  <div class="path-tooltip" id="tooltip"></div>

  <script>
    const treeData = ${treeJson}
    const statsData = ${statsJson}

    const tooltip = document.getElementById('tooltip')

    // Render stats
    if (statsData) {
      const statsEl = document.getElementById('stats')
      const items = [
        { label: 'Components', value: statsData.uniqueComponents },
        { label: 'Depth', value: statsData.maxDepth },
      ]
      if (statsData.circularCount > 0) items.push({ label: 'Circular', value: statsData.circularCount, cls: 'warn' })
      if (statsData.errorCount > 0) items.push({ label: 'Unreadable', value: statsData.errorCount, cls: 'error' })
      items.forEach(({ label, value, cls }) => {
        const el = document.createElement('span')
        el.className = 'stat-item' + (cls ? ' ' + cls : '')
        el.innerHTML = '<span class="stat-value">' + value + '</span> ' + label
        statsEl.appendChild(el)
      })
    }

    function createNode(node) {
      const el = document.createElement('div')
      el.className = 'node'

      const row = document.createElement('div')
      row.className = 'node-row'

      const toggle = document.createElement('span')
      toggle.className = 'toggle' + (node.children.length === 0 ? ' leaf' : '')
      toggle.textContent = node.children.length > 0 ? '▶' : '·'
      row.appendChild(toggle)

      const name = document.createElement('span')
      name.className = 'filename' + (node.circular ? ' circular' : '') + (node.error ? ' error' : '')
      name.textContent = node.name
      row.appendChild(name)

      if (node.circular) {
        const badge = document.createElement('span')
        badge.className = 'badge circular'
        badge.textContent = 'circular'
        badge.title = 'This component already appears higher in the tree. Branch cut to prevent infinite loop.'
        row.appendChild(badge)
      } else if (node.error) {
        const badge = document.createElement('span')
        badge.className = 'badge error'
        badge.textContent = 'unreadable'
        badge.title = 'This file could not be read or parsed.'
        row.appendChild(badge)
      } else if (node.children.length > 0) {
        const badge = document.createElement('span')
        badge.className = 'badge'
        badge.textContent = node.children.length + ' child' + (node.children.length > 1 ? 'ren' : '')
        row.appendChild(badge)
      }

      // Tooltip on hover
      row.addEventListener('mouseenter', e => {
        tooltip.textContent = node.path
        tooltip.style.display = 'block'
      })
      row.addEventListener('mousemove', e => {
        tooltip.style.left = (e.clientX + 14) + 'px'
        tooltip.style.top = (e.clientY + 14) + 'px'
      })
      row.addEventListener('mouseleave', () => {
        tooltip.style.display = 'none'
      })

      el.appendChild(row)

      if (node.children.length > 0) {
        const childrenEl = document.createElement('div')
        childrenEl.className = 'children collapsed'

        node.children.forEach(child => {
          childrenEl.appendChild(createNode(child))
        })

        el.appendChild(childrenEl)

        row.addEventListener('click', () => {
          const collapsed = childrenEl.classList.toggle('collapsed')
          toggle.textContent = collapsed ? '▶' : '▼'
        })
      }

      return el
    }

    // Render root (auto-expanded)
    const root = createNode(treeData)
    // Expand root by default
    const rootChildren = root.querySelector('.children')
    if (rootChildren) {
      rootChildren.classList.remove('collapsed')
      root.querySelector('.toggle').textContent = '▼'
    }
    const treeEl = document.getElementById('tree')
    treeEl.appendChild(root)

    // Expand All / Collapse All
    document.getElementById('expand-all').addEventListener('click', () => {
      treeEl.querySelectorAll('.children').forEach(el => el.classList.remove('collapsed'))
      treeEl.querySelectorAll('.toggle:not(.leaf)').forEach(el => { el.textContent = '▼' })
    })
    document.getElementById('collapse-all').addEventListener('click', () => {
      treeEl.querySelectorAll('.children').forEach(el => el.classList.add('collapsed'))
      treeEl.querySelectorAll('.toggle:not(.leaf)').forEach(el => { el.textContent = '▶' })
    })

    // Search
    const searchInput = document.getElementById('search')
    searchInput.addEventListener('input', () => {
      const q = searchInput.value.trim().toLowerCase()
      const allNodes = treeEl.querySelectorAll('.node')

      if (!q) {
        allNodes.forEach(n => { n.classList.remove('dimmed', 'highlighted') })
        return
      }

      // Mark each node: does its name or any descendant name match?
      function markNode(nodeEl) {
        const name = nodeEl.querySelector(':scope > .node-row .filename').textContent.toLowerCase()
        const isMatch = name.includes(q)
        let hasMatchingDescendant = false

        nodeEl.querySelectorAll(':scope > .children > .node').forEach(child => {
          if (markNode(child)) hasMatchingDescendant = true
        })

        const visible = isMatch || hasMatchingDescendant
        nodeEl.classList.toggle('dimmed', !visible)
        nodeEl.classList.toggle('highlighted', isMatch)

        // Auto-expand ancestors of matches
        if (hasMatchingDescendant) {
          const children = nodeEl.querySelector(':scope > .children')
          const toggle = nodeEl.querySelector(':scope > .node-row .toggle')
          if (children) { children.classList.remove('collapsed') }
          if (toggle) { toggle.textContent = '▼' }
        }

        return visible
      }

      allNodes.forEach(n => { n.classList.remove('dimmed', 'highlighted') })
      treeEl.querySelectorAll(':scope > .node').forEach(n => markNode(n))
    })
  </script>
</body>
</html>`
}
