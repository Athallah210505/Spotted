# Explore, Filters and Google review dishes

26 October 2026. Requested scope: improve Explore while retaining the user's Figma direction; align card panels with their photos; add restrained motion; match Filters and Overview to Figma; show dishes from actual Google reviews.

## Design and implementation

Figma references were read with screenshots and design context: [editorial Explore](https://www.figma.com/design/Sxg2J06MrgCE0ywAviBDNu?node-id=2065-1984), [editorial detail](https://www.figma.com/design/Sxg2J06MrgCE0ywAviBDNu?node-id=2065-1985), and [Filters](https://www.figma.com/design/Sxg2J06MrgCE0ywAviBDNu?node-id=2052-2129). The user's explicit request for full-width card panels overrides the inset panel in the reference. Existing components, local icons, Inter typography, butter masthead, blue ratings and rounded photographic surfaces are reused.

The previous card-width fix used equal-specificity CSS rules from different chunks, so the older inset margin could win in development or after navigation. A Google-card modifier now scopes the panel rule with higher specificity and an explicit full width. The development preview measured photo and identity panel at the same 342 px width. Browser tests cover 375, 390, 430 and desktop widths after navigating through Filters.

Filters previously appeared after the entire feed because of a CSS flex order. They now share a compact section toolbar with Sort before the cards. A local editorial label marks the first default recommendation. Photo aspect ratio keeps the first venue's identity visible above bottom navigation. Cards enter with a brief opacity/10 px translation; Save has press and selected-color feedback. Reduced motion removes these transitions and animations.

Filters retain the Figma heading sizes, yellow selected cuisine/rating chips, blue distance choice and 48 px controls. Apply/Reset stay in a footer outside the scrolling form. Explore starts with Any distance rather than silently limiting results to the profile radius; explicit distances remain measured from Blok M. Unsupported price/halal metadata has no new control. Existing query state, result counts and navigation are retained.

Overview uses the existing editorial detail layout, with 15 source-backed descriptions, including TUKU's coffee/noncoffee, cake and donut selection from its actual reviewer text. Other venues retain factual category/area fallback text. No additional official verification or halal certification is claimed.

## Google dishes

Sixteen dish photos for twelve venues are published under `menuPhotos`, with real captions, photo source URLs, author names/contributor URLs and capture timestamps. Each selected caption is inspected explicitly; review pages must match the venue name and a coordinate within 25 m. Avatar and unknown-image hosts are rejected. Two visually ambiguous photos were excluded after a local contact-sheet review. The parser has focused tests for selection, authors, unsafe sources and mismatched branches.

Collection uses the headless Firecrawl/Scrapling workflow: existing inspected captures plus a fresh TUKU page and five additional full English-language pages via ordinary headless Scrapling. No visible browser, paid API, stealth or challenge bypass. Files in `public/google-menus` are visitor photographs; they are not generated illustrations or a priced official menu.

Detail shows the available dish photos and captions with a Google source link. Clicking a photo opens the local image for inspection. Where a dish photo is unavailable, the page retains a truthful empty state and Google Maps link. Prices are not inferred from reviews. An official-menu link remains available where the earlier source inspection supplied one.

## Verification

- Production build, TypeScript, ESLint and 32 Node tests passed.
- 19 Python tests passed, including menu-caption/source validation.
- All 78 desktop/mobile browser cases passed, including first-screen Filters, persistent Apply, yellow selection, panel/photo width after navigation, reduced motion, real menu image loading, Overview text, source links, existing Save/Import/Profile flows and interactive Map.
- Headless development screenshots were inspected for Explore, Filters and TUKU Menu. Existing local static icons retain their intrinsic dimensions. Map tests use local tiles and emulated location.

## Anti Slop delivery gate

Mode: DURING, from the user's session choice. Direction: existing Figma editorial identity. Dials: ENERGY 2 / RHYTHM 2 / MOTION 1.

| Item | Status and evidence                                                                                             |
| ---- | --------------------------------------------------------------------------------------------------------------- |
| R-01 | PASS: existing flat butter/blue/canvas palette; no new gradient.                                                |
| R-02 | PASS: new product copy uses no em dash.                                                                         |
| R-03 | PASS: browser coverage checks mobile, landscape, desktop and larger text; aligned card bounds asserted.         |
| R-04 | PASS: existing bookmark, navigation and external-link assets retain their functions.                            |
| R-05 | PASS: the existing discovery flow determines masthead, toolbar and venue feed.                                  |
| R-06 | PASS: existing Figma Inter type and editorial label retained.                                                   |
| R-07 | PASS: no background grid or artificial texture.                                                                 |
| R-08 | PASS: external icon only identifies the source destination.                                                     |
| R-09 | PASS: Local Edit identifies the first editorial recommendation; no new status claims.                           |
| R-10 | PASS: no glass surfaces introduced.                                                                             |
| R-11 | PASS: 32 px cards, 24 px dish photos and pill controls preserve the reference hierarchy.                        |
| R-12 | PASS: existing overlapping panel shadow provides separation from its photo.                                     |
| R-13 | PASS: no glow.                                                                                                  |
| R-14 | PASS: venue cards support browsing; menu figures show actual available dishes.                                  |
| R-15 | PASS: Filters, Sort, Apply, Reset and source links have working destinations/actions.                           |
| R-16 | PASS: no AI marketing claims added.                                                                             |
| R-17 | PASS: counts derive from the published 37-venue snapshot and actual draft filters.                              |
| R-18 | PASS: review authors and captions remain attached to original source links.                                     |
| R-19 | PASS: bounded entrance/press feedback; reduced-motion browser check passes.                                     |
| R-20 | PASS: original butter masthead, spotted wordmark and blue ratings remain visible.                               |
| R-21 | PASS: existing Figma light theme retained.                                                                      |
| R-22 | PASS: real venue/dish photography, no generated decorative artwork.                                             |
| R-23 | PASS: user explicitly requested Google menu data and animation; no new logo/avatar/nav structure.               |
| R-24 | PASS: navigation, dish-image links, Google links and return state exercised.                                    |
| R-25 | PASS: white/blue contrast 5.30:1; muted/canvas 5.97:1; ink/butter 14.07:1.                                      |
| R-26 | PASS: every new control has a real href or handler.                                                             |
| R-27 | PASS: existing feed loading/empty/image-error states retained; menu has missing-data fallback.                  |
| R-28 | PASS: no FAQ introduced.                                                                                        |
| R-29 | PASS: existing semantic colors; yellow and blue indicate selection consistently.                                |
| R-30 | PASS: adapts the user's supplied Figma screens.                                                                 |
| R-31 | PASS: width correction, visible controls, persistent Apply and captioned dishes address the requested problems. |
| R-32 | PASS: native links/buttons/fieldset semantics and existing focus treatment retained.                            |
| R-33 | PASS: source JSX/CSS edited directly; screenshots are QA, not implementation assets.                            |
| R-34 | PASS: no unrelated theme feature introduced.                                                                    |
| R-35 | PASS: build plus 78 browser cases and development visual checks completed.                                      |
| R-36 | PASS: visitor dishes identified; no official-menu prices or whole-catalogue menu coverage claimed.              |
| R-37 | PASS: direction/dials follow the existing brand and the user's explicit animation request.                      |
| R-38 | PASS: only selected, attributed photos from matching venue coordinates are published.                           |
| L-1  | PASS: ENERGY 2 / RHYTHM 2 / MOTION 1 declared.                                                                  |
| L-2  | PASS: bold masthead, restrained surfaces and short entrance motion match those dials.                           |
| L-3  | PASS: Explore photo/identity, Filters selection and Menu food photo provide screen focal points.                |
| L-4  | PASS: spacing separates discovery, filtering and detail content; footer actions stay visible.                   |
| L-5  | PASS: yellow identity and blue functional accents follow Figma.                                                 |
| L-6  | PASS: editorial typography and rounded photo/panel pairing repeat the brand motif.                              |
| L-7  | PASS: Figma references and intended changes were identified before edits.                                       |
| C-1  | PASS: changes address specific UI/data requests.                                                                |
| C-2  | PASS: browser tests exercise filters, sorting, image links and source links.                                    |
| C-3  | PASS: no filler sections; the toolbar serves discovery and menu figures serve dish inspection.                  |
| C-4  | PASS: responsive, keyboard, reduced-motion and fallback states covered.                                         |
| C-5  | PASS: no invented ratings, authors, prices or menu photos.                                                      |

## Limits

Dish photos are available for 12 of 37 venues and descriptions for 15. A caption from a visitor review is not proof of current menu availability or pricing. The data remains a manually refreshed snapshot. TikTok data and the older Wishlist map prototype are unchanged.
