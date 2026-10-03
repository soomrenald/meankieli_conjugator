# Bounded Meanbot Phase 21 update

Prepared locally on 2026-10-03. Publication is pending explicit approval; this
branch is separate from the deployed display fix.

The update adds active conditional negatives and passive present/past negatives
for the 39 lemmas already represented by the browser's audited lexicon. It adds
one exact marginal potential cell, `olla+V+Act+Pot+Prs+Sg3 → lienee`. It does not
infer a productive potential paradigm or admit unknown lemmas.

The implementation is original browser code. The data contains only factual
component surfaces, grammatical feature requests, source row locators and a
checksum. No Meanbot implementation, source prose, sentence corpus examples,
OCR text or external lang-fit source is copied.

## Authority and evidence

The grammatical reference is Bengt Pohjanen's ISOF
[Meänkieli: grammatik, lärobok, historik, texter](https://www.isof.se/download/18.7e054323188517fd234218c1/1686127060237/Mea%CC%88nkieli%20grammatik%20la%CC%88robok%20historik%20texter.pdf):

- PDF pp. 103–104: personal negative auxiliary plus conditional connegative.
- PDF pp. 101–102: fixed `ei` plus infinitive-shaped passive present connegative.
- PDF p. 102: fixed `ei` plus passive-perfect-participle-shaped past connegative.
- PDF p. 105: the exact marginal potential form `lienee`.

Project licensing decisions come from Meanbot's
`phase21c/NEGATIVE_CONSTRUCTION_RULES.tsv` (`P21C.ACT.COND.NEG`,
`P21C.PASS.IND.PRS.NEG`, `P21C.PASS.IND.PRT.NEG`, and disabled
`P21C.PASS.COND.NEG`) and `phase21d/POTENTIAL_DECISION.md`.

The machine-readable morphology source is the final Phase 21F/G saved
`phase21f/VERB_RUNTIME_RESULTS.tsv`. `meanbot_update_data.js` records its SHA-256
and exact source rows. Only each row's individual `roundtrip_surfaces` subset
is imported. A row-level `SUPPORTED_VARIANT` designation does not validate all
generated alternatives. This preparation does not rerun HFST or inspect the
external `/home/wolfhard/lang-fit` dependency.

Negative outputs are marked `derived`: the construction is source-licensed and
the main verb has individual saved generator/analyzer evidence. Entire composed
phrases are not claimed to be independently attested. Each surface carries its
own component analysis, component surface, evidence level, source row, source
checksum and grammar-page reference. The exact `lienee` cell has exact saved
roundtrip evidence and is marked `verified`.

## Examples and boundaries

Derived outputs include `en antais`, `emmä tekis`, `ei juosta`, `ei oltu`,
`en paenis / en pakenis`, and `ei paettu / ei pakettu`. These are outputs of the
new composition code, not copied corpus sentences.

Passive conditional negatives are unavailable because the reviewed construction
is explicitly disabled. Potential neighbors, third-infinitive instructive,
fifth infinitive and ownerless long infinitive remain bounded as before.
`voia` is not admitted as a lemma; `saa` remains ambiguous. `tapahtua` remains an
unverified unknown class; its displayed candidates are not promoted to verified.

The older conjugator handoff conflicts with later saved data on `avata` and the
plural participles of `jua`. Those cells are outside this update: all existing
strict fixture surfaces, including `avanu` and the retained h-position variants,
remain unchanged. Other compound-tense and imperative families are outside this
bounded update.

## Reproduction and tests

```sh
python3 tools/build_meanbot_update_data.py \
  --source /home/wolfhard/meanbot/phase21f/VERB_RUNTIME_RESULTS.tsv \
  --output meanbot_update_data.js
node tests/regression.mjs
node tests/rendering.mjs
node tests/meanbot_updates.mjs
node tests/meanbot_updates.mjs --source /home/wolfhard/meanbot/phase21f/VERB_RUNTIME_RESULTS.tsv
```

The historical Phase 1 oracle remains authoritative for all its strict surfaces.
Only the separately tested Phase 21 rule IDs supersede its old gap decisions;
those rows are reported as `SOURCE_UPDATED`. The browser smoke page tests the
classic-script load order, visible derived forms, per-surface source details,
exact `lienee`, and unavailable neighboring potential cells.
