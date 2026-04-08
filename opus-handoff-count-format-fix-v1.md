# Opus-to-Sonnet Handoff: Batched Fixes v1

> **Purpose**: Four confirmed bugs fixed in one pass.
> **Context**: React 18 + Vite 8 + Tailwind 3.4.19 portfolio. Git workflow: develop on `dev`, PR to `main`. Do NOT include `Co-Authored-By` Claude lines in commits. Never reuse PR titles.

---

## Fix 1 — Transactions Analyzed shows dollar sign instead of count

**Bug**: In `src/projects/variance-engine/VarianceSummary.jsx` line 44, `formatCompact(data.transactions_analyzed)` applies currency formatting to a transaction count. 5,161 transactions renders as "$5K" instead of "5.2K". `formatCompact` is a currency-only formatter that prepends `$` to every value.

### Step 1 — Add `formatCount` to `src/utils/formatters.js`

Append this at the **end of the file**, after the existing `formatCompact` function:

```js
/**
 * Format a large count compactly (no currency symbol).
 * @param {number} value
 * @returns {string} e.g. "5.2K", "1.3M"
 */
export function formatCount(value) {
  const abs = Math.abs(value)
  const sign = value < 0 ? '-' : ''

  if (abs >= 1_000_000_000) return `${sign}${(abs / 1_000_000_000).toFixed(1)}B`
  if (abs >= 1_000_000) return `${sign}${(abs / 1_000_000).toFixed(1)}M`
  if (abs >= 1_000) return `${sign}${(abs / 1_000).toFixed(1)}K`
  return `${sign}${abs.toFixed(0)}`
}
```

Do not modify `formatCompact` — other components use it for legitimate currency display.

### Step 2 — Update `src/projects/variance-engine/VarianceSummary.jsx`

**Line 4** — add `formatCount` to the import:
```jsx
// BEFORE:
import { formatVariance, formatCompact } from '@/utils/formatters'

// AFTER:
import { formatVariance, formatCompact, formatCount } from '@/utils/formatters'
```

**Line 44** — replace `formatCompact` with `formatCount`:
```jsx
// BEFORE:
value={formatCompact(data.transactions_analyzed)}

// AFTER:
value={formatCount(data.transactions_analyzed)}
```

**Verification**: "Transactions Analyzed" card shows "5.2K" with no dollar sign. All other metric cards are unchanged.

---

## Fix 2 — LinkedIn link routes to a broken placeholder URL

**Bug**: `src/config/constants.js` line 18 has a placeholder LinkedIn URL (`https://linkedin.com/in/sidneygonzalez`) that leads to an empty error page. The correct URL is `https://www.linkedin.com/in/sidney-gonzalez-784034158/`.

### Step 1 — Update `src/config/constants.js`

**Line 18** — replace the placeholder:
```js
// BEFORE:
  linkedin: 'https://linkedin.com/in/sidneygonzalez',

// AFTER:
  linkedin: 'https://www.linkedin.com/in/sidney-gonzalez-784034158/',
```

**Verification**: Click the LinkedIn card in the Contact section. It should open `https://www.linkedin.com/in/sidney-gonzalez-784034158/` in a new tab.

---

## Fix 3 — Text selection highlight has poor contrast in light mode

**Bug**: `src/index.css` line 82 applies `text-white` to selected text with a `bg-accent-blue/30` (30% blue) selection background. In light mode, 30% blue on white is a very pale wash — white text on it has near-zero contrast and is unreadable.

### Step 1 — Update `src/index.css`

**Line 82** — change `text-white` to `text-text-primary`:
```css
/* BEFORE: */
::selection {
  @apply bg-accent-blue/30 text-white;
}

/* AFTER: */
::selection {
  @apply bg-accent-blue/30 text-text-primary;
}
```

`text-text-primary` resolves to near-black (`#0F172A`) in light mode and near-white (`#E2E8F0`) in dark mode via CSS custom properties, so selected text is readable in both themes.

