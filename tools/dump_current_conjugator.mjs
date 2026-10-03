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

function display(result) {
  return result.surfaces.length ? result.surfaces.join(" / ") : "—";
}

const result = {};
for (const lemma of process.argv.slice(2)) {
  const paradigm = window.MeanKieliMorphology.conjugateParadigm(lemma);
  result[lemma] = {
    resolution: paradigm.resolution,
    finite: paradigm.finite.map(row => ({
      section: row.section,
      forms: row.forms.map(display),
      passive: display(row.passive),
      metadata: [...row.forms, row.passive]
    })),
    nonfinite: paradigm.nonfinite.map(row => ({
      form: row.form,
      active: display(row.active),
      passive: display(row.passive),
      metadata: { active: row.active, passive: row.passive }
    }))
  };
}

process.stdout.write(JSON.stringify(result));
