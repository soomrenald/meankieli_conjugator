# Meänkieli Verb Conjugator

A static, offline-capable browser conjugator whose morphology rules are derived
from the Meanbot strict audit. Open `index.html` directly or serve this folder
with any static file server. Meanbot and HFST are development-time authorities;
neither is needed in the browser.

## Evidence model

Every table cell is a structured result:

```js
{
  surfaces: ["..."],
  status: "verified" | "supported_variant" | "derived" |
          "documented" | "partial" | "ambiguous" | "heuristic" | "unsupported",
  source: "...", // Meanbot audit, document example, or rule/composition source
  rule_id: "...",
  note: "...",
  surface_evidence: [{ surface: "...", evidence_level: "...", source_locator: "..." }]
}
```

Both display modes show every available surface with its separate evidence-status
badge, including partial and heuristic candidates. An empty surface set displays
`Unavailable`, with the status and source explanation retained. Forms + evidence
also shows each cell's rule and source inline; Forms + status keeps them available
on hover or focus. Displaying a candidate never promotes its evidence status.
Multiple Meanbot surfaces are rendered with ` / ` and remain an array in the debug
API.

## Browser architecture

- `grammar_rules.js` — result contract, UI inventories, person/number metadata
- `validation_metadata.js` — frozen Phase 1 cell-capability decisions
- `lexicon.js` — compact known-lemma class/stem tuples and lexical flags
- `meanbot_update_data.js` — individually roundtripped factual Phase 21 components
- `meanbot_updates.js` — bounded negative constructions and exact `lienee` cell
- `past_example_data.js` — classified, minimal facts from the supplied Word tables
- `past_examples.js` — direct examples, bounded past candidates and source conflicts
- `morphology.js` — resolver, finite/passive/nonfinite builders and separate
  periphrastic composer
- `render.js` — dictionary lookup and status-aware tables
- `app.js` — minimal DOM wiring and `window.__conjugator` debug API
- `dictionary.js` — generated offline Meänkieli–Swedish dictionary; not edited
  by the morphology refactor

Known lemmas store class and stem metadata, not full paradigms. Unknown inputs
are matched against safe surface signatures. The identity infinitive can be
derived; divergent class/stem hypotheses return ambiguity or an explicitly
unverified heuristic result.

## Validation

Run the fixture and metadata regression:

```sh
node tests/regression.mjs --write
node tests/rendering.mjs
node tests/meanbot_updates.mjs
node tests/past_examples.mjs
```

It consumes the frozen `tests/meanbot_expected_verbs.tsv` oracle and writes:

- `phase2_conjugator_vs_meanbot.tsv`
- `docs/phase2_regression_summary.json`

`tests/browser_smoke.html` exercises the actual classic-script load order,
dictionary display, tables, debug API, supported forms, and visible gaps in an
offline browser.

Phase 1 evidence and its original baseline remain available in:

- `docs/MEANBOT_CONJUGATOR_PHASE1_REPORT.md`
- `docs/MEANBOT_VERB_MORPHOLOGY_SPEC.md`
- `docs/meanbot_ui_capability_matrix.tsv`
- `docs/MEANBOT_CAPABILITY_GAPS.md`
- `current_conjugator_vs_meanbot.tsv`

The optional source crosschecks take `--source` paths to the original Meanbot
audit or supplied DOCX. The original Word document and rendered pages stay in
locally ignored `local_sources/`; they are not part of this repository change.

See `docs/PAST_EXAMPLES_UPDATE.md` and `docs/past_example_source_audit.tsv`
for all source classifications, conflicts and extrapolation limits. `documented`
means an explicit composed document example; it is distinct from analyzer-backed
`verified`, construction-level `derived`, and unvalidated `heuristic` candidates.

## Current boundaries

- Potential is supported only for the exact `olla` present third-singular cell
  `lienee`; every other potential person, lemma, negative and compound stays
  unsupported.
- The long first infinitive is ambiguous without possessive person.
- III instructive, fifth infinitive, passive imperative, and many passive
  nonfinite cells remain unsupported.
- The supplied document extends named past cells and singular participle-based
  constructions. Bounded regular past candidates require an exact dictionary
  verb entry and retain heuristic status. Missing strong stems, plural
  participles, passive paradigms and ambiguous substitutions stay unavailable.
- Existing perfect/pluperfect rows still use historical component candidates and
  remain `partial` until the corresponding later construction rules are integrated.
- The Phase 21 overlay adds source-licensed active conditional negatives and
  passive present/past negatives for the 39 audited lemmas. These compositions
  are `derived`, with individual main-component roundtrip evidence; entire phrases
  are not promoted to attested forms. Passive conditional negatives are disabled.
  See `docs/MEANBOT_PHASE21_UPDATE.md` for source locators and validation limits.
- `saa` preserves lexical ambiguity; ASCII `saa'a` is visibly normalized to
  strict `saa’a`.
- Reciprocal dictionary short-vowel spellings such as `rakasta` visibly select
  their documented `rakastaa` form set, preserving the original regional label.
  Unbacked spellings do not enter the productive `-sta` rule.
- `jua` and `juua` are distinct classes.
- `voia` is not promoted to the strict lemma `voija`.
