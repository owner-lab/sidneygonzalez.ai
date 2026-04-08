# Sonnet Handoff: theme-color Meta Tag — Declarative Dark/Light Chrome

## Workflow Reminders

- Work on `dev` branch. Do NOT commit directly to `main`.
- Do NOT include a `Co-Authored-By` Claude line in the commit.
- Conventional Commit message (see bottom of this file).
- Single commit for all three fixes below (they're tightly coupled).
- PR to `main` after pushing. Use a unique PR title (Netlify snapshots per deploy preview).

## Context

The `theme-color` meta tag tells the browser what color to paint its surrounding chrome (Chrome Android address bar, Safari iOS status bar, Safari macOS tab background). The site already has a working implementation — this handoff closes two related gaps.

### What already works (do NOT touch)

- `index.html:48` — single `<meta name="theme-color" content="#0A0A0F" />`
- `index.html:85-87` — inline anti-flash script runs synchronously in `<head>` and updates the meta tag via `querySelector` based on `localStorage['theme']` + `matchMedia`
- `src/hooks/useTheme.js:18-21` — `applyTheme()` updates the single meta tag on every theme change; a `matchMedia` listener inside the effect handles OS-level changes when preference is `'system'`
- Color values are `#0A0A0F` (dark) / `#FFFFFF` (light), matching `--color-bg-primary` in `src/index.css`

### Two gaps being closed

**Gap 1 — First-paint default is wrong on light-mode devices.** The single meta tag hardcodes `#0A0A0F`. The anti-flash script fixes this before paint in practice, but it depends entirely on JS running before the browser commits to the initial chrome color. Safari iOS is known to sometimes commit early. The declarative fix is to ship two media-query-scoped meta tags so the browser picks the right color at parse time with no JS involvement.

**Gap 2 — No CSS `color-scheme` declaration.** Grep confirms the codebase never sets the `color-scheme` CSS property. Without it, browser scrollbars, native form controls, and iframe default backgrounds render in light mode even when the `.dark` class is applied. `theme-color` handles chrome *outside* the viewport; `color-scheme` handles chrome *inside* it. Two CSS lines fix it.

---

## Fix 1 — Replace single meta tag with two media-scoped tags

**File:** `index.html`

**Problem:** A single tag always ships with one hardcoded color. Browsers may paint initial chrome with this value before JS runs.

**Solution:** Two tags with `media` attributes let the browser choose declaratively at parse time.

Find (line 48):

```html
<meta name="theme-color" content="#0A0A0F" />
```

Replace with:

```html
<meta name="theme-color" content="#FFFFFF" media="(prefers-color-scheme: light)" />
<meta name="theme-color" content="#0A0A0F" media="(prefers-color-scheme: dark)" />
```

---

## Fix 2 — Update the inline anti-flash script to target both tags

**File:** `index.html`

**Problem:** With two tags, `querySelector` only updates the first one. When the user has an explicit override (e.g. dark on a light-mode OS), the second tag keeps its stale value and the media query picks the wrong one if the OS preference changes later.

**Solution:** Use `querySelectorAll` + `forEach`. Setting both tags to the same resolved color means whichever tag matches the browser's current `media` query evaluation returns the correct value.

Find (line 86, inside the `<script>` block):

```js
var m=document.querySelector('meta[name="theme-color"]');if(m)m.setAttribute('content',d?'#0A0A0F':'#FFFFFF')
```

Replace with:

```js
document.querySelectorAll('meta[name="theme-color"]').forEach(function(m){m.setAttribute('content',d?'#0A0A0F':'#FFFFFF')})
```

The surrounding IIFE and the `classList.add('dark')` logic stay unchanged.

---

## Fix 3 — Update `applyTheme()` in useTheme to target both tags

**File:** `src/hooks/useTheme.js`

**Problem:** Same as Fix 2, but for runtime theme changes via the `ThemeToggle`. The single `querySelector` only updates one of the two new tags.

**Solution:** Mirror the inline script — `querySelectorAll` + `forEach`.

Find (lines 17-21):

```js
  // Update theme-color meta tag
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) {
    meta.setAttribute('content', isDark ? '#0A0A0F' : '#FFFFFF')
  }
```

Replace with:

```js
  // Update theme-color meta tags (both media-scoped entries)
  const color = isDark ? '#0A0A0F' : '#FFFFFF'
  document
    .querySelectorAll('meta[name="theme-color"]')
    .forEach((m) => m.setAttribute('content', color))
```

The rest of `applyTheme()` (the `.dark` class toggle, `isDark` computation, and return value) stays unchanged.

---

## Fix 4 — Add CSS `color-scheme` property

**File:** `src/index.css`

**Problem:** The codebase never declares `color-scheme`. Browser scrollbars, native form controls, and iframe default backgrounds render light even in dark mode.

**Solution:** Two CSS lines in `@layer base`. The existing `.dark` class toggle on `<html>` automatically drives the right value.

Find the `:root { ... }` block (around line 6, inside `@layer base`). Add one line near the bottom of that block, before its closing brace:

```css
    color-scheme: light;
```

Find the `.dark { ... }` block (around line 46, inside `@layer base`). Add one line near the bottom of that block, before its closing brace:

```css
    color-scheme: dark;
```

The placement within each block doesn't matter functionally — put them wherever reads naturally with the surrounding `--color-*` variables (e.g., right after the background color variables, or at the very bottom of the block).

---

## Files Changed

| File | Fix |
|---|---|
| `index.html` | Replace single `theme-color` meta with two media-scoped tags; update inline anti-flash script's `querySelector` → `querySelectorAll` |
| `src/hooks/useTheme.js` | `applyTheme()`: `querySelector` → `querySelectorAll` with `forEach` |
| `src/index.css` | Add `color-scheme: light` to `:root` and `color-scheme: dark` to `.dark` |

Three files, four small changes, one commit.

---

## Edge-Case Matrix (sanity check the logic before committing)

| User preference | OS preference | Both tags' `content` after JS | Browser uses | Correct? |
|---|---|---|---|---|
| `'system'` | Light | `#FFFFFF` / `#FFFFFF` | light-media tag → `#FFFFFF` | ✓ |
| `'system'` | Dark | `#0A0A0F` / `#0A0A0F` | dark-media tag → `#0A0A0F` | ✓ |
| `'dark'` override | Light | `#0A0A0F` / `#0A0A0F` | light-media tag → `#0A0A0F` | ✓ |
| `'light'` override | Dark | `#FFFFFF` / `#FFFFFF` | dark-media tag → `#FFFFFF` | ✓ |
| Pre-JS, light OS | Light | `#FFFFFF` / `#0A0A0F` (declarative) | light-media tag → `#FFFFFF` | ✓ |
| Pre-JS, dark OS | Dark | `#FFFFFF` / `#0A0A0F` (declarative) | dark-media tag → `#0A0A0F` | ✓ |

All six cases resolve correctly. The `media` attribute becomes vestigial after JS runs (both tags hold the same color), but it's still evaluated correctly by the browser.

---

## Explicitly Out of Scope

- **Scroll-aware `theme-color`** — the navbar glass background (`rgba(17,17,24,0.6)` dark / `rgba(255,255,255,0.7)` light) composites to colors visually indistinguishable from `--color-bg-primary`. No perceptible gain.
- **`apple-mobile-web-app-status-bar-style`** — iOS Home Screen PWA mode only. Not relevant to standard Safari tabs.
- **Web App Manifest `theme_color`** — no `manifest.json` exists. Not adding one.
- **Centralizing the hex colors** — they appear in three places (`index.html`, `useTheme.js`, derived from `--color-bg-primary`). Not worth a constants file for two values.

---

## Commit Message

```
feat: declarative theme-color via media queries + CSS color-scheme
```

---

## Verification

Before committing:

1. **Build:** `npm run build` — must succeed with no new warnings.
2. **Dev preview:** `npm run dev`, open in Chrome + Safari.

Manual checks on the dev preview (all must pass):

- [ ] **Light-mode device, no stored preference:** hard refresh → browser chrome white from first paint, no dark flicker.
- [ ] **Dark-mode device, no stored preference:** hard refresh → browser chrome `#0A0A0F` from first paint.
- [ ] **ThemeToggle → dark (on light OS):** both page background AND browser chrome switch to dark immediately.
- [ ] **ThemeToggle → light (on dark OS):** inverse of above.
- [ ] **ThemeToggle → system:** browser chrome matches OS preference.
- [ ] **OS preference changes live:** with preference set to `'system'`, toggle OS dark/light — browser chrome follows via the existing `matchMedia` listener.
- [ ] **Scrollbar color (CSS color-scheme):** in dark mode the page scrollbar is dark (macOS Safari, Chrome, Firefox all respect `color-scheme`). In light mode it's light. Previously stayed light in both.
- [ ] **Page reload in each state:** chrome color persists correctly (no flash of wrong color on reload).

Most important test: iOS Safari on a light-mode device. This is where the declarative media query fix matters most.

---

## Branch Workflow

```bash
# You should already be on dev after the previous session. Verify:
git status
git branch --show-current  # expect: dev
git pull origin dev        # sync with remote

# Make the 4 edits above, then:
npm run build              # must pass
git add index.html src/hooks/useTheme.js src/index.css
git commit -m "feat: declarative theme-color via media queries + CSS color-scheme"
git push origin dev

# Open PR to main with a unique title:
gh pr create --base main --head dev \
  --title "feat: declarative theme-color + CSS color-scheme for native dark mode chrome" \
  --body "$(cat <<'EOF'
## Summary
- Replace single \`theme-color\` meta tag with two media-scoped tags so browsers pick the correct color at parse time (no JS dependency for first paint)
- Update inline anti-flash script + \`useTheme.js\` \`applyTheme()\` to target both meta tags via \`querySelectorAll\`
- Add CSS \`color-scheme: light\` / \`color-scheme: dark\` so scrollbars and native controls respect dark mode

## Test plan
- [ ] Light-mode iOS/Android device: browser chrome is white from first paint
- [ ] Dark-mode device: chrome is \`#0A0A0F\` from first paint
- [ ] ThemeToggle overrides: both tags update, chrome matches selected theme
- [ ] Scrollbar darkens in dark mode
EOF
)"
```

After the PR is created, Sidney will review and merge.
