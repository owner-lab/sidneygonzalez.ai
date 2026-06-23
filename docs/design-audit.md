# Design Audit — Generic-AI Tells vs. "The Precision Instrument"

> Multi-agent audit of the front end against `DESIGN.md` / `PRODUCT.md` / `.impeccable/design.json`.
> **53 tells confirmed** (40 Class-A code-violates-spec · 13 Class-B spec-is-generic) from 58 raw findings,
> across 7 design-critic dimensions, each finding adversarially verified (skeptics defaulted to *refuting*).
> Run `wco2hsmgi` · 66 agents · read-only. The final synthesis was authored from the verified findings after
> the workflow's synthesis agent hit a session limit.

**Class A** = the code breaks a rule the spec *already states* → fix to conform.
**Class B** = the spec *itself* encodes a generic choice → a decision to evolve the spec.

---

## Verdict

The system **as written** is disciplined — semantic color, role-segregated type, glass-earns-it, tabular precision. The **implementation has drifted off its own spec**, and the drift clusters on exactly the surfaces meant to persuade: the `/ai` page and the Home → `/ai` CTA. The single most damaging irony: the spec's whole thesis is *financial precision*, yet **the headline KPI numbers don't render in the data typeface** — they fall back to the display font, breaking the Tabular Precision Rule on the most important figures on the site.

Most of the "generic-AI feel" is **concentrated, not pervasive**. A handful of surfaces account for the bulk of the tells — the gradient `/ai` headline (surfaced 5×), the "magic button" CTA (≈7×), two animated hero backgrounds, and glass leaking onto marketing cards. Fixing those few surfaces removes most of the signal. The deepest-rooted tell — the **Space Grotesk + Inter** pairing — is the one place the *spec itself* picks the genre's default; it's real, but it's one signal among many, not a singular disqualifier.

**Net:** ~70% of the visible tells are small, low-risk Class-A conformance fixes that can land in one pass. The rest is deliberate work: de-atmosphere the heroes, vary the card silhouettes, and (separately) evolve the typography.

### Where the tells live

| Dimension | Confirmed | Concentrated on |
|---|--:|---|
| Decoration / micro | 12 | The CTA, OG image, favicon, eyebrows |
| Color & gradients | 10 | Gradient text, CTA fill, purple-as-decoration |
| Motion | 8 | Animated hero backgrounds, ping, arrow loop |
| Typography | 7 | Fonts (spec), mono-on-numbers, gradient text |
| Glass / elevation | 6 | Glass on 6 marketing surfaces |
| Gestalt | 6 | Cumulative purple/glow load on `/ai` |
| Layout | 4 | Identical card grids |

---

## Quick wins — one conformance pass (all Class A, all small)

These are pure spec-conformance, low-risk, and clear most of the *visible* genericness.

