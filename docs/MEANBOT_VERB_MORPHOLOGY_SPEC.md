# Meanbot-derived browser verb morphology specification

Date: 2026-09-04

Status: phase-1 derivation specification. This document does not change the
browser morphology engine.

## Authority and method

Meanbot is authoritative. Evidence was collected through
`/home/wolfhard/meanbot/tools/strict/meanbot-strict-lookup` using normal
transducers compiled from a disposable copy of `/home/wolfhard/lang-fit` at
`/tmp/meanbot-lang-fit-audit`. The Meanbot strict-profile regression passed.
Every populated simple-form fixture was generated and then analyzed back to
the exact requested feature bundle. HFST 3.16.0 was used to execute the build;
the current Meanbot reports record 3.17.3 for earlier project runs.

The machine-readable evidence is:

- `tests/meanbot_expected_verbs.tsv`
- `docs/meanbot_ui_capability_matrix.tsv`
- `current_conjugator_vs_meanbot.tsv`

`STRICT_VERIFIED` means one generated surface round-tripped. `SUPPORTED_VARIANT`
means multiple strict surfaces or an explicitly normalized input variant.
`PARTIAL` means component morphology exists but construction-level evidence or
lexical coverage is incomplete. `UNSUPPORTED` means there is no current strict
path. `AMBIGUOUS` means the UI/input omits a required distinction.

## Runtime design boundary

The browser implementation should use four independent layers:

1. Input normalization and lemma resolution.
2. Lexical class selection, including a small set of class/gradation flags.
3. A feature-driven morphology generator for simple cells.
4. A separate periphrastic composer for negative and compound rows.

Each result must carry `surface[]`, `status`, `rule_id`, and `notes`. A surface
array is required because Meanbot often generates several valid variants.
The engine must not choose an arbitrary first variant without retaining the
others.

## Feature inventory used by the UI

### Simple finite morphology

- Present: `V+Act+Ind+Prs+Sg1/Sg2/Sg3/Pl1/Pl2/Pl3` and
  `V+Pass+Ind+Prs`.
- Past: `V+Act+Ind+Prt+Sg1/Sg2/Sg3/Pl1/Pl2/Pl3` and
  `V+Pass+Ind+Prt`.
- Conditional: `V+Act+Cond+Sg1/Sg2/Sg3/Pl1/Pl2/Pl3` and `V+Pass+Cond`.
- Imperative: `V+Act+Imprt+Sg2`, class-dependent `Sg`/`Sg3`, `Pl2`, and
  `Pl3`. General `Pl1`, passive imperative, and several negative persons are
  not available.
- Potential: no `Pot` path exists in the current Meanbot feature inventory.

### Negative components

- Negative auxiliary: `ei+V+Neg+Act+Prs+Sg1/Sg2/Sg3/Pl1/Pl2/Pl3`.
- Present connegative: `V+Act+Ind+Prs+ConNeg`.
- Passive present/past connegative:
  `V+Pass+Ind+Prs+ConNeg` / `V+Pass+Ind+Prt+ConNeg` where the class exposes it.
- Conditional connegative: `V+Act+Cond+ConNeg` and
  `V+Pass+Cond+ConNeg` exist only for a minority of representative classes.
- Negative imperative components are available only for second singular and
  second plural.

Meanbot activates generic active present negation. Other negative rows remain
construction-level `PARTIAL` even when their individual words round-trip.

### Nonfinite morphology

- I: `V+Inf`.
- Long I: `V+Inf+Tra+Px*`; the current single UI cell is ambiguous because it
  does not specify possessive person.
- II: `V+InfE+Ine`, `V+InfE+Ins`, and `V+Pass+InfE+Ine`.
- III: `V+InfMa+Ine/Ela/Ill/Ade/Abe`.
- IV-style forms: `V+Der/minen+N+Sg+Nom/Par`; HFST models these as derived
  nouns, not a dedicated fourth-infinitive tag.
- Participles: `V+Act/Pass+PrsPrc+Sg+Nom`,
  `V+Act/Pass+PrfPrc+Sg+Nom`, active perfect plural `Pl+Nom`, and `V+AgPrc`.
- No strict path exists for III instructive or the fifth infinitive.

## Useful Meänkieli class structure

The Finnish-style six-type UI label is not sufficient. The browser classifier
should use Meanbot-compatible families plus lexical flags. The source
continuation classes below are development evidence, not names that must be
shown to users.

