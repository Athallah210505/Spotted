# Personal map pin and radius

26 October 2026. Main `/map` now supports a personal center point and a visible 1, 3, 5 or 10 km radius.

## Behavior

- **Gunakan lokasi saya** requests browser permission after a tap. A successful current-position fix places a labeled, draggable personal pin. The blue circle is the chosen search radius; a smaller dashed circle represents the browser's reported location accuracy.
- **Pilih titik** allows selecting a point by tapping the map. **Gunakan titik tengah peta** provides a keyboard alternative. Selecting a point or dragging the personal pin identifies it as **Titik pilihan Anda**, rather than claiming it is the GPS position.
- The circle uses geographic meters and the map fits its bounds after changing the point or radius. Clicking the personal pin, including Enter from the keyboard, recenters the circle. Existing venue pins still open internal details.
- The nearby count includes published venues whose straight-line distance from the selected point is within the radius. The existing Blok M distance helper now delegates to the same general distance calculation, preserving Explore's existing distance behavior.
- A late geolocation response cannot overwrite a newer manual selection. Denied/unavailable/timeout states retain manual selection and retry. Cancelling point selection keeps any existing pin.
- Controls retain the existing butter/blue palette and 44 px targets. The header can scroll on short landscape screens, and map markers are clipped inside the map viewport. No additional dependency or paid provider was added.

Coordinates are held only in the mounted Map component. They are not written to the URL, local storage or a database, and the selection resets when leaving/reloading the Map. GPS is a requested position fix, not continuous device tracking. Dataset coverage remains 37 Jakarta venues; the nearby count does not claim to cover every restaurant. Radius is straight-line geography, not driving distance. Native device GPS accuracy was not measured during automated testing.

Implementation follows the installed [Leaflet reference](https://leafletjs.com/reference.html#circle): circle radius is supplied in meters, draggable markers update the chosen point, and `fitBounds` frames the circle.

## Validation

33 unit tests passed, including arbitrary-origin distance and unchanged Blok M calculations. Build, TypeScript, ESLint and formatting passed. Thirty focused desktop/mobile browser cases cover GPS opt-in, permission denial/timeout/retry, manual map selection, dragging, all four radii, keyboard center selection and recentering, stale GPS callbacks, viewport layouts, tile failure/retry and related Wishlist/Profile navigation. Tests use local tile fixtures and emulated geolocation rather than the user's actual location or automated pan/zoom against community tile servers.

## Anti Slop delivery gate

Mode: DURING, inherited user session choice. Direction: existing SPOTTED Map, butter controls, blue geographic overlays. ENERGY 1 / RHYTHM 1 / MOTION 1. No new decorative animation.

| Item | Status and evidence                                                                            |
| ---- | ---------------------------------------------------------------------------------------------- |
| R-01 | PASS: existing flat brand colors; no gradients.                                                |
| R-02 | PASS: new product copy has no em dash.                                                         |
| R-03 | PASS: phone, desktop, landscape and larger-text map cases pass; viewport clips markers.        |
| R-04 | PASS: personal pin identifies the selected geographic point.                                   |
| R-05 | PASS: controls, status and map follow the task's point-to-radius flow.                         |
| R-06 | PASS: existing typography retained.                                                            |
| R-07 | PASS: no decorative background grid.                                                           |
| R-08 | PASS: no decorative arrow added.                                                               |
| R-09 | PASS: no decorative badge added.                                                               |
| R-10 | PASS: no glass effects.                                                                        |
| R-11 | PASS: existing pill controls; pin and geographic circle have distinct shapes.                  |
| R-12 | PASS: only the location pin uses a small separation shadow.                                    |
| R-13 | PASS: no glow.                                                                                 |
| R-14 | PASS: no feature-card grid introduced.                                                         |
| R-15 | PASS: GPS, point selection and radius buttons describe real actions.                           |
| R-16 | PASS: factual location/status copy only.                                                       |
| R-17 | PASS: nearby count uses actual published coordinates and the selected radius.                  |
| R-18 | PASS: no testimonials or fabricated people.                                                    |
| R-19 | PASS: radius framing disables animation; no new template motion.                               |
| R-20 | PASS: existing Map, controls and bottom navigation retained.                                   |
| R-21 | PASS: existing light theme retained.                                                           |
| R-22 | PASS: no generic illustration.                                                                 |
| R-23 | PASS: the user explicitly requested a personal pinpoint and visible radius.                    |
| R-24 | PASS: venue-to-detail/back and navigation tested.                                              |
| R-25 | PASS: existing white/blue 5.30:1 and ink/butter 14.07:1 contrast retained.                     |
| R-26 | PASS: controls select, locate, cancel or reframe; personal-pin Enter action tested.            |
| R-27 | PASS: no-origin, denied, timeout, unavailable, tile-error and zero-count states remain usable. |
| R-28 | PASS: no FAQ.                                                                                  |
| R-29 | PASS: existing blue, butter and neutral semantic colors.                                       |
| R-30 | PASS: existing SPOTTED Map extended without unrelated template sections.                       |
| R-31 | PASS: pin marks origin, circle marks radius, counter shows results.                            |
| R-32 | PASS: button names, selection state, radius image labels and keyboard alternative provided.    |
| R-33 | PASS: JSX/CSS implementation; screenshots used for QA only.                                    |
| R-34 | PASS: no unrelated theme control.                                                              |
| R-35 | PASS: build, unit and scoped browser checks completed.                                         |
| R-36 | PASS: manual location is labeled separately from GPS; straight-line distance documented.       |
| R-37 | PASS: existing Map direction and restrained dials retained.                                    |
| R-38 | PASS: no inferred user location; only browser coordinates or an explicit chosen point.         |
| L-1  | PASS: ENERGY 1 / RHYTHM 1 / MOTION 1 declared.                                                 |
| L-2  | PASS: quiet controls and nonanimated framing match these dials.                                |
| L-3  | PASS: the personal pin/circle form the geographic focal point.                                 |
| L-4  | PASS: header, map viewport and navigation remain distinct.                                     |
| L-5  | PASS: blue marks selected radius; butter retains the primary location action.                  |
| L-6  | PASS: existing rounded controls and blue map identity reused.                                  |
| L-7  | PASS: existing Map and callers were inspected before edits.                                    |
| C-1  | PASS: every added element supports location or radius selection.                               |
| C-2  | PASS: GPS, tap, drag, keyboard placement and recenter have browser coverage.                   |
| C-3  | PASS: no filler section added.                                                                 |
| C-4  | PASS: denied GPS still supports manual placement; late GPS cannot overwrite it.                |
| C-5  | PASS: counts use published venues; no fake location or coverage claim.                         |
