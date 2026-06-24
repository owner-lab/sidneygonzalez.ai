---
name: sidneygonzalez.ai
description: Financial intelligence portfolio — systematic, authoritative, built for people who read between the lines.
colors:
  # Dark-mode foundations (primary brand surface)
  void: "#0A0A0F"
  depth: "#111118"
  surface-dark: "#1E1E2E"
  surface-dark-hover: "#252538"
  # Light-mode foundations
  white: "#FFFFFF"
  slate-50: "#F8FAFC"
  slate-100: "#F1F5F9"
  slate-200: "#E2E8F0"
  # Text
  ink-light: "#0F172A"
  ink-muted-light: "#5A6678"
  ink-dark: "#E2E8F0"
  ink-secondary-dark: "#94A3B8"
  ink-muted-dark: "#828FA6"
  # Semantic accents — fills (static, same in both themes)
  action: "#0068FF"
  positive: "#4AF6C3"
  negative: "#FF433D"
  warning: "#FB8B1E"
  intelligence: "#A78BFA"
  # Semantic accents — ink, light mode (WCAG AA on white)
  action-ink-light: "#0052CC"
  positive-ink-light: "#0B7A5A"
  negative-ink-light: "#C81E1E"
  warning-ink-light: "#9E5400"
  intelligence-ink-light: "#6A45C7"
  # Semantic accents — ink, dark mode (bright fills pass on near-black)
  action-ink-dark: "#4D94FF"
  positive-ink-dark: "#4AF6C3"
  negative-ink-dark: "#FF6B66"
  warning-ink-dark: "#FB8B1E"
  intelligence-ink-dark: "#A78BFA"
typography:
  display:
    fontFamily: '"Instrument Sans", system-ui, sans-serif'
    fontSize: "clamp(2.5rem, 7vw, 4.5rem)"
    fontWeight: 600
    lineHeight: 1.1
    letterSpacing: "-0.02em"
  headline:
    fontFamily: '"Instrument Sans", system-ui, sans-serif'
    fontSize: "1.875rem"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "-0.01em"
  title:
    fontFamily: '"Instrument Sans", system-ui, sans-serif'
    fontSize: "1.25rem"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "0"
  body:
    fontFamily: '"IBM Plex Sans", system-ui, sans-serif'
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.625
    letterSpacing: "0"
  label:
    fontFamily: '"IBM Plex Sans", system-ui, sans-serif'
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "0.05em"
  mono:
    fontFamily: '"JetBrains Mono", monospace'
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "0"
    fontFeature: '"tnum"'
rounded:
  full: "9999px"
  card: "1rem"
  button: "0.5rem"
  badge: "9999px"
spacing:
  xs: "0.25rem"
  sm: "0.5rem"
  md: "1rem"
  lg: "1.5rem"
  xl: "2rem"
  section-y: "clamp(4rem, 10vh, 8rem)"
  section-x: "clamp(1rem, 5vw, 4rem)"
components:
  button-primary:
    backgroundColor: "{colors.action}"
    textColor: "#FFFFFF"
    rounded: "{rounded.button}"
    padding: "10px 20px"
  button-primary-hover:
    backgroundColor: "{colors.action}"
    textColor: "#FFFFFF"
    rounded: "{rounded.button}"
    padding: "10px 20px"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.ink-dark}"
    rounded: "{rounded.button}"
    padding: "10px 20px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ink-secondary-dark}"
    rounded: "{rounded.button}"
    padding: "10px 20px"
  badge-blue:
    backgroundColor: "{colors.action}"
    textColor: "{colors.action-ink-light}"
    rounded: "{rounded.badge}"
    padding: "4px 12px"
  badge-green:
    backgroundColor: "{colors.positive}"
    textColor: "{colors.positive-ink-light}"
    rounded: "{rounded.badge}"
    padding: "4px 12px"
  badge-red:
    backgroundColor: "{colors.negative}"
    textColor: "{colors.negative-ink-light}"
    rounded: "{rounded.badge}"
    padding: "4px 12px"
---

# Design System: sidneygonzalez.ai

## 1. Overview

**Creative North Star: "The Precision Instrument"**

