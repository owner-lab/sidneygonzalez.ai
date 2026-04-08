# Sonnet Handoff: Project Closing Card — Redesign "Known Limitations"

## Workflow Reminders

- Work on `dev` branch. Do NOT commit directly to `main`.
- Do NOT include a `Co-Authored-By` Claude line in the commit.
- Single commit for all changes below (they're tightly coupled).
- PR to `main` after pushing. Use a unique PR title (Netlify snapshots per deploy preview).

---

## Context

Sidney flagged that the bottom of each project on dev preview feels non-premium:

> "I feel like the known limitations should have its own section, right now each known limitation sits under the projects and then a large deadspace is in the viewport which does not look nor feel very premium."

### Diagnosis

The dead space is real but the root cause is **visual weight mismatch**, not excess padding. Three screenshots from dev preview confirm the pattern:

1. Big visual content (charts, tables, formulas)
2. Right-aligned `View Code` button (small, isolated)
3. `Known Limitations` block rendered as `text-xs text-text-muted` — tiny muted footnote
4. Up to **304px of vertical dead space** until the next project begins

The 304px gap decomposes as:

- Project Section bottom padding: up to `8rem` (from `--section-padding-y: clamp(4rem, 10vh, 8rem)`)
- Next project's `<div className="mt-12">` wrapper: `3rem`
- Next project Section top padding: up to `8rem`

That padding would be fine if the closing element earned it. Currently the closing element is a muted footnote that signals "footer, skip this," so the padding reads as empty rather than as premium breathing room.

### Approach considered and rejected

**Dedicated "Known Limitations" section** (the user's own initial framing): move all 12 limitations (4 per project × 3 projects) into a single section between Projects and Build Log. **Rejected because:**

- It divorces limitations from their project context — readers have to mentally reconnect "which limits belong to which project"
- It breaks the per-project narrative arc the site is built on: Business Question → Implementation → Honest Trade-offs → next project
- A single "limitations" section at the end reads as a shame corner; inline closing caveats read as professional self-awareness
- CLAUDE.md states: "Executive-first hierarchy. Each project opens with the business insight." The mirror of that is each project should *close* with honest caveats, not hand them off to a footer section

### Approach taken

**Transform the closing area of each project into a substantial "Closing Card"** that unifies the `View Code` button with the `Known Limitations` content inside a single `GlassPanel`. Both are project meta-info (not demo content), so grouping them is semantically clean. The card becomes a visually weighty closing element that earns the padding below it.

Secondary cleanup: remove the `<div className="mt-12">` wrapper from each of the 3 project components (48px of compound margin that serves no purpose — Section already provides top padding).

---

## Fix 1 — ProjectLayout.jsx: Unify View Code + Known Limitations into a Closing Card

**File:** `src/projects/ProjectLayout.jsx`

**Current state (lines 64–86):** View Code is a standalone right-aligned button, Known Limitations is a separate small muted block with a top border.

**Target state:** A single `GlassPanel` containing a header row (icon + "Known Limitations" title on the left, `View Code` button on the right), a one-line context sentence, then a 2-column grid of limitations (1-column on mobile). The GlassPanel treatment matches the visual language of the Business Question GlassPanel at the top of each project, creating deliberate compositional bookends.

### 1a. Remove the standalone View Code block

Find (lines 64–69):

```jsx
        {/* View Code button */}
        <div className="mb-8 flex justify-end">
          <Button variant="secondary" onClick={() => setCodeOpen(true)}>
            View Code
          </Button>
        </div>
```

Delete this entire block. The `View Code` button will move into the new closing card below.

### 1b. Replace the Limitations block with the unified Closing Card

Find (lines 74–86):

```jsx
        {/* Limitations */}
        {limitations.length > 0 && (
          <div className="mt-8 border-t border-border-subtle pt-6">
            <p className="mb-2 text-xs font-medium uppercase tracking-wider text-text-muted">
              Known Limitations
            </p>
            <ul className="space-y-1 text-xs text-text-muted">
              {limitations.map((item, i) => (
                <li key={i}>&bull; {item}</li>
              ))}
            </ul>
          </div>
        )}
```

Replace with:

```jsx
        {/* Project closing card — View Code + Known Limitations */}
        <GlassPanel className="mt-10">
          <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="mb-1 flex items-center gap-2">
                <svg
                  className="h-4 w-4 shrink-0 text-accent-blue"
                  viewBox="0 0 16 16"
                  fill="none"
                  aria-hidden="true"
                >
                  <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
                  <line
                    x1="8"
                    y1="7"
                    x2="8"
                    y2="11"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                  <circle cx="8" cy="4.75" r="0.85" fill="currentColor" />
                </svg>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-text-primary">
                  Known Limitations
                </h4>
              </div>
              <p className="text-xs text-text-muted">
                What would change if this were deployed for real users.
              </p>
            </div>
            <Button variant="secondary" onClick={() => setCodeOpen(true)}>
              View Code
            </Button>
          </div>

          {limitations.length > 0 && (
            <ul className="grid gap-3 sm:grid-cols-2">
              {limitations.map((item, i) => (
                <li
                  key={i}
                  className="flex gap-2 text-sm leading-relaxed text-text-secondary"
                >
                  <span className="shrink-0 text-accent-blue" aria-hidden="true">
                    •
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          )}
        </GlassPanel>
```

**Design notes for the implementer:**

- The `GlassPanel` wrapper is already imported at the top of `ProjectLayout.jsx` (line 4) — no new import.
- `Button` is already imported (line 8) — no new import.
- The card renders even if `limitations.length === 0` because it still hosts the `View Code` button. The limitations `<ul>` is conditional inside the card.
- `flex-wrap` + `gap-4` on the header row means on narrow viewports the View Code button wraps below the title+subtitle instead of crushing them.
- `min-w-0` on the left text block prevents flex overflow if the title somehow gets long.
- `sm:grid-cols-2` matches Tailwind's 640px breakpoint — phones get single column, tablets+ get two columns.
- Bullet color uses `text-accent-blue` for a subtle accent consistent with the portfolio's existing use of `#0068FF` as the primary accent.
- The icon is an inline SVG info circle (no icon library in this project — the codebase uses inline SVGs throughout, e.g. `SlidersIcon` in `ScenarioSelector.jsx`).

---

## Fix 2 — Remove `mt-12` wrapper from each project component

**Rationale:** Each project is wrapped in `<div className="mt-12">` which adds 48px of top margin that compounds with the Section top padding below it. The Section itself provides `py: clamp(4rem, 10vh, 8rem)` which is already generous. The `mt-12` wrapper is redundant and contributes to the inter-project dead space.

### 2a. `src/projects/command-center/CommandCenterProject.jsx`

Find (around line 174 per the explore report — the exact line may vary slightly; grep for `mt-12`):

```jsx
<div className="mt-12">
  <ProjectLayout
    ...
  >
```

Replace with just the `ProjectLayout` directly (drop the wrapper div):

```jsx
<ProjectLayout
  ...
>
```

Also find the matching closing `</div>` at the end of the component and remove it. The result: `CommandCenterProject` returns `<ProjectLayout>...</ProjectLayout>` directly with no outer wrapper.

### 2b. `src/projects/decision-impact/DecisionImpactProject.jsx`

Same change — remove the `<div className="mt-12">` wrapper and its closing `</div>`.

### 2c. `src/projects/variance-engine/VarianceEngineProject.jsx`

Same change — remove the `<div className="mt-12">` wrapper and its closing `</div>`.

**Before committing, confirm with a grep:**

```bash
grep -rn 'mt-12' src/projects/
```

Should return zero matches inside `src/projects/command-center/`, `src/projects/decision-impact/`, and `src/projects/variance-engine/` root project files.

---

## Files Changed

| File | Change |
|---|---|
| `src/projects/ProjectLayout.jsx` | Delete standalone View Code block; replace Limitations block with unified GlassPanel Closing Card containing both View Code + Known Limitations |
| `src/projects/command-center/CommandCenterProject.jsx` | Remove `<div className="mt-12">` outer wrapper |
| `src/projects/decision-impact/DecisionImpactProject.jsx` | Remove `<div className="mt-12">` outer wrapper |
| `src/projects/variance-engine/VarianceEngineProject.jsx` | Remove `<div className="mt-12">` outer wrapper |

Four files, one commit.

---

## What Does NOT Change

- The 4 limitation strings in each project component — keep them verbatim.
- The `limitations` prop on `ProjectLayout` — keep the same API.
- The Section padding tokens in `src/index.css` — do NOT touch `--section-padding-y` globally (affects Hero, About, Build Log, Contact too).
- The order of elements in `ProjectLayout` (Header → Question → Badges → Demo → Formulas → Closing Card).
- The name "Known Limitations" — kept verbatim; Sidney didn't ask to rename it.

---

## Verification

### Build
```bash
npm run build
```
Must succeed with zero new warnings.

### Visual checks on dev preview (`npm run dev`)

Do these in both light mode and dark mode:

- [ ] **Each of the 3 projects ends with a GlassPanel closing card** — the panel has a subtle border, background, and blur matching the Business Question card at the top of the same project (visual bookends).
- [ ] **Card header row:** Info icon + "KNOWN LIMITATIONS" title on the left, context sentence beneath, `View Code` button on the right. On mobile (<640px) the button wraps below the title gracefully.
- [ ] **Limitations grid:** 2 columns on `sm` and above, 1 column below `sm`. Bullet points are `text-accent-blue` (the portfolio's primary blue).
- [ ] **Readability:** limitations are `text-sm text-text-secondary` (not `text-xs text-text-muted`) — noticeably more readable than before.
- [ ] **View Code functionality:** clicking `View Code` in the new location still opens the `CodeToggle` slide-out modal with the correct code tabs. Click Escape / close button → modal closes, Lenis scroll resumes.
- [ ] **Inter-project spacing:** The gap between the bottom of Project 1's closing card and the top of Project 2's title no longer feels like dead space. The padding is still generous but now reads as premium breathing room because the card earns it.
- [ ] **Dark mode border flash:** on scroll the navbar still does NOT flash its border (regression check from the previous theme-color session).
- [ ] **Lenis scroll:** smooth scroll works through the Projects section without any container appearing frozen.

### Mobile responsive
Test at 375px width:
- Card header wraps correctly (title stacks above button)
- Limitations grid collapses to 1 column
- No horizontal overflow

### Cross-project consistency
All 3 projects should render their closing card identically in structure, differing only in the limitation content.

---

## Commit Message

```
feat: unify View Code + Known Limitations into premium project closing card
```

---

## Branch Workflow

```bash
git status
git branch --show-current  # expect: dev
git pull origin dev

# Make the 4 edits above
npm run build              # must pass
git add src/projects/ProjectLayout.jsx \
        src/projects/command-center/CommandCenterProject.jsx \
        src/projects/decision-impact/DecisionImpactProject.jsx \
        src/projects/variance-engine/VarianceEngineProject.jsx
git commit -m "feat: unify View Code + Known Limitations into premium project closing card"
git push origin dev

gh pr create --base main --head dev \
  --title "feat: project closing card — unify View Code with Known Limitations" \
  --body "$(cat <<'EOF'
## Summary
- Replace the weak \`text-xs text-text-muted\` footnote at the bottom of each project with a GlassPanel closing card that unifies \`View Code\` + \`Known Limitations\` into a single substantial element
- Limitations now render in a readable 2-column grid with subtle accent-blue bullets and \`text-sm text-text-secondary\` typography
- Eliminate the 48px \`mt-12\` wrapper on each project component that was compounding with Section padding
- Creates visual bookends with the Business Question GlassPanel at the top of each project, aligning with the executive-first hierarchy principle

## Why not a dedicated Limitations section
Divorcing limitations from their project context breaks the per-project narrative arc (Question → Implementation → Honest Trade-offs → next project). A weighty in-place closing card solves the dead-space perception without moving content.

## Test plan
- [ ] Each project ends with a GlassPanel Closing Card matching the Business Question card visually
- [ ] View Code button lives inside the card header row and still opens the code slide-out
- [ ] Limitations grid: 2 cols on sm+, 1 col on mobile; text readable (not muted footnote)
- [ ] Inter-project gap no longer reads as dead space
- [ ] Dark mode + light mode both polished
- [ ] Mobile 375px: card header wraps cleanly, grid collapses to 1 column
EOF
)"
```

After the PR is created, Sidney will review the dev preview and merge.
