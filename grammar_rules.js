(function (global) {
  "use strict";

  const STATUSES = Object.freeze({
    VERIFIED: "verified",
    SUPPORTED_VARIANT: "supported_variant",
    DERIVED: "derived",
    DOCUMENTED: "documented",
    PARTIAL: "partial",
    AMBIGUOUS: "ambiguous",
    HEURISTIC: "heuristic",
    UNSUPPORTED: "unsupported"
  });

  const PRONOUNS = Object.freeze([
    { label: "mie", person: 1, number: "sg", slot: "mie" },
    { label: "sie", person: 2, number: "sg", slot: "sie" },
    { label: "se/hään", person: 3, number: "sg", slot: "se/hään" },
    { label: "met", person: 1, number: "pl", slot: "met" },
    { label: "tet", person: 2, number: "pl", slot: "tet" },
    { label: "net/het", person: 3, number: "pl", slot: "net/het" }
  ]);

  const FINITE_ROWS = Object.freeze([
    "Present tense",
    "Past tense",
    "Conditional mood",
    "Imperative mood",
    "Potential tense",
    "Present negative tense",
    "Past negative tense",
    "Conditional negative tense",
    "Imperative negative mood",
    "Potential negative tense",
    "Present perfect tense",
    "Past perfect / pluskvamperfektum",
    "Conditional perfect tense",
    "Imperative perfect tense",
    "Potential perfect tense",
    "Present perfect negative tense",
    "Past perfect negative tense",
    "Conditional perfect negative tense",
    "Potential perfect negative tense"
  ]);

  const NONFINITE_ROWS = Object.freeze([
    "1st infinitive",
    "1st long infinitive",
    "2nd infinitive inessive",
    "2nd infinitive instructive",
    "3rd infinitive inessive",
    "3rd infinitive elative",
    "3rd infinitive illative",
    "3rd infinitive adessive",
    "3rd infinitive abessive",
    "3rd infinitive instructive",
    "4th infinitive nominative",
    "4th infinitive partitive",
    "5th infinitive",
    "Present participle",
    "Past participle",
    "Agent participle"
  ]);

  const NEGATIVE_AUXILIARY = Object.freeze(["en", "et", "ei", "emmä", "että", "ei"]);

  function unique(values) {
    return [...new Set((values || []).filter(Boolean))];
  }

  function result(surfaces, status, ruleId, source, note = "", surfaceEvidence = []) {
    const clean = unique(Array.isArray(surfaces) ? surfaces : [surfaces]);
    return Object.freeze({
      surfaces: Object.freeze(clean),
      status,
      rule_id: ruleId,
      source,
      note,
      surface_evidence: Object.freeze(surfaceEvidence.map(item => Object.freeze({ ...item })))
    });
  }

  function unsupported(ruleId, note) {
    return result([], STATUSES.UNSUPPORTED, ruleId, "meanbot", note);
  }

  function finiteKey(section, slot) {
    return `finite|${section}|${slot}`;
  }

  function nonfiniteKey(form, voice) {
    return `nonfinite|${form}|${voice}`;
  }

  global.MeanKieliGrammar = Object.freeze({
    STATUSES,
    PRONOUNS,
    FINITE_ROWS,
    NONFINITE_ROWS,
    NEGATIVE_AUXILIARY,
    unique,
    result,
    unsupported,
    finiteKey,
    nonfiniteKey
  });
})(window);
