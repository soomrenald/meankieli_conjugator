#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
globalThis.window = globalThis;
for (const file of ["dictionary.js", "grammar_rules.js", "validation_metadata.js", "lexicon.js", "meanbot_update_data.js", "meanbot_updates.js", "past_example_data.js", "past_examples.js", "morphology.js", "render.js"]) vm.runInThisContext(fs.readFileSync(path.join(root, file), "utf8"), { filename: file });
const M = window.MeanKieliMorphology;
const D = window.MeanKieliPastExampleData;
const get = (lemma, slot) => M.generateCell(lemma, `finite|Past tense|${slot}`);
const accepted = new Set(["direct", "visible-variant", "variant-specific"]);
assert.equal(D.rows.length, 128);
assert.equal(new Set(D.rows.map(row => row.id)).size, 128);
const counts = {}, conflicts = [], audit = [], newCells = new Set();
for (const row of D.rows) {
  assert.ok(Object.isFrozen(row));
  assert.ok(row.surface && row.lemma && row.disposition);
  const key = row.kind === "past" ? `finite|Past tense|${row.slot}` : row.slot === "pl" ? "finite|Present perfect tense|met" : `nonfinite|Past participle|${row.slot === "passive" ? "passive" : "active"}`;
  const cell = M.generateCell(row.lemma, key);
  let category = row.disposition;
  if (accepted.has(row.disposition)) {
    const match = cell.surfaces.some(surface => surface === row.surface || surface.endsWith(` ${row.surface}`));
    if (window.MeanKieliLexicon.entries[row.lemma]) {
      category = match ? "existing-agreement" : "audited-conflict";
      assert.ok(["verified", "supported_variant", "partial"].includes(cell.status));
      if (!match) {
        conflicts.push({ id: row.id, lemma: row.lemma, document: row.surface, retained: cell.surfaces });
        assert.ok(cell.note.includes(row.surface), `${row.id}: conflict hidden`);
      }
    } else {
      category = "new-document-cell";
      assert.ok(match, `${row.id} ${row.lemma}: documented cell missing`);
      assert.equal(cell.status, "documented");
      assert.ok(cell.surface_evidence.some(item => item.source_locator.endsWith(`#${row.id}`)));
      assert.ok(!cell.surface_evidence.some(item => item.evidence_level === "exact-roundtrip"));
      newCells.add(`${row.lemma}|${key}`);
    }
  } else {
    assert.ok(["lexical-substitution", "ambiguous-lemma", "unresolved-stem"].includes(row.disposition));
    assert.ok(!cell.surface_evidence.some(item => item.source_locator?.endsWith(`#${row.id}`)));
  }
  counts[category] = (counts[category] || 0) + 1;
  audit.push({ id: row.id, lemma: row.lemma, kind: row.kind, slot: row.slot, document: row.surface, classification: category, result: cell.surfaces.join(" / "), status: cell.status });
}
assert.deepEqual(counts, { "existing-agreement": 52, "audited-conflict": 14, "new-document-cell": 50, "lexical-substitution": 6, "ambiguous-lemma": 3, "unresolved-stem": 3 });

// Surface -t alone does not identify person: source subjects license Pl3.
for (const id of ["T19.R2", "T19.R7", "T39.R5"]) assert.equal(D.rows.find(row => row.id === id).slot, "net/het");
assert.equal(D.rows.find(row => row.id === "T23.R4").slot, "pl");
assert.equal(D.rows.find(row => row.id === "T36.R6").slot, "passive");
assert.equal(D.rows.find(row => row.id === "T36.R1").lemma, "tarttea");

