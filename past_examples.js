(function (global) {
  "use strict";
  const G = global.MeanKieliGrammar;
  const D = global.MeanKieliPastExampleData;
  const accepted = new Set(["direct", "visible-variant", "variant-specific"]);
  const slots = G.PRONOUNS.map(person => person.slot);
  const weakSlots = new Set(["mie", "sie", "met", "tet", "net/het"]);
  const rowsFor = lemma => D.rows.filter(row => row.lemma === lemma);
  const locator = row => `${D.source_file}#${row.id}`;
  const front = lemma => /[äöy]/.test(lemma) && !/[aou]/.test(lemma);

  function evidence(row, surface = row.surface, level = "document-example") {
    return { surface, evidence_level: level, component_surface: row.surface,
      source_locator: locator(row), source_sha256: D.source_sha256,
      grammatical_source: "User-provided perfect/imperfect sentence tables; composed examples" };
  }
  function hasExamples(lemma) { return rowsFor(lemma).length > 0; }
  function resolveAlias(lemma) { return D.aliases[lemma] || null; }
  function resolutionNote(lemma) {
    const rows = rowsFor(lemma);
    if (!rows.length) return "";
    const deferred = rows.filter(row => !accepted.has(row.disposition));
    const detail = deferred.length ? " Deferred examples: " + deferred.map(row =>
      `${row.surface} (${row.disposition}; ${row.id})`).join("; ") + "." : "";
    return "The supplied document has examples for this lemma, not a complete audited paradigm. Document examples and extrapolated forms have separate evidence labels. Audited forms are retained where sources differ." + detail;
  }
  function rowForKey(lemma, key, includeCompound = false) {
    if (key.startsWith("finite|Past tense|")) {
      const slot = key.split("|")[2];
      return rowsFor(lemma).filter(row => accepted.has(row.disposition) && row.kind === "past" && row.slot === slot);
    }
    if (key === "nonfinite|Past participle|active" || key === "nonfinite|Past participle|passive") {
      const wanted = key.endsWith("|passive") ? "passive" : "sg";
      return rowsFor(lemma).filter(row => accepted.has(row.disposition) && row.kind === "participle" && row.slot === wanted);
    }
    if (includeCompound && key.startsWith("finite|")) {
      const [, section, slot] = key.split("|");
      const compoundSections = new Set(["Past negative tense", "Present perfect tense", "Past perfect / pluskvamperfektum", "Present perfect negative tense", "Past perfect negative tense", "Conditional perfect tense"]);
      if (compoundSections.has(section)) {
        const index = slots.indexOf(slot);
        const wanted = slot === "passive" ? "passive" : index >= 3 ? "pl" : "sg";
        return rowsFor(lemma).filter(row => accepted.has(row.disposition) && row.kind === "participle" && row.slot === wanted);
      }
    }
    return [];
  }
  function annotateKnown(resolution, key, result) {
    const rows = rowForKey(resolution.lemma, key, true);
    if (!rows.length) return null;
    const isCompound = key.startsWith("finite|") && !key.startsWith("finite|Past tense|");
    if (isCompound && !result.surfaces.length) return null;
    const matches = row => result.surfaces.some(surface => surface === row.surface || (isCompound && surface.endsWith(` ${row.surface}`)));
    const matching = rows.filter(matches);
    const conflicts = rows.filter(row => !matches(row));
    const notes = conflicts.map(row => `Source difference: document ${row.surface} (${row.id}); existing Meanbot ${result.surfaces.join(" / ") || "unavailable"} retained. The document example is not substituted or added as an audited variant.`);
    if (matching.length) notes.push("Matching document example provides additional composed-example evidence; it does not change the audited status.");
    return G.result(result.surfaces, result.status, result.rule_id, result.source,
      [result.note, ...notes].filter(Boolean).join(" "),
      [...(result.surface_evidence || []), ...matching.flatMap(row => result.surfaces.filter(surface => surface === row.surface || (isCompound && surface.endsWith(` ${row.surface}`))).map(surface => evidence(row, surface, isCompound ? "document-component-agreement" : "document-example")))]);
  }
  function personal(stem, slot, lemma) {
    if (slot === "mie") return stem + "n";
    if (slot === "sie" || slot === "net/het") return stem + "t";
    if (slot === "se/hään") return stem;
    if (slot === "met") return stem + (front(lemma) ? "mä" : "ma");
    if (slot === "tet") return stem + (front(lemma) ? "ttä" : "tta");
    return null;
  }
  function inferRegular(lemma) {
    // Dictionary POS licenses the lemma, not its proposed paradigm. Multiple
    // POS values, geographic restrictions and dictionary spelling stay intact.
    const dictionaryEntry = global.MEANKIELI_DICTIONARY?.[lemma];
    if (!dictionaryEntry?.pos?.includes("v") || D.blocked_rule_lemmas.includes(lemma)) return null;
    if (/st[aä]$/.test(lemma) && !/juost[aä]$/.test(lemma)) {
      return { stem: lemma.slice(0, -2) + "i", rule: "DOC.PAST.REGULAR.STA", ids: ["T25.R1", "T25.R2", "T25.R4", "T25.R7"] };
    }
    if (/(ll|nn|rr)[aä]$/.test(lemma)) {
      const core = lemma.slice(0, -2);
      // The examples license the simple one-vowel-group shape. Longer -ella
      // stems, kuunnella contractions and lexical copula olla are excluded.
      if (lemma !== "olla" && /^[^aäeioöuüy]*[aäeioöuüy]+[lnr]$/.test(core)) {
        return { stem: core + "i", rule: "DOC.PAST.REGULAR.GEMINATE", ids: ["T31.R1", "T31.R2", "T31.R5", "T31.R6", "T31.R7"] };
      }
    }
    return null;
  }
  function extrapolated(resolution, slot) {
    const specification = D.stems[resolution.lemma];
    const regular = specification ? null : inferRegular(resolution.lemma);
    if (!specification && !regular) return null;
    if (specification?.[2] === "weak" && !weakSlots.has(slot)) {
      return G.result([], G.STATUSES.AMBIGUOUS, "DOC.PAST.STRONG-STEM-GAP", "user-document",
        "The document supplies a weak-person stem but does not resolve the third-singular strong stem. No consonant gradation is invented.");
    }
    const stem = specification?.[0] || regular.stem;
    const surface = personal(stem, slot, resolution.lemma);
    if (!surface) return null;
    const sourceRows = (specification ? [specification[1]] : regular.ids).map(id => D.rows.find(row => row.id === id));
    const note = "Past candidate extrapolated from a documented stem/pattern and personal endings. This lemma/person form has no independent analyzer or corpus validation. Single-m plural ending is a candidate; additional dialect variants and passive forms are not inferred.";
    return G.result([surface], G.STATUSES.HEURISTIC, regular?.rule || "DOC.PAST.LEXICAL-STEM", "user-document-rule", note,
      sourceRows.map(row => evidence(row, surface, "document-pattern-extrapolation")));
  }
  function compose(resolution, key, generate) {
    const [, section, slot] = key.split("|");
    const index = slots.indexOf(slot);
    if (index < 0 || index > 2) return null;
    const row = rowsFor(resolution.lemma).find(item => accepted.has(item.disposition) && item.kind === "participle" && item.slot === "sg");
    if (!row) return null;
    let aux;
    if (section === "Present perfect tense") aux = generate("olla", G.finiteKey("Present tense", slot)).surfaces;
    else if (section === "Past perfect / pluskvamperfektum") aux = generate("olla", G.finiteKey("Past tense", slot)).surfaces;
    else if (section === "Past negative tense") aux = [G.NEGATIVE_AUXILIARY[index]];
    else return null;
    const surfaces = aux.map(value => `${value} ${row.surface}`);
    return G.result(surfaces, G.STATUSES.DERIVED, "DOC.PAST.COMPOSITION.SINGULAR", "user-document-composition",
      "Number-matched singular construction derived from the document's active participle and existing auxiliary rules. The main component is a composed document example; the generated whole phrase is not independently attested or analyzer-validated.",
      surfaces.map(surface => evidence(row, surface, "document-component-composition")));
  }
  function generateCell(resolution, key, generate) {
    const rows = rowForKey(resolution.lemma, key);
    if (rows.length) {
      return G.result(rows.map(row => row.surface), G.STATUSES.DOCUMENTED,
        key.startsWith("finite|") ? "DOC.PAST.CELL" : "DOC.PAST.PARTICIPLE", "user-document",
        "Explicit form in the user-supplied composed example, with its person/number or voice preserved. This is not an independent corpus attestation or saved analyzer roundtrip.", rows.map(row => evidence(row)));
    }
    if (key.startsWith("finite|Past tense|") && !key.endsWith("|passive")) return extrapolated(resolution, key.split("|")[2]);
    if (key.startsWith("finite|")) return compose(resolution, key, generate);
    return null;
  }
  global.MeanKieliPastExamples = Object.freeze({ generateCell, annotateKnown, resolveAlias, hasExamples, resolutionNote, inferRegular });
})(window);
