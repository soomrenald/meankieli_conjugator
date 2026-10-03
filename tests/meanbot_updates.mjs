#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
globalThis.window = globalThis;
for (const file of ["grammar_rules.js", "validation_metadata.js", "lexicon.js", "meanbot_update_data.js", "meanbot_updates.js", "past_example_data.js", "past_examples.js", "morphology.js", "render.js"]) {
  vm.runInThisContext(fs.readFileSync(path.join(root, file), "utf8"), { filename: file });
}
const M = window.MeanKieliMorphology;
const D = window.MeanKieliUpdateData;
const R = window.MeanKieliRender;
const get = (lemma, section, slot) => M.generateCell(lemma, `finite|${section}|${slot}`);
const slots = ["mie", "sie", "se/hään", "met", "tet", "net/het"];
const auxiliaries = ["en", "et", "ei", "emmä", "että", "ei"];
const keys = Object.keys(D.records);
assert.equal(keys.length, 39);
assert.deepEqual(new Set(keys), new Set(Object.keys(window.MeanKieliLexicon.entries)));
let composedCells = 0;
for (const lemma of keys) {
  for (let index = 0; index < slots.length; index++) {
    const cell = get(lemma, "Conditional negative tense", slots[index]);
    assert.equal(cell.status, "derived");
    assert.deepEqual(cell.surfaces, D.records[lemma].conditional[1].map(value => `${auxiliaries[index]} ${value}`));
    composedCells++;
  }
  for (const [section, family] of [["Present negative tense", "passive_present"], ["Past negative tense", "passive_past"]]) {
    const cell = get(lemma, section, "passive");
    assert.equal(cell.status, "derived");
    assert.deepEqual(cell.surfaces, D.records[lemma][family][1].map(value => `ei ${value}`));
    composedCells++;
  }
  const blocked = get(lemma, "Conditional negative tense", "passive");
  assert.equal(blocked.status, "unsupported");
  assert.deepEqual(blocked.surfaces, []);
  assert.equal(blocked.rule_id, "P21C.PASS.COND.NEG");
  for (const slot of slots) {
    const potential = get(lemma, "Potential tense", slot);
    if (lemma === "olla" && slot === "se/hään") {
      assert.deepEqual(potential.surfaces, ["lienee"]);
      assert.equal(potential.status, "verified");
      assert.equal(potential.surface_evidence[0].evidence_level, "exact-roundtrip");
    } else {
      assert.equal(potential.status, "unsupported");
      assert.deepEqual(potential.surfaces, []);
    }
  }
  for (const section of ["Potential negative tense", "Potential perfect tense", "Potential perfect negative tense"]) {
    for (const slot of [...slots, "passive"]) assert.equal(get(lemma, section, slot).status, "unsupported");
  }
}
assert.equal(composedCells, 312);

// Independent concrete outcomes catch wrong feature selection, endings and variants.
assert.deepEqual(get("antaa", "Conditional negative tense", "mie").surfaces, ["en antais"]);
assert.deepEqual(get("tehä", "Conditional negative tense", "met").surfaces, ["emmä tekis"]);
assert.deepEqual(get("nähä", "Conditional negative tense", "sie").surfaces, ["et näkis"]);
assert.deepEqual(get("käyä", "Past negative tense", "passive").surfaces, ["ei käyty"]);
assert.deepEqual(get("juosta", "Present negative tense", "passive").surfaces, ["ei juosta"]);
assert.deepEqual(get("olla", "Past negative tense", "passive").surfaces, ["ei oltu"]);
assert.deepEqual(get("paeta", "Conditional negative tense", "mie").surfaces, ["en paenis", "en pakenis"]);
assert.deepEqual(get("paeta", "Past negative tense", "passive").surfaces, ["ei paettu", "ei pakettu"]);
assert.deepEqual(get("tehä", "Present negative tense", "passive").surfaces, ["ei tehhä", "ei tehjä", "ei tehä"]);
assert.equal(get("saa", "Conditional negative tense", "mie").status, "ambiguous");
assert.equal(M.resolveInput("voia").kind, "rejected_alias");
assert.equal(get("tapahtua", "Present tense", "mie").status, "heuristic");
assert.equal(get("tapahtua", "Conditional negative tense", "mie").surfaces.length, 0);
assert.ok(M.generateCell("avata", "nonfinite|Past participle|active").surfaces.includes("avanu"));
assert.deepEqual(get("jua", "Past negative tense", "met").surfaces, ["emmä juohneet", "emmä juonheet"]);

let evidenceSurfaces = 0;
for (const lemma of keys) {
  const cells = [...slots.map(slot => get(lemma, "Conditional negative tense", slot)), get(lemma, "Present negative tense", "passive"), get(lemma, "Past negative tense", "passive")];
  for (const cell of cells) {
    assert.equal(cell.surface_evidence.length, cell.surfaces.length);
    assert.ok(Object.isFrozen(cell.surface_evidence));
    for (const evidence of cell.surface_evidence) {
      assert.ok(Object.isFrozen(evidence));
      assert.equal(evidence.evidence_level, "main-component-roundtrip");
      assert.ok(cell.surfaces.includes(evidence.surface));
      assert.match(evidence.source_locator, /^phase21f\/VERB_RUNTIME_RESULTS.tsv:\d+$/);
      assert.match(evidence.source_sha256, /^[a-f0-9]{64}$/);
      assert.ok(evidence.analysis.startsWith(`${lemma}+V+`));
      assert.ok(R.renderCell(cell, "reference").includes(evidence.source_locator));
      evidenceSurfaces++;
    }
  }
}

const sourceIndex = process.argv.indexOf("--source");
if (sourceIndex >= 0) {
  const bytes = fs.readFileSync(process.argv[sourceIndex + 1]);
  assert.equal(crypto.createHash("sha256").update(bytes).digest("hex"), D.source_sha256);
  const lines = bytes.toString("utf8").trimEnd().split("\n");
  const header = lines[0].split("\t");
  const fields = ["conditional", "passive_present", "passive_past"];
  for (const [lemma, entry] of Object.entries(D.records)) {
    for (const family of fields) {
      const [line, values] = entry[family];
      const row = Object.fromEntries(lines[line - 1].split("\t").map((value, index) => [header[index], value]));
      assert.equal(row.lemma, lemma);
      assert.deepEqual(values, row.roundtrip_surfaces.split(" | "));
      assert.ok(values.every(value => row.surfaces.split(" | ").includes(value)));
    }
  }
}
console.log(JSON.stringify({ passed: true, lemmas: keys.length, derived_negative_cells: composedCells, per_surface_evidence_entries: evidenceSurfaces, exact_potential_cells: 1, blocked_passive_conditional_cells: 39, original_audit_crosscheck: sourceIndex >= 0 }, null, 2));