// Literal source examples and independent held-out regular candidates.
for (const [lemma, slot, surface, status] of [
  ["rakastaa", "se/hään", "rakasti", "documented"], ["rakastaa", "mie", "rakastin", "heuristic"],
  ["pölätä", "se/hään", "pölkäsi", "documented"], ["pölätä", "tet", "pölkäsittä", "heuristic"],
  ["auttaa", "met", "autoima", "documented"], ["auttaa", "mie", "autoin", "heuristic"],
  ["tulkita", "mie", "tulkittin", "documented"], ["lyä", "mie", "löin", "heuristic"],
  ["jää'ä", "met", "jäimä", "documented"], ["haista", "mie", "haisin", "heuristic"],
  ["haista", "se/hään", "haisi", "heuristic"], ["nuolla", "mie", "nuolin", "heuristic"],
  ["nuolla", "tet", "nuolitta", "heuristic"]]) {
  assert.deepEqual(get(lemma, slot).surfaces, [surface]);
  assert.equal(get(lemma, slot).status, status);
}
for (const lemma of ["auttaa", "tulkita"]) {
  assert.deepEqual(get(lemma, "se/hään").surfaces, []);
  assert.equal(get(lemma, "se/hään").status, "ambiguous");
}
for (const lemma of ["haista", "nuolla"]) for (const person of MeanKieliGrammar.PRONOUNS) {
  const cell = get(lemma, person.slot);
  assert.equal(cell.status, "heuristic");
  assert.ok(cell.surface_evidence.every(item => item.evidence_level === "document-pattern-extrapolation"));
}
for (const lemma of ["zzsta", "zzlla", "ajatella", "surra", "juoksea", "nuoreta", "voia"]) assert.deepEqual(get(lemma, "se/hään").surfaces, [], `Unsafe rule spread: ${lemma}`);
assert.equal(M.resolveInput("voia").kind, "rejected_alias");
assert.equal(M.resolveInput("saa").kind, "ambiguous_known");
assert.equal(M.resolveInput("tehjä").lemma, "tehä");
assert.equal(M.resolveInput("tehjä").normalized_from, "tehjä");
assert.deepEqual(get("tehjä", "mie").surfaces, ["tehin"]);
assert.deepEqual(get("tarvita", "mie").surfaces, ["tarvittin"]);
assert.deepEqual(get("tarttea", "mie").surfaces, ["tarttin"]);
for (const [lemma, retained, other] of [["vanheta", "vanheni", "vanhentu"], ["kylmetä", "kylmeni", "kylmisty"], ["lyhetä", "lyheni", "lyhenty"], ["vaaleta", "vaaleni", "vaalentu"]]) {
  const cell = get(lemma, "se/hään");
  assert.deepEqual(cell.surfaces, [retained]);
  assert.equal(cell.status, "verified");
  assert.ok(cell.note.includes(other));
  assert.ok(!cell.surface_evidence.some(item => item.surface === other));
}
assert.deepEqual(get("aatela", "mie").surfaces, ["aattelin"]);
assert.ok(get("aatela", "mie").note.includes("aatelin"));
const participle = M.generateCell("rakastaa", "nonfinite|Past participle|active");
assert.deepEqual(participle.surfaces, ["rakastanu"]);
assert.equal(participle.status, "documented");
const compound = M.generateCell("rakastaa", "finite|Past perfect / pluskvamperfektum|mie");
assert.deepEqual(compound.surfaces, ["olin rakastanu"]);
assert.equal(compound.status, "derived");
assert.equal(compound.surface_evidence[0].evidence_level, "document-component-composition");
assert.deepEqual(M.generateCell("rakastaa", "finite|Past negative tense|mie").surfaces, ["en rakastanu"]);
assert.deepEqual(M.generateCell("rakastaa", "finite|Present perfect tense|met").surfaces, []);
assert.ok(MeanKieliRender.renderCell(participle, "reference").includes("Document example"));
assert.ok(MeanKieliRender.renderCell(get("rakastaa", "mie"), "reference").includes("Heuristic"));

const sourceIndex = process.argv.indexOf("--source");
if (sourceIndex >= 0) {
  const source = process.argv[sourceIndex + 1];
  assert.equal(createHash("sha256").update(fs.readFileSync(source)).digest("hex"), D.source_sha256);
  const facts = JSON.parse(execFileSync(process.env.PYTHON || "python3", ["-c", `
import sys,json,zipfile,xml.etree.ElementTree as E
n={'w':'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
b=E.fromstring(zipfile.ZipFile(sys.argv[1]).read('word/document.xml')).find('w:body',n)
out={}
for i,x in enumerate(b):
 if x.tag.endswith('}tbl'):
  for j,r in enumerate(x.findall('w:tr',n)[1:],1):
   out[f'T{i}.R{j}']=[''.join(t.text or '' for t in c.findall('.//w:t',n)) for c in r.findall('w:tc',n)]
 elif i==33:out['P33']=['aatela',''.join(t.text or '' for t in x.findall('.//w:t',n))]
print(json.dumps(out,ensure_ascii=False))
`, source], { encoding: "utf8" }));
  for (const row of D.rows) {
    assert.ok(facts[row.id], row.id);
    assert.ok(facts[row.id][0].includes(row.source_lemma), `${row.id} lemma`);
    assert.ok(facts[row.id][1].includes(row.surface), `${row.id} surface`);
  }
}
const summary = { passed: true, classified_source_rows: D.rows.length, distinct_new_document_cells: newCells.size, counts, conflicts, source_docx_crosscheck: sourceIndex >= 0 };
if (process.argv.includes("--write")) {
  const header = Object.keys(audit[0]);
  fs.writeFileSync(path.join(root, "docs/past_example_source_audit.tsv"), [header.join("\t"), ...audit.map(row => header.map(key => row[key]).join("\t"))].join("\n") + "\n");
  fs.writeFileSync(path.join(root, "docs/past_example_validation.json"), JSON.stringify(summary, null, 2) + "\n");
}
console.log(JSON.stringify(summary, null, 2));
