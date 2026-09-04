#!/usr/bin/env node

import fs from "node:fs";
import vm from "node:vm";

const appPath = new URL("../app.js", import.meta.url);
const source = fs.readFileSync(appPath, "utf8");

globalThis.window = {
  MEANKIELI_DICTIONARY: {},
  MEANKIELI_DICTIONARY_ALIASES: {},
  addEventListener() {}
};

vm.runInThisContext(source, { filename: appPath.pathname });

const verbs = process.argv.slice(2);
const result = {};
for (const lemma of verbs) {
  const derived = window.__conjugator.derive(lemma);
  result[lemma] = {
    finite: window.__conjugator.formRows(derived),
    nonfinite: window.__conjugator.infinitiveRows(derived)
  };
}

process.stdout.write(JSON.stringify(result));