| Browser family | Meanbot/lang-fit classes | Representative evidence | Core stem behavior |
|---|---|---|---|
| A-vowel | `v1`, `v1_odd`, `v1_otta` | `antaa`, `alkaa`, `ostaa`, `käsittää`, `ymmärtää`, `kirjottaa` | Infinitive final `a/ä` is removed, but present weak grade, past-vowel behavior, and odd-syllable behavior are separate flags. |
| `-ata/-ätä` | `v2_ata_odd` | `huomata`, `avata`, `tavata`, `hypätä`, `hakata`, `maata` | Present uses a lexical strong stem; past and perfect participle use different grade/stem routes. |
| `-uta/-ytä` | `v2_uta` | `tarjota`, `haluta` | Vowel stem in present; `-si-` past; passive `-tt-` series. |
| Contracted | `v3_jua`, `v3_syä`, `v3_ja`, `v3_tehha`, `v3_nahha`, `v3_kaya` | `jua`, `syä`, `myyä`, `tehä`, `nähä`, `käyä` | Lexically selected present, past, conditional, participle, and h-position behavior. |
| Consonant | `v4`, `v4_sta`, `v4_juosta` | `tulla`, `mennä`, `pestä`, `nousta`, `juosta`, `päästä` | Present `-e-` stem; past `-i-`; perfect participle consonant assimilation; III illative has several h/metathesis variants. |
| `-la` odd | `v4_la_odd` | `aatela` | Lexical `aatte-/aattel-` alternation. |
| Need/require | `v5` plus lexical `tarttea` route | `tarvita`, `tarttea` | `tarvita` has `tarvitte-` finite stem and `tarvin-` participle; `tarttea` is not the same formal class. |
| Change/become | `v6` | `vanheta`, `lämmetä`, `paeta`, `kylmetä`, `lyhetä`, `vaaleta` | Present/past/conditional use `-ne-`; reverse gradation and root recovery may be lexical. |
| Copula | `OLLA` | `olla` | Fully lexical auxiliary paradigm with several feature-tag gaps. |

`juua` is a separate strict `v1` lemma, not merely an orthographic spelling of
`jua`; its forms differ (`juun`, `juuin`, `juisin`, `juunu`). `voia` is not a
strict infinitive lemma. The strict lexicon has `voija`; surface `voia` analyzes
only as its passive present connegative.

## Generic rules

These patterns are safe only after a class and any gradation flag have been
selected.

### Person and number endings

- Present active uses stem plus `-n`, `-t`, `-ma/-mä`, and `-tta/-ttä` for
  1sg, 2sg, 1pl, and 2pl. Third persons are class patterns and can have several
  strict variants; they must not be reduced to one universal ending.
- Past active generally uses a class-derived `i`/`oi` stem plus the same
  personal ending family. Third singular and third plural require their own
  class patterns.
- Conditional active uses class-derived `-is-` plus `-in`, `-it`, zero,
  `-imma/-immä`, `-itta/-ittä`, and plural variants such as `-it`, `-iva/-ivä`,
  or `-ivva/-ivvä` when Meanbot supplies them.
- Imperative safely generalizes only 2sg, 2pl `-kaa/-kää`, and 3pl
  `-khoot/-khööt` after class-specific stem selection. Third singular uses
  `-khoon/-khöön`, but the current feature tag is class-dependent (`Sg` versus
  `Sg3`).

### Present, past, and conditional stems

- A-vowel families have a strong and weak route. Example:
  `antaa → annan : antaa`, `alkaa → alan : alkaa`,
  `käsittää → käsitän : käsittää`, and `ymmärtää → ymmärän : ymmärtää`.
- `-ata/-ätä` present uses a lexical strong route:
  `huomata → huomaan`, `avata → avvaan`, `tavata → tappaan`,
  `hypätä → hyppään`, `hakata → hakkaan`, `maata → makkaan`.
  The infinitive surface alone cannot determine these alternations safely.
- Consonant families use an `e` present stem:
  `tulla → tulen`, `mennä → menen`, `nousta → nousen`,
  `pestä → pesen`, `juosta → juoksen`, `päästä → pääsen`.
- Change/become families use `-ne-`:
  `vanheta → vanhenen`, `lämmetä → lämpenen`, `kylmetä → kylmenen`,
  `lyhetä → lyhenen`, `vaaleta → vaalenen`.
- `paeta` is explicitly ambiguous in the current strict lexicon:
  `paenen` and `pakenen` both generate, with corresponding past/conditional
  variants.

### Consonant gradation

Gradation is a lexical-class property, not a reversible spelling substitution.
The browser may apply a generic alternation only after a lexicon/class rule has
authorized it. In particular, never infer reverse `v → p` or a single-consonant
doubling merely from an infinitive. `avata`, `tavata`, `hakata`, and `maata`
show why suffix shape alone is insufficient.

For unknown verbs, return all class candidates compatible with the surface.
If the candidates produce different strong stems, mark the affected cells
`AMBIGUOUS` or `HEURISTIC`; do not pick one silently.

### Passive

Passive is a separate stem route:

- A-vowel examples:
  `antaa → annethaan / annethiin / annettais / annettu` and
  `ostaa → ostethaan / ostethiin / ostettais / ostettu`.
