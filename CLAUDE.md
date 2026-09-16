# Claude Code Directives — sidneygonzalez.ai

## Project Overview

Single-page React portfolio at sidneygonzalez.ai demonstrating financial intelligence systems. Three interconnected projects form a Corporate Intelligence Stack with live Python (Pyodide) computation in the browser.

## Build Principles

1. **Build incrementally.** Each phase results in a deployable state. Component-first — build and test in isolation before composing.
2. **Mobile-first responsive.** Start at 375px. Test at 375/768/1280/1920px.
3. **Accessibility baseline.** Semantic HTML, heading hierarchy, focus-visible, aria-labels, reduced-motion fallbacks.
4. **Financial precision.** Thousands separators, consistent decimals, percentage formatting, negative values in red parentheses (accounting notation). `tabular-nums` on all financial data.
5. **Error boundaries.** Every Pyodide component has fallback: worker failure shows a static preview plus a CTA into that project's "View Code" slide-out. Never a blank screen, never a dead end. The repo is private — the site must not link out to it (see Source Visibility below).
6. **Pipeline visibility.** "View Code" tabs: Ingest > Clean > Transform > Analyze > Visualize. The engineering is the demo.
7. **Executive-first hierarchy.** Each project opens with the business insight. Technical details are one click deeper.
8. **Performance discipline.** Initial JS < 250KB gzipped. Pyodide is non-blocking. Skeleton screens for async content. No layout shifts.

## Source Visibility

The site is public; the repo is **private**. These are deliberately decoupled.

- **Never add an outbound link to the repository** from the site. `SOCIAL` in `src/config/constants.js` has no `github` key by design — don't reintroduce one.
- Pipeline transparency is served **in-page** by the `CodeToggle` slide-out (curated `codeByTab` snippets), not by sending visitors to the repo. This is what keeps principle #6 ("the engineering is the demo") true under a private repo.
- Fallbacks reach that slide-out via `ProjectCodeContext` (`src/hooks/useProjectCode.js`). The context is **positional**: a component rendered above the provider reads `null` and silently loses its CTA. Consume it from a child of `ProjectLayout` (or of a component that provides it, like `AiValueModel`) — never from the component that renders the provider.
- `build.sourcemap` is pinned `false` in `vite.config.js`. The shipped bundle is the only public artifact; a source map would republish the original source verbatim.
- `scripts/generate-og-github.mjs` is dormant (it generated the repo's social preview card). Its output `public/og-github.png` is retained — it doubles as the LinkedIn Featured image.

## Git Workflow

- Develop on `dev` branch
- PR to `main` for approval
- Conventional Commits (feat:, fix:, refactor:, docs:, chore:)
- Do NOT include `Co-Authored-By` Claude lines in commits
- Never reuse the same PR title across multiple pushes (Netlify snapshots per deploy preview)

## Tech Stack

- React 18 (Vite + SWC) / Tailwind CSS 3.x / Motion v12
- Lenis smooth scroll / Recharts + Nivo / KaTeX / Pyodide in Web Worker
- Fonts: Instrument Sans (display), IBM Plex Sans (body), JetBrains Mono (code/data)
- Deployed to Cloudflare Pages

## Design Tokens

Colors, fonts, and glassmorphism tokens are defined in:
- `src/index.css` — CSS custom properties
- `src/config/theme.js` — JS-accessible tokens
- `tailwind.config.js` — Tailwind theme extensions

## Lenis Scroll Rules

The site uses Lenis smooth scroll (`<ReactLenis root>` in `App.jsx`), which intercepts ALL scroll events at the `window` level in JavaScript. This bypasses native CSS overflow on any element.

**Rule:** Every scrollable container — `overflow-auto`, `overflow-y-auto`, `overflow-x-auto` — must have `data-lenis-prevent` on it, or Lenis will steal the scroll and the container will appear frozen.

```jsx
// Correct — Lenis yields to native scroll when hovering this element
<div className="overflow-x-auto" data-lenis-prevent>
<div className="max-h-[400px] overflow-y-auto" data-lenis-prevent>

// Wrong — Lenis intercepts, element appears unscrollable
<div className="overflow-x-auto">
```

**Exception:** Modal overlays (e.g. `CodeToggle`) should call `lenis.stop()` / `lenis.start()` instead, since they lock the entire page scroll rather than isolating a sub-container.

## Data Integrity

All synthetic datasets must pass `validate_realism.py` before being used in any project UI. If data looks fake, the project looks fake. Data generation scripts live in `data-generation/`.

## Design Context

Full spec: `PRODUCT.md` (strategic) · `DESIGN.md` (visual) · `.impeccable/design.json` (token sidecar + component snippets)

- **Register:** Brand — design IS the product. Target: CIO/CFO/CAIO buyers.
- **North Star:** "The Precision Instrument" — Bloomberg Terminal authority, not agency-site spectacle.
- **Anti-references:** Over-designed agency site (cursor effects, WebGL, motion over substance); generic AI portfolio (purple gradients, hero-metric cards); startup SaaS landing (warm neutrals, pastel grids).
- **Principles:** (1) Information is authority. (2) Built for readers, not viewers. (3) Restraint as craft. (4) Distinctly positioned. (5) Financial precision.
- **Accent colors are semantic:** Blue = action, Green = positive, Red = negative, Orange = warning, Purple = AI/intelligence only. Never decorative.
- **Glass panels** are data containers and overlays only — not structural layout or marketing sections.
- **All financial figures** use JetBrains Mono + `font-variant-numeric: tabular-nums`. No exceptions.

## graphify

Machine-local knowledge graph of this repo at `graphify-out/` (gitignored; `graphify` CLI is a global install, not a repo dependency). **If the CLI or `graphify-out/graph.json` is absent — e.g. cloud/CI sessions — skip this section entirely.**

Rules (when present):
- For codebase questions, orient with `graphify query "<question>"` first — a scoped subgraph, ~50x cheaper than grep-and-read exploration (measured on this repo). Use `graphify path "<A>" "<B>"` for relationships, `graphify explain "<symbol-or-file>"` for one concept, `graphify affected "<symbol>"` for impact analysis.
- Phrase queries with concrete symbol/file terms — seeding is lexical, so `"chartTheme"` beats `"how does theming work"`.
- Read raw source only for the specific lines you'll modify or debug; read `graphify-out/GRAPH_REPORT.md` only for broad architecture review.
- After modifying code, run `graphify update .` to keep the graph current (local AST, no LLM/API cost).
- Include these rules in any subagent prompt that explores code.
