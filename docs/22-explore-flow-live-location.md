# Explore flow and live Map location

1 November 2026. Ponytail FULL, Anti Slop DURING inherited from the user's session. Existing SPOTTED butter/blue photo-led direction retained: ENERGY 2 / RHYTHM 2 / MOTION 2. No new dependency or data import.

## Explore

The masthead remains the same when searching or selecting categories, instead of replacing it with a different screen. Search and categories stay sticky inside the existing feed scroller. Category changes return long feeds to the result heading while preserving the header position for users already at the top. Reset still returns to the beginning.

Full-width photo/panel pairing, real Google ratings, internal detail links, Filters, Sort, saved state and visitor-menu photography remain intact. Search focus and category selection retain visible feedback. Pending results fade without inserting a loading row that shifts content.

Each venue receives one 300 ms entrance when it first intersects the feed viewport. Unobserved content remains visible even if IntersectionObserver callbacks are delayed. Bookmark selection has a 260 ms feedback animation. Reduced-motion preferences disable these effects. The sticky toolbar reserves scroll padding so focused content remains below the controls.

## Map

The previous `getCurrentPosition` fix was a single snapshot. The location button now starts [watchPosition](https://developer.mozilla.org/en-US/docs/Web/API/Geolocation/watchPosition) after an explicit tap. It shows a live pin, reported accuracy, the selected geographic radius and published venues within that radius. A high-accuracy timeout or unavailable response retries once using network positioning; permission denial instead presents browser/device settings guidance. Neither mode invents a position when the browser cannot provide one.

Dragging the map stops camera following while location updates continue. The location button can recenter and restart the watch. Dragging the personal pin or selecting a manual point stops GPS tracking and labels the point as manual. The stop button cancels tracking while retaining the last position; navigation away cleans up the watch using [clearWatch](https://developer.mozilla.org/en-US/docs/Web/API/Geolocation/clearWatch). A late callback cannot overwrite a manual selection. GPS updates preserve the current zoom, and camera panning respects reduced motion. After a first fix, temporary unavailable/timeout errors retain the active watch and last point until a new update arrives; permission denial stops it.

Geolocation requires a secure context and permission from the browser and operating system. Non-secure origins show guidance instead of silently failing. Existing `Permissions-Policy: geolocation=(self)` remains appropriate for direct localhost/HTTPS access. Embedded hosts may impose their own restrictions. Coordinates stay in component memory; no URL, storage, analytics or database write was added. Browser accuracy is displayed, not treated as verified GPS precision.

## Verification

PASS: production build and TypeScript, changed-file ESLint/Prettier, 34 unit tests and all 34 scoped browser cases across Chromium and mobile WebKit. Desktop/mobile screenshots were inspected for the initial feed and sticky controls. Preview is served on localhost:3000.

The scoped suite covers Explore search/category/reset, saved state, photo/menu/detail navigation, sticky controls, stable header, matching photo/panel widths, 320–1280 px layouts and reduced motion. Map cases cover permission, moving positions, accuracy, manual camera panning, stop/restart, navigation cleanup, network fallback, denied/timeout retry, stale callbacks, pin dragging, radii, keyboard placement and tile retry. Tests use local tile fixtures and emulated coordinates; device hardware GPS and OS permission dialogs are not measured.

UI delivery review: existing palette, typography, controls and focus styles retained; animations are bounded and reduced-motion aware; no fabricated photos, ratings, counts or location. Layout, empty, pending and error states use the existing product flow. This work does not change the research database or add all discovery candidates to Explore.
