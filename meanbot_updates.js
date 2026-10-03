(function (global) {
  "use strict";

  const G = global.MeanKieliGrammar;
  const D = global.MeanKieliUpdateData;
  const suffixes = Object.freeze({
    conditional: "Act+Cond+ConNeg",
    passive_present: "Pass+Ind+Prs+ConNeg",
    passive_past: "Pass+Ind+Prt+ConNeg"
  });
  const pages = Object.freeze({
    conditional: "ISOF Meänkieli grammar, PDF pp. 103–104",
    passive_present: "ISOF Meänkieli grammar, PDF pp. 101–102",
    passive_past: "ISOF Meänkieli grammar, PDF p. 102"
  });

  function composedResult(resolution, family, prefix, ruleId) {
    const component = D.records[resolution.lemma][family];
    const surfaces = component[1].map(surface => `${prefix} ${surface}`);
    const evidence = surfaces.map((surface, index) => ({
      surface,
      evidence_level: "main-component-roundtrip",
      component_surface: component[1][index],
      analysis: `${resolution.lemma}+V+${suffixes[family]}`,
      source_locator: `${D.source_file}:${component[0]}`,
      source_sha256: D.source_sha256,
      grammatical_source: pages[family]
    }));
    const status = resolution.kind === "ambiguous_known" ? G.STATUSES.AMBIGUOUS : G.STATUSES.DERIVED;
    const note = [resolution.note, "Source-licensed negative composition. Each main-verb component independently roundtripped in the saved Meanbot audit; the whole phrase is derived, not separately attested."].filter(Boolean).join(" ");
    return G.result(surfaces, status, ruleId, "meanbot-phase21-audit", note, evidence);
  }

  function generateCell(resolution, key) {
    if (!resolution.entry || !D.records[resolution.lemma] || !key.startsWith("finite|")) return null;
    const [, section, slot] = key.split("|");
    if (section === "Conditional negative tense") {
      if (slot === "passive") {
        return G.unsupported("P21C.PASS.COND.NEG", "ISOF/Meanbot Phase 21C does not license a negative passive conditional construction.");
      }
      const index = G.PRONOUNS.findIndex(person => person.slot === slot);
      if (index < 0) return null;
      return composedResult(resolution, "conditional", G.NEGATIVE_AUXILIARY[index], "P21C.ACT.COND.NEG");
    }
    if (slot === "passive" && section === "Present negative tense") {
      return composedResult(resolution, "passive_present", "ei", "P21C.PASS.IND.PRS.NEG");
    }
    if (slot === "passive" && section === "Past negative tense") {
      return composedResult(resolution, "passive_past", "ei", "P21C.PASS.IND.PRT.NEG");
    }
    if (resolution.lemma === "olla" && section === "Potential tense" && slot === "se/hään") {
      const evidence = [{
        surface: "lienee",
        evidence_level: "exact-roundtrip",
        component_surface: "lienee",
        analysis: "olla+V+Act+Pot+Prs+Sg3",
        source_locator: `${D.source_file}:${D.potential[0]}`,
        source_sha256: D.source_sha256,
        grammatical_source: "ISOF Meänkieli grammar, PDF p. 105"
      }];
      return G.result(["lienee"], G.STATUSES.VERIFIED, "P21D.OLLA.POT.PRS.SG3", "meanbot-phase21-audit", "Exact marginal potential cell supported by the source and saved strict roundtrip. Other potential persons, lemmas and constructions remain unsupported.", evidence);
    }
    return null;
  }

  global.MeanKieliUpdates = Object.freeze({ generateCell });
})(window);
