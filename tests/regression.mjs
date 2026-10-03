#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
globalThis.window = globalThis;
for (const file of ["grammar_rules.js", "validation_metadata.js", "lexicon.js", "meanbot_update_data.js", "meanbot_updates.js", "past_example_data.js", "past_examples.js", "morphology.js"]) {
  vm.runInThisContext(fs.readFileSync(path.join(root, file), "utf8"), { filename: file });
}

function parseTsv(file) {
  const lines = fs.readFileSync(file, "utf8").trimEnd().split("\n");
  const header = lines.shift().split("\t");
  return lines.map(line => Object.fromEntries(line.split("\t").map((value, index) => [header[index], value])));
}

function oracleSurfaces(row) {
  return [row.expected_surface, ...row.alternate_surface.split(" | ")].filter(Boolean);
}

function sameSet(left, right) {
  const a = [...new Set(left)].sort();
  const b = [...new Set(right)].sort();
  return a.length === b.length && a.every((value, index) => value === b[index]);
}

const rows = parseTsv(path.join(root, "tests/meanbot_expected_verbs.tsv"));
const resolutions = new Map();
const output = [];
const totals = { rows: rows.length, strict_pass: 0, strict_fail: 0, status_pass: 0, status_fail: 0, roundtrip_evidence_rows: 0, strict_roundtrip_evidence_fail: 0, source_updated_rows: 0 };
const diff = Object.fromEntries([
  "MATCH", "MULTIPLE_VALID_VARIANTS", "CURRENT_APP_WRONG",
  "CURRENT_APP_HEURISTIC", "MEANBOT_UNSUPPORTED", "NEEDS_EVIDENCE", "SOURCE_UPDATED"
].map(value => [value, 0]));

for (const row of rows) {
  const resolution = resolutions.get(row.lemma) || window.MeanKieliMorphology.resolveInput(row.lemma);
  resolutions.set(row.lemma, resolution);
  const actual = window.MeanKieliMorphology.generateCell(resolution, row.ui_cell_key);
  const expected = oracleSurfaces(row);
  const overlap = actual.surfaces.filter(surface => expected.includes(surface));
  const strictOracle = row.status === "STRICT_VERIFIED" || row.status === "SUPPORTED_VARIANT";
  // The frozen Phase 1 oracle remains authoritative for its strict cells.
  // Only the separately tested Phase 21 overlay supersedes historical gaps.
  const sourceUpdated = !strictOracle && /^P21[CD]\./.test(actual.rule_id);
  if (sourceUpdated) totals.source_updated_rows += 1;
  const statusOkay = sourceUpdated ||
    (row.status === "UNSUPPORTED" && actual.status === "unsupported") ||
    (row.status === "AMBIGUOUS" && actual.status === "ambiguous") ||
    (row.status === "PARTIAL" && ["partial", "unsupported"].includes(actual.status)) ||
    (strictOracle && ["verified", "supported_variant", "ambiguous"].includes(actual.status));
  if (statusOkay) totals.status_pass += 1; else totals.status_fail += 1;

  let exact = false;
  if (strictOracle) {
    exact = sameSet(actual.surfaces, expected);
    if (exact) totals.strict_pass += 1; else totals.strict_fail += 1;
  }
  if (row.analyzer_roundtrip === "PASS" || row.analyzer_roundtrip === "PASS_COMPONENTS") totals.roundtrip_evidence_rows += 1;
  if (strictOracle && row.analyzer_roundtrip !== "PASS") totals.strict_roundtrip_evidence_fail += 1;

  let classification;
  if (sourceUpdated) classification = "SOURCE_UPDATED";
  else if (actual.status === "heuristic") classification = "CURRENT_APP_HEURISTIC";
  else if (row.status === "UNSUPPORTED" && actual.status === "unsupported") classification = "MEANBOT_UNSUPPORTED";
  else if (row.status === "AMBIGUOUS" && actual.status === "ambiguous") classification = "MULTIPLE_VALID_VARIANTS";
  else if (row.status === "PARTIAL") classification = overlap.length || !expected.length ? "NEEDS_EVIDENCE" : "CURRENT_APP_WRONG";
  else if (strictOracle && exact) classification = expected.length > 1 || actual.status === "ambiguous" ? "MULTIPLE_VALID_VARIANTS" : "MATCH";
  else classification = "CURRENT_APP_WRONG";
  diff[classification] = (diff[classification] || 0) + 1;

  output.push({
    lemma: row.lemma,
    ui_cell_key: row.ui_cell_key,
    meanbot_status: row.status,
    phase2_status: actual.status,
    meanbot_surface: row.expected_surface,
    meanbot_alternates: row.alternate_surface,
    phase2_surfaces: actual.surfaces.join(" | "),
    classification,
    rule_id: actual.rule_id,
    source: actual.source,
    status_match: statusOkay ? "PASS" : "FAIL",
    exact_surface_set: strictOracle ? (exact ? "PASS" : "FAIL") : "NOT_APPLICABLE",
    notes: actual.note,
    analyzer_roundtrip_evidence: row.analyzer_roundtrip
  });
}