1. **Numbers in the data face.** Remove `font-display` so `.metric-value` (JetBrains Mono + tabular-nums) governs every figure — [MetricCard.jsx:21](src/components/ui/MetricCard.jsx#L21), [AnimatedCounter.jsx:43](src/components/ui/AnimatedCounter.jsx#L43), [IdcCredibilityPanel.jsx:30](src/features/ai-value-model/IdcCredibilityPanel.jsx#L30). *Fixes the Tabular Precision Rule on the KPIs.*
2. **Kill gradient text.** Drop the per-word gradient on the `/ai` headline → solid `text-accent-ink-purple` ([AiValueTest.jsx:104](src/pages/AiValueTest.jsx#L104)); delete the three now-orphaned `.text-gradient-*` utilities ([index.css:164-177](src/index.css#L164)). *Prohibited by name in the spec.*
3. **De-magic the CTA.** Solid `bg-accent-purple` hover fill (no purple→blue gradient), drop the pulsing ping dot and the infinite arrow loop; **keep** the one-shot shimmer + breathe glow (those are sanctioned) — [Projects.jsx:184-240](src/sections/Projects.jsx#L184).
4. **Glass → flat on marketing.** Swap `GlassPanel` for a flat bordered surface on the 6 non-data surfaces (CTA, Stack diagram, `/ai` systems + CTA, About "Built With", Build Log cards).
5. **Resting shadow → hover only** on the primary Button ([Button.jsx:3](src/components/ui/Button.jsx#L3)) and its Contact duplicate ([Contact.jsx:51](src/sections/Contact.jsx#L51)).
6. **Stop decorative color.** Drop the four-accent "data flows →" rainbow connector ([Projects.jsx:149-153](src/sections/Projects.jsx#L149)) and the intelligence-purple chart-series color (purple is AI-only, not a categorical hue).

---

## Theme 1 — Financial precision is broken (Tabular Precision Rule) · Class A

The numbers — the entire point — aren't rendered as data. Highest brand-damage-per-fix.

| Tell | Where | Sev | Fix |
|---|---|---|---|
| Metric **values** in Space Grotesk, overriding JetBrains Mono | [MetricCard.jsx:21](src/components/ui/MetricCard.jsx#L21) | High | Remove `font-display`; let `.metric-value` (mono + tabular-nums) govern. `text-2xl`/`font-semibold` still apply. |
| Live KPI counter in Space Grotesk | [AnimatedCounter.jsx:43](src/components/ui/AnimatedCounter.jsx#L43) | Low | Same — render in `.metric-value`. |
| IDC credibility stats in Space Grotesk | [IdcCredibilityPanel.jsx:30](src/features/ai-value-model/IdcCredibilityPanel.jsx#L30) | Med | Same. |

---

## Theme 2 — Gradient text (prohibited outright) · Class A

`background-clip:text` over a gradient is named in the spec's Don'ts *and* breaks the Signal Rule (the `/ai` one ramps purple→blue, fusing two semantic accents into decoration).

| Tell | Where | Sev | Fix |
|---|---|---|---|
| Purple gradient on the `/ai` hero word "earned" | [AiValueTest.jsx:104-106](src/pages/AiValueTest.jsx#L104) | High | Solid `text-accent-ink-purple` (AA-safe) or flat `text-text-primary`. |
| Three `.text-gradient-blue/green/purple` utilities ship in CSS | [index.css:164-177](src/index.css#L164) | High | Delete all three (grep shows no remaining source usage once #2-1 lands). |

---

## Theme 3 — The "magic button" CTA · Class A + B

The Home → `/ai` CTA is the single most concentrated tell (gradient fill + shimmer + breathe + ping + beckoning arrow + glow + eyebrow chip). The verifiers were clear: **two of these are sanctioned, the rest aren't.**

| Tell | Where | Sev | Fix |
|---|---|---|---|
| Purple→blue **gradient fill** (`from-[#6A45C7] via-[#5B4FD6] to-[#0057E0]`) | [Projects.jsx:228](src/sections/Projects.jsx#L228) | High (A) | Solid `group-hover:bg-accent-purple`, white label. One color = one meaning. Deletes 3 off-palette hexes. |
| Pulsing "live" **ping dot** — and the live model isn't even on this page | [Projects.jsx:206-210](src/sections/Projects.jsx#L206) | Med (A) | Remove. Not a sanctioned motion; misleading. |
| **Infinite arrow loop** on hover | [index.css:237-248](src/index.css#L237) | Med (B) | Drop `infinite` → static or single nudge (affordance, not ornament). |
| Second "bloom-in" **glow layer** | [Projects.jsx:194-202](src/sections/Projects.jsx#L194) | Low (A) | Remove; keep the one sanctioned breathe glow. |
| **Keep:** `cta-shimmer` (one-shot) + `cta-glow-breathe` | [index.css:204-235](src/index.css#L204) | — | Spec-sanctioned exceptions for the single AI CTA. Leave them. |

> Net target: *solid purple fill + one-shot shimmer + ambient breathe + static arrow* — one color signal, two sanctioned motions, zero gradient.

---

## Theme 4 — Atmospheric animated backgrounds (agency-spectacle / WebGL anti-reference) · Class A

Both hero entrances run an animated background — the exact "motion/WebGL replaces substance" the spec rejects, *twice*.

| Tell | Where | Sev | Fix |
|---|---|---|---|
| `NeuralFlowBackground` particle-graph canvas behind `/ai` hero | [NeuralFlowBackground.jsx:51-81](src/components/animation/NeuralFlowBackground.jsx#L51) | High | Delete the rAF canvas loop; keep only the static (dialed-back, less-purple) radial mesh, or go fully flat. Credibility comes from the manifesto + live model. |
| `MeshGradient` blue+purple+green wash behind Home hero | [Hero.jsx:54-61](src/sections/Hero.jsx#L54) | High | Flatten the hero; if a backdrop stays, drop the decorative purple/green so it isn't a tri-accent wash. |

---

## Theme 5 — Glass on marketing surfaces (Glass Earns It Rule) · Class A

Glass is reserved for **data containers + overlays**. Six marketing/structural uses violate it.

| Surface | Where | Sev |
|---|---|---|
| Home → `/ai` CTA card | [Projects.jsx:184](src/sections/Projects.jsx#L184) | High |
| "Corporate Intelligence Stack" 4 panels | [Projects.jsx:132](src/sections/Projects.jsx#L132) | High |
| `/ai` SYSTEMS 3-up cards | [AiValueTest.jsx:188](src/pages/AiValueTest.jsx#L188) | High |
| `/ai` final CTA section | [AiValueTest.jsx:212](src/pages/AiValueTest.jsx#L212) | High |
| About "Built With" panel | [About.jsx:73](src/pages/About.jsx#L73) | Med |
| Build Log timeline cards | [BuildLog.jsx:117](src/pages/BuildLog.jsx#L117) | Med |

**Fix pattern:** replace `<GlassPanel>` with a flat `<div class="rounded-2xl border border-border-subtle bg-bg-surface p-6 …">` (opaque token, no backdrop-blur, no resting shadow → also satisfies State-Only Shadow; `rounded-2xl` = the 1rem ceiling). On the CTA, keep the sanctioned glow/shimmer against the now-opaque surface.

---

## Theme 6 — Card-grid monotony (vary layout, density, weight) · Class A

| Tell | Where | Sev | Fix |
|---|---|---|---|
| Identical `sm:grid-cols-2 lg:grid-cols-4` MetricCard grid cloned across 3 projects | [ExecutiveSummary.jsx:38](src/projects/command-center/ExecutiveSummary.jsx#L38), [VarianceSummary.jsx:22](src/projects/variance-engine/VarianceSummary.jsx#L22), [HeadcountRoiPanel.jsx:214](src/projects/order-book/HeadcountRoiPanel.jsx#L214) | Med | Keep Command Center's 4-up (the legit "terminal" opening). Break the twin silhouette on Variance: **one dominant figure** (Total Variance, large) + a denser tabular sub-row for the rest. Promote the verdict figure (NPV / ROI) on the ROI panels. |
| `ScenarioSelector` ≈ `DeliveryPresetSelector` 5-up | [ScenarioSelector.jsx:25](src/projects/decision-impact/ScenarioSelector.jsx#L25), [DeliveryPresetSelector.jsx:20](src/projects/order-book/DeliveryPresetSelector.jsx#L20) | Med | Differentiate density/weight between the two. |
| `/ai` SYSTEMS uniform 3-up | [AiValueTest.jsx:181](src/pages/AiValueTest.jsx#L181) | Med | Recast as a numbered vertical list (1 See / 2 Model / 3 Detect) or two columns of differing weight. |

---

## Theme 7 — Color used decoratively (Signal Rule) · Class A

| Tell | Where | Sev | Fix |
|---|---|---|---|
| Intelligence-purple (`#A78BFA`) as a **chart series** color across Command Center / Decision Impact | [theme.js:12](src/config/theme.js#L12) + 5 chart configs | Med | Purple is AI-only. Use a neutral categorical ramp for chart series, not a semantic accent. |
| Four-accent rainbow connector + "data flows →" | [Projects.jsx:149-153](src/sections/Projects.jsx#L149) | Low | Single neutral hairline; drop the rainbow. |

---

## Theme 8 — Micro-decoration & polish · Class A + B

| Tell | Where | Sev | Fix |
|---|---|---|---|
| Primary Button **resting** colored shadow | [Button.jsx:3](src/components/ui/Button.jsx#L3) | Med (A) | Move to `hover:shadow-md` (State-Only Shadow). Fix Contact dup or replace with `<Button>`. |
| OG share image purple haze | [og-image.svg:3-13](public/og-image.svg#L3) | Med (B) | Optional: align the share card to the flatter, less-purple identity. |
| Favicon "SG" in `system-ui`, not brand face | [favicon.svg:3](public/favicon.svg#L3) | Low (A) | Set the brand display face. |
| Uppercase tracked eyebrow on ~38 spots; every page opens the same eyebrow→heading rhythm | site-wide | Low (B) | Vary openings; reserve the eyebrow for where it earns attention. |
| `ScrollReveal` on nearly every block | [ScrollReveal.jsx](src/components/animation/ScrollReveal.jsx) (~30 uses) | Low (B) | Reserve entrance motion for key moments, not as ambient default. |

---

## Spec evolution (Class B) — decisions, not just fixes

These need *you* to change the spec, not the code to catch up.

### 1. Typography — the highest-leverage distinctiveness lever
Both mandated faces are on the overused list, and "Inter everywhere" is named *verbatim* in your anti-references. **Keep JetBrains Mono** (it genuinely earns the precision voice; don't touch it or tabular-nums). Evolve the display + body pair in one coordinated token swap across `tailwind.config.js`, `theme.js`, `index.css`, the font-loading/preload chain, `DESIGN.md §3`, and `design.json`:

- **Display** (replaces Space Grotesk): a sharper Swiss/instrument grotesque — *ABC Diatype*, *GT America*, *Neue Haas Grotesk Display* (licensed), or open-source variable *Mona Sans* / *Hanken Grotesk*. Keep the 600 / -0.02em tuning.
- **Body** (replaces Inter — the higher-leverage half): a quieter humanist workhorse — *IBM Plex Sans*, *Public Sans*, or a *Söhne*-adjacent face — **or** collapse to a two-voice system (one grotesque + JetBrains Mono) and let mono carry more labels/microcopy, leaning into the terminal identity.

Preserve the Two Voices role-segregation (it's good — only the *typefaces* are generic). Self-host with preload; re-verify at 375/768/1280/1920 in both themes.

### 2. The CTA exception — keep it, or retire it?
The spec *blesses* shimmer + breathe on the one AI CTA, but a shimmering/breathing CTA is itself the generic-AI "glowing button." Decision: keep both as the single conversion accent, or drop shimmer and keep only the breathe glow for maximum restraint. (Recommendation: keep the breathe glow as the one purple moment; the audit already removes the gradient/ping/arrow-loop that made it feel "magic.")

### 3. `/ai` purple density — restraint, not removal
With gradient text, the animated canvas, and the uniform card grid neutralized, the page's *one* remaining purple moment (the CTA-card glow, which the spec already sanctions) becomes the load-bearing accent it's meant to be. Budget: **one** purple moment per page.

---

## Suggested sequencing

- **Phase 0 — Conformance pass (1 PR, ~half a day):** all Quick Wins (Themes 1, 2, 3, 5, 7-small, 8-Button). Pure spec-conformance, low risk, removes most visible genericness.
- **Phase 1 — De-atmosphere (Theme 4):** remove the two animated hero backgrounds; settle the heroes flat.
- **Phase 2 — Vary silhouettes (Theme 6):** differentiate the project dashboards' card grids.
- **Phase 3 — Typography (Spec §1):** pick + self-host new display/body faces, update tokens + docs, re-verify. Highest leverage, most consequential — its own PR.
- **Phase 4 — Spec/doc cleanup:** update `DESIGN.md` / regenerate `design.json` to reflect retired utilities, the CTA decision, and the "one purple moment" budget.

---

## Method & caveats

- Static **code + spec** audit (no runtime screenshots) — visual/contrast at real breakpoints in both themes is a sensible follow-up, especially after the typography swap.
- Finders occasionally **overstated**; verifiers corrected (e.g., fonts downgraded High→Med as "contributing, not disqualifying"; the CTA's shimmer/breathe explicitly preserved as sanctioned). Severities here are post-verification.
- 5 raw findings were **refuted** and dropped (semantic colors / sanctioned exceptions / a11y affordances correctly identified as *not* tells).
