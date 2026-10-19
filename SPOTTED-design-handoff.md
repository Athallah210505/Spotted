# SPOTTED — MVP v1.0 Design Handoff

Created 18 October 2026 from the supplied PRD and visual brief.

- [Editable Figma design](https://www.figma.com/design/vOOlbYlDev7n5GSPV7yIhq)
- [Core prototype](https://www.figma.com/proto/vOOlbYlDev7n5GSPV7yIhq?node-id=5-6&starting-point-node-id=5%3A6)
- [PRD](https://docs.google.com/document/d/1VJaKLT11DS6usxYOgmtSrPM7rQiYVRBRA_L2OGOsimo/edit)

## Confirmed deliverables

1. Foundations & Components: exact four brand colors, semantic aliases, geometry tokens, 10 text styles, floating elevation, 26 component families and 80 variants.
2. Screens & Prototype: all seven MVP screen types, Wishlist List/Map, search-state map, detail tabs, gallery, authentication, import confirmation/success, recovery/settings frames and linked prototype paths.
3. States & Handoff: 28 documented product states, developer behavior notes, scope, assumptions, analytics and QA acceptance checks.

The file uses three pages to respect the connected Figma Starter plan. Text, vectors, components and frames remain editable. Raster fills are discrete content photography, never complete UI screenshots.

## Visual direction

Playful premium minimalism. Butter Yellow #FFE288; Soft Blue #4A69B3; Pastel Petal #FFCFE2; Pale Green #CDD98D. Neutral surfaces dominate. SF Pro uses the available unified Figma family, with Inter as the web fallback. Secondary text uses #61615C to improve contrast over the suggested #777777.

## Validation performed

- Rendered and inspected foundations, component library, main screen composition, fallback states and 375/430 px Explore/Wishlist specimens.
- Read back native node types, font families, image-node dimensions and prototype flow starts.
- Corrected narrow controls, floating preview sheets, duplicate recovery actions and component paint fallbacks.
- Verified all main screen text uses SF Pro and content-photo nodes are independent of the editable UI.

These are Figma design checks. Browser, screen-reader, real GPS, reduced-motion and performance testing require the implemented application.

## Assumptions and recommendations

- English interface copy is a design-review assumption; validate Indonesian localization with target users.
- Email-link authentication is proposed through Supabase Auth.
- Proposed display-name length: 1–50 trimmed characters; confirm with Product.
- Confirm private-video-link retention when removing a saved place, deletion/reauthentication behavior, and source-attribution policy before development.

## Prototype limitations

The prototype simulates navigation and data changes. It is not connected to Google Places, Maps, TikTok, Supabase, location permissions or analytics. Inputs and external actions are review simulations. Nearby motion and reduced-motion behavior are specified for implementation rather than represented as a continuously animated map.

Restaurant names, ratings, reviews, menu prices and photography are explicitly illustrative. Maps are schematic. No actual certification or speciality is asserted. Replace fixtures with authorized, attributed place data before release.

## MVP guardrails

Discover → Save → Find Nearby → Visit. Public browsing; authenticated personal wishlist; foreground location or manual city selection; 1/3/5/10 km straight-line radius with 5 km default; manual restaurant confirmation for TikTok imports; private personal links.

No active delivery, payment, booking, social feed, AI matching, background GPS or location-triggered push controls.
