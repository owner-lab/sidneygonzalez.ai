# Opus-to-Sonnet Handoff: Desktop Visual Bug Fixes

> **Purpose**: Strict, step-by-step technical checklist for fixing 6 visual bugs identified from desktop screenshots.
> **Context**: This is a single-page React 18 portfolio (Vite 8 + Tailwind 3.4.19 + Motion v12) deployed on Cloudflare Pages. The theme toggle (light/dark/system) was just shipped. All colors use CSS custom properties with RGB channel format for Tailwind opacity modifier support. Git workflow: develop on `dev`, PR to `main`. Do NOT include `Co-Authored-By` Claude lines in commits. Never reuse PR titles.

---

## Bug 1: CodeToggle Panel Overlaps Navbar (HIGH)

**What's wrong**: The slide-out code panel (`fixed inset-y-0 right-0 z-40`) starts at `top: 0`, so its content (the "View Code" header and tab bar) renders directly behind the semi-transparent navbar (`fixed top-0 z-50`). Because both elements use glassmorphism (`backdrop-filter: blur`), the overlapping content bleeds through and creates visual noise. The user sees "View Code" text overlapping the "Projects" nav link.

**Root cause**: CodeToggle has no top padding to account for the navbar's height (~72px).

**File**: `src/components/ui/CodeToggle.jsx`

**Fix**:

