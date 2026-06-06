---
name: Executive Minimalist
colors:
  surface: '#f9f9f9'
  surface-dim: '#dadada'
  surface-bright: '#f9f9f9'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f3f4'
  surface-container: '#eeeeee'
  surface-container-high: '#e8e8e8'
  surface-container-highest: '#e2e2e2'
  on-surface: '#1a1c1c'
  on-surface-variant: '#45464d'
  inverse-surface: '#2f3131'
  inverse-on-surface: '#f0f1f1'
  outline: '#76777d'
  outline-variant: '#c6c6cd'
  surface-tint: '#565e74'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#131b2e'
  on-primary-container: '#7c839b'
  inverse-primary: '#bec6e0'
  secondary: '#4648d4'
  on-secondary: '#ffffff'
  secondary-container: '#6063ee'
  on-secondary-container: '#fffbff'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#191c1e'
  on-tertiary-container: '#828486'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dae2fd'
  primary-fixed-dim: '#bec6e0'
  on-primary-fixed: '#131b2e'
  on-primary-fixed-variant: '#3f465c'
  secondary-fixed: '#e1e0ff'
  secondary-fixed-dim: '#c0c1ff'
  on-secondary-fixed: '#07006c'
  on-secondary-fixed-variant: '#2f2ebe'
  tertiary-fixed: '#e1e2e4'
  tertiary-fixed-dim: '#c5c7c8'
  on-tertiary-fixed: '#191c1e'
  on-tertiary-fixed-variant: '#444749'
  background: '#f9f9f9'
  on-background: '#1a1c1c'
  surface-variant: '#e2e2e2'
typography:
  headline-xl:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.05em
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  sidebar-width: 220px
  container-max: 1440px
  gutter: 24px
  margin-page: 40px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 32px
---

## Brand & Style

This design system is engineered for high-stakes business autonomy. The brand personality is **authoritative, precise, and invisible**. It draws inspiration from the "utility-as-luxury" aesthetic of modern engineering tools, prioritizing clarity over decoration. 

The visual style is a blend of **Minimalism** and **Corporate Modern**, utilizing heavy whitespace to reduce cognitive load for executive decision-makers. It avoids the neon-heavy tropes of traditional AI dashboards in favor of a "Physical Paper" metaphor—where elements have tangible weight, subtle depth, and clear boundaries. The emotional response should be one of total control and absolute reliability.

## Colors

The palette is strictly curated to emphasize high-end professionalism. 

- **Primary (#0F172A):** A deep charcoal-indigo used for primary text and high-importance UI anchors.
- **Secondary (#6366F1):** A sophisticated Indigo used sparingly for focus states, primary actions, and "active" status indicators.
- **Surface Strategy:** The system uses a "White-on-Gray" layering technique. The main application background is `#F8F9FB` (Secondary Background), while interactive cards and containers are `#FFFFFF` (Primary Background) to create a natural "pop" without aggressive shadowing.
- **Borders:** `#E5E7EB` is the structural backbone, used to define zones without adding visual noise.

## Typography

The typography system relies on **Inter** for its neutral, systematic character. The hierarchy is characterized by significant contrast between weights and sizes to ensure scannability.

- **Headlines:** Use tight letter-spacing (-0.02em) and SemiBold/Bold weights to create a sense of importance.
- **Body:** Standardized at 16px for optimal legibility, using ample line height (1.5x) to prevent density.
- **Labels:** Small caps or medium-weight uppercase labels are used for metadata and table headers to distinguish them clearly from interactive text.
- **Numeric Data:** For financial or autonomous metrics, use tabular lining figures to ensure vertical alignment in lists and tables.

## Layout & Spacing

The layout utilizes a **Fixed Grid** system for the primary navigation, transitioning into a **Fluid Grid** for the main content area to maximize the utility of ultra-wide executive monitors.

- **Sidebar:** A fixed 220px left-hand column. It is visually separated by a 1px border (`#E5E7EB`) rather than a heavy shadow.
- **The 8px Rhythm:** All spacing between elements (paddings, margins) must be a multiple of 8px. 
- **Breathing Room:** Sections should be separated by at least 32px (`stack-lg`) to maintain the "expensive" feel.
- **Responsive Behavior:** 
    - **Desktop:** 12-column grid, 24px gutters.
    - **Tablet:** 8-column grid, 16px gutters, sidebar collapses into a hamburger menu or narrow icon-rail.
    - **Mobile:** 4-column grid, 16px margins, fluid stacking.

## Elevation & Depth

Hierarchy is established through **Tonal Layers** and **Ambient Shadows** rather than traditional skeuomorphism.

1.  **Level 0 (Base):** The secondary background (`#F8F9FB`). All static elements rest here.
2.  **Level 1 (Cards):** Pure White (`#FFFFFF`) with a 1px border (`#E5E7EB`). A very soft, diffused shadow (0px 4px 20px rgba(0,0,0,0.03)) is used to create a "lifted" effect.
3.  **Level 2 (Overlays/Modals):** Pure White with a slightly more aggressive shadow (0px 10px 30px rgba(0,0,0,0.08)) and a **Backdrop Blur** (12px) on the obscured content.
4.  **Glassmorphism:** Use sparingly for global navigation bars or floating action buttons. Apply a 70% opacity white fill with a 16px backdrop-saturate and 20px blur.

## Shapes

The shape language is "Generous Rounded." Elements should feel approachable but structural.

- **Primary Container Radius:** 16px for standard cards and modules.
- **Large Container Radius:** 24px for main dashboard sections or primary hero visuals.
- **Component Radius:** 8px for buttons, input fields, and tags.
- **Pill Shapes:** Reserved exclusively for status indicators (e.g., "Active," "Awaiting Setup") to differentiate them from interactive buttons.

## Components

### Buttons
- **Primary:** Solid `#0F172A` with white text. 8px radius. No gradients.
- **Secondary:** White background, `#E5E7EB` border, `#0F172A` text.
- **Ghost:** No border or background. Text only, turns to subtle gray on hover.

### Cards
- Always `#FFFFFF` background. 1px `#E5E7EB` border. 16px or 24px corner radius.
- Inner padding: 24px or 32px depending on content density.

### Empty & "Not Configured" States
- To maintain the "Executive" tone, empty states must not use "cutesy" illustrations. 
- Use a **Dashed Border** (2px dash, 4px gap) using `#E5E7EB`.
- Text should be `#6B7280` (Medium Gray) and clearly labeled "Awaiting Configuration" or "Data Stream Not Active."

### Inputs
- Height: 40px or 48px. 
- Background: `#FFFFFF`. 
- Border: 1px `#E5E7EB`. 
- Focus state: 1px Indigo border with a subtle Indigo outer glow (2px).

### Sidebar Items
- Active state: Subtle background tint (`#F1F5F9`) and a 2px vertical Indigo line on the far left or right edge.
- Iconography: 20px size, stroke weight of 1.5px to match the professional tone of Inter.