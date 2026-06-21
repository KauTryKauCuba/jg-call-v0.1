# Design System Specification - JG Call

This document defines the core styling variables, typography scales, spacing tokens, and component guidelines for the JG Call project. All design tokens are implemented as CSS Custom Properties in [globals.css](file:///Users/muddassirmatakhir/Desktop/jg-call-v0.1/src/app/globals.css).

---

## 1. Color System

We use a dark-themed space palette featuring atmospheric background glows and harmonious neon gradients.

| Variable Name | Color Value | Description |
| :--- | :--- | :--- |
| `--bg-primary` | `#0a0b10` | Dark deep space background color |
| `--bg-card` | `rgba(255, 255, 255, 0.03)` | Frosted glassy card background |
| `--bg-card-hover` | `rgba(255, 255, 255, 0.07)` | Active state card background |
| `--border-color` | `rgba(255, 255, 255, 0.08)` | Subdued divider and outline border |
| `--text-primary` | `#ffffff` | High contrast primary reading text |
| `--text-secondary` | `#94a3b8` | Subdued secondary description text |

### Gradients
*   **Accent Gradient** (`--accent-gradient`): `linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #ec4899 100%)` (Indigo to Pink).
*   **Atmospheric Glow** (`--glow-gradient`): `radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, rgba(0, 0, 0, 0) 70%)`.

---

## 2. Typography

All typography is rendered using **Inter** via [layout.tsx](file:///Users/muddassirmatakhir/Desktop/jg-call-v0.1/src/app/layout.tsx). We strictly support **Regular (400)** and **Semibold (600)** weights only.

### Typographic Scale
| Token | REM Value | Pixels | Application | Weight |
| :--- | :--- | :--- | :--- | :--- |
| `--fs-xs` | `0.75rem` | `12px` | Captions, instructions, smallest text | Regular (400) |
| `--fs-sm` | `0.875rem` | `14px` | Buttons, badges, tags, metadata | Semibold (600) |
| `--fs-base` | `1rem` | `16px` | Standard body copy, paragraphs | Regular (400) |
| `--fs-lg` | `1.25rem` | `20px` | Subheadings, section titles (H2) | Semibold (600) |
| `--fs-xl` | `1.5rem` | `24px` | Large section headings | Semibold (600) |
| `--fs-2xl` | `2rem` | `32px` | Primary Page Titles (H1) | Semibold (600) |

---

## 3. Button Standardization

All rectangular buttons in the codebase (whether plain HTML, vanilla CSS `.btn`, or interactive canvas elements `.pixel-btn-rect`) must conform to the following specifications:

*   **Height**: Exactly `56px`.
*   **Width**: Full responsive (`width: 100%`) with a default max-width constraint of `240px`.
*   **Border Radius**: `14px` (rounded corners).
*   **Font Size**: `14px` (`var(--fs-sm)`).
*   **Font Weight**: `600` (Semibold).
*   **States**:
    *   *Default*: Framed border (`1px solid var(--border-color)`), transparent or dark card background.
    *   *Hover*: Translation transition (`translateY(-2px)`), border shifts to matching theme accent color (e.g. `--active-color`), and nested text/icon glows up.

---

## 4. Spacing and Alignment
- **Containers**: Center layouts using Flexbox/CSS Grid with standard responsive padding (`2rem` / `32px`).
- **Cards**: Maximum card width is standardized to `540px` with padding of `3rem` (`48px`).