**Verification**: In light mode, select any body text on the page. The selection highlight should show dark text inside a light blue selection band. In dark mode, selected text should still be readable (light text on a deeper blue tint).

---

---

## Fix 4 — "View Code" panel shows only the stage name line, not the actual code

**Bug**: All three project files use a `splitPipelineTabs` / `splitEngineTabs` function that splits the Python source on a banner line (`# ═══...═══`). The Python files sandwich each stage name between two banner lines:

```
# ═══...═══
# STAGE 1: INGEST
# ═══...═══
[actual code here]
```

After splitting on the banner, the array alternates: `[stage name only]`, `[code]`, `[stage name only]`, `[code]`, etc. The loop only captures sections containing the word "STAGE" — which are only the name-only sections — and skips the code sections that follow them. Every tab ends up showing just `# STAGE N: NAME`.

**Second part of the same bug**: The custom tab names produced by these functions (`Validate`, `Aggregate`, `Anomaly Detection`, `Parse Model`, `Output`, etc.) are never passed to `CodeToggle`. `CodeToggle` renders tabs from its hardcoded default (`['Ingest', 'Clean', 'Transform', 'Analyze', 'Visualize']`) regardless of what keys are in `codeByTab`. Fix `CodeToggle` to derive tabs from `Object.keys(codeByTab)` when the object is non-empty.

### Step 1 — Fix `CodeToggle` to derive tabs from `codeByTab` keys

**File**: `src/components/ui/CodeToggle.jsx`

In the component body, before the return, add:

```jsx
const activeTabs = Object.keys(codeByTab).length > 0 ? Object.keys(codeByTab) : tabs
```

Then replace every use of `tabs` in the JSX with `activeTabs`. The only occurrence is the `.map()` on line 65:

```jsx
// BEFORE:
{tabs.map((tab) => (

// AFTER:
{activeTabs.map((tab) => (
```

Also update `useState(tabs[0])` on line 8 to use the derived tabs:

```jsx
// BEFORE (line 8):
const [activeTab, setActiveTab] = useState(tabs[0])

// AFTER:
const activeTabs = Object.keys(codeByTab).length > 0 ? Object.keys(codeByTab) : tabs
const [activeTab, setActiveTab] = useState(activeTabs[0])
```

Since `activeTabs` is needed both for the initial state and in the JSX, define it once before the `useState` call. Move the `activeTabs` declaration to the top of the component body (before all hooks), and use it in both places.

**Final component top should look like:**

```jsx
export default function CodeToggle({ isOpen, onClose, tabs = PIPELINE_TABS, codeByTab = {} }) {
  const activeTabs = Object.keys(codeByTab).length > 0 ? Object.keys(codeByTab) : tabs
  const [activeTab, setActiveTab] = useState(activeTabs[0])

  // ... existing useEffects unchanged ...
```

And in the JSX, `{tabs.map(...)}` → `{activeTabs.map(...)}`.

---

### Step 2 — Fix the split logic in all three project files

The same index-based loop fix applies to all three files. Replace the `for...of` loop with an index-based `for` loop that grabs the current section (stage name) AND the next section (stage code) together.

---

**File**: `src/projects/command-center/CommandCenterProject.jsx`

Replace the `splitPipelineTabs` function (lines 29–48) entirely:

```js
function splitPipelineTabs(code) {
  const sections = code.split(STAGE_MARKER)
  const stages = {}
  const names = ['Ingest', 'Validate', 'Clean', 'Transform', 'Output']
  let nameIdx = 0

  for (let i = 0; i < sections.length; i++) {
    if (sections[i].includes('STAGE') && nameIdx < names.length) {
      const stageHeader = sections[i].trim()
      const stageCode = i + 1 < sections.length ? sections[i + 1].trim() : ''
      stages[names[nameIdx]] = stageHeader + '\n\n' + stageCode
      nameIdx++
      i++ // skip the code section — already consumed above
    }
  }

  if (nameIdx === 0) return { Ingest: code }
  return stages
}
```

---