const sampleParadigm = window.MeanKieliMorphology.conjugateParadigm("antaa");
const sampleCells = [
  ...sampleParadigm.finite.flatMap(row => [...row.forms, row.passive]),
  ...sampleParadigm.nonfinite.flatMap(row => [row.active, row.passive])
];
const capabilityKeys = [
  ...window.MeanKieliGrammar.FINITE_ROWS.flatMap(section => [
    ...window.MeanKieliGrammar.PRONOUNS.map(person => window.MeanKieliGrammar.finiteKey(section, person.slot)),
    window.MeanKieliGrammar.finiteKey(section, "passive")
  ]),
  ...window.MeanKieliGrammar.NONFINITE_ROWS.flatMap(form => [
    window.MeanKieliGrammar.nonfiniteKey(form, "active"),
    window.MeanKieliGrammar.nonfiniteKey(form, "passive")
  ])
];
const capabilityCounts = capabilityKeys.reduce((counts, key) => {
  const status = window.MeanKieliValidation.capabilityStatus(key);
  counts[status] = (counts[status] || 0) + 1;
  return counts;
}, {});
const smoke = {
  exact_ui_inventory: sampleParadigm.finite.length === 19 && sampleParadigm.nonfinite.length === 16 && sampleCells.length === 165,
  phase1_capability_boundary:
    capabilityCounts.SUPPORTED_VARIANT === 44 && capabilityCounts.PARTIAL === 60 &&
    capabilityCounts.UNSUPPORTED === 60 && capabilityCounts.AMBIGUOUS === 1,
  metadata_on_every_cell: sampleCells.every(cell => Array.isArray(cell.surfaces) && cell.status && cell.source && cell.rule_id && Object.hasOwn(cell, "note")),
  jua_juua_distinct: window.MeanKieliMorphology.generateCell("jua", "finite|Present tense|mie").surfaces[0] !== window.MeanKieliMorphology.generateCell("juua", "finite|Present tense|mie").surfaces[0],
  saa_ambiguous: window.MeanKieliMorphology.resolveInput("saa").kind === "ambiguous_known",
  curly_saaa_known: window.MeanKieliMorphology.resolveInput("saa’a").kind === "known",
  ascii_saaa_visible_normalization: window.MeanKieliMorphology.resolveInput("saa'a").normalized_from === "saa'a",
  voia_not_alias: window.MeanKieliMorphology.resolveInput("voia").kind === "rejected_alias",
  voija_known: window.MeanKieliMorphology.resolveInput("voija").kind === "known",
  voija_strict_samples:
    window.MeanKieliMorphology.generateCell("voija", "finite|Present tense|mie").surfaces.includes("voin") &&
    window.MeanKieliMorphology.generateCell("voija", "finite|Conditional mood|mie").surfaces.includes("voisin") &&
    window.MeanKieliMorphology.generateCell("voija", "nonfinite|1st infinitive|active").surfaces.includes("voi’a"),
  unknown_attempt: window.MeanKieliMorphology.generateCell("testata", "nonfinite|1st infinitive|active").status === "derived",
  unknown_heuristic_visible:
    window.MeanKieliMorphology.generateCell("tapahtua", "finite|Present tense|mie").status === "heuristic" &&
    window.MeanKieliMorphology.generateCell("tapahtua", "finite|Present tense|mie").surfaces.length === 1,
  unknown_class_ambiguity: window.MeanKieliMorphology.generateCell("testata", "finite|Present tense|mie").status === "ambiguous",
  gradation_regression:
    window.MeanKieliMorphology.generateCell("avata", "finite|Present tense|mie").surfaces.includes("avvaan") &&
    window.MeanKieliMorphology.generateCell("avata", "nonfinite|Past participle|active").surfaces.includes("avanu") &&
    !window.MeanKieliMorphology.generateCell("avata", "nonfinite|Past participle|active").surfaces.includes("apannu"),
  h_position_variants: window.MeanKieliMorphology.generateCell("antaa", "nonfinite|3rd infinitive illative|active").surfaces.length === 3,
  potential_explicitly_unsupported: window.MeanKieliMorphology.generateCell("antaa", "finite|Potential tense|mie").status === "unsupported"
};

const summary = { ...totals, diff_classification: diff, smoke };
if (process.argv.includes("--write")) {
  const fields = Object.keys(output[0]);
  const escape = value => String(value ?? "").replaceAll("\t", " ").replaceAll("\n", " ");
  fs.writeFileSync(path.join(root, "phase2_conjugator_vs_meanbot.tsv"), [fields.join("\t"), ...output.map(row => fields.map(field => escape(row[field])).join("\t"))].join("\n") + "\n");
  fs.writeFileSync(path.join(root, "docs/phase2_regression_summary.json"), JSON.stringify(summary, null, 2) + "\n");
}
console.log(JSON.stringify(summary, null, 2));
if (totals.strict_fail || totals.status_fail || totals.strict_roundtrip_evidence_fail || Object.values(smoke).includes(false)) process.exitCode = 1;
