# Lost and Found UI Direction

## Product Feel

Build the app like a calm, trustworthy community operations tool, not a marketing landing page. The first screen should help someone do one of two things immediately:

- Find a missing item.
- Report an item they found.

The UI should feel fast, organized, reassuring, and practical. People using it may be stressed, in a hurry, or on a phone near the place where something was lost. Favor clarity over decoration.

## Recommended Interface Type

Use a search-first lost-and-found dashboard.

The home page should behave like the actual product screen:

- A compact top bar with the product name, primary navigation, and a clear `Report item` action.
- A prominent search area with filters for item type, location, date, and status.
- A split browsing experience on desktop: listings on one side, location/context panel on the other.
- A single-column mobile layout where search, filters, and item cards are easy to scan.
- Clear item states: `Lost`, `Found`, `Claim pending`, `Returned`.
- Trust and safety signals built into the workflow, not as a separate marketing section.

## Visual Style

Use restrained, civic-service design with a modern product polish.

- Background: warm off-white or very light neutral.
- Surfaces: white or near-white with subtle borders.
- Primary color: dependable blue.
- Accent color: green for successful matches, returned items, and positive confirmation.
- Warning color: amber for pending claims.
- Destructive color: red only for deletion, fraud, or urgent warnings.
- Avoid heavy gradients, decorative blobs, cartoon styling, oversized hero art, or dark-first aesthetics.

Suggested tokens:

```css
--color-background: #F8FAFC;
--color-surface: #FFFFFF;
--color-foreground: #0F172A;
--color-muted: #64748B;
--color-border: #D9E2EC;
--color-primary: #2563EB;
--color-primary-strong: #1D4ED8;
--color-success: #15803D;
--color-warning: #B45309;
--color-danger: #DC2626;
--color-ring: #2563EB;
```

## Typography

Use a highly readable sans-serif system. If adding web fonts, prefer `Inter`, `Source Sans 3`, or `Lexend` for headings. Keep the tone practical and human.

- Page title: 32-40px desktop, 28-32px mobile.
- Section headings: 18-24px.
- Body text: 16px minimum.
- Labels and metadata: 13-14px, but never too low contrast.
- Do not use negative letter spacing.

## Layout Rules

- Design desktop.
- Do not nest cards inside cards.
- Use full-width page bands or simple constrained layouts, not floating decorative sections.
- Stable dimensions matter: item cards, filter controls, icon buttons, and status pills should not resize unexpectedly on hover or state change.
- Desktop should prioritize scanning: filters, list density, visible metadata, and quick actions.

## Core Screens

### Home / Browse

This is the default product screen.

Required elements:

- Search input with clear placeholder text.
- Filter controls for category, date, location, and status.
- Sort control for newest, nearest, and most likely match.
- Item list with image thumbnail, title, category, location, date, status, and confidence hints.
- Empty state with a useful action: broaden filters or report an item.

### Report Item

Use a guided form, not a giant wall of fields.

Steps:

1. Item basics: lost or found, title, category, description.
2. Place and time: location, date, optional time window.
3. Photos and identifying details.
4. Contact and privacy preferences.
5. Review and submit.

Rules:

- Keep labels visible.
- Validate on blur or submit, not every keystroke.
- Show errors near the relevant field.
- Preserve drafts for long reports when possible.
- Do not expose private contact details on public listings.

### Item Detail

Show enough detail to build confidence without enabling false claims.

Include:

- Photo gallery.
- Item status.
- Reported location and date.
- Public description.
- Claim or contact action.
- Safety note about proving ownership.
- Similar items or possible matches.

### Admin / Moderation

If admin views are added, make them dense and operational.

Include:

- Queue of new reports and claims.
- Status filters.
- Fraud or duplicate flags.
- Audit trail.
- Quick actions with confirmation for destructive changes.

## Components

Use the existing stack and local conventions.

- Next.js app router.
- Tailwind CSS tokens and utility classes.
- Phosphor icons for all interface icons.
- Radix/shadcn-style primitives where useful for dialogs, menus, tabs, and forms.

Component expectations:

- Buttons: primary, secondary, ghost, danger.
- Inputs: label, helper text, error text, disabled state.
- Selects/menus: keyboard accessible.
- Status pills: semantic color plus text, never color alone.
- Item cards: image area with stable aspect ratio.
- Dialogs/sheets: clear title, close action, focus management.
- Toasts: short feedback with undo when appropriate.

## Interaction

- Every clickable element needs a visible hover, focus, pressed, and disabled state.
- Use `cursor-pointer` on clickable custom elements.
- Keep micro-interactions between 150ms and 300ms.
- Animate transform and opacity, not layout properties.
- Respect `prefers-reduced-motion`.
- Icon-only buttons must have accessible names.
- Touch targets must be at least 44px by 44px.

## Accessibility

Accessibility is a product requirement, not polish.

- Text contrast must meet WCAG AA.
- Keyboard navigation must work for search, filters, cards, dialogs, and forms.
- Focus rings must be visible.
- Form fields need visible labels.
- Errors need clear recovery instructions.
- Images need meaningful alt text when they communicate item information.
- Status must be conveyed with text and color together.
- Do not rely on hover-only interactions.

## Content Voice

Use plain, reassuring language.

Good examples:

- `Report a found item`
- `Search by item, place, or description`
- `Claim pending`
- `Returned to owner`
- `Add a detail only the owner would know`

Avoid:

- Cute copy.
- Joke empty states.
- Overly dramatic warnings.
- Marketing slogans in the product UI.

## What Codex Should Do Before Building UI

Before writing UI code, Codex should:

1. Read `AGENTS.md`.
2. For this Next.js version, read the relevant guide in `node_modules/next/dist/docs/` before changing Next-specific APIs.
3. Inspect existing components, theme files, and app routes.
4. Preserve existing project conventions unless there is a clear reason to change them.
5. Build the actual usable product screen first, not a landing page.
6. Verify responsive behavior at 375px, 768px, 1024px, and desktop widths.
7. Run lint/build checks when practical.

## Definition of Done

A UI change is not done until:

- The main workflow is usable on desktop.
- Text does not overflow its containers.
- Buttons and controls have clear states.
- Forms show useful validation and feedback.
- Empty, loading, and error states exist.
- The design uses semantic tokens instead of scattered one-off colors.
- The page feels like a trustworthy lost-and-found product, not a generic template.
