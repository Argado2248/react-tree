# react-tree

Visualize your React component parent tree in the terminal or browser.

```
App.jsx
├── Navbar.jsx
│   ├── Logo.jsx
│   └── NavLinks.jsx
├── Main.jsx
│   ├── Hero.jsx
│   └── Sidebar.jsx
└── Footer.jsx
```

Zero dependencies. Works with any React project (Vite, CRA, Next.js).

---

## Quick start

### Run instantly with npx (no install)

```bash
npx github:argado2248/react-tree src/App.jsx
```

### Or clone and install globally

```bash
git clone https://github.com/yourname/react-tree
cd react-tree
npm link
```

Now `react-tree` is available anywhere on your machine:

```bash
react-tree src/App.jsx
```

---

## Usage

### Terminal tree

```bash
react-tree src/App.jsx
```

### Open interactive HTML in browser

```bash
react-tree src/App.jsx --html
```

Writes `react-tree.html` and opens it automatically. Nodes are collapsible and hovering shows the full file path.

### Custom output path

```bash
react-tree src/App.jsx --html --out /tmp/my-tree.html
```

---

## Vite plugin

Add to your project's `vite.config.js` to get a live tree at `/__react-tree` while the dev server is running.

```js
import reactTree from 'react-tree/vite'

export default {
  plugins: [
    reactTree({ entry: 'src/App.jsx' })
  ]
}
```

Start your dev server, then visit:

```
http://localhost:5173/__react-tree
```

---

## How it works

react-tree reads your JSX/TSX files and:

1. Finds all local imports (`import Navbar from './Navbar'`)
2. Checks which of those components are actually rendered (`<Navbar />`)
3. Follows the chain recursively to build the full tree

No build step, no AST libraries — just Node.js built-ins.

---

## Options

| Flag | Description |
|---|---|
| `--html` | Generate an interactive HTML page and open it in the browser |
| `--out <path>` | Custom path for the HTML file (default: `react-tree.html`) |
| `--help` | Show usage information |
