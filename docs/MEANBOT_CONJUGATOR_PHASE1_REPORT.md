# Meanbot conjugator integration: phase-1 report

Date: 2026-09-04

## Result

The phase-1 evidence basis is complete without changing `app.js` morphology.
The remote GitHub `main` commit and the clean local conjugator clone both point
to `5e9005656f5bf6ca979cde48d85804c42855fa06`. Work was performed on the
isolated branch `meanbot-morphology-audit` in
`/tmp/meankieli_conjugator-meanbot-phase1`.

Meanbot's strict profile passed against transducers compiled from the
disposable `/tmp/meanbot-lang-fit-audit` copy. Canonical
`/home/wolfhard/meanbot` and `/home/wolfhard/lang-fit` were read-only.

## 1. Exact UI conjugation-cell inventory

The finite table has seven morphology columns (`mie`, `sie`, `se/hään`, `met`,
`tet`, `net/het`, `passive`) for each of 19 rows, for **133 finite cells**:

1. Present tense
2. Past tense
3. Conditional mood
4. Imperative mood
5. Potential tense
6. Present negative tense
7. Past negative tense
8. Conditional negative tense
9. Imperative negative mood
10. Potential negative tense
11. Present perfect tense
12. Past perfect / pluskvamperfektum
13. Conditional perfect tense
14. Imperative perfect tense
15. Potential perfect tense
16. Present perfect negative tense
17. Past perfect negative tense
18. Conditional perfect negative tense
19. Potential perfect negative tense

The nonfinite/participle table has active and passive morphology columns for 16
rows, for **32 cells**:

1. 1st infinitive
2. 1st long infinitive
3. 2nd infinitive inessive
4. 2nd infinitive instructive
5. 3rd infinitive inessive
6. 3rd infinitive elative
7. 3rd infinitive illative
8. 3rd infinitive adessive
9. 3rd infinitive abessive
10. 3rd infinitive instructive
11. 4th infinitive nominative
12. 4th infinitive partitive
13. 5th infinitive
14. Present participle
15. Past participle
16. Agent participle

Total: **165 displayed morphology cells**. This excludes row labels, pronoun
headers, and note/usage columns. Intentional em dashes are still inventoried as
cells and classified `UNSUPPORTED` where appropriate.

The exact feature-level inventory is in
`docs/meanbot_ui_capability_matrix.tsv`.

## 2. Meanbot capability count

Across the 38 distinct strict-admitted representative paradigms:

| Capability status | Cells | Percent of 165 | Meaning |
|---|---:|---:|---|
| `SUPPORTED_VARIANT` | 44 | 26.67% | The cell generated and round-tripped for all admitted paradigms; at least one paradigm has multiple strict outputs. |
| `PARTIAL` | 60 | 36.36% | Some lexical classes are missing, or all word components exist but Meanbot does not license the complete periphrastic construction. |
| `AMBIGUOUS` | 1 | 0.61% | Long infinitive cell omits required possessive person. |
| `UNSUPPORTED` | 60 | 36.36% | No applicable current strict path or the UI intentionally contains no form. |

Thus **44/165 cells (26.67%) are universally strict-validatable as defined by
the actual UI**, including retained strict variants. **105/165 (63.64%) have at
least some strict generated/component evidence**, but 61 of those are not safe
to present as universally verified.

At the input-by-cell level, the fixture has 6,600 rows:

- 1,513 `STRICT_VERIFIED`
- 264 `SUPPORTED_VARIANT`
- 1,897 `PARTIAL`
- 2,793 `UNSUPPORTED`
- 133 `AMBIGUOUS`

The 40 inputs include the requested input variants `saa'a`, `saa`, `jua`,
`juua`, `tarvita`, and `tarttea`, plus unsupported-infinitive probe `voia`.

## 3. Unsupported and ambiguous cells

Major unsupported families:

- all simple and compound potential cells (`+Pot` does not exist);
- active imperative 1sg, most active imperative 1pl, passive imperative;
- negative imperative outside 2sg/2pl and all passive negative imperative;
- imperative-perfect 1sg and `olla`-based 2sg under the current tags;
- passive past-perfect negative;
- conditional-perfect negative (the required `olla+V+Act+Cond+ConNeg`
  component is absent; positive third singular is not treated as a substitute);
- all passive nonfinite cells except passive II inessive and passive
  present/perfect participles;
- active/passive III instructive;
- active/passive fifth infinitive;
- passive agent participle.

The long first infinitive is `AMBIGUOUS`: Meanbot requires
`V+Inf+Tra+PxSg1/Sg2/Sg3/Pl1/Pl2/Pl3`, while the app displays one unspecific
`-kse(en)` cell. `saa` is also lexically ambiguous between `saa’a` and
`saaja`, and `paeta` has two strict stems. These input-level ambiguities appear
in the fixture even though the capability-matrix row count is cell-based.

## 4. Representative-verb fixture

`tests/meanbot_expected_verbs.tsv`

It contains all 6,600 input/cell combinations, feature bundles, selected
surface, all retained alternatives (bounded for Cartesian compound products),
status, evidence, analyzer roundtrip, and notes. It is a test oracle, not a
runtime paradigm lexicon.

## 5. Morphology specification

`docs/MEANBOT_VERB_MORPHOLOGY_SPEC.md`

