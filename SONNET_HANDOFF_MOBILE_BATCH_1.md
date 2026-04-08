# Sonnet Handoff: Mobile Polish Batch 1 — Four Critical Fixes

## Workflow Reminders

- Work on `dev` branch. Do NOT commit directly to `main`.
- Do NOT include a `Co-Authored-By` Claude line in the commit.
- Single commit for all four fixes (they're a coordinated mobile batch).
- PR to `main` after pushing. Use a unique PR title (Netlify snapshots per deploy preview).

---

## Context

Sidney tested the dev preview on iPhone 16 Pro Max Safari and flagged four critical mobile UX issues that hurt portfolio credibility:

1. **Filter buttons look unclickable** — Variance Engine department and anomaly type filter chips lose all visual affordance when inactive (rendered as plain unstyled text), so mobile users don't realize they're interactive. Root cause: `ghost` variant relies on `hover:` styles that never trigger on touch.

2. **Compound dead space between every section** — On narrow mobile viewports the `--section-padding-y` token resolves to ~85px per side, creating ~170px of empty vertical space between every adjacent section. On desktop this ratio looks intentional; on mobile it looks abandoned.

3. **Code modal shows navbar through it** — `CodeToggle` panel is `z-40` but navbar is `z-50`, so the SG logo + hamburger remain visible through the modal. Combined with `pt-20` spacer, the modal doesn't feel like a full takeover on mobile — it reads as a broken overlay.

4. **Contact section duplicates GitHub/LinkedIn/Email** — The `Contact` section has three CTA GlassPanel buttons for GitHub/LinkedIn/Email, and the `Footer` immediately below repeats the same three as text links plus a near-identical tagline. On mobile the repetition is jarring and wastes vertical space.

This plan ships all four fixes as one coordinated batch, with desktop behavior preserved wherever possible.

---

## Fix 1 — Button `ghost` variant: add resting border so inactive chips look tappable

**File:** `src/components/ui/Button.jsx`

**Problem:** The `ghost` variant is `text-text-secondary hover:text-text-primary hover:bg-bg-hover/50`. It has no border and no background at rest. On mobile there's no hover, so every `ghost` button renders as plain floating text. Filter chips (`AnomalyTable`, `VarianceControls`, `DashboardControls`, `RawDataViewer`) look unclickable.

**Solution:** Give `ghost` a subtle resting border and transparent background. Active (`secondary`) stays visually distinct because it has a filled `bg-bg-hover` background and `text-text-primary` color. The `ghost` variant keeps its "lower visual weight" role but gains affordance.

Find (lines 1–7):

```js
const variants = {
  primary:
    'bg-accent-blue text-white hover:bg-accent-blue/90 shadow-lg shadow-accent-blue/25',
  secondary:
    'border border-border-subtle bg-bg-hover text-text-primary hover:bg-bg-surface',
  ghost: 'text-text-secondary hover:text-text-primary hover:bg-bg-hover/50',
}
```

Replace with:

```js
const variants = {
  primary:
    'bg-accent-blue text-white hover:bg-accent-blue/90 shadow-lg shadow-accent-blue/25',
  secondary:
    'border border-border-subtle bg-bg-hover text-text-primary hover:bg-bg-surface',
  ghost:
    'border border-border-subtle/60 bg-transparent text-text-secondary hover:bg-bg-hover/50 hover:text-text-primary',
}
```

**What changes visually:**

- Inactive filter chips now render with a subtle outline → clearly look like tappable controls
- Active vs inactive distinction remains clear: active has filled background + primary text, inactive has transparent background + muted text + visible outline
- Standalone `ghost` usages (`CustomScenarioBuilder` Reset All button) also gain a border — this is acceptable and arguably an improvement for that button too

**Files implicitly affected (no code changes needed in them, they just gain the new styling):**

- `src/projects/variance-engine/AnomalyTable.jsx` (anomaly type chips)
- `src/projects/variance-engine/VarianceControls.jsx` (department chips)
- `src/projects/command-center/DashboardControls.jsx` (division + period chips)
- `src/projects/command-center/RawDataViewer.jsx` (Raw/Clean toggle)
- `src/projects/decision-impact/CustomScenarioBuilder.jsx` (Reset All button — acceptable improvement)

---

## Fix 2 — Tighten section padding on mobile only

**File:** `src/index.css`

**Problem:** `--section-padding-y: clamp(4rem, 10vh, 8rem)` means on a mobile viewport with ~852px height, each section gets ~85px top AND bottom padding. Between two adjacent sections that's ~170px of vertical gap. On mobile this reads as vast empty space. On desktop the ratio feels right and should be preserved.

**Solution:** Add a `(max-width: 640px)` media query that overrides the token on mobile only. Desktop unchanged.

Find (lines 36–38):

```css
    /* Section spacing */
    --section-padding-y: clamp(4rem, 10vh, 8rem);
    --section-padding-x: clamp(1rem, 5vw, 4rem);
```

Keep those lines as-is. Then find the end of the `:root { ... }` block (the `}` that closes it around line 45) and **after** that closing brace, but still inside `@layer base {`, add:

```css
  /* Mobile: tighten vertical rhythm — desktop token is too generous at narrow widths */
  @media (max-width: 640px) {
    :root {
      --section-padding-y: clamp(2rem, 6vh, 4rem);
    }
  }
```

**Resulting values:**

| Viewport | Old `--section-padding-y` | New `--section-padding-y` | Gap between adjacent sections |
|---|---|---|---|
| iPhone (852px tall) | ~85px per side | ~51px per side | 170px → 102px (saves 68px) |
| iPad (1024×768) | ~77px per side | unchanged (77px) | unchanged |
| Desktop (1920×1080) | 108px (clamped to 8rem = 128px) | unchanged | unchanged |

Mobile gains ~68px per section gap, which is roughly half a thumb-scroll of wasted space eliminated between every section transition.

**Important:** Do NOT modify `--section-padding-x` — horizontal padding is already handled correctly by the `5vw` clamp.

---

## Fix 3 — `CodeToggle` modal: full-screen takeover on mobile

**File:** `src/components/ui/CodeToggle.jsx`

**Problem:** The panel has three issues on mobile:

1. `z-40` panel sits below `z-50` navbar → navbar visible through the modal
2. `pt-20` spacer leaves a 5rem gap at the top where the navbar shows through
3. `rounded-l-xl` + `max-w-lg` makes it a slide-out from the right, which is correct on desktop but wrong on mobile where it should own the full viewport

**Solution:** Use responsive Tailwind classes to keep desktop behavior exactly as-is while making mobile full-screen. Bump z-index above navbar on mobile, drop the top spacer, drop the rounded corners, and give the close button a proper 44×44px touch target.

### 3a. Panel z-index and rounding

Find (line 51–57):

```jsx
          <motion.div
            className="fixed inset-y-0 right-0 z-40 w-full max-w-lg"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          >
```

Replace with:

```jsx
          <motion.div
            className="fixed inset-y-0 right-0 z-[60] w-full lg:z-40 lg:max-w-lg"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          >
```

**What changes:**

- Mobile (`<lg`): `z-[60]` overrides navbar's `z-50`, and the panel is full-width (no `max-w-lg` cap)
- Desktop (`lg+`): `z-40` below navbar (current behavior preserved), `max-w-lg` caps the panel width for slide-out-from-right appearance

### 3b. GlassPanel inner: drop mobile top padding and rounded corner

Find (line 58):

```jsx
            <GlassPanel className="flex h-full flex-col rounded-none rounded-l-xl pt-20">
```

Replace with:

```jsx
            <GlassPanel className="flex h-full flex-col rounded-none px-6 pt-6 lg:rounded-l-xl lg:pt-20">
```

**What changes:**

- Mobile: no top padding gap, no rounded corners, explicit `px-6` to maintain horizontal content padding (GlassPanel default padding gets reset when we specify)
- Desktop: `lg:pt-20` restores the navbar spacer, `lg:rounded-l-xl` restores the left-rounded corners

**Note:** Verify that adding `px-6` on mobile doesn't double up with any existing padding from `GlassPanel`. Read `src/components/ui/GlassPanel.jsx` first to confirm its default padding. If GlassPanel already applies `p-6` or similar internally, the `px-6` may be redundant but harmless.

### 3c. Close button: proper touch target

Find (line 63–69):

```jsx
                <button
                  onClick={onClose}
                  className="text-text-muted transition-colors hover:text-text-primary"
                  aria-label="Close code panel"
                >
                  &times;
                </button>
```

Replace with:

```jsx
                <button
                  onClick={onClose}
                  className="-mr-2 inline-flex h-11 w-11 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-bg-hover/50 hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue/50"
                  aria-label="Close code panel"
                >
                  <svg
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M5 5l10 10M15 5L5 15"
                      stroke="currentColor"
                      strokeWidth="1.75"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
```

**What changes:**

- 44×44px (`h-11 w-11`) touch target meets iOS Human Interface Guidelines
- Inline SVG X instead of text `&times;` (consistent with site's inline-SVG convention — no icon library)
- Focus ring for keyboard users
- `-mr-2` negative margin pulls the button flush with the right edge while preserving its internal padding
- Visible hover background so desktop users see the interactive area

---

## Fix 4 — `Footer`: strip duplicate links and tagline

**File:** `src/components/layout/Footer.jsx`

**Problem:** `Footer` currently renders a tagline ("Let's build your organization's intelligence layer.") and the same GitHub/LinkedIn/Email links as text, immediately below the Contact section's GlassPanel CTA buttons for the same three links with a near-identical tagline ("Building an intelligence layer for your organization?"). Two identical CTAs in the same scroll view.

**Solution:** Reduce Footer to minimal copyright metadata only. The Contact section owns the CTAs; the Footer owns the legal/copyright line. Clean separation of concerns.

Replace the entire Footer.jsx file contents with:

```jsx
export default function Footer() {
  return (
    <footer
      className="border-t border-border-subtle bg-bg-primary py-8"
      role="contentinfo"
    >
      <div className="mx-auto max-w-7xl px-6 text-center">
        <p className="text-xs text-text-muted">
          &copy; {new Date().getFullYear()} Sidney Gonzalez. Built with React,
          Tailwind, and live Python.
        </p>
      </div>
    </footer>
  )
}
```

**What's removed:**

- The tagline `<p>` ("Let's build your organization's intelligence layer.")
- The three social link `<a>` tags (GitHub / LinkedIn / Email)
- The associated `import { SOCIAL } from '@/config/constants'` (no longer needed)

**What stays:**

- Copyright line with dynamic year
- Top border separator
- `role="contentinfo"` for accessibility
- `py-8` (reduced from `py-12` since the footer is now much shorter)

---

## Files Changed

| File | Change |
|---|---|
| `src/components/ui/Button.jsx` | Add resting border + transparent background to `ghost` variant so inactive chips have visual affordance on touch |
| `src/index.css` | Add `@media (max-width: 640px)` override of `--section-padding-y` to `clamp(2rem, 6vh, 4rem)` |
| `src/components/ui/CodeToggle.jsx` | Bump panel z-index above navbar on mobile; drop mobile top-padding spacer; drop mobile rounded corners; upgrade close button to 44×44px with inline SVG X |
| `src/components/layout/Footer.jsx` | Strip tagline and duplicate social links; keep only the copyright line; drop unused `SOCIAL` import |

Four files, one commit.

---

## What Does NOT Change

- The `secondary` Button variant — stays as-is (active chip state)
- The `primary` Button variant — unchanged
- Desktop section padding — unchanged (mobile-only media query override)
- Desktop CodeToggle behavior — unchanged (responsive `lg:` classes preserve slide-out-from-right)
- Navbar z-index — stays `z-50` (Fix 3 uses `z-[60]` to sit above it, not by lowering the navbar)
- Contact section — unchanged (it already has the CTAs we want to keep)
- Any project layout, any chart, any Pyodide logic

---

## Verification

### Build

```bash
npm run build
```

Must succeed with zero new warnings.

### Mobile visual checks (iPhone 16 Pro Max Safari on dev preview)

- [ ] **Variance Engine department filter:** Engineering, Sales, Marketing, Operations, Finance chips are all clearly visible with subtle borders at rest. Active selection ("All Departments") has a filled background; inactive have outlined pills. All appear tappable.
- [ ] **Variance Engine anomaly type filter:** Same — All Types / Trending / Seasonal / Threshold / Duplicate / One-Time chips all visible as pills, active one filled, inactive outlined.
- [ ] **Command Center division + period toggles:** Same visual treatment — all chips are visible pills whether active or inactive.
- [ ] **RawDataViewer Raw/Clean toggle:** Both options visible as pills.
- [ ] **Section gaps** feel tighter. Specifically:
  - Hero CTA buttons → About heading: no longer feels like endless dead space
  - Variance Engine closing card → Build Log heading: gap feels deliberate, not empty
  - Let's Talk section no longer has a huge empty area above it
- [ ] **Tap View Code on any project:** panel slides in and covers the entire screen including the navbar. The SG logo and hamburger are no longer visible through the modal. The close X button is in the top-right of the panel and easy to tap (proper touch target).
- [ ] **Tap the X:** panel closes cleanly, Lenis scroll resumes, no scroll jump.
- [ ] **Contact section (Let's Talk):** The three glass-panel CTA buttons (GitHub / LinkedIn / Email) are present. **Immediately below**, the footer now shows ONLY the copyright line — no duplicate GitHub/LinkedIn/Email links, no duplicate tagline.

### Desktop regression checks

- [ ] **Section padding on desktop** is unchanged (visual rhythm matches main before this PR).
- [ ] **CodeToggle on desktop** still slides in from the right as a ~lg-width panel with rounded left corners. Navbar is still visible above it. Backdrop click still closes.
- [ ] **Filter chips on desktop** look slightly different from before (inactive chips now have a thin border) but this is an acceptable improvement — they look more like real controls.
- [ ] **Footer on desktop** is much shorter and cleaner — just the copyright line.

### Cross-browser

- [ ] Test on Chrome desktop, Safari desktop, Chrome Android, Safari iOS.
- [ ] Dark mode + light mode both verified for each fix.

### Touch target audit

- [ ] The CodeToggle close X is at least 44×44px (inspect element → h-11 w-11).
- [ ] Filter chips have enough padding to tap reliably (they already use `px-5 py-2.5` from Button base — adequate).

---

## Commit Message

```
feat(mobile): filter chip affordance, section padding, full-screen code modal, footer cleanup
```

---

## Branch Workflow

```bash
git status
git branch --show-current  # expect: dev
git pull origin dev

# Make the 4 edits above
npm run build              # must pass

git add src/components/ui/Button.jsx \
        src/index.css \
        src/components/ui/CodeToggle.jsx \
        src/components/layout/Footer.jsx

git commit -m "feat(mobile): filter chip affordance, section padding, full-screen code modal, footer cleanup"
git push origin dev

gh pr create --base main --head dev \
  --title "feat(mobile): batch 1 — chip affordance, section padding, code modal, footer" \
  --body "$(cat <<'EOF'
## Summary

Four coordinated mobile UX fixes flagged from iPhone 16 Pro Max testing:

1. **Filter chip affordance** — `ghost` Button variant now has a resting border + transparent background so inactive filter chips (department, anomaly type, division, period, Raw/Clean) look tappable on touch devices instead of rendering as plain unstyled text.

2. **Section padding on mobile** — add \`@media (max-width: 640px)\` override on \`--section-padding-y\` reducing it from \`clamp(4rem, 10vh, 8rem)\` to \`clamp(2rem, 6vh, 4rem)\`. Saves ~68px per inter-section gap on narrow viewports. Desktop unchanged.

3. **CodeToggle full-screen on mobile** — responsive Tailwind classes make the panel cover the entire viewport including the navbar on mobile (\`z-[60]\`, no top spacer, no rounded corners), while preserving the exact desktop slide-out-from-right behavior (\`lg:z-40\`, \`lg:max-w-lg\`, \`lg:rounded-l-xl\`, \`lg:pt-20\`). Close button upgraded to 44×44 touch target with inline SVG X.

4. **Footer cleanup** — strip the duplicate GitHub/LinkedIn/Email links and the duplicate tagline that repeated the Contact section's CTAs. Footer is now just the copyright line.

## Test plan

**Mobile (iPhone 16 Pro Max Safari):**
- [ ] All filter chips (Variance Engine, Command Center, RawDataViewer) render as visible pills with borders, active vs inactive clearly distinguished
- [ ] Section gaps feel tighter — no more dead space between Hero/About, projects, or above Let's Talk
- [ ] View Code modal covers the entire viewport including navbar; close X is easy to tap
- [ ] Contact section has no duplicate links from the footer

**Desktop regression:**
- [ ] Section padding rhythm unchanged
- [ ] CodeToggle still slides from right as a \`lg\` panel with rounded left corners
- [ ] Navbar still visible on desktop when code modal is open (preserves current behavior)

**Dark mode:** verify all four fixes in both themes.
EOF
)"
```

After the PR is created, Sidney will review the dev preview and merge.
