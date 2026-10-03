# Past-example coverage update

Prepared locally on 2026-10-03; publication remains pending approval. This change
extends the deployed form-display fix without modifying the historical audited
form sets or their strict evidence labels.

## Source and classification

The supplied `ML_meankieli_perfect_imperfect_sentences.docx` has five pages,
seven named verb groups, 127 perfect/imperfect table rows, and an additional
`mie aatelin` example. All five rendered pages were reviewed. The source states
that its example sentences and translations were composed for the document;
these are explicit document examples, rather than independently attested corpus
tokens or saved analyzer roundtrips.

SHA-256: `03b293161bdba68cf160f4cd630c741d35dcd372e8561e2b6c966ee2b8e5e525`.
The original DOCX and renderings remain in locally ignored `local_sources/`.
The proposed repository change contains original rules, minimal grammatical
facts and source locators. It excludes the source sentences, translations and
whole document. Publishing these factual additions still requires the pending
publication approval.

Each source row is recorded in `docs/past_example_source_audit.tsv`:

| Classification | Source entries |
| --- | ---: |
| Agreement with existing Meanbot output | 52 |
| Difference from existing Meanbot output | 14 |
| New explicit document cells | 50 |
| Different lexical verb in the example | 6 |
| Ambiguous lemma or alternative lemma labels | 3 |
| Unresolved stem or derivational relationship | 3 |

The 50 new-example entries provide 48 distinct cells; repeated `purra` examples
retain their separate source locators. Locators `Tn.Rm` refer to OOXML body
element `n`, table row `m` after the header; `P33` refers to body paragraph 33.
These stable locators are verified against the source file and its checksum.

## Rules and evidence

- Explicit finite examples retain their stated person and number. Explicit
  participles retain singular, plural or passive voice. New direct cells show
  `Document example` (`documented`), never `Verified`.
- Fifteen explicitly chosen lexical past stems support additional personal
  candidates, with `Heuristic` labels and links to their stem evidence. The
  source's `autoi-` and `tulkitti-` weak-person evidence does not resolve the
  third-singular strong stem; those cells remain unavailable and ambiguous.
- Two bounded productive signatures propose past candidates for other exact
  dictionary verb entries: `-sta/-stä` minus final `ta/tä`, plus `i`; and simple
  one-vowel-group `-lla/-nnä/-rra` stems minus the final repeated consonant and
  infinitive vowel, plus `i`. Known Meanbot lemmas always take precedence.
  Longer `-ella` stems, lexical `olla`, the `juosta` exception, and the source's
  unresolved `surra` substitution are excluded from these productive rules.
- Personal candidates use `-n`, `-t`, zero, `-ma/-mä`, `-tta/-ttä`, and `-t`.
  Vowel harmony follows the displayed infinitive; other dialect endings and
  passive alternatives are not inferred. Held-out `haista → haisin/haisi` and
  `nuolla → nuolin/nuolitta` check rule behavior and remain unvalidated candidates.
- Singular perfect, pluperfect and past-negative constructions can combine an
  explicit document participle with existing auxiliary rules. These show
  `Derived`, with `document-component-composition` evidence; the whole phrase
  has no independent analyzer or corpus validation. Plural participles are not
  guessed from a singular example.
- `tehjä` and `nähjä` visibly resolve to audited `tehä` and `nähä`; these are also
  existing Meanbot infinitive variants. `voia` remains rejected as a strict
  infinitive. The source's `tarvita / tarttea → tarttin/tarttenu` examples attach
  specifically to `tarttea`; `tarvita → tarvittin` remains distinct.

The source groups alone do not establish a universal `-aa`, `-ta`, `-ita` or
`-eta` past rule. Their vowel changes, consonant grades and contracted stems
diverge. No Finnish default or unobserved stem alternation is used to fill them.

## Differences and deferred cases

Existing audited surfaces remain displayed, with document differences in their
cell evidence. Examples needing a source/dialect decision include:

| Lemma/cell | Document | Existing Meanbot retained |
| --- | --- | --- |
| vanheta, past third singular | vanhentu | vanheni |
| kylmetä, past third singular | kylmisty | kylmeni |
| lyhetä, past third singular | lyhenty | lyheni |
| vaaleta, past third singular | vaalentu | vaaleni |
| aatela, past first singular | aatelin | aattelin |
| käsittää, active singular past participle | käsittäny | käsittänny |
| hypätä, active singular past participle | hypänny | hypäny |
| päästä, plural perfect component | päässeet | pääsheet |

The complete list of 14 differences is in `docs/past_example_validation.json`.
None is silently added as an audited variant.

Examples such as `voia → saatto`, `surra → murehti/murehtinu`,
`aatela → hunderanu`, and `nuoreta → näytti` use other lexical verbs and do not
establish an inflection rule. `juoksea` with `juoksi/laukko`, the source lemma
`lämmittä` with `lämpiny`, and unresolved `nuorentunu/tummistunu/laihtunu` stem
relationships remain recorded and deferred.

## Reproduction and verification

```sh
python3 tools/build_past_example_data.py --source /path/to/ML_meankieli_perfect_imperfect_sentences.docx --output past_example_data.js
node tests/past_examples.mjs --source /path/to/ML_meankieli_perfect_imperfect_sentences.docx --write
node tests/regression.mjs
node tests/rendering.mjs
node tests/meanbot_updates.mjs --source /path/to/meanbot/phase21f/VERB_RUNTIME_RESULTS.tsv
```

Verification passed for all 128 source rows, explicit and held-out candidate
fixtures, all 6,600 historical status checks, all 1,777 strict surface-set
checks, rendering checks, and Meanbot component-source checks. Fresh local
Chromium passed all 42 combined browser checks, including separate evidence
badges, actual forms, unavailable cells and visible source differences.

The rule tests confirm bounded behavior and preservation of audited forms.
They do not promote extrapolated candidates to independently validated forms.
