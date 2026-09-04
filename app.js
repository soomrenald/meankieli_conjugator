(function (global) {
  "use strict";

  const M = global.MeanKieliMorphology;
  const R = global.MeanKieliRender;

  function currentMode() {
    return document.querySelector('input[name="displayMode"]:checked')?.value || "strict";
  }

  function bindSamples() {
    document.querySelectorAll("[data-sample]").forEach(button => {
      if (button.dataset.bound) return;
      button.dataset.bound = "true";
      button.addEventListener("click", () => {
        document.getElementById("verbInput").value = button.dataset.sample;
        conjugate();
      });
    });
  }

  function conjugate() {
    const input = document.getElementById("verbInput").value;
    const output = document.getElementById("output");
    if (!M.normalizeInput(input).normalized) {
      output.innerHTML = `<div class="empty">Enter a Meänkieli infinitive, e.g. <button class="linklike" data-sample="antaa">antaa</button>, <button class="linklike" data-sample="jua">jua</button>, or <button class="linklike" data-sample="huomata">huomata</button>.</div>`;
      bindSamples();
      return;
    }
    const paradigm = M.conjugateParadigm(input);
    output.innerHTML = R.renderOutput(paradigm, R.lookupDictionary(input), currentMode());
  }

  global.addEventListener("DOMContentLoaded", () => {
    document.getElementById("conjugateBtn").addEventListener("click", conjugate);
    document.getElementById("verbInput").addEventListener("keydown", event => {
      if (event.key === "Enter") conjugate();
    });
    document.querySelectorAll('input[name="displayMode"]').forEach(input => input.addEventListener("change", conjugate));
    bindSamples();
    conjugate();
  });

  global.__conjugator = Object.freeze({
    normalizeInput: M.normalizeInput,
    resolveInput: M.resolveInput,
    generateCell: M.generateCell,
    buildFiniteRows: M.buildFiniteRows,
    buildNonfiniteRows: M.buildNonfiniteRows,
    conjugateParadigm: M.conjugateParadigm,
    internals: M.internals,
    lookupDictionary: R.lookupDictionary,
    conjugate
  });
})(window);