It separates generic feature-driven rules, lexical class/gradation metadata,
periphrastic construction rules, ambiguous unknown-verb handling, and
unsupported areas.

## 6. Current-app diff

`current_conjugator_vs_meanbot.tsv`

Classification totals across 6,600 comparisons:

| Classification | Rows |
|---|---:|
| `MATCH` | 937 |
| `MULTIPLE_VALID_VARIANTS` | 273 |
| `CURRENT_APP_WRONG` | 1,502 |
| `CURRENT_APP_HEURISTIC` | 2,073 |
| `MEANBOT_UNSUPPORTED` | 720 |
| `NEEDS_EVIDENCE` | 1,095 |

`MATCH` is deliberately strict. A component-derived compound that looks the
same remains `NEEDS_EVIDENCE` when Meanbot lacks a construction rule.

## 7. Major current-app error classes

1. **Unsupported potential generation.** The app fills all simple potential
   active/passive cells and most potential-perfect cells from Finnish-style
   estimates, despite Meanbot having no `Pot` feature path. This accounts for
   1,040 high-volume `CURRENT_APP_HEURISTIC` rows by itself.
2. **Reverse gradation and lexical stem recovery.** Meanbot gives
   `avata → avvaan / avanu`, `tavata → tappaan / tavanu`,
   `maata → makkaan / maanu`, and `ymmärtää → ymmärän`. The JS classifier
   cannot recover these reliably from suffix shape.
3. **Past-stem overgeneralization.** For example Meanbot has
   `ostaa → ostin`, not the app's generic `-oi-` route; `tehä → tehin`, not
   the app's `teki-` base.
4. **Connegative/participle conflation.** Meanbot distinguishes
   `annata` (passive present connegative), `annatu` (passive past connegative),
   and `annettu` (passive perfect participle). The app uses infinitives or
   participles in cells whose strict feature is different.
5. **Participle boundary and gemination errors.** Examples include strict
   `huomanu`, `avanu`, `käsittänny`, and class-specific plural h-forms, rather
   than a universal suffix rewrite.
6. **h-position collapsed to one guess.** Meanbot commonly returns several III
   illatives, such as `anthaan | antahmaan | antamhaan`; the app emits one
   mechanically inserted-h form.
7. **Imperative overgeneration.** The app manufactures 1pl, negative third
   person, and passive/compound cells for which the current strict inventory is
   absent or inconsistently tagged.
8. **`jua`/`juua` conflation risk.** They are distinct strict classes and have
   different paradigms. `voia` is not a strict infinitive lemma; `voija` is.
9. **Compound rows treated as suffix output.** Many auxiliary and participle
   words are morphologically available, but full construction licensing is
   missing. Matching strings are therefore not yet strict grammatical proof.
10. **Variant loss.** Present/passive/third-plural syncretism, conditional 3pl,
    h-metathesis, and `paeta` variants cannot be represented by one scalar
    surface.

## 8. Proposed browser-side rule architecture

```text
input normalizer
  -> lemma/class resolver
     (class id + stem tuple + gradation flags + confidence)
  -> feature dispatcher
     -> simple finite builder
     -> passive builder
     -> nonfinite/participle builder
  -> periphrastic composer
     (only evidence-backed auxiliary + participle recipes)
  -> result { surfaces[], status, rule_id, notes }
```

Unknown inputs should retain all compatible classes. Cells common to all
candidates may be shown as derived; divergent cells must return ambiguity.
Known lemmas store only class/stem metadata, never full static paradigms.

## 9. Unavoidable lexical exceptions

- `olla`;
- contracted/stem-tuple classes for `saa’a`, `jua`, `syä`, `myyä`, `tehä`,
  `nähä`, and `käyä`;
- separate `juua` class;
- `aatela`, `tarvita`, and separate `tarttea` assignment;
- lexical gradation/stem flags for `avata`, `tavata`, `hypätä`, `hakata`,
  `maata`, `lämmetä`, and comparable lexemes;
- both `paeta` stems;
- visible punctuation normalization for ASCII `saa'a` to `saa’a`.

## 10. Meanbot gaps requiring possible future work

No Meanbot work is required to implement the already verified simple-cell
subset. Full parity with the current broad UI would require future Meanbot
decisions/work for potential, compound-tense composition, imperative tag
coverage (especially `olla` 2sg), sparse conditional/passive connegatives, III
instructive, fifth infinitive, and the lexical status of `voia`.

The isolated gap report is `docs/MEANBOT_CAPABILITY_GAPS.md`.

## 11. Isolation confirmation

- No file, branch, index, or worktree state under `/home/wolfhard/meanbot` was
  changed.
- No file or branch under `/home/wolfhard/lang-fit` was changed.
- No neural, tokenizer, PyTorch, or ROCm work was started.
- No conjugator code was committed into Meanbot.
- `app.js`, `index.html`, `styles.css`, and `dictionary.js` were not modified
  in the isolated conjugator branch.

## Reproduction

With the disposable transducers and HFST lookup available:

```sh
MEANBOT_ROOT=/home/wolfhard/meanbot \
MEANKIELI_BUILD_ROOT=/tmp/meanbot-lang-fit-audit \
HFST_LOOKUP=/tmp/meanbot-runtime/hfst/usr/bin/hfst-lookup \
./tools/generate_meanbot_audit.py
```

The generator script is development-only and does not become part of the
browser runtime.
