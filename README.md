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
          "partial" | "ambiguous" | "heuristic" | "unsupported",
  source: "meanbot" | "meanbot-derived-rule" | "legacy-heuristic",
  rule_id: "...",
  note: "..."
}
```

Strict mode shows verified/derived results and makes gaps explicit. Reference
mode may reveal component-derived or heuristic candidates, but retains their
status badge. Multiple Meanbot surfaces are rendered with ` / ` and remain an
array in the debug API.

## Browser architecture

- `grammar_rules.js` — result contract, UI inventories, person/number metadata
- `validation_metadata.js` — frozen Phase 1 cell-capability decisions
- `lexicon.js` — compact known-lemma class/stem tuples and lexical flags
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

## Current boundaries

- Potential is unsupported because Meanbot has no strict `+Pot` path.
- The long first infinitive is ambiguous without possessive person.
- III instructive, fifth infinitive, passive imperative, and many passive
  nonfinite cells remain unsupported.
- Perfect/pluperfect rows are composed separately and remain `partial` unless
  Meanbot licenses the construction, even when every component generates.
- `saa` preserves lexical ambiguity; ASCII `saa'a` is visibly normalized to
  strict `saa’a`.
- `jua` and `juua` are distinct classes.
- `voia` is not promoted to the strict lemma `voija`.
