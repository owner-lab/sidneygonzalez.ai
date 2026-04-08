# Sonnet Handoff: Mobile Batch 2 — Critical Polish

## Workflow Reminders

- Work on `dev` branch. Do NOT commit directly to `main`.
- Do NOT include `Co-Authored-By` Claude line in the commit.
- Single commit for all fixes below.
- Unique PR title (Netlify snapshots per deploy preview).

---

## Context

Batch 1 shipped successfully (PR #14). Fresh iPhone 16 Pro Max screenshots from dev preview surfaced four remaining issues that are either breaking core interaction, hiding data, or damaging first impression. This batch addresses all four. After this, mobile polish is done.

---

## Fix 1 — Filter chips look like plain text, not buttons

**Problem:** Inactive filter chips in the Variance Engine department filter, Anomaly type filter, and Command Center division filter read as labels rather than tappable controls. Batch 1 added a hairline border to `ghost` variant, but the visual weight is still too weak next to the active chip's filled state. On touch devices (no hover), the contrast gap is jarring.

**File:** `src/components/ui/Button.jsx`

**Current ghost variant (line 6-7):**

```js
  ghost:
    'border border-border-subtle/60 bg-transparent text-text-secondary hover:bg-bg-hover/50 hover:text-text-primary',
```

**Replace with:**

```js
  ghost:
    'border border-border-subtle bg-bg-surface/60 text-text-secondary hover:bg-bg-hover hover:text-text-primary',
```

**Why:** Adding `bg-bg-surface/60` gives the chip a resting fill so it reads as a button at a glance. The border is bumped from `/60` to full opacity for a crisper edge. The active (selected) state of these chips is already a stronger `bg-bg-hover` + border, so the hierarchy still reads correctly: resting = subtle fill, active = stronger fill.

---

## Fix 2 — Tables clip horizontally with no scroll affordance

**Problem:** The Detected Anomalies table and the Raw Input table both overflow horizontally on mobile. Variance values show as "$231,646 -" with the % column sliced. Users have no visual hint that the table scrolls — it just looks broken.

**Approach:** Add a right-edge gradient fade mask to the scroll container so the cut-off edge visibly fades into the card background, signaling "more content this way." This is purely CSS, works in all modern iOS Safari, and requires no JS.

### 2a. `src/index.css`

Add this utility at the bottom of the `@layer utilities` block (around line 132, before the `data-flash` keyframe):

```css
  /* Horizontal scroll affordance — right-edge fade mask */
  .scroll-fade-right {
    mask-image: linear-gradient(to right, black calc(100% - 32px), transparent 100%);
    -webkit-mask-image: linear-gradient(to right, black calc(100% - 32px), transparent 100%);
  }
```

### 2b. `src/projects/variance-engine/AnomalyTable.jsx`

Find line 57:

```jsx
      <div className="max-h-[400px] overflow-auto" data-lenis-prevent>
```

Replace with:

```jsx
      <div className="scroll-fade-right max-h-[400px] overflow-auto" data-lenis-prevent>
```

### 2c. `src/projects/command-center/RawDataViewer.jsx`

Find the `overflow-x-auto` container (grep for it). Add `scroll-fade-right` class to the same div:

```jsx
<div className="scroll-fade-right overflow-x-auto" data-lenis-prevent>
```

(Keep the existing `data-lenis-prevent` — do not remove it.)

**Before committing, verify with grep:**

```bash
grep -n 'scroll-fade-right' src/projects/variance-engine/AnomalyTable.jsx src/projects/command-center/RawDataViewer.jsx
```

Both files should show one match each.

---

## Fix 3 — Cash Conversion Cycle metric value clips at top

**Problem:** On the Command Center Executive Summary, the "11.2 days" value in the Cash Conversion Cycle card shows the top of the "1" descender touching the label above. The font-display (Space Grotesk) at `text-2xl font-semibold` with default leading is too tight for ascenders.

**File:** `src/components/ui/MetricCard.jsx`

Find line 21-23:

```jsx
      <span className="metric-value font-display text-2xl font-semibold text-text-primary">
        {value}
      </span>
```

Replace with:

```jsx
      <span className="metric-value font-display text-2xl font-semibold leading-tight text-text-primary">
        {value}
      </span>
```

**Why:** Tailwind's default `leading` inherits from the parent (here the flex column gap-1 parent). Explicitly setting `leading-tight` (1.25) gives the glyph enough vertical room without inflating card height. This fixes all four metric cards consistently, not just CCC.

---

## Fix 4 — Hero section too tall on mobile

**Problem:** Hero uses `min-h-screen` which resolves to the full iPhone viewport (~874px on iPhone 16 Pro Max). The CTA buttons ("Explore Projects" / "View on GitHub") sit at the very bottom of the first fold, creating the impression the hero is empty and forcing a scroll before the value prop lands.

**File:** `src/sections/Hero.jsx`

Find line 53:

```jsx
    <Section id="hero" className="relative flex min-h-screen items-center">
```

Replace with:

```jsx
    <Section id="hero" className="relative flex min-h-[85vh] items-center sm:min-h-screen">
```

**Why:** Mobile gets `85vh` so the CTAs sit comfortably within the first viewport with breathing room above the fold. Desktop (`sm:` and above, ≥640px) keeps the original `min-h-screen` behavior — desktop visitors expect a full-viewport hero and the metric carries more weight there.

---

## Files Changed

| File | Change |
|---|---|
| `src/components/ui/Button.jsx` | ghost variant: add bg-bg-surface/60 fill, bump border to full opacity |
| `src/index.css` | Add `.scroll-fade-right` utility for horizontal scroll affordance |
| `src/projects/variance-engine/AnomalyTable.jsx` | Add `scroll-fade-right` to scroll container |
| `src/projects/command-center/RawDataViewer.jsx` | Add `scroll-fade-right` to scroll container |
| `src/components/ui/MetricCard.jsx` | Add `leading-tight` to value span |
| `src/sections/Hero.jsx` | Mobile: `min-h-[85vh]`, desktop unchanged |

Six files, one commit.

---

## What Does NOT Change

- No other Button variants (primary, secondary) — only ghost
- No changes to chart label rotation (deferred — not critical)
- No changes to the Closing Card button layout (deferred — already polished)
- No changes to section padding tokens (batch 1 already handled this)
- No new dependencies, no new components

---

## Verification

### Build
```bash
npm run build
```
Must succeed with zero new warnings.

### Visual checks on dev preview (iPhone + desktop, light + dark mode)

- [ ] **Filter chips** (Variance Engine department filter, Anomaly type filter, Command Center division filter) now look like tappable buttons at rest — subtle fill + visible border. Active state still clearly distinguished.
- [ ] **Detected Anomalies table**: right edge fades softly into the card background, signaling scrollability. Horizontal scroll still works with `data-lenis-prevent`.
- [ ] **Raw Input table** (Command Center Pipeline section): same right-edge fade.
- [ ] **Cash Conversion Cycle card**: "11.2 days" value no longer clips at the top. Check all four Executive Summary cards look consistent.
- [ ] **Hero on mobile**: "Explore Projects" and "View on GitHub" CTAs visible without scrolling. Hero feels proportional, not empty.
- [ ] **Hero on desktop (≥640px)**: unchanged — still `min-h-screen`.
- [ ] **Dark mode**: all fixes render correctly, no regression on navbar border flash.

### Cross-check
Every batch 1 fix (footer, CodeToggle full-width, closing card, ghost border) still works — nothing regressed.

---

## Commit Message

```
feat: mobile batch 2 — chip affordance, table scroll fade, metric leading, hero height
```

---

## Branch Workflow

```bash
cd sidneygonzalez.ai
git status
git branch --show-current  # expect: dev
git pull origin dev

# Make the 6 edits above
npm run build              # must pass
git add src/components/ui/Button.jsx \
        src/index.css \
        src/projects/variance-engine/AnomalyTable.jsx \
        src/projects/command-center/RawDataViewer.jsx \
        src/components/ui/MetricCard.jsx \
        src/sections/Hero.jsx
git commit -m "feat: mobile batch 2 — chip affordance, table scroll fade, metric leading, hero height"
git push origin dev

gh pr create --base main --head dev \
  --title "feat: mobile batch 2 — chip affordance, scroll fade, metric polish" \
  --body "$(cat <<'EOF'
## Summary
- Filter chips now read as buttons at rest (ghost variant fill + full-opacity border) — core interaction no longer ambiguous on touch
- Tables fade at the right edge via a CSS mask to signal horizontal scrollability without a visible scrollbar (Anomaly table, Raw Input table)
- MetricCard value gets `leading-tight` — fixes CCC "11.2 days" top-clipping on Command Center
- Hero drops to `min-h-[85vh]` on mobile so CTAs land in the first viewport; desktop keeps `min-h-screen`

## Why these four
These are the only remaining mobile issues that either break a core interaction, hide data, or damage first impression. Chart label rotation overflow and closing card button stacking are polish items deferred intentionally — diminishing returns.

## Test plan
- [ ] Filter chips look tappable at rest on iPhone (both themes)
- [ ] Anomaly + Raw Input tables fade at right edge, horizontal scroll still works
- [ ] All four Executive Summary metric values render without glyph clipping
- [ ] Hero on mobile: CTAs in first viewport
- [ ] Hero on desktop: unchanged min-h-screen
- [ ] No regression on batch 1 fixes (footer, CodeToggle, closing card)
EOF
)"
```

After PR is created, Sidney reviews dev preview on phone and merges.
