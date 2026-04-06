# Claude Code Directives — sidneygonzalez.ai

## Project Overview

Single-page React portfolio at sidneygonzalez.ai demonstrating financial intelligence systems. Three interconnected projects form a Corporate Intelligence Stack with live Python (Pyodide) computation in the browser.

## Build Principles

1. **Build incrementally.** Each phase results in a deployable state. Component-first — build and test in isolation before composing.
2. **Mobile-first responsive.** Start at 375px. Test at 375/768/1280/1920px.
3. **Accessibility baseline.** Semantic HTML, heading hierarchy, focus-visible, aria-labels, reduced-motion fallbacks.
4. **Financial precision.** Thousands separators, consistent decimals, percentage formatting, negative values in red parentheses (accounting notation). `tabular-nums` on all financial data.
5. **Error boundaries.** Every Pyodide component has fallback: worker failure shows static preview with GitHub link. Never a blank screen.
6. **Pipeline visibility.** "View Code" tabs: Ingest > Clean > Transform > Analyze > Visualize. The engineering is the demo.
7. **Executive-first hierarchy.** Each project opens with the business insight. Technical details are one click deeper.
8. **Performance discipline.** Initial JS < 250KB gzipped. Pyodide is non-blocking. Skeleton screens for async content. No layout shifts.

## Git Workflow

- Develop on `dev` branch
- PR to `main` for approval
- Conventional Commits (feat:, fix:, refactor:, docs:, chore:)
- Do NOT include `Co-Authored-By` Claude lines in commits
- Never reuse the same PR title across multiple pushes (Netlify snapshots per deploy preview)

## Tech Stack

- React 18 (Vite + SWC) / Tailwind CSS 3.x / Motion v12
- Lenis smooth scroll / Recharts + Nivo / KaTeX / Pyodide in Web Worker
- Fonts: Space Grotesk (display), Inter (body), JetBrains Mono (code/data)
- Deployed to Cloudflare Pages

## Design Tokens

Colors, fonts, and glassmorphism tokens are defined in:
- `src/index.css` — CSS custom properties
- `src/config/theme.js` — JS-accessible tokens
- `tailwind.config.js` — Tailwind theme extensions

## Data Integrity

All synthetic datasets must pass `validate_realism.py` before being used in any project UI. If data looks fake, the project looks fake. Data generation scripts live in `data-generation/`.
