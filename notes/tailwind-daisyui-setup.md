# Tailwind CSS + DaisyUI Setup Notes

## Why versions were deliberately pinned, not "latest"

npm's latest `tailwindcss` is v4 (CSS-first config — no `tailwind.config.js`, configured via
`@import "tailwindcss"` and `@plugin` directives instead), and latest `daisyui` is v5 (built
specifically for Tailwind v4). The course teaches the **old** JS-config style:

```bash
npm install -D tailwindcss@3 postcss autoprefixer
npx tailwindcss init -p
npm install -D daisyui@4
```

```js
// tailwind.config.js
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: { extend: {} },
  plugins: [require('daisyui')],
}
```

```css
/* src/index.css — must be at the very top */
@tailwind base;
@tailwind components;
@tailwind utilities;
```

Same version-drift situation hit earlier with mongoose 9.x — pin to what the course actually
uses, or every config step needs manual translation to the new approach.

**Gotcha: `content: []` starts empty.** If you don't fill this in with the paths to scan for
class names, Tailwind detects zero classes anywhere and purges all styling — nothing renders
styled at all, even though the setup otherwise "works."

## Two real JSX bugs that came from copying HTML examples (DaisyUI docs / Vite boilerplate)

**1. `<input>` can't have children — it's a void/self-closing element:**
```jsx
<input placeholder="...">Email ID</input>   // ❌ React throws at runtime, crashes the component
```
`<input>` (like `<img>`, `<br>`) cannot wrap content between an opening and closing tag. React
throws a real error for this specific case ("input is a void element tag and must neither have
children..."), which crashes the whole component. Fix: self-close it (`<input ... />`), and put
visible label text in a separate `<label>` element instead.

**2. Capitalized tag names are treated as React components, not HTML elements:**
```jsx
<Div>This is the Home Page.</Div>   // ❌ "Div is not defined" — crashes, blank page
```
JSX treats lowercase tags (`<div>`) as literal HTML elements, and capitalized tags (`<Div>`) as
references to actual React components. Since no component named `Div` exists anywhere, this
throws `ReferenceError: Div is not defined` at render time. Easy typo to make when you're used
to thinking in HTML — the capitalization rule is JSX-specific.

## VS Code: Tailwind class autocomplete not triggering automatically while typing

**Symptom:** typing `justify` inside `className="..."` shows no live suggestions; only
`Ctrl+Space` (manual trigger) brings them up.

**Cause:** `.vscode/settings.json` (copied over from the backend project) has:
```json
"editor.quickSuggestions": { "other": true, "comments": false, "strings": false }
```
`"strings": false` deliberately disables *automatic* suggestions while typing inside string
literals — and `className="..."` is exactly that, a string. This setting made sense for the
backend (where suggestions popping up inside arbitrary strings would just be noise), but it
actively works against Tailwind class autocomplete on the frontend, since Tailwind classes
*only* ever live inside string literals.

**Suggested fix (scoped, not global):**
```json
"[javascript][javascriptreact]": {
  "editor.quickSuggestions": { "strings": true }
}
```
Scoping to just JS/JSX files (rather than flipping `strings: true` globally) avoids
auto-suggestions popping up unwanted in other string contexts (like `.json` files).

Also requires the **"Tailwind CSS IntelliSense"** VS Code extension installed — without it,
even a correctly-configured `quickSuggestions` setting only gives generic string completions,
not real Tailwind-aware class names/color previews.
