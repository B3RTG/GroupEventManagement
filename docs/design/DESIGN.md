# Design System Strategy: The Athletic Editorial

## 1. Overview & Creative North Star
**Creative North Star: The Precision Curator**
This design system moves beyond the generic "community app" aesthetic by adopting the language of high-end sports journalism and luxury athletic performance tracking. It is characterized by **Precision through Space**: where most apps use lines to separate content, we use rhythmic spacing and tonal shifts.

The system breaks the "standard template" look through **Intentional Asymmetry**. Hero sections and dashboards should leverage overlapping elements—such as a data visualization card bleeding slightly over a primary image container—to create a sense of motion and kinetic energy. By utilizing a high-contrast typography scale (pairing the architectural strength of *Manrope* with the functional clarity of *Inter*), we establish an authoritative, premium tone that feels both trustworthy and modern.

---

## 2. Colors: Tonal Depth & The No-Line Rule
The color palette is rooted in deep slates and technical blues, grounded by a sophisticated range of "cool" neutrals.

### The "No-Line" Rule
To achieve a high-end, bespoke feel, **1px solid borders are strictly prohibited for sectioning.** Boundaries must be defined solely through background color shifts. For example, a `surface-container-low` content block should sit on a `background` page without a stroke. The eye should perceive the change in depth, not a drawn line.

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers—like stacked sheets of fine paper. 
- **Base:** `background` (#f6fafe)
- **Primary Layout Sections:** `surface-container-low` (#f0f4f8)
- **Interactive Cards:** `surface-container-lowest` (#ffffff)
- **Elevated Modals/Popovers:** `surface-bright` (#f6fafe)

### The "Glass & Gradient" Rule
To avoid a flat, "out-of-the-box" look, use Glassmorphism for floating navigation bars or overlay stats cards. Apply a semi-transparent `surface` color with a `backdrop-blur` of 12px–20px. 
**Signature Texture:** Main CTAs or data-heavy hero backgrounds should use a subtle linear gradient from `primary` (#00101e) to `primary_container` (#122636) at a 135-degree angle. This adds "visual soul" that flat colors lack.

---

## 3. Typography: Authority & Function
The type system is a dialogue between brand personality and functional utility.

*   **Display & Headlines (Manrope):** These are our "Editorial" moments. Use `display-lg` and `headline-md` with tighter letter-spacing (-0.02em) to create an aggressive, athletic feel for event titles and performance stats.
*   **Title & Body (Inter):** The "Workhorse." Use `title-md` for card headers and `body-md` for descriptions. These are designed for maximum legibility during high-activity group coordination.
*   **Hierarchy Note:** Always maintain at least a 2-step jump in scale between headlines and body text to ensure a clear information architecture.

---

## 4. Elevation & Depth: Tonal Layering
We convey hierarchy through light and tone, not structure.

*   **The Layering Principle:** Place a `surface-container-lowest` card (Pure White) on a `surface-container` background to create a natural "lift." This mimics the physical world without the clutter of drop shadows.
*   **Ambient Shadows:** When a "floating" effect is necessary (e.g., a primary action card), use an extra-diffused shadow: `box-shadow: 0 12px 40px rgba(23, 28, 31, 0.06)`. The shadow color is a 6% opacity tint of our `on-surface` token, making it feel like ambient environmental light.
*   **The "Ghost Border" Fallback:** If a container requires definition for accessibility, use the `outline-variant` token at **15% opacity**. High-contrast, 100% opaque borders are strictly forbidden.
*   **Glassmorphism:** Use `surface-container-lowest` at 80% opacity with a blur to allow the brand's secondary blues to bleed through the UI, softening the layout's edges.

---

## 5. Components: Refined Primitives

### Buttons
*   **Primary:** `primary` background with `on_primary` text. Use `rounded-lg` (1rem) for a friendly yet professional grip.
*   **Secondary:** `surface-container-highest` background. No border.
*   **State:** On hover, shift background to `primary_container`.

### Cards & Lists
*   **The Divider Ban:** Never use horizontal rules. Separate list items using 12px (`spacing-3`) of vertical white space or a subtle `surface-container-low` background on every other item.
*   **Card Styling:** Always use `rounded-xl` (1.5rem) and a `surface-container-lowest` fill.

### Specialized Components
*   **The "Stat-Pulse":** For event management metrics (e.g., "12 Spots Left"), use a high-contrast `secondary_container` pill with `on_secondary_fixed_variant` text.
*   **Participant Stacks:** Circular avatars with a 2px `surface-container-lowest` "halo" (ring) to separate them when overlapping.

---

## 6. Do’s and Don'ts

### Do
*   **Do** use asymmetrical layouts where text is left-aligned and imagery or data-visuals bleed off the right edge.
*   **Do** use `spacing-8` (2rem) as your default margin between major sections to allow the design to "breathe."
*   **Do** use `tertiary_fixed_dim` (#f7be1d) sparingly as a "gold" highlight for VIP events or premium status.

### Don’t
*   **Don’t** use pure black (#000000). Use `primary` (#00101e) for deep blacks to maintain tonal harmony.
*   **Don’t** use standard `rounded-sm` corners. It feels "standard." Stick to `md` and `lg` for a premium feel.
*   **Don’t** center-align long-form body text. Keep it strictly left-aligned to maintain the "Editorial" grid.
*   **Don't** use 100% opaque borders to define inputs; use `surface-container-high` as a subtle background fill instead.