**File**: `src/projects/decision-impact/DecisionImpactProject.jsx`

Replace the `splitEngineTabs` function (lines 53–68) entirely:

```js
function splitEngineTabs(code) {
  const sections = code.split(STAGE_MARKER)
  const stages = {}
  const names = ['Parse Model', 'Propagate', 'Output']
  let nameIdx = 0

  for (let i = 0; i < sections.length; i++) {
    if (sections[i].includes('STAGE') && nameIdx < names.length) {
      const stageHeader = sections[i].trim()
      const stageCode = i + 1 < sections.length ? sections[i + 1].trim() : ''
      stages[names[nameIdx]] = stageHeader + '\n\n' + stageCode
      nameIdx++
      i++
    }
  }

  if (nameIdx === 0) return { 'Full Code': code }
  return stages
}
```

---

**File**: `src/projects/variance-engine/VarianceEngineProject.jsx`

Replace the `splitPipelineTabs` function (lines 39–54) entirely:

```js
function splitPipelineTabs(code) {
  const sections = code.split(STAGE_MARKER)
  const stages = {}
  const names = ['Ingest', 'Aggregate', 'Variance', 'Anomaly Detection', 'Output']
  let nameIdx = 0

  for (let i = 0; i < sections.length; i++) {
    if (sections[i].includes('STAGE') && nameIdx < names.length) {
      const stageHeader = sections[i].trim()
      const stageCode = i + 1 < sections.length ? sections[i + 1].trim() : ''
      stages[names[nameIdx]] = stageHeader + '\n\n' + stageCode
      nameIdx++
      i++
    }
  }

  if (nameIdx === 0) return { 'Full Code': code }
  return stages
}
```

**Verification**: Click "View Code" on any project. Each tab (Ingest, Validate, Clean, etc.) should show the actual Python code for that stage — not just the comment header line. The tab labels shown should match the stage names above (Ingest, Validate, etc.) not the generic defaults.

---

## Summary of All File Changes

| File | Change | Fix |
|------|--------|-----|
| `src/utils/formatters.js` | Append `formatCount` function | Fix 1 |
| `src/projects/variance-engine/VarianceSummary.jsx` | Import + use `formatCount` | Fix 1 |
| `src/config/constants.js` | Correct LinkedIn URL | Fix 2 |
| `src/index.css` | `::selection` text color | Fix 3 |
| `src/components/ui/CodeToggle.jsx` | Derive `activeTabs` from `codeByTab` keys | Fix 4 |
| `src/projects/command-center/CommandCenterProject.jsx` | Fix `splitPipelineTabs` loop | Fix 4 |
| `src/projects/decision-impact/DecisionImpactProject.jsx` | Fix `splitEngineTabs` loop | Fix 4 |
| `src/projects/variance-engine/VarianceEngineProject.jsx` | Fix `splitPipelineTabs` loop | Fix 4 |

**Total files touched: 8**

---

## Git Instructions

1. Confirm you are on the `dev` branch: `git checkout dev`
2. Stage all eight files:

```
git add src/utils/formatters.js src/projects/variance-engine/VarianceSummary.jsx src/config/constants.js src/index.css src/components/ui/CodeToggle.jsx src/projects/command-center/CommandCenterProject.jsx src/projects/decision-impact/DecisionImpactProject.jsx src/projects/variance-engine/VarianceEngineProject.jsx
```

3. Commit:

```
git commit -m "fix: View Code panel shows actual pipeline code, count format, LinkedIn URL, selection contrast"
```

4. Push: `git push origin dev`
5. Create PR:

```
gh pr create --base main --head dev --title "Fix View Code panel content, count format, LinkedIn URL, selection contrast" --body "- View Code panel now shows actual pipeline code per stage tab (was only showing stage header line due to broken split logic)
- CodeToggle derives tab names from codeByTab keys instead of hardcoded defaults
- Transactions Analyzed shows 5.2K instead of dollar-sign 5K
- LinkedIn contact link corrected to real profile URL
- Text selection readable in both light and dark mode"
```