1. On line 20, the GlassPanel has `className="flex h-full flex-col rounded-none rounded-l-xl"`. Add `pt-20` (which equals 5rem / 80px — enough to clear the navbar's ~72px height):

```jsx
// BEFORE (line 20):
<GlassPanel className="flex h-full flex-col rounded-none rounded-l-xl">

// AFTER:
<GlassPanel className="flex h-full flex-col rounded-none rounded-l-xl pt-20">
```

This pushes the "View Code" header, tab bar, and code content below the navbar. The `h-full` still works because the parent is `fixed inset-y-0` (viewport height), and the bottom of the panel remains scrollable.

---

## Bug 2: CodeToggle Has No Backdrop Overlay (HIGH)

**What's wrong**: When the code panel slides in from the right, there's no dimming/overlay behind it. The hero content (title, subtitle, buttons, mesh gradient) remains fully visible and interactive, making the UI feel broken rather than intentionally layered.

**Root cause**: The component only renders the panel itself — no overlay element.

**File**: `src/components/ui/CodeToggle.jsx`

**Fix**:

1. Add a backdrop overlay inside the `AnimatePresence`, rendered **before** the panel `motion.div`. The overlay should:
   - Be `fixed inset-0`
   - Have `z-30` (below the panel's z-40, below the navbar's z-50)
   - Have a semi-transparent background: dark mode `bg-black/50`, light mode `bg-black/30`
   - Fade in/out with Motion
   - Call `onClose` on click

2. Replace the entire `AnimatePresence` block (lines 11-61) with:

```jsx
<AnimatePresence>
  {isOpen && (
    <>
      {/* Backdrop overlay */}
      <motion.div
        className="fixed inset-0 z-30 bg-black/40"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Panel */}
      <motion.div
        className="fixed inset-y-0 right-0 z-40 w-full max-w-lg"
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      >
        <GlassPanel className="flex h-full flex-col rounded-none rounded-l-xl pt-20">
          {/* ... existing content unchanged ... */}
        </GlassPanel>
      </motion.div>
    </>
  )}
</AnimatePresence>
```

3. Add an `onKeyDown` handler to close on Escape. Add this `useEffect` inside the component body (after the `useState` on line 8):

```jsx
import { useState, useEffect } from 'react'  // update import at top

// Inside component body, after useState:
useEffect(() => {
  if (!isOpen) return
  const handleEsc = (e) => { if (e.key === 'Escape') onClose() }
  document.addEventListener('keydown', handleEsc)
  return () => document.removeEventListener('keydown', handleEsc)
}, [isOpen, onClose])
```

**Verification**: Open any project's "View Code" button. The background should dim. Clicking the dimmed area should close the panel. Pressing Escape should close the panel. The "View Code" header should NOT overlap the navbar.

---

## Bug 3: Sankey Left-Edge Label Clipping on Desktop (MEDIUM)

**What's wrong**: In both light and dark mode, node labels on the left side of the Sankey diagram are clipped. Characters like ":0" and "t" are visible at the left edge — these are the rightmost characters of labels that extend beyond the chart's left boundary. The labels use `labelPosition="outside"` which renders them to the LEFT of left-side nodes, but the left margin is only 20px.

**Root cause**: Desktop left margin is 20px (`margin={{ ... left: isMobile ? 60 : 20 }}`), but outside labels for nodes like "Op Margin", "DSO", "FCF" extend 50-80px to the left of their nodes.

**File**: `src/components/charts/SankeyDiagram.jsx`

**Fix**:

1. On line 84, change the desktop left margin from `20` to `80`:

```jsx
// BEFORE (line 84):
margin={{ top: 20, right: isMobile ? 90 : 140, bottom: 20, left: isMobile ? 60 : 20 }}

// AFTER:
margin={{ top: 20, right: isMobile ? 90 : 140, bottom: 20, left: isMobile ? 60 : 80 }}
```

**Verification**: Load Project 2 (Decision Impact Analyzer) on desktop. All left-side labels ("Op Margin", "DSO", "FCF", "Fulfillment", "CSAT") should be fully visible without clipping.

---

## Bug 4: Sankey Link Opacity Too Low in Light Mode (MEDIUM)

**What's wrong**: The Sankey link bands use `linkOpacity={0.25}` when no scenario is active. On a dark background, this is fine because the semi-transparent bands have good contrast against `#0A0A0F`. On a light/white background (`#FFFFFF`), the same 0.25 opacity makes the links nearly invisible — they look washed out and the diagram loses its visual impact.

**Root cause**: Single opacity value regardless of theme.

**File**: `src/components/charts/SankeyDiagram.jsx`

**Fix**:

1. The `isDark` variable is already available (line 29). Use it to adjust link opacity. On line 93:

```jsx
// BEFORE (line 93):
linkOpacity={hasHighlights ? 0.7 : 0.25}

// AFTER:
linkOpacity={hasHighlights ? 0.7 : isDark ? 0.25 : 0.4}
```

This raises the base link opacity from 0.25 to 0.4 in light mode only. When highlights are active (a scenario is selected), both modes use 0.7 which is fine.

**Verification**: Load Project 2 in light mode with no scenario selected. The link bands between nodes should be clearly visible — not invisible wisps. Compare with dark mode to ensure the diagram reads well in both themes.

---

## Bug 5: CodeToggle Body Scroll Not Locked (LOW)

**What's wrong**: When the code panel is open, the main page behind it can still be scrolled. Combined with the new backdrop overlay (Bug 2), this creates an inconsistency — the page appears "locked" visually but the user can still scroll it with their trackpad/mouse wheel.

**File**: `src/components/ui/CodeToggle.jsx`

**Fix**:

1. Add a `useEffect` to toggle `overflow-hidden` on the `<body>` element when the panel opens/closes. Add this after the Escape key handler:

```jsx
useEffect(() => {
  if (isOpen) {
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = ''
  }
  return () => { document.body.style.overflow = '' }
}, [isOpen])
```

**Verification**: Open the code panel, then try scrolling with trackpad. The page should not scroll. Close the panel, scrolling should work again.

---

## Bug 6: Dimmed Sankey Link Colors on Scenario Highlight (LOW)

**What's wrong**: When a scenario IS active and `hasHighlights` is true, the non-highlighted links use `rgba(148,163,184,0.08)` (line 60). In light mode, this is essentially invisible — 8% opacity gray on white. The user can't see the network structure at all; only the highlighted cascade path is visible.

**Root cause**: The dimmed color was designed for dark mode where 8% opacity gray on near-black still reads faintly.

**File**: `src/components/charts/SankeyDiagram.jsx`

**Fix**:

1. The `isDark` variable is available. Use it on line 60 to provide a light-mode-friendly dim color:

```jsx
// BEFORE (line 60):
return { ...link, startColor: 'rgba(148,163,184,0.08)', endColor: 'rgba(148,163,184,0.08)' }

// AFTER:
const dimColor = isDark ? 'rgba(148,163,184,0.08)' : 'rgba(148,163,184,0.15)'
return { ...link, startColor: dimColor, endColor: dimColor }
```

Note: `isDark` is available at line 29 scope, but this code is inside the `useMemo` callback which closes over the component scope. However, `isDark` is NOT in the `useMemo` dependency array. **You must also add `isDark` to the dependency array on line 66**:

```jsx
// BEFORE (line 66):
}, [data, hasHighlights, highlightSet])

// AFTER:
}, [data, hasHighlights, highlightSet, isDark])
```

**Verification**: Load Project 2, select a scenario (e.g., "Cut Marketing Budget by 15%"). In light mode, the non-highlighted links should still be faintly visible as a structural backdrop to the highlighted cascade. In dark mode, they should appear the same as before.

---

## Summary of All File Changes

| File | Lines Changed | Bugs Fixed |
|------|--------------|------------|
| `src/components/ui/CodeToggle.jsx` | Add imports (`useEffect`), add Escape handler, add body scroll lock, add backdrop overlay, add `pt-20` to GlassPanel | Bugs 1, 2, 5 |
| `src/components/charts/SankeyDiagram.jsx` | Line 60 (dim color), line 84 (left margin), line 93 (link opacity), line 66 (dep array) | Bugs 3, 4, 6 |

**Total files touched**: 2

---

## Final CodeToggle.jsx (Complete Reference)

After applying Bugs 1, 2, and 5, the full file should look like:

```jsx
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import GlassPanel from './GlassPanel'

const PIPELINE_TABS = ['Ingest', 'Clean', 'Transform', 'Analyze', 'Visualize']

export default function CodeToggle({ isOpen, onClose, tabs = PIPELINE_TABS, codeByTab = {} }) {
  const [activeTab, setActiveTab] = useState(tabs[0])

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return
    const handleEsc = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [isOpen, onClose])

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop overlay */}
          <motion.div
            className="fixed inset-0 z-30 bg-black/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            aria-hidden="true"
          />
          {/* Slide-out panel */}
          <motion.div
            className="fixed inset-y-0 right-0 z-40 w-full max-w-lg"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          >
            <GlassPanel className="flex h-full flex-col rounded-none rounded-l-xl pt-20">
              <div className="flex items-center justify-between border-b border-border-subtle pb-4">
                <h3 className="font-display text-sm font-semibold text-text-primary">
                  View Code
                </h3>
                <button
                  onClick={onClose}
                  className="text-text-muted transition-colors hover:text-text-primary"
                  aria-label="Close code panel"
                >
                  &times;
                </button>
              </div>

              <div className="flex gap-1 border-b border-border-subtle py-2">
                {tabs.map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                      activeTab === tab
                        ? 'bg-accent-blue/10 text-accent-blue'
                        : 'text-text-muted hover:text-text-secondary'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <div className="flex-1 overflow-auto py-4">
                <pre className="font-mono text-xs leading-relaxed text-text-secondary">
                  <code>
                    {codeByTab[activeTab] ||
                      `# ${activeTab} stage\n# Code will be added when project is built.`}
                  </code>
                </pre>
              </div>
            </GlassPanel>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
```

---

## Final SankeyDiagram.jsx Changes (Diff Reference)

```diff
--- a/src/components/charts/SankeyDiagram.jsx
+++ b/src/components/charts/SankeyDiagram.jsx
@@ -57,7 +57,8 @@ export default function SankeyDiagram({
       if (hasHighlights) {
-        return { ...link, startColor: 'rgba(148,163,184,0.08)', endColor: 'rgba(148,163,184,0.08)' }
+        const dimColor = isDark ? 'rgba(148,163,184,0.08)' : 'rgba(148,163,184,0.15)'
+        return { ...link, startColor: dimColor, endColor: dimColor }
       }
       return link
     })
@@ -63,7 +64,7 @@ export default function SankeyDiagram({
     return { nodes: data.nodes, links }
-  }, [data, hasHighlights, highlightSet])
+  }, [data, hasHighlights, highlightSet, isDark])