- `-ata/-ätä` examples:
  `huomata → huomathaan / huomathiin / huomattais / huomattu` and
  `hypätä → hypäthään / hypäthiin / hypättäis / hypätty`.
- Consonant examples include strict variants:
  `tulla → tulhaan | tulthaan`, `mennä → menhään | menthään`, and
  past `tulthiin`, `menthiin`.
- Contracted examples likewise retain variants:
  `jua → juohaan | juothaan`, `syä → syöhään | syöthään`.

Present and past negative passive predicates use their own connegative
features. They are not interchangeable with the infinitive or perfect
participle: `antaa` generates `annata` (present connegative), `annatu` (past
connegative), and `annettu` (perfect participle). The current app conflates
these categories in several rows.

### Participles and h-position

- Active perfect singular is class-derived:
  `antaa antanu`, `huomata huomanu`, `avata avanu`, `jua juonu`,
  `tulla tullu`, `tarvita tarvinnu`.
- Active perfect plural frequently has h-position variants, for example
  `antaa antahneet | antanheet`. Contracted and consonant classes have their
  own patterns (`jua juohneet`, `tulla tulheet` where generated).
- Passive perfect uses the passive stem (`annettu`, `huomattu`, `juotu`,
  `menty`).
- III illative must return all generated h/metathesis forms. Examples:
  `antaa anthaan | antahmaan | antamhaan`,
  `mennä menehmään | menemhään | menheen`, and
  `tehä tekehmään | tekemhään | tekheen`.

A browser rule can encode h-placement templates by class, but variant order and
availability must be fixture-tested. A single post-hoc “insert h” function is
not adequate.

## Lexical exceptions and flags

The minimum unavoidable lexical layer is small compared with static paradigms,
but it is real:

- Full auxiliary/copula paradigm: `olla`.
- Contracted paradigms or stem tuples: `saa’a`, `jua`, `syä`, `myyä`, `tehä`,
  `nähä`, `käyä`; keep `juua` separate.
- `aatela` (`aatte-/aattel-`) and `tarvita` (`tarvitte-/tarvin-`).
- `tarttea` as its own class assignment rather than an alias of `tarvita`.
- Gradation/class flags for at least `avata`, `tavata`, `hypätä`, `hakata`,
  `maata`, `lämmetä`, and similar lexemes.
- Explicit `paeta` dual-stem variants.
- Input-only normalization for ASCII `'` to strict curly `’` may be provided,
  but the original input and normalization status must remain visible.

These entries store class/stem metadata, not complete paradigms.

## Periphrastic grammar

Perfect and pluperfect rows are not simple morphology. HFST supplies finite
`olla` forms and active/passive perfect participles, and all such components
round-trip for the admitted representative lemmas. Meanbot does not currently
provide a generic, table-backed rule that licenses every perfect,
pluperfect, conditional-perfect, imperative-perfect, or negative-perfect UI
row. Those cells are therefore `PARTIAL` even where a deterministic component
concatenation can be displayed for research.

Negative conditional-perfect rows are stricter still: the required
`olla+V+Act+Cond+ConNeg` auxiliary component does not generate. They are
`UNSUPPORTED`, and positive third-singular `olis` must not be silently reused
under the missing connegative feature.

The future browser composer should accept a construction rule such as:

```text
construction_id
auxiliary_feature_by_person
main_participle_feature_by_number_and_voice
polarity_strategy
evidence_status
```

It must not live in the same suffix code as simple verb inflection. Until a row
has a Meanbot construction rule or independent evidence, strict mode should
gray it out; reference mode may show the component-derived candidate labeled
`PARTIAL`.

## Unknown verbs

Unknown infinitive-like input remains supported as an attempt:

1. Match all compatible surface-class signatures.
2. Reject signatures that require a lexical gradation or irregular stem not
   inferable from the surface.
3. Generate invariant cells common to every remaining candidate.
4. Return multiple labeled candidates for divergent cells.
5. If no strict-derived template applies, return `UNSUPPORTED`; a legacy guess
   may be shown only as `HEURISTIC/UNVERIFIED`.

Dictionary/Meanbot membership can raise confidence and select stored class
metadata. It must not turn corpus frequency, foreign-name routes, shared-SMI
entries, or generic `Err/Orth` analyses into morphology authority.

## Purity requirements

- Preserve Meanbot's narrow `on`/`On` exception only for the exact
  `olla+V+Act+Ind+Prs+Sg3+Err/Orth` profile decision.
- Never add a generic `Err/Orth` bypass.
- Reject foreign/proper-name and shared technical routes as conjugation
  authority.
- Keep Finnish and Swedish reference forms out of rule induction unless a
  Meanbot-owned evidence decision explicitly admits them.
- Use fixtures with `STRICT_VERIFIED` or `SUPPORTED_VARIANT` as regression
  oracles. `PARTIAL`, `AMBIGUOUS`, and `UNSUPPORTED` must remain visibly gated.
