/**
 * Generate a self-contained HTML page that renders an interactive
 * collapsible component tree. No external CDN dependencies.
 */
export function generateHTML(tree) {
  const treeJson = JSON.stringify(tree, null, 2)

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
      margin-bottom: 32px;
    }

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
  <div class="tree" id="tree"></div>
  <div class="path-tooltip" id="tooltip"></div>

  <script>
    const treeData = ${treeJson}

    const tooltip = document.getElementById('tooltip')

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
        row.appendChild(badge)
      } else if (node.error) {
        const badge = document.createElement('span')
        badge.className = 'badge error'
        badge.textContent = 'unreadable'
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
    document.getElementById('tree').appendChild(root)
  </script>
</body>
</html>`
}
