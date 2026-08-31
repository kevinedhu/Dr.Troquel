---
name: TroquelMaster Design System
colors:
  surface: '#051425'
  surface-dim: '#051425'
  surface-bright: '#2c3a4d'
  surface-container-lowest: '#010f20'
  surface-container-low: '#0d1c2e'
  surface-container: '#122032'
  surface-container-high: '#1d2b3d'
  surface-container-highest: '#283648'
  on-surface: '#d5e3fc'
  on-surface-variant: '#bfc7d2'
  inverse-surface: '#d5e3fc'
  inverse-on-surface: '#233144'
  outline: '#89929b'
  outline-variant: '#3f4850'
  surface-tint: '#93ccff'
  primary: '#93ccff'
  on-primary: '#003351'
  primary-container: '#3198dc'
  on-primary-container: '#002c47'
  inverse-primary: '#006398'
  secondary: '#94ccff'
  on-secondary: '#003352'
  secondary-container: '#0168a0'
  on-secondary-container: '#c9e3ff'
  tertiary: '#ffb95f'
  on-tertiary: '#472a00'
  tertiary-container: '#ca8100'
  on-tertiary-container: '#3e2400'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#cce5ff'
  primary-fixed-dim: '#93ccff'
  on-primary-fixed: '#001d31'
  on-primary-fixed-variant: '#004b73'
  secondary-fixed: '#cde5ff'
  secondary-fixed-dim: '#94ccff'
  on-secondary-fixed: '#001d32'
  on-secondary-fixed-variant: '#004b74'
  tertiary-fixed: '#ffddb8'
  tertiary-fixed-dim: '#ffb95f'
  on-tertiary-fixed: '#2a1700'
  on-tertiary-fixed-variant: '#653e00'
  background: '#051425'
  on-background: '#d5e3fc'
  surface-variant: '#283648'
typography:
  display-metrics:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-caps:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.05em
  utility-mono:
    fontFamily: monospace
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  container-margin: 24px
  gutter: 16px
---

## Brand & Style

The design system is engineered for high-stakes industrial environments where precision and uptime are the only metrics that matter. It adopts a **Corporate / Modern** aesthetic with a specific focus on "Safe" UI patterns—prioritizing predictability, rapid scanning of data, and absolute clarity under fluorescent factory lighting.

The brand personality is authoritative and technical. It avoids decorative flourishes in favor of utilitarian efficiency. The dark-mode interface reduces eye strain for operators during long shifts, while high-contrast status accents ensure that critical machine alerts are impossible to miss. The result is a digital extension of the machinery it manages: robust, reliable, and precise.

## Colors

The palette is anchored by **Dark Slate (#0F172A)** to provide a deep, non-reflective base that recedes into the background, allowing active data to come forward. **Industrial Blue (#0284C7)** serves as the primary action color, signaling interactivity and system "on" states.

Status communication utilizes a "traffic light" logic reinforced by **Workshop Yellow (#F59E0B)** for cautions and **Red (#EF4444)** for immediate stoppages. Neutral tones are sampled from **Steel Gray**, providing a bridge between the deep background and the high-contrast text. All color pairings are verified for WCAG AA accessibility to ensure legibility in high-glare production environments.

## Typography

This design system utilizes **Inter** exclusively for its neutral, systematic, and utilitarian properties. The typeface’s tall x-height and open apertures ensure that technical data remains readable even at small sizes or on lower-resolution industrial monitors.

The hierarchy is structured around "Information Velocity":
1. **Display Metrics:** For real-time production counts and OEE percentages.
2. **Standard Headlines:** For section titling and machine IDs.
3. **Utility Labels:** Bold, all-caps labels for metadata like "JOB NO" or "OPERATOR," providing a structured, form-like feel to every view.

## Layout & Spacing

The layout follows a **Fluid Grid** philosophy optimized for 1440px dashboards but capable of scaling down to ruggedized tablets. We use an 8px rhythmic scale to ensure consistent alignment of modular components.

- **Desktop:** 12-column grid with 16px gutters and 24px outer margins.
- **Tablets:** 8-column grid for operator handhelds, emphasizing touch-target sizes for buttons.
- **Density:** The design system prioritizes high information density. Padding within data tables and cards is kept tight (8-12px) to maximize the amount of visible data without requiring excessive scrolling.

## Elevation & Depth

Depth is achieved through **Tonal Layering** rather than traditional shadows. In an industrial context, shadows can create visual "noise." Instead:
- **Level 0 (Background):** #0F172A (The machine bed).
- **Level 1 (Cards/Panels):** #1E293B with a subtle 1px border of #334155 (The workstations).
- **Level 2 (Modals/Popovers):** Slightly lighter fill with a soft 12px blur shadow to indicate priority.

A "Ghost Border" technique is used for interactive elements, where a subtle stroke defines the shape, and a solid fill is only introduced upon interaction or active status.

## Shapes

The design system employs **Soft (Level 1)** roundedness. A 4px (0.25rem) radius is the standard for buttons, input fields, and small cards. This creates a modern, "machined" look—cleaner than sharp 90-degree corners but more serious and industrial than pill-shaped or highly rounded consumer interfaces. Large containers like main dashboard panels use an 8px radius to subtly distinguish major layout blocks.

## Components

### Buttons & Inputs
Buttons feature a solid fill for primary actions and a "Steel Gray" outline for secondary actions. Inputs must have a high-contrast focus state using Industrial Blue (#0284C7) with a 2px outer glow to ensure the active field is unmistakable.

### Status Badges (The "Signal" System)
Badges are critical for die-cutting workflows. They use a "Low-Alpha" background with "High-Contrast" text:
- **En cola (Queued):** Neutral Gray background, white text.
- **En corte (Cutting):** Industrial Blue background, white text (pulsing icon optional).
- **Listo (Ready):** Success Green background, white text.
- **Mantenimiento (Maintenance):** Workshop Yellow background, black text.

### Metrics Cards
Cards are the primary container. They should feature a "Label-Caps" header, a "Display-Metric" value, and a small Sparkline or percentage change indicator at the bottom.

### Industrial Data Tables
Tables use a "Zebra-Stripe" approach with very subtle variations in dark slate tones. Rows must have a hover state that highlights the entire line in a translucent blue to assist horizontal scanning of die-cutting specifications.