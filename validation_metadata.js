(function (global) {
  "use strict";

  const { finiteKey, nonfiniteKey } = global.MeanKieliGrammar;
  const statusByCell = new Map();

  function setFinite(section, slots, status) {
    for (const slot of slots) statusByCell.set(finiteKey(section, slot), status);
  }

  const allSlots = ["mie", "sie", "se/hään", "met", "tet", "net/het", "passive"];
  const activeSlots = allSlots.slice(0, 6);

  for (const section of ["Present tense", "Past tense", "Conditional mood"])
    setFinite(section, allSlots, "SUPPORTED_VARIANT");
  setFinite("Imperative mood", ["tet"], "SUPPORTED_VARIANT");
  setFinite("Imperative mood", ["sie", "se/hään", "met", "net/het"], "PARTIAL");
  setFinite("Imperative mood", ["mie", "passive"], "UNSUPPORTED");
  setFinite("Present negative tense", activeSlots, "SUPPORTED_VARIANT");
  setFinite("Present negative tense", ["passive"], "PARTIAL");
  for (const section of ["Past negative tense", "Conditional negative tense"])
    setFinite(section, allSlots, "PARTIAL");
  setFinite("Imperative negative mood", ["sie", "tet"], "PARTIAL");
  setFinite("Imperative negative mood", ["mie", "se/hään", "met", "net/het", "passive"], "UNSUPPORTED");
  for (const section of [
    "Potential tense", "Potential negative tense", "Potential perfect tense",
    "Conditional perfect negative tense", "Potential perfect negative tense"
  ]) setFinite(section, allSlots, "UNSUPPORTED");
  for (const section of [
    "Present perfect tense", "Past perfect / pluskvamperfektum",
    "Conditional perfect tense", "Present perfect negative tense"
  ]) setFinite(section, allSlots, "PARTIAL");
  setFinite("Imperative perfect tense", ["se/hään", "met", "tet", "net/het", "passive"], "PARTIAL");
  setFinite("Imperative perfect tense", ["mie", "sie"], "UNSUPPORTED");
  setFinite("Past perfect negative tense", activeSlots, "PARTIAL");
  setFinite("Past perfect negative tense", ["passive"], "UNSUPPORTED");

  const supportedActive = [
    "1st infinitive", "2nd infinitive inessive", "2nd infinitive instructive",
    "3rd infinitive inessive", "3rd infinitive elative", "3rd infinitive illative",
    "3rd infinitive adessive", "3rd infinitive abessive",
    "4th infinitive nominative", "4th infinitive partitive",
    "Present participle", "Past participle", "Agent participle"
  ];
  for (const form of supportedActive) statusByCell.set(nonfiniteKey(form, "active"), "SUPPORTED_VARIANT");
  for (const form of ["2nd infinitive inessive", "Present participle", "Past participle"])
    statusByCell.set(nonfiniteKey(form, "passive"), "SUPPORTED_VARIANT");
  statusByCell.set(nonfiniteKey("1st long infinitive", "active"), "AMBIGUOUS");
  for (const form of global.MeanKieliGrammar.NONFINITE_ROWS) {
    for (const voice of ["active", "passive"]) {
      const key = nonfiniteKey(form, voice);
      if (!statusByCell.has(key)) statusByCell.set(key, "UNSUPPORTED");
    }
  }

  function capabilityStatus(key) {
    return statusByCell.get(key) || "UNSUPPORTED";
  }

  global.MeanKieliValidation = Object.freeze({
    PHASE1_SUMMARY: Object.freeze({
      total_cells: 165,
      universally_supported: 44,
      partial: 60,
      unsupported: 60,
      ambiguous: 1
    }),
    capabilityStatus
  });
})(window);