This is a visual system built for people who work with numbers for a living. Every element is machined to exact tolerances — not styled. The interface doesn't try to impress; it communicates. A CIO landing on this portfolio should feel the same way they feel when they open a Bloomberg terminal: orientation in seconds, depth on demand, no time wasted.

The system is dual-theme: dark mode is the primary brand surface (deep navy-blacks that frame financial data with authority), with a light mode that is equally rigorous — clean whites, carefully checked contrast, the same structural discipline in a different register. Neither theme is a concession. Both are considered.

What this system explicitly rejects: the over-designed agency site where motion and WebGL replace substance; the generic AI portfolio with purple gradients and hero-metric cards; the startup SaaS landing with its warm neutrals and evenly-distributed pastel grid. Those interfaces prioritize the designer's moment over the reader's time. This one doesn't.

**Key Characteristics:**
- Flat structural surfaces with glass reserved for data containers
- Semantic color: every accent means something specific and nothing else
- Two-voice typography: Space Grotesk commands, Inter serves
- Financial-grade numeric rendering with JetBrains Mono + tabular-nums
- Reduced-motion compliant; every animation degrades to a static equivalent
- WCAG AA minimum across all surfaces and themes

## 2. Colors: The Signal Palette

Five accent colors. Each has one job. None are decorative.

