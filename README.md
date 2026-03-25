# React Tree

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
Auto-detects your entry file — no configuration needed.

**Made with Claude Code**

---

## Quick start

### Run instantly with npx (no install)

```bash
npx github:argado2248/react-tree
```

That's it. It auto-detects `src/App.jsx`, `src/main.tsx`, `pages/index.tsx`, etc.

### Or clone and install globally

```bash
git clone https://github.com/argado2248/react-tree
cd react-tree
npm link
```

Now `react-tree` is available anywhere on your machine:

```bash
cd your-react-project
react-tree
```

It checks for updates once per day and lets you know when a new version is available.

---

## Usage

### Terminal tree (auto-detect)

```bash
react-tree
```

### Specify entry manually

```bash
react-tree src/App.jsx
```

### Open interactive HTML in browser

```bash
react-tree --html
```

Writes `react-tree.html` and opens it automatically. Nodes are collapsible and hovering shows the full file path.

### Custom output path

```bash
react-tree --html --out /tmp/my-tree.html
```

---

## Auto-detection

When no entry file is specified, react-tree looks for these files in order:

| Framework | Files checked |
| --- | --- |
| Vite / CRA | `src/App.jsx`, `src/App.tsx`, `src/main.jsx`, `src/main.tsx`, `src/index.jsx`, `src/index.tsx` |
| Next.js (App Router) | `app/page.jsx`, `app/page.tsx` |
| Next.js (Pages Router) | `pages/index.jsx`, `pages/index.tsx`, `pages/_app.jsx`, `pages/_app.tsx` |

If none are found, it tells you what it tried and asks you to specify manually.

---

## Vite plugin

Add to your project's `vite.config.js` to get a live tree at `/__react-tree` while the dev server is running.

```js
import reactTree from "react-tree/vite";

export default {
  plugins: [reactTree()],
};
```

Entry is auto-detected. To override:

```js
reactTree({ entry: "src/MyApp.tsx" })
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

## Updating

If you installed with `npm link`, react-tree checks for updates once a day. When a new version is available you'll see:

```
  ⟳  Update available!  Run react-tree --update to get the latest version.
```

Just run:

```bash
react-tree --update
```

That's it — pulls the latest from GitHub automatically.

---

## Options

| Flag | Description |
| --- | --- |
| `--html` | Generate an interactive HTML page and open it in the browser |
| `--out <path>` | Custom path for the HTML file (default: `react-tree.html`) |
| `--update` | Pull the latest version from GitHub |
| `--help` | Show usage information |
