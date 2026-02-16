# codemirror-for-writers: packaging issues

Issues that prevent clean installation from GitHub (or npm once published).

---

## 1. `dist/` is gitignored but `exports` points to it

**package.json:**
```json
"exports": {
  ".": {
    "import": "./dist/index.js",
    "require": "./dist/index.cjs",
    "types": "./dist/index.d.ts"
  }
}
```

**.gitignore:**
```
dist/
```

When installed via `github:dwaynemcyrus/codemirror-for-writers#main`, npm clones the repo — but `dist/` doesn't exist. Any bundler that respects the `exports` field (webpack 5, Node 12+, Vite) will fail:

```
Module not found: Package path ./lib/index.js is not exported from package
```

**Fix — add a `prepare` script** so `dist/` gets built on install:

```json
"scripts": {
  "prepare": "npm run build:lib"
}
```

This runs automatically after `npm install` (including from GitHub). It requires `vite` to be available — move it from `devDependencies` to `dependencies`, or use a conditional prepare that skips if vite isn't present.

---

## 2. `vite.lib.config.js` is excluded from the npm package

**package.json `files` field:**
```json
"files": ["dist", "lib"]
```

This means `vite.lib.config.js` is NOT included when installed via npm (or GitHub if npm respects the files field). The `build:lib` script depends on it.

**Fix:** add `vite.lib.config.js` to the `files` array:

```json
"files": ["dist", "lib", "vite.lib.config.js"]
```

Or better: if `dist/` is always pre-built (via `prepare`), the `files` field can drop `lib` entirely:

```json
"files": ["dist"]
```

---

## 3. No TypeScript declarations

The `types` field points to `./dist/index.d.ts`, but the vite lib build (`vite.lib.config.js`) doesn't generate `.d.ts` files — it only produces `index.js` and `index.cjs`.

Consumers have to write their own ambient declarations.

**Fix — generate types during build.** Options:

- Add a `lib/index.d.ts` hand-written declaration file alongside `lib/index.js` and have the build copy it to `dist/`.
- Or use `vite-plugin-dts` to auto-generate from JSDoc annotations.
- Simplest: write a single `index.d.ts` and include it in the `files` field.

---

## 4. Lib build externalizes regular dependencies

`vite.lib.config.js` externalizes everything including non-peer deps:

```js
external: [
  // peer deps — correct to externalize
  '@codemirror/commands',
  '@codemirror/state',
  '@codemirror/view',
  '@codemirror/lang-markdown',
  // regular deps — should be bundled OR listed as peer deps
  'katex',
  'markdown-it',
  'markdown-it-emoji',
  'mermaid',
  '@codemirror/language',
  '@codemirror/search',
  '@lezer/highlight',
  // ...
]
```

This is fine as long as all of these are in `dependencies` (they are). But it means consumers end up with a large dependency tree including mermaid (~2.5MB). Consider making heavy deps like `mermaid` and `katex` optional:

- Lazy-load them only when a mermaid/math block is encountered
- Or split them into optional peer dependencies with `peerDependenciesMeta`

Not a blocker, just a size concern.

---

## 5. Not published to npm

`npm install codemirror-for-writers` returns 404. The README badge links to npmjs.com but the package was never published.

**Fix:** publish with `npm publish` after building dist.

---

## Summary of recommended changes

```jsonc
// package.json
{
  "files": ["dist", "lib", "vite.lib.config.js"],
  "scripts": {
    "prepare": "npm run build:lib",
    "build:lib": "vite build --config vite.lib.config.js"
  }
}
```

And either:
- Hand-write `lib/index.d.ts` (or `dist/index.d.ts` via build), OR
- Add `vite-plugin-dts` to generate declarations

Once `prepare` exists, GitHub installs will auto-build `dist/` and the `exports` field will resolve correctly.