### Primary
- **System Blue / Action (#0068FF):** The single interactive color. Used on buttons, links, focus rings, and selected states. Carries the meaning "this does something." Light-mode ink: #0052CC. Dark-mode ink: #4D94FF.

### Tertiary
- **Intelligence Purple (#A78BFA):** Reserved for AI-adjacent features — the /ai page, AI capability badges, intelligence-related callouts. Its rarity is intentional; it signals something qualitatively different. Light-mode ink: #6A45C7.

### Neutral
- **Void (#0A0A0F):** Primary dark-mode background. Near-black with a slight blue cast that reads as deliberate, not accidental.
- **Depth (#111118):** Dark-mode secondary background. Cards and secondary surfaces.
- **Dark Surface (#1E1E2E):** Dark-mode tertiary — elevated panels, hover states.
- **White (#FFFFFF) / Slate-50 (#F8FAFC) / Slate-100 (#F1F5F9):** Light-mode backgrounds in the same structural role.
- **Ink Light (#0F172A):** Primary text, light mode.
- **Ink Dark (#E2E8F0):** Primary text, dark mode.
- **Ink Secondary (#94A3B8):** Supporting text and labels, dark mode.
- **Ink Muted (#5A6678 light / #828FA6 dark):** Tertiary labels, chart axes, helper text.

### Financial Semantic Colors
- **Positive / Up (#4AF6C3, ink-light: #0B7A5A):** Favorable variance, gains, green delta indicators.
- **Negative / Down (#FF433D, ink-light: #C81E1E):** Unfavorable variance, losses, red delta indicators.
- **Warning (#FB8B1E, ink-light: #9E5400):** Caution thresholds, anomaly alerts.

**The Signal Rule.** Each accent color carries exactly one semantic meaning and appears in exactly that context: blue for interaction, green for positive financial outcomes, red for negative, orange for warnings, purple for AI/intelligence. If you're reaching for purple because something "looks cool purple," stop.

**The Ink/Fill Split Rule.** Bright fills (#0068FF, #4AF6C3, etc.) are for backgrounds, borders, and decorative dots. Text that carries meaning uses the ink variant (#0052CC light / #4D94FF dark). The fill colors fail WCAG AA as text on white — the ink variants don't. Never swap them.

## 3. Typography: Two Voices

**Display Font:** Instrument Sans (system-ui, sans-serif fallback)
**Body Font:** IBM Plex Sans (system-ui, sans-serif fallback)
**Data Font:** JetBrains Mono (monospace fallback)

**Character:** Instrument Sans is the voice of authority — it sets headings, project titles, and metric values with tight, functional letterforms designed for screen precision. IBM Plex Sans is the voice of clarity — it carries body copy and labels with institutional legibility and zero visual friction. They never compete because they never appear at the same visual altitude.

### Hierarchy
- **Display** (600 weight, clamp(2.5rem–4.5rem), line-height 1.1, letter-spacing -0.02em): Hero headings and section titles. The maximum. Floors at -0.02em to prevent letters from touching.
- **Headline** (600 weight, 1.875rem, line-height 1.3, letter-spacing -0.01em): Project names, panel titles. One step below display.
- **Title** (500 weight, 1.25rem, line-height 1.4): Section sub-headers, card headings.
- **Body** (400 weight, 1rem, line-height 1.625): All prose. Cap at 65–75ch per line. text-wrap: balance on headings.
- **Label** (500 weight, 0.75rem, letter-spacing +0.05em, uppercase): Metric labels, chart axis labels, badge text. The only place tracking opens up.
- **Mono** (400 weight, 0.875rem, line-height 1.5, font-feature: "tnum"): All financial figures, code snippets, pipeline code views.

**The Two Voices Rule.** Instrument Sans is for headings, metric values, and navigation. IBM Plex Sans is for body copy, descriptions, and helper text. Neither appears in the other's role.

**The Tabular Precision Rule.** Every financial figure — currency, percentage, ratio — renders in JetBrains Mono with `font-variant-numeric: tabular-nums`. Column alignment is not a nicety; it is how financial readers parse data. No exceptions.

## 4. Elevation: Glass on Flat

This system uses **tonal layering** as its primary depth strategy in dark mode — progressively lighter near-black surfaces signal hierarchy without shadow. Glass panels are the signature elevation treatment, reserved for data containers and overlays where frosted depth serves the content.

### Shadow Vocabulary
- **Glass ambient** (`0 8px 32px rgba(0,0,0,0.08)` light / `0 8px 32px rgba(0,0,0,0.3)` dark): Applied to `.glass-panel` — the diffuse lift under data cards and chart containers.
- **Button lift** (`shadow-lg shadow-accent-blue/25`): Applied to primary CTA buttons. A focused drop shadow in the button's own hue.
- **CTA card glow** (`0 18px 50px -18px rgb(167 139 250 / 0.5)`): Special treatment for the AI Value Model entry card. Purple glow radiating from the card underside on hover.
- **Modal overlay**: No explicit shadow — a darkened backdrop handles the separation.

### Glass Specification
- Background: `rgba(255,255,255,0.7)` light / `rgba(17,17,24,0.6)` dark
- Border: `rgba(0,0,0,0.08)` light / `rgba(255,255,255,0.08)` dark
- Blur: 20px backdrop-filter
- Radius: 1rem (16px)

**The Glass Earns It Rule.** Glass panels appear on data containers (chart wrappers, metric cards, dashboard panels) and overlaying elements (navbar on scroll, modals). The page background and structural layout sections are flat — no glass. Decorative glass cards on marketing sections are prohibited.

**The State-Only Shadow Rule.** Standard flat surfaces have no shadow at rest. Shadows appear on hover (elevation cue) and on glass panels (ambient separation). Never as decoration on a resting card.

## 5. Components

### Buttons
Three variants, each with a clear hierarchy role.
- **Shape:** Gently rounded corners (0.5rem / 8px). Not pill-shaped; not sharp-cornered. Calibrated.
- **Primary:** System Blue background (#0068FF) with white text, `shadow-lg shadow-accent-blue/25`. Hover: 90% opacity, same shadow. Focus: 2px ring at accent-blue/50. Only one primary button per screen area.
- **Secondary:** Transparent background, subtle border (`rgba(0,0,0,0.08)`), primary text color. Hover: surface background fill.
- **Ghost:** Transparent, subtle border, secondary text color. Hover: hover-surface fill, primary text color upgrade.
- **Transitions:** 200ms, ease-out. All state changes.

### Badges
Color-coded semantic chips. Each variant maps directly to the Signal Rule.
- **Shape:** Pill (border-radius: 9999px). Padding: 4px 12px.
- **Style:** 10% opacity background in the accent color, accent-ink text, 20% opacity border. No solid fills on badges.
- **Five variants:** blue (action/tech), green (positive), red (negative), orange (warning), purple (intelligence/AI).
- **Typography:** Label scale — 0.75rem, 500 weight, Inter.

### Glass Panels (Signature)
The signature container. Used for metric cards, chart containers, project dashboard panels.
- **Background:** Semi-transparent (0.7 light / 0.6 dark), backdrop blur 20px.
- **Border:** 1px, `rgba(0,0,0,0.08)` light / `rgba(255,255,255,0.08)` dark.
- **Shadow:** Ambient glass shadow (see Elevation).
- **Radius:** 1rem.
- **Transition:** background, border-color, box-shadow — 300ms.

### Metric Cards
Built on the Glass Panel. The primary KPI display unit.
- **Structure:** Label (Label scale, uppercase, muted) → Value (Headline scale, Space Grotesk, JetBrains Mono for numbers) → Change indicator (Body scale, impact color).
- **Value rendering:** Always JetBrains Mono + tabular-nums. Always.
- **Change colors:** Positive → `text-impact-positive` (accent-green-ink), Negative → `text-impact-negative` (accent-red-ink), Neutral → `text-impact-neutral` (muted).

### Navigation
- **Desktop:** Horizontal link bar, fixed top. Body/label scale, secondary text color at rest, primary on hover. Smooth backdrop glass on scroll.
- **Active:** No explicit active style beyond URL match — the page context communicates position.
- **Mobile:** Collapsed. (Responsive treatment per Adapt reference.)

### Code Toggle (Signature)
A sliding code panel on project dashboards — "View Code" tab opens the pipeline code (`pipeline_etl.py`, etc.) in a monospaced view. Uses JetBrains Mono at body scale. This is the "engineering is the demo" pattern that differentiates the portfolio.

## 6. Do's and Don'ts

### Do:
- **Do** render every financial figure in JetBrains Mono with `font-variant-numeric: tabular-nums`.
- **Do** use accent fill colors (#0068FF, #4AF6C3, etc.) only for backgrounds and borders; switch to the ink variant for any text use.
- **Do** pair WCAG AA verification for any text on a tinted or dark background. Body text must hit ≥4.5:1; large text ≥3:1.
- **Do** add `data-lenis-prevent` to every scrollable container (`overflow-auto`, `overflow-y-auto`, `overflow-x-auto`). Lenis intercepts scroll at the window level; without this, the container appears frozen.
- **Do** use glass panels exclusively on data containers and overlays. Keep structural layout surfaces flat.
- **Do** write negative financial values in red parentheses — accounting notation, not a minus sign.
- **Do** restrict the intelligence purple (#A78BFA) to AI-adjacent features only. Its rarity is load-bearing.
- **Do** cap display heading letter-spacing at -0.02em. Anything tighter than -0.04em makes letters touch.
- **Do** use `text-wrap: balance` on h1–h3. Eliminate orphans on headings automatically.
- **Do** provide a `@media (prefers-reduced-motion: reduce)` fallback for every animation.

### Don't:
- **Don't** use gradient text (`background-clip: text` with a gradient). This is prohibited by the impeccable design spec and by this system's Signal Rule — color carries meaning, not decoration.
- **Don't** add motion for atmosphere. Motion earns its place by serving meaning: state feedback, entrance reveals, data updates. The cta-shimmer and cta-glow-breathe are deliberate exceptions for the primary conversion surface.
- **Don't** use glass panels on marketing sections or hero backgrounds — the "glassmorphism as default" pattern reads as decorative and cheap.
- **Don't** use an over-designed aesthetic: no cursor effects, no WebGL backgrounds, no scroll-jacking beyond Lenis smooth scrolling. Style over substance undermines the "Precision Instrument" north star.
- **Don't** use purple for anything other than AI/intelligence features. A purple button, purple heading, or purple badge on a non-AI surface breaks the signal system.
- **Don't** use `border-left` greater than 1px as a colored accent stripe on cards. Rewrite with background tints or full borders.
- **Don't** nest glass panels inside glass panels. One layer of glass per container hierarchy.
- **Don't** use `border-radius` greater than 1rem (16px) on cards or panels. Buttons may be pill-shaped only for tag/badge elements; cards top out at 16px.
- **Don't** deploy the hero-metric template (big number, small label, gradient accent, supporting stats) as a layout pattern on the main portfolio. It is the SaaS cliché this portfolio explicitly avoids.
- **Don't** use identical card grids. Vary layout, density, and visual weight across project entries.
