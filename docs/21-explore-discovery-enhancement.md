# Explore discovery enhancement

28 October 2026. Existing SPOTTED editorial direction, ENERGY 2 / RHYTHM 2 / MOTION 1. Anti Slop DURING follows the user's session choice.

Explore keeps the butter masthead, blue accents, full-width photo/panel pairing and existing type. The unused 44 px status-bar space becomes the real device safe-area inset, and masthead spacing decreases to 16 px. This keeps the first venue's name and rating visible while making room for quick filtering. Other pages retain their existing safe-area layout.

The new **4.5+ rated** and **Saved places** controls use the existing URL filters. The saved count includes actual published Google venues only. Selection survives detail/back navigation, removing the last saved match reveals a useful empty state, and search/category inputs temporarily disable during navigation so an immediate search after Reset cannot reuse an old category. Result metadata shows the active sort. Existing Filters and Sort pages remain available.

Cards now expose their actual review count alongside the Google score. After the first three venue cards, **On the table** presents one existing visitor photo from each of the 12 venues with menu photography. Each caption links to that venue's internal menu detail. The horizontal rail uses native scrolling and focusable links, supports keyboard activation and reuses the existing photo-error fallback. It appears on the unfiltered feed only, so it does not introduce unrelated results during search. No new image, external request, dependency or dataset was introduced.

Motion stays restrained: existing card entrances and Save press feedback remain, hover changes link color instead of scaling images beyond their panel, and reduced motion disables existing animation/transition effects. Food photography changes the pace of the feed without adding decorative sections.

## Verification

- Production build and TypeScript passed. ESLint passed with unrelated untracked `spotted-*.js` design scripts excluded. Changed-file Prettier and Git whitespace checks passed.
- All 33 unit tests and 24 scoped desktop/mobile browser cases passed. Coverage includes rating/saved combinations, live saved count, empty recovery, search/reset/category race, detail/back state, menu-photo loading and keyboard activation, existing Filters/Sort, Wishlist, image failures, reduced motion and 320–1280 px layouts.
- Desktop and mobile screenshots were inspected for the initial viewport and menu rail. Photo and panel boundaries remain equal after filter navigation. Browser tests ran headlessly with local assets; native Safari keyboard preference and device hardware were not separately tested.
- Computed contrast: muted `#61615c` / canvas `#fcfaf6` = 5.97:1; white / blue `#4a69b3` = 5.30:1. Existing global visible focus styles remain.

The 100 research candidates remain separate. The published catalogue is still 37 places, with menu photos for 12; scores/hours/photos are existing snapshots. Saved state remains the existing session preview, not account-persisted storage. This task does not change Map, authentication or the database.

## Anti Slop delivery gate

| Item | Status and evidence                                                                                              |
| ---- | ---------------------------------------------------------------------------------------------------------------- |
| R-01 | PASS: existing flat butter/blue/canvas colors; no gradients.                                                     |
| R-02 | PASS: new product copy contains no em dash.                                                                      |
| R-03 | PASS: 320–1280 px overflow checks, responsive navigation and photo/panel alignment pass.                         |
| R-04 | PASS: existing bookmark denotes the saved filter; photos identify real dishes.                                   |
| R-05 | PASS: discovery header, working filters, venue feed and contextual menu rail follow browsing tasks.              |
| R-06 | PASS: existing Figma typography retained.                                                                        |
| R-07 | PASS: no decorative grid or texture.                                                                             |
| R-08 | PASS: no decorative arrows added.                                                                                |
| R-09 | PASS: existing first-recommendation label retained; no invented status badges.                                   |
| R-10 | PASS: no glass surfaces added.                                                                                   |
| R-11 | PASS: 14 px quick-filter corners, 20 px dish photos and existing large venue cards distinguish roles.            |
| R-12 | PASS: existing overlapping identity panel uses its existing separation shadow.                                   |
| R-13 | PASS: no glow.                                                                                                   |
| R-14 | PASS: venue cards support comparison; smaller menu photos support food inspection.                               |
| R-15 | PASS: rating, Saved places, Filters, Sort and menu-photo labels describe working actions.                        |
| R-16 | PASS: concrete menu and result copy, without AI marketing language.                                              |
| R-17 | PASS: result, saved and review counts derive from published records/state.                                       |
| R-18 | PASS: no testimonials or invented people added.                                                                  |
| R-19 | PASS: existing entrance feedback and bounded color hover respect reduced motion.                                 |
| R-20 | PASS: spotted wordmark, butter masthead, blue ratings and rounded photo/panel motif retained.                    |
| R-21 | PASS: user's existing light Figma theme retained.                                                                |
| R-22 | PASS: only existing attributed visitor photography is used.                                                      |
| R-23 | PASS: user requested Explore enhancement; no new logo, avatar or navigation structure.                           |
| R-24 | PASS: menu links, detail/back and existing navigation exercised in browser tests.                                |
| R-25 | PASS: measured muted/canvas 5.97:1 and white/blue 5.30:1.                                                        |
| R-26 | PASS: quick filters toggle URL state; all 12 photo links have actual menu destinations.                          |
| R-27 | PASS: existing loading and image-error fallback retained; empty saved state has recovery.                        |
| R-28 | PASS: no FAQ introduced.                                                                                         |
| R-29 | PASS: existing butter, blue and neutral palette retained.                                                        |
| R-30 | PASS: follows the user's established SPOTTED design direction.                                                   |
| R-31 | PASS: compact header shows the first venue; quick filters shorten filtering; rail exposes available dish photos. |
| R-32 | PASS: native buttons/links, aria-pressed, live count, visible focus and keyboard menu activation tested.         |
| R-33 | PASS: JSX/CSS edited directly; screenshots used only for QA.                                                     |
| R-34 | PASS: no theme toggle or unrelated theme change.                                                                 |
| R-35 | PASS: build, 33 unit tests, 24 browser cases and screenshot inspection completed.                                |
| R-36 | PASS: photos are labeled as visitor photography, without official-menu availability claims.                      |
| R-37 | PASS: existing brand direction and ENERGY 2 / RHYTHM 2 / MOTION 1 stated before edits.                           |
| R-38 | PASS: photos, names, ratings and counts use existing source-backed app data.                                     |
| L-1  | PASS: ENERGY 2 / RHYTHM 2 / MOTION 1 declared.                                                                   |
| L-2  | PASS: bold brand header, quiet controls and restrained feedback match the dials.                                 |
| L-3  | PASS: headline/first venue lead initially; menu photography leads at the rail.                                   |
| L-4  | PASS: 16 px header spacing and separated food rail organize the scroll.                                          |
| L-5  | PASS: butter identifies the brand and selection; blue retains functional emphasis.                               |
| L-6  | PASS: established typography and photo/panel pairing repeat SPOTTED's identity.                                  |
| L-7  | PASS: existing implementation, Figma direction and caller scope read before edits.                               |
| C-1  | PASS: every addition supports scanning, filtering or food/detail inspection.                                     |
| C-2  | PASS: quick filtering, saving, menu-photo activation and return state tested.                                    |
| C-3  | PASS: no marketing/filler sections; menu rail uses actual available content.                                     |
| C-4  | PASS: responsive, reduced-motion, keyboard activation, empty and failed-image cases pass.                        |
| C-5  | PASS: no invented rating, food photo, coverage or trending claim.                                                |
