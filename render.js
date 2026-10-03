(function (global) {
  "use strict";

  const G = global.MeanKieliGrammar;
  const L = global.MeanKieliLexicon;

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function dictionaryCandidates(value) {
    const normalized = global.MeanKieliMorphology.normalizeInput(value).normalized;
    const ascii = normalized.replace(/’/g, "'");
    const candidates = new Set();
    for (const form of [normalized, ascii]) {
      candidates.add(form);
      candidates.add(form.replace(/[’']/g, ""));
      if (/[’'][aä]$/.test(form)) candidates.add(form.slice(0, -2));
      if (/[aä]$/.test(form)) candidates.add(form.slice(0, -1));
      if (form.endsWith("da")) candidates.add(form.slice(0, -2) + "a");
      if (form.endsWith("dä")) candidates.add(form.slice(0, -2) + "ä");
    }
    return [...candidates].filter(Boolean);
  }

  function lookupDictionary(value) {
    const dictionary = global.MEANKIELI_DICTIONARY || {};
    const aliases = global.MEANKIELI_DICTIONARY_ALIASES || {};
    for (const candidate of dictionaryCandidates(value)) {
      if (dictionary[candidate]) return { found: true, key: candidate, entry: dictionary[candidate], via: "exact" };
    }
    for (const candidate of dictionaryCandidates(value)) {
      const alias = aliases[candidate];
      if (alias && dictionary[alias]) return { found: true, key: alias, entry: dictionary[alias], via: `variant of ${alias}` };
    }
    return { found: false };
  }

  function renderDictionary(hit) {
    if (!hit.found) return `<div class="status warn"><strong>Dictionary:</strong> no exact dictionary entry found. Morphology is still resolved independently.</div>`;
    const entry = hit.entry;
    const pos = (entry.pos || []).join(", ") || "—";
    const translations = (entry.translations || []).join("; ") || "No Swedish translation tag found.";
    const variants = entry.variants?.length ? `<br><strong>Variants:</strong> ${escapeHtml(entry.variants.join(", "))}` : "";
    const mismatch = entry.pos?.includes("v") ? "" : `<div class="status warn"><strong>Warning:</strong> dictionary entry is not marked as a verb.</div>`;
    return `<div class="status ok"><strong>Dictionary:</strong> ${escapeHtml(entry.headword)} ${hit.via !== "exact" ? `(${escapeHtml(hit.via)})` : ""}<br><strong>Part of speech:</strong> ${escapeHtml(pos)}<br><strong>Swedish:</strong> ${escapeHtml(translations)}${variants}</div>${mismatch}`;
  }

  const statusLabels = Object.freeze({
    verified: "Verified",
    supported_variant: "Verified variants",
    derived: "Derived",
    documented: "Document example",
    partial: "Partial",
    ambiguous: "Ambiguous",
    heuristic: "Heuristic",
    unsupported: "Unsupported"
  });

  function renderCell(result, mode) {
    const value = result.surfaces.join(" / ") || "Unavailable";
    const surfaceEvidence = (result.surface_evidence || []).map(item =>
      `${item.surface}: ${item.evidence_level}; ${item.source_locator}; ${item.grammatical_source}`
    ).join(" / ");
    const title = [result.note, `Rule: ${result.rule_id}`, `Source: ${result.source}`, surfaceEvidence].filter(Boolean).join(" — ");
    const evidence = mode === "reference" ? `<span class="cell-evidence">${escapeHtml(title)}</span>` : "";
    return `<span class="cell-result" tabindex="0" title="${escapeHtml(title)}"><span class="cell-forms">${escapeHtml(value)}</span><span class="cell-badge badge-${escapeHtml(result.status)}">${escapeHtml(statusLabels[result.status] || result.status)}</span>${evidence}</span>`;
  }

  function renderResolution(resolution) {
    let classLabel = "No safe class";
    let confidence = "unsupported";
    if (resolution.entry) {
      classLabel = L.labels[resolution.entry.class_id] || resolution.entry.class_id;
      confidence = resolution.kind === "ambiguous_known" ? "lexically ambiguous" : "known Meanbot class";
    } else if (resolution.documented_past) {
      classLabel = "Documented examples / bounded past rules";
      confidence = "document examples; extrapolation unverified";
    } else if (resolution.candidates?.length) {
      classLabel = resolution.candidates.map(candidate => candidate.class_id).join(" / ");
      confidence = resolution.candidates.length > 1 ? "ambiguous surface classes" : "unverified surface class";
    }
    const normalized = resolution.normalized_from ? `<div><span>Normalized input</span><strong>${escapeHtml(resolution.lemma)}</strong></div>` : "";
    return `<div class="meta-grid">
      <div><span>Resolution</span><strong>${escapeHtml(confidence)}</strong></div>
      <div><span>Morphology class</span><strong>${escapeHtml(classLabel)}</strong></div>
      <div><span>Lemma</span><strong>${escapeHtml(resolution.lemma || resolution.normalized || "—")}</strong></div>
      <div><span>Candidate count</span><strong>${escapeHtml(resolution.candidates?.length || 0)}</strong></div>
      ${normalized}
    </div>
    <details class="notes" open><summary>Morphology evidence</summary><p>${escapeHtml(resolution.note || "Class and stems are recorded from the Phase 1 Meanbot audit.")}</p></details>`;
  }

  function renderFiniteTable(rows, mode) {
    const heads = ["Form", ...G.PRONOUNS.map(person => person.label), "passive", "evidence"];
    const body = rows.map(row => {
      const cells = [
        `<td>${escapeHtml(row.section)}</td>`,
        ...row.forms.map(value => `<td class="cell-status-${escapeHtml(value.status)}">${renderCell(value, mode)}</td>`),
        `<td class="cell-status-${escapeHtml(row.passive.status)}">${renderCell(row.passive, mode)}</td>`,
        `<td class="evidence-note">Hover/focus a cell for rule and source.</td>`
      ];
      return `<tr>${cells.join("")}</tr>`;
    }).join("");
    return `<div class="table-wrap"><table><thead><tr>${heads.map(head => `<th>${escapeHtml(head)}</th>`).join("")}</tr></thead><tbody>${body}</tbody></table></div>`;
  }

  function renderNonfiniteTable(rows, mode) {
    const body = rows.map(row => `<tr><td>${escapeHtml(row.form)}</td><td class="cell-status-${escapeHtml(row.active.status)}">${renderCell(row.active, mode)}</td><td class="cell-status-${escapeHtml(row.passive.status)}">${renderCell(row.passive, mode)}</td><td class="evidence-note">Hover/focus a cell for rule and source.</td></tr>`).join("");
    return `<div class="table-wrap small"><table><thead><tr><th>Form</th><th>Active</th><th>Passive</th><th>Evidence</th></tr></thead><tbody>${body}</tbody></table></div>`;
  }

  function renderOutput(paradigm, dictionaryHit, mode) {
    return `<section class="card">${renderDictionary(dictionaryHit)}${renderResolution(paradigm.resolution)}</section>
      <section class="card"><h2>Finite forms</h2>${renderFiniteTable(paradigm.finite, mode)}</section>
      <section class="card"><h2>Infinitives and participles</h2>${renderNonfiniteTable(paradigm.nonfinite, mode)}</section>`;
  }

  global.MeanKieliRender = Object.freeze({ escapeHtml, lookupDictionary, renderCell, renderFiniteTable, renderNonfiniteTable, renderOutput });
})(window);
