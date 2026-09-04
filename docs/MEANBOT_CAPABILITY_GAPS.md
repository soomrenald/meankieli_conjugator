# Meanbot capability gaps exposed by the conjugator audit

Date: 2026-09-04

This is a report for possible future Meanbot work. No Meanbot or lang-fit file
was changed by the conjugator task.

## Phase 2 status

The browser refactor discovered no additional Meanbot capability gap. A direct
strict-oracle check confirmed that `voija` is a productive lemma (`voin`,
`voisin`, `voinu`, `voitu`), while the existing finding remains unchanged:
`voia` is not a strict infinitive and must not be silently promoted to
`voija`.

## Gaps that block strict UI coverage

- Potential morphology is absent: there is no current `+Pot` path. This blocks
  all 28 potential/potential-perfect active/passive UI cells, before negative
  or compound syntax is considered.
- Generic compound-tense construction rules are absent. HFST provides `olla`
  and participle components, but Meanbot does not license all perfect,
  pluperfect, conditional-perfect, imperative-perfect, or negative-perfect
  combinations shown by the app.
- `olla+V+Act+Cond+ConNeg`, the auxiliary form needed for negative
  conditional-perfect composition, does not generate. The positive third
  singular `olis` must not be used as an untagged substitute.
- Imperative coverage is incomplete. General verbs expose 2sg, a generic
  third-singular `Sg`, 2pl, and usually 3pl. General 1pl is absent. `olla`
  exposes `ole` as `Imprt+Sg1` but not `Imprt+Sg2`, even though 2sg is the UI
  use needed for `ole`. The Meanbot imperative map says `Sg3`, while the
  current compiled regular classes use generic `Sg`; this documentation/source
  mismatch needs reconciliation.
- Passive imperative morphology is absent. Negative imperative components are
  available only for 2sg and 2pl, and the Meanbot sentence grammar deliberately
  defers negative imperative behavior.
- Conditional connegative coverage is sparse: active
  `V+Act+Cond+ConNeg` generated for only 9/38 admitted representative lemmas;
  passive `V+Pass+Cond+ConNeg` generated for 5/38.
- Passive present/past connegative paths are missing for `tehä`, `nähä`,
  `käyä`, `juosta`, and `olla` in this audit. Meanbot also defers generic
  negative-passive grammar.
- Long infinitive coverage requires a possessive suffix and is absent for
  `juosta` and `olla` among the 38 admitted paradigms. The current UI cell does
  not ask for possessive person, so the UI is independently ambiguous.
- No strict feature path exists for the UI's III instructive or fifth
  infinitive.

## Lexical/input gaps rather than rule gaps

- `voia` is not a strict infinitive lemma. The lexicon has `voija`; `voia`
  analyzes only as `voija+V+Pass+Ind+Prs+ConNeg`. Meanbot should decide whether
  `voia` is an independently evidenced infinitive spelling before the browser
  treats it as an alias.
- ASCII `saa'a` is not strictly analyzed. Curly-apostrophe `saa’a` is the
  strict lemma, and surface `saa` is ambiguous between `saa’a` and `saaja`.
  Browser normalization can handle ASCII punctuation without widening the
  strict analyzer.
- `paeta` has two strict lexical stems, producing `paenen` and `pakenen`.
  This is a supported ambiguity to preserve, not a defect to collapse.

## Priority recommendation

No Meanbot change is required before the browser engine can be rewritten for
the already strict simple cells. If strict parity with every current UI row is
the product requirement, future Meanbot work should address, in order:

1. reconcile imperative tags and `olla` 2sg;
2. define evidence-backed generic perfect/pluperfect composition;
3. decide whether potential belongs in supported Meänkieli output;
4. complete or explicitly reject sparse connegative/passive cells;
5. decide the status of III instructive, fifth infinitive, and `voia`.