@@ -81,10 +82,10 @@ export default function SankeyDiagram({
       <div style={{ height: chartHeight, minWidth: isMobile ? 700 : 'auto' }}>
         <ResponsiveSankey
           key={isDark ? 'd' : 'l'}
           data={coloredData}
-          margin={{ top: 20, right: isMobile ? 90 : 140, bottom: 20, left: isMobile ? 60 : 20 }}
+          margin={{ top: 20, right: isMobile ? 90 : 140, bottom: 20, left: isMobile ? 60 : 80 }}
           align="justify"
           sort="auto"
           nodeOpacity={1}
           nodeHoverOthersOpacity={0.35}
@@ -90,7 +91,7 @@ export default function SankeyDiagram({
           linkOpacity={hasHighlights ? 0.7 : 0.25}
+          linkOpacity={hasHighlights ? 0.7 : isDark ? 0.25 : 0.4}
```

---

## Testing Checklist

- [ ] Dark mode: CodeToggle opens with backdrop, content below navbar, body scroll locked
- [ ] Light mode: CodeToggle backdrop visible, Escape closes, click-outside closes
- [ ] Dark mode: Sankey left labels fully visible (FCF, Fulfillment, CSAT, etc.)
- [ ] Light mode: Sankey link bands clearly visible (no scenario selected)
- [ ] Light mode: Sankey with scenario — highlighted links bright, dimmed links faintly visible
- [ ] Dark mode: Sankey unchanged from current behavior
- [ ] Mobile: CodeToggle still works correctly at 375px
- [ ] `npm run lint` passes with 0 errors
- [ ] `npm run build` succeeds
- [ ] `npm run test` — all tests pass

---

## Git Instructions

1. Checkout `dev` branch: `git checkout dev`
2. Make all changes to the 2 files listed above
3. Stage: `git add src/components/ui/CodeToggle.jsx src/components/charts/SankeyDiagram.jsx`
4. Commit: `git commit -m "fix: CodeToggle overlay/stacking + Sankey label clipping and light-mode opacity"`
5. Push: `git push origin dev`
6. Create PR: `gh pr create --base main --head dev --title "Fix CodeToggle overlay and Sankey light-mode rendering" --body "..."`
7. Do NOT reuse any previous PR title
