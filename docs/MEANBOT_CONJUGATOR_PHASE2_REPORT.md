# Meanbot conjugator integration: Phase 2 report

Date: 2026-09-04

## Outcome

The browser app now uses a Meanbot-derived class/stem engine. It remains a
static classic-script application with no runtime Meanbot, HFST, network,
package, or build dependency. The original 165 UI cells remain present, but
every cell now carries status, source, rule ID, notes, and an array of surfaces.

The frozen Phase 1 fixture was not regenerated or reinterpreted. The new engine
matches all strictly generated fixture surface sets and all fixture status
expectations.

## Architecture and files

- `grammar_rules.js`: immutable result contract and exact UI inventories.
- `validation_metadata.js`: Phase 1 aggregate capability boundary.
- `lexicon.js`: compact class/stem tuples and lexical flags; no paradigms.
- `morphology.js`: input resolution, class rules, finite/passive/nonfinite
  dispatch, and separate periphrastic composition.
- `render.js`: dictionary lookup and status-aware rendering.
- `app.js`: DOM/event wiring and the new `window.__conjugator` API.
- `styles.css` and `index.html`: minimal mode/badge changes; scrolling and the
  opaque sticky first column are preserved.
- `tests/regression.mjs`: 6,600-row fixture regression and Phase 2 diff writer.
- `tests/browser_smoke.html`: real offline browser/DOM smoke test.
- `phase2_conjugator_vs_meanbot.tsv`: post-refactor comparison.
- `docs/phase2_regression_summary.json`: machine-readable totals.

`dictionary.js` was not edited.

## Implemented morphology

The engine implements the Phase 1-supported present, past, conditional,
imperative, active present-negative, passive, participle, infinitive, derived
`-minen`, and III-infinitive families. Sparse conditional connegative and
negative imperative components are enabled only for the lemmas/persons that
actually generated in Phase 1.

Class rules cover A-vowel, odd A-vowel, `-ata/-ätä`, `-uta/-ytä`, contracted,
long-vowel, consonant-stem, change/become `-eta/-etä`, and the lexical
`aatela`, `tarvita`, `tarttea`, and `olla` routes. Stem tuples generate the
paradigms; they do not store the 165 output cells.

Lexical metadata is retained for the unavoidable Phase 1 cases: `saa’a`,
`jua`, `juua`, `syä`, `myyä`, `tehä`, `nähä`, `käyä`, `aatela`, `tarvita`,
`tarttea`, the gradating `-ata/-ätä` and `-eta/-etä` cases, and both `paeta`
stems. This prevents the former unsafe `avata → apannu`-style reverse
gradation.

## Unknown inputs and variants

Known lemmas resolve to audited class/stem metadata. Unknown infinitive-like
inputs are matched against compatible surface classes. The input infinitive
can be safely derived; cells requiring unknown gradation or a divergent class
return `ambiguous`, `heuristic`, or `unsupported` instead of choosing a class
silently.

`saa` remains lexically ambiguous, ASCII `saa'a` is visibly normalized to
`saa’a`, `jua` and `juua` remain distinct, and `voia` is not treated as an
alias for `voija`. A separate strict-oracle check confirmed representative
`voija` forms (`voin`, `voisin`, `voihaan | voithaan`, `voinu`, `voitu`, and
`voihmaan | voimhaan`).

All generated alternatives remain in `surfaces[]` and render with ` / `.

## Explicit gaps

Potential, passive imperative, unsupported imperative persons, III
instructive, fifth infinitive, passive agent participle, and unsupported
passive nonfinite rows render as `unsupported`. The long first infinitive is
`ambiguous` because the UI omits possessive person, except `juosta` and `olla`,
whose missing generation paths remain `unsupported`.

Perfect/pluperfect rows use a separate auxiliary-plus-participle composer and
remain `partial`; available components are visible only in reference mode.
Conditional-perfect negative remains `unsupported`, because the required
`olla+V+Act+Cond+ConNeg` component does not generate.

## Regression result

Fixture totals:

- strict/supported-variant surface sets: **1,777 passed, 0 failed**;
- strict fixture analyzer-roundtrip evidence checks: **1,777 passed, 0 failed**;
- status expectations: **6,600 passed, 0 failed**;
- fixture rows carrying analyzer-roundtrip evidence: **3,807**;
- offline Chromium smoke checks: **8 passed, 0 failed**.

Post-refactor diff across 6,600 rows:

| Classification | Phase 1 app | Phase 2 app | Change |
|---|---:|---:|---:|
| `MATCH` | 937 | 1,551 | +614 |
| `MULTIPLE_VALID_VARIANTS` | 273 | 359 | +86 |
| `CURRENT_APP_WRONG` | 1,502 | 0 | -1,502 |
| `CURRENT_APP_HEURISTIC` | 2,073 | 0 | -2,073 |
| `MEANBOT_UNSUPPORTED` | 720 | 2,793 | +2,073 |
| `NEEDS_EVIDENCE` | 1,095 | 1,897 | +802 |

The unsupported increase is intentional: old potential and other unsupported
guesses are now exposed as unsupported instead of being counted as heuristic
surfaces. The `NEEDS_EVIDENCE` increase reflects partial constructions and
input ambiguity; it does not hide any strict fixture failure. Remaining
`CURRENT_APP_WRONG` rows: **0**. Remaining heuristic rows in the representative
fixture: **0**.

## Browser and compatibility verification

- Direct `file://` loading succeeded in headless Chromium.
- The included dictionary returned the existing Swedish/POS data for `antaa`.
- Both tables, variant surfaces, status badges, strict/reference behavior, and
  the debug API rendered successfully.
- A 390-pixel mobile viewport retained horizontal table scrolling.
- The sticky first-column backgrounds remain opaque in CSS.

## Meanbot handoff and isolation

No new Meanbot morphology gap was found beyond the Phase 1 gap report. The
additional `voija` check clarifies the existing `voia` issue but does not
change Meanbot data.

Canonical `/home/wolfhard/meanbot` and `/home/wolfhard/lang-fit` were not
modified or switched. All HFST queries used the existing disposable `/tmp`
build. No corpus, tokenizer, neural, PyTorch, or ROCm work was touched.
