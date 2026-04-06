---
name: UX scaling and responsive issues
description: Landscape phone, intermediate widths, and chart label problems identified during real-device testing
type: feedback
---

768px mobile breakpoint is too narrow — landscape phones (700-926px) need mobile-style chart treatment (fewer labels, rotation, smaller fonts). The `useMediaQuery('(max-width: 768px)')` pattern misses this range entirely.

**Why:** Real-device testing showed overlapping x-axis labels, Sankey node collisions, and toggle wrapping at landscape orientations. Desktop-style rendering kicks in too early.

**How to apply:** Consider raising the chart-specific mobile breakpoint to 1024px or using a separate `useMediaQuery('(max-width: 1024px)')` for chart components specifically. The 768px breakpoint is fine for layout (columns, stacking) but charts need more space than layout does.

Additional: Sankey full KPI names ("Features Shipped/Quarter", "Pipeline Value ($M)") are too long at ANY width except very wide desktop. Short labels should be the default, with full names only on hover/tooltip.

Waterfall chart bar labels (white text on light green bars) have poor contrast and overlap the x-axis values at the bottom.
