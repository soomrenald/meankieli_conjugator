#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
globalThis.window = globalThis;
for (const file of ["grammar_rules.js", "validation_metadata.js", "lexicon.js", "meanbot_update_data.js", "meanbot_updates.js", "past_example_data.js", "past_examples.js", "morphology.js", "render.js"]) {
  vm.runInThisContext(fs.readFileSync(path.join(root, file), "utf8"), { filename: file });
}

const G = window.MeanKieliGrammar;
const M = window.MeanKieliMorphology;
const R = window.MeanKieliRender;
const heuristic = M.generateCell("tapahtua", "finite|Present tense|mie");
const emptyHeuristic = M.generateCell("tapahtua", "finite|Past tense|mie");
const partial = M.generateCell("antaa", "finite|Present perfect tense|mie");
const unsupported = M.generateCell("antaa", "finite|Potential tense|mie");
const ambiguous = M.generateCell("testata", "finite|Present tense|mie");
const snapshots = JSON.stringify([heuristic, emptyHeuristic, partial, unsupported, ambiguous]);
const forms = html => html.match(/<span class="cell-forms">(.*?)<\/span>/)[1];

for (const mode of ["strict", "reference"]) {
  const candidate = R.renderCell(heuristic, mode);
  assert.equal(forms(candidate), "tapahtun");
  assert.match(candidate, /class="cell-badge badge-heuristic">Heuristic<\/span>/);
  assert.equal(forms(R.renderCell(partial, mode)), partial.surfaces.join(" / "));
  assert.match(R.renderCell(partial, mode), /badge-partial/);
  for (const cell of [emptyHeuristic, unsupported, ambiguous]) {
    const html = R.renderCell(cell, mode);
    assert.equal(forms(html), "Unavailable");
    assert.ok(html.includes(`badge-${cell.status}`));
    assert.ok(html.includes("Rule:") && html.includes("Source:"));
  }
  const escaped = R.renderCell(G.result(["<script>alert(1)</script>", "other"], "heuristic", "<rule>", "<source>", "<note>"), mode);
  assert.equal(forms(escaped), "&lt;script&gt;alert(1)&lt;/script&gt; / other");
  assert.ok(!escaped.includes("<script>") && !escaped.includes("<note>"));
  assert.equal(candidate.includes('class="cell-evidence"'), mode === "reference");
}
assert.equal(JSON.stringify([heuristic, emptyHeuristic, partial, unsupported, ambiguous]), snapshots);
console.log("Rendering regression: PASS (both modes, separate badges, unavailable cells, escaping, unchanged evidence).");
