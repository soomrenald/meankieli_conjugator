(function (global) {
  "use strict";

  const G = global.MeanKieliGrammar;
  const V = global.MeanKieliValidation;
  const L = global.MeanKieliLexicon;
  const S = G.STATUSES;

  function normalizeInput(value) {
    const raw = String(value || "").trim();
    const normalized = raw.toLowerCase().replace(/[\u2018\u2019`\u00b4']/g, "’").replace(/\s+/g, " ");
    return { raw, normalized };
  }

  function front(word) {
    return /[äöy]/i.test(word) && !/[aou]/i.test(word);
  }
  function A(word) { return front(word) ? "ä" : "a"; }
  function U(word) { return front(word) ? "y" : "u"; }
  function VA(word) { return front(word) ? "vä" : "va"; }
  function MA(word) { return front(word) ? "mä" : "ma"; }
  function SSA(word) { return front(word) ? "ssä" : "ssa"; }
  function STA(word) { return front(word) ? "stä" : "sta"; }
  function LLA(word) { return front(word) ? "llä" : "lla"; }
  function TTA(word) { return front(word) ? "ttä" : "tta"; }
  function Haan(word) { return front(word) ? "hään" : "haan"; }
  function Thaan(word) { return front(word) ? "thään" : "thaan"; }
  function Khoon(word) { return front(word) ? "khöön" : "khoon"; }
  function Khoot(word) { return front(word) ? "khööt" : "khoot"; }
  function Kaa(word) { return front(word) ? "kää" : "kaa"; }
  function Khaa(word) { return front(word) ? "khää" : "khaa"; }
  function replaceFinalA(value, replacement) { return value.replace(/[aä]$/, replacement); }
  function stripFinalA(value) { return value.replace(/[aä]$/, ""); }
  function addPersonal(stem, slot, harmonyWord, doubleM = false) {
    if (slot === "mie") return stem + "n";
    if (slot === "sie") return stem + "t";
    if (slot === "met") return stem + (doubleM ? (front(harmonyWord) ? "mmä" : "mma") : MA(harmonyWord));
    if (slot === "tet") return stem + TTA(harmonyWord);
    return "";
  }
  function product(parts) {
    return parts.reduce((rows, choices) => rows.flatMap(row => choices.map(choice => [...row, choice])), [[]])
      .map(row => row.join(" "));
  }

  function inferUnknownCandidates(word) {
    const candidates = [];
    if (/[aä]$/.test(word)) candidates.push({ class_id: "unknown_a", stem: stripFinalA(word) });
    if (/[aäoöuüy]t[aä]$/.test(word)) candidates.push({ class_id: "unknown_ta", stem: word.slice(0, -2) });
    if (/(ll|nn|rr)[aä]$/.test(word) || /st[aä]$/.test(word)) candidates.push({ class_id: "unknown_consonant", stem: word.slice(0, -1) });
    if (/e[t][aä]$/.test(word)) candidates.push({ class_id: "unknown_eta", stem: word.slice(0, -2) });
    return candidates;
  }

  function resolveInput(value) {
    const input = normalizeInput(value);
    if (!input.normalized) return { ...input, kind: "empty", candidates: [] };
    if (input.normalized === "saa") {
      return {
        ...input,
        kind: "ambiguous_known",
        lemma: "saa’a",
        entry: L.entries["saa’a"],
        candidates: ["saa’a", "saaja"],
        note: "Surface saa is ambiguous between strict lemmas saa’a and saaja. The verb candidate is shown without discarding the noun analysis."
      };
    }
    if (input.normalized === "voia") {
      return {
        ...input,
        kind: "rejected_alias",
        candidates: ["voija"],
        note: "voia is not a strict infinitive lemma; it is not silently normalized to voija."
      };
    }
    const sourceAlias = global.MeanKieliPastExamples?.resolveAlias(input.normalized);
    if (sourceAlias) {
      return { ...input, kind: "known", lemma: sourceAlias, entry: L.entries[sourceAlias], candidates: [sourceAlias], normalized_from: input.raw,
        note: `Document infinitive variant ${input.normalized} is shown under audited lemma ${sourceAlias}. This normalization is explicit; spelling and lemma distinctions remain in the evidence.` };
    }
    const entry = L.entries[input.normalized];
    if (entry) {
      const visiblyNormalized = input.raw.toLowerCase() !== input.normalized;
      return {
        ...input,
        kind: "known",
        lemma: input.normalized,
        entry,
        candidates: [input.normalized],
        normalized_from: visiblyNormalized ? input.raw : "",
        note: [visiblyNormalized ? `Input punctuation normalized visibly to ${input.normalized}.` : "", global.MeanKieliPastExamples?.resolutionNote(input.normalized)].filter(Boolean).join(" ")
      };
    }
    const spellingVariant = global.MeanKieliPastExamples?.resolveDictionarySpelling(input.normalized);
    if (spellingVariant) {
      const candidates = inferUnknownCandidates(spellingVariant.lemma);
      return { ...input, kind: candidates.length > 1 ? "unknown_ambiguous" : "unknown",
        documented_past: true, lemma: spellingVariant.lemma, candidates,
        normalized_from: input.raw, dictionary_variant: spellingVariant,
        note: [spellingVariant.note, global.MeanKieliPastExamples.resolutionNote(spellingVariant.lemma)].join(" ") };
    }
    const candidates = inferUnknownCandidates(input.normalized);
    return {
      ...input,
      kind: candidates.length > 1 ? "unknown_ambiguous" : "unknown",
      documented_past: global.MeanKieliPastExamples?.hasExamples(input.normalized) || false,
      lemma: input.normalized,
      candidates,
      note: [candidates.length
        ? "Unknown lemma: only surface-safe class hypotheses are available."
        : "No safe Meanbot-derived infinitive class matches this input.", global.MeanKieliPastExamples?.resolutionNote(input.normalized)].filter(Boolean).join(" ")
    };
  }

  function strongStem(lemma) { return stripFinalA(lemma); }

  function presentStem(entry, lemma) {
    switch (entry.class_id) {
      case "a_vowel": case "a_vowel_odd": return [entry.weak];
      case "ata": return [entry.present];
      case "uta": return [entry.base + A(lemma)];
      case "contracted": case "contracted_kay": return [entry.present];
      case "long_vowel": return [entry.stem];
      case "tehda": return [entry.weak];
      case "consonant": return [entry.present];
      case "eta": return entry.present_roots;
      case "aatela": return ["aattele"];
      case "tarvita": return ["tarvitte"];
      case "tarttea": return ["tartte"];
      case "olla": return ["ole"];
      default: return [];
    }
  }

  function presentThird(entry, lemma) {
    switch (entry.class_id) {
      case "a_vowel": case "a_vowel_odd": return [lemma];
      case "ata": return [entry.present];
      case "uta": return [entry.base + A(lemma) + A(lemma)];
      case "contracted": return [entry.present, entry.present + "pi", entry.present + "pii"];
      case "contracted_kay": return ["käy", "käypi", "käypii"];
      case "long_vowel": return [entry.stem + entry.stem.slice(-1)];
      case "tehda": return [entry.finite.replace(/e$/, "") + "kee"];
      case "consonant": return [entry.third];
      case "eta": return entry.present_roots.map(stem => stem + "e");
      case "aatela": return ["aattelee"];
      case "tarvita": return ["tarvittee"];
      case "tarttea": return ["tarttee"];
      case "olla": return ["oon"];
      default: return [];
    }
  }

  function activePresentParticiple(entry, lemma) {
    return maBases(entry, lemma).map(stem => stem + VA(lemma));
  }

  function passivePresent(entry, lemma) {
    switch (entry.class_id) {
      case "a_vowel": case "a_vowel_odd": {
        const stem = replaceFinalA(entry.weak, "e");
        return [stem + Thaan(stem)];
      }
      case "ata": return [entry.base + Thaan(entry.base)];
      case "uta": return [entry.base + Thaan(entry.base)];
      case "contracted": return [entry.present + Haan(entry.present), entry.present + "t" + Haan(entry.present)];
      case "contracted_kay": return ["käyhään", "käythään"];
      case "long_vowel": return [entry.stem + Thaan(entry.stem)];
      case "tehda": return lemma === "tehä" ? ["tehhään", "tehthään"] : ["nähhään"];
      case "consonant": return entry.passive_roots.map(root => root + Haan(lemma));
      case "eta": return [entry.base + Thaan(entry.base)];
      case "aatela": return ["aattehlaan", "aattelhaan"];
      case "tarvita": return ["tarvithaan"];
      case "tarttea": return ["tarttethaan"];
      case "olla": return ["olhaan"];
      default: return [];
    }
  }

  function presentParadigm(entry, lemma) {
    const stems = presentStem(entry, lemma);
    const thirds = presentThird(entry, lemma);
    const passive = passivePresent(entry, lemma);
    const prc = activePresentParticiple(entry, lemma);
    const allPassiveInPl3 = ["contracted"].includes(entry.class_id);
    const pl3Thirds = entry.class_id === "eta" ? thirds : thirds.slice(0, 1);
    const pl3 = entry.class_id === "olla" ? ["oon"] : G.unique([...pl3Thirds, ...prc, ...(allPassiveInPl3 ? passive : passive.slice(0, 1))]);
    if (entry.prc_vva) {
      for (const surface of prc) pl3.push(surface.replace(/v([aä])$/, "vv$1"));
    }
    if (["uta", "aatela", "tarvita"].includes(entry.class_id)) {
      for (const surface of prc) pl3.push(surface.replace(/v([aä])$/, "vv$1"));
    }
    if (entry.class_id === "aatela") pl3.push(...passive.slice(1));
    const doubleM = ["a_vowel_odd", "uta", "aatela", "tarvita"].includes(entry.class_id);
    return {
      mie: stems.map(stem => addPersonal(stem, "mie", lemma, doubleM)),
      sie: stems.map(stem => addPersonal(stem, "sie", lemma, doubleM)),
      "se/hään": thirds,
      met: stems.map(stem => addPersonal(stem, "met", lemma, doubleM)),
      tet: stems.map(stem => addPersonal(stem, "tet", lemma, doubleM)),
      "net/het": G.unique(pl3),
      passive
    };
  }

  function pastStem(entry, lemma) {
    switch (entry.class_id) {
      case "a_vowel": case "a_vowel_odd": case "long_vowel": case "tehda": return [entry.past];
      case "ata": return [entry.finite + "si"];
      case "uta": return [entry.base + "si"];
      case "contracted": case "contracted_kay": return [entry.past];
      case "consonant": return [entry.core + "i"];
      case "eta": return entry.present_roots.map(stem => stem.replace(/e$/, "i"));
      case "aatela": return ["aatteli"];
      case "tarvita": return ["tarvitti"];
      case "tarttea": return ["tartti"];
      case "olla": return ["oli"];
      default: return [];
    }
  }

  function pastThird(entry, lemma) {
    if (entry.past3) return entry.past3;
    switch (entry.class_id) {
      case "ata": return [entry.finite + "s", entry.finite + "si"];
      case "uta": return [entry.base + "s", entry.base + "si"];
      case "contracted": case "contracted_kay": return [entry.past];
      case "consonant": return [entry.core + "i"];
      case "eta": return entry.present_roots.map(stem => stem.replace(/e$/, "i"));
      case "aatela": return ["aatteli"];
      case "tarvita": return ["tarvitti"];
      case "tarttea": return ["tartti"];
      case "olla": return ["oli"];
      default: return pastStem(entry, lemma);
    }
  }

  function passivePast(entry, lemma) {
    switch (entry.class_id) {
      case "a_vowel": case "a_vowel_odd": return [replaceFinalA(entry.weak, "e") + "thiin"];
      case "ata": return [entry.base + "thiin"];
      case "uta": return [entry.base + "thiin"];
      case "contracted": case "contracted_kay": return [entry.present + "thiin"];
      case "long_vowel": return [entry.stem + "thiin"];
      case "tehda": return [lemma === "tehä" ? "tehthiin" : "nähthiin"];
      case "consonant": return [entry.passive_past + "hiin"];
      case "eta": return [entry.base + "thiin"];
      case "aatela": return ["aattelthiin"];
      case "tarvita": return ["tarvithiin"];
      case "tarttea": return ["tarttethiin"];
      case "olla": return ["olthiin"];
      default: return [];
    }
  }

  function pastParadigm(entry, lemma) {
    const stems = pastStem(entry, lemma);
    const passive = passivePast(entry, lemma);
    const third = pastThird(entry, lemma);
    let pl3 = G.unique([...stems.map(stem => stem + "t"), ...passive]);
    if (lemma === "juosta") pl3 = ["juoksit", "juosthaan"];
    if (lemma === "olla") pl3 = ["oli", "olit", "olthiin"];
    const doubleM = ["a_vowel_odd", "ata", "uta", "aatela", "tarvita"].includes(entry.class_id);
    return {
      mie: stems.map(stem => stem + "n"),
      sie: stems.map(stem => stem + "t"),
      "se/hään": third,
      met: stems.map(stem => addPersonal(stem, "met", lemma, doubleM)),
      tet: stems.map(stem => addPersonal(stem, "tet", lemma, doubleM)),
      "net/het": pl3,
      passive
    };
  }

  function conditionalBase(entry, lemma) {
    switch (entry.class_id) {
      case "a_vowel": case "a_vowel_odd": return [strongStem(lemma) + "is"];
      case "ata": return [entry.finite + "is"];
      case "uta": return [entry.base + A(lemma) + "is"];
      case "contracted": return [entry.cond.replace(/i$/, "") + "is"];
      case "contracted_kay": return ["kävis"];
      case "long_vowel": return ["juis"];
      case "tehda": return [entry.finite.replace(/e$/, "") + "is"];
      case "consonant": return [entry.core + "is"];
      case "eta": return entry.present_roots.map(stem => stem.replace(/e$/, "is"));
      case "aatela": return ["aattelis"];
      case "tarvita": return ["tarvittis"];
      case "tarttea": return ["tarttis"];
      case "olla": return ["olis"];
      default: return [];
    }
  }

  function conditionalParadigm(entry, lemma) {
    const bases = conditionalBase(entry, lemma);
    const singleM = ["a_vowel_odd", "uta", "contracted", "aatela", "tarvita"].includes(entry.class_id);
    const allowVva = ["a_vowel", "ata", "long_vowel", "contracted_kay", "tehda", "consonant", "tarttea", "eta"].includes(entry.class_id);
    const pl3 = [];
    for (const base of bases) {
      pl3.push(base + "it", base + (front(lemma) ? "ivä" : "iva"));
      if (allowVva) pl3.push(base + (front(lemma) ? "ivvä" : "ivva"));
    }
    return {
      mie: bases.map(base => base + "in"),
      sie: bases.map(base => base + "it"),
      "se/hään": bases,
      met: bases.map(base => base + (singleM ? (front(lemma) ? "imä" : "ima") : (front(lemma) ? "immä" : "imma"))),
      tet: bases.map(base => base + (front(lemma) ? "ittä" : "itta")),
      "net/het": G.unique(pl3),
      passive: passiveConditional(entry, lemma)
    };
  }

  function passiveConditional(entry, lemma) {
    switch (entry.class_id) {
      case "a_vowel": case "a_vowel_odd": return [replaceFinalA(entry.weak, "e") + (front(lemma) ? "ttäis" : "ttais")];
      case "ata": return [entry.base + (front(lemma) ? "ttäis" : "ttais")];
      case "uta": return [entry.base + (front(lemma) ? "ttäis" : "ttais")];
      case "contracted": return [conditionalBase(entry, lemma)[0]];
      case "contracted_kay": return ["käytäis", "käytäs"];
      case "long_vowel": return [entry.stem + "ttais"];
      case "tehda": return lemma === "tehä" ? ["tehtäs"] : ["nähtäis"];
      case "consonant": return conditionalBase(entry, lemma);
      case "eta": return entry.present_roots.map(stem => stem.replace(/e$/, "isi"));
      case "aatela": return ["aatteltais"];
      case "tarvita": return ["tarvittais"];
      case "tarttea": return ["tarttettais"];
      case "olla": return ["olis"];
      default: return [];
    }
  }

  function imperativeParadigm(entry, lemma) {
    const none = [];
    let second = presentStem(entry, lemma);
    let root = "";
    let secondPlural = [];
    switch (entry.class_id) {
      case "a_vowel": case "a_vowel_odd": root = strongStem(lemma); secondPlural = [root + Kaa(root)]; break;
      case "ata": root = entry.base; second = [entry.base]; secondPlural = [root + Khaa(root)]; break;
      case "uta": root = entry.base; secondPlural = [root + (front(root) ? "kkää" : "kkaa")]; break;
      case "contracted": root = entry.present; secondPlural = [root + Kaa(root)]; break;
      case "contracted_kay": root = "käy"; secondPlural = ["käykää"]; break;
      case "long_vowel": root = entry.stem; secondPlural = [root + Kaa(root)]; break;
      case "tehda": root = lemma === "tehä" ? "teh" : "näh"; secondPlural = [root + Kaa(lemma)]; break;
      case "consonant": root = entry.imperative; secondPlural = [root + Kaa(lemma), root + Khaa(lemma)]; break;
      case "eta": root = lemma; second = [lemma]; secondPlural = [lemma + Khaa(lemma)]; break;
      case "aatela": root = "aattel"; second = ["aattele"]; secondPlural = ["aattelkaa"]; break;
      case "tarvita": root = "tarvi"; second = ["tarvitte"]; secondPlural = ["tarvikkaa"]; break;
      case "tarttea": root = "tartte"; second = ["tartte"]; secondPlural = ["tarttekaa"]; break;
      case "olla": root = "ol"; second = []; secondPlural = ["olkhaa"]; break;
    }
    if (entry.class_id === "consonant" && ["tulla", "mennä", "pestä", "päästä"].includes(lemma)) {
      secondPlural = G.unique(secondPlural);
    } else if (entry.class_id === "consonant" && lemma === "nousta") {
      secondPlural = ["nouskaa", "nouskhaa"];
    } else if (entry.class_id === "consonant" && lemma === "juosta") {
      secondPlural = ["juoskaa"];
    }
    let third = entry.no_imp_3 || entry.class_id === "tehda" || entry.class_id === "contracted_kay" ? [] : [root + Khoon(lemma)];
    let thirdPlural = entry.no_imp_3 || entry.class_id === "tehda" || entry.class_id === "contracted_kay" || entry.class_id === "aatela" ? [] : [root + Khoot(lemma)];
    if (entry.class_id === "eta") {
      const etaThird = {
        "lämmetä": ["lämpetäkhöön"],
        "paeta": ["paetakhoon", "paketakhoon"],
        "lyhetä": ["lyhtäkhöön"],
        "vaaleta": ["vaaltakhoon"]
      };
      third = etaThird[lemma] || third;
    }
    if (entry.class_id === "tarvita") {
      third = ["tarvikhoon", "tarvitkhoon"];
      thirdPlural = ["tarvikhoot", "tarvitkhoot"];
    }
    const firstPlural = entry.class_id === "olla" ? ["olkhaamme"] : none;
    return { mie: none, sie: second, "se/hään": third, met: firstPlural, tet: secondPlural, "net/het": thirdPlural, passive: none };
  }

  function connegativePresent(entry, lemma) {
    switch (entry.class_id) {
      case "eta": return [lemma];
      case "tarvita": return ["tarvita"];
      default: return presentStem(entry, lemma);
    }
  }

  function passiveConnegative(entry, lemma, tense) {
    if (entry.class_id === "tehda" || entry.class_id === "contracted_kay" || lemma === "juosta" || entry.class_id === "olla") return [];
    if (tense === "past") {
      switch (entry.class_id) {
        case "a_vowel": case "a_vowel_odd": return [entry.weak + (front(lemma) ? "ty" : "tu")];
        case "ata": case "uta": return [entry.base + (front(lemma) ? "ty" : "tu")];
        case "long_vowel": return [entry.stem + "tu"];
        case "eta": return [entry.base + (front(lemma) ? "ty" : "tu")];
        case "aatela": return ["aatteltu"];
        case "tarvita": return ["tarvittu"];
        case "tarttea": return ["tarttetu"];
        default: return passivePerfectParticiple(entry, lemma).filter((_, i) => i === 0);
      }
    }
    switch (entry.class_id) {
      case "a_vowel": case "a_vowel_odd": return [entry.weak + (front(lemma) ? "tä" : "ta")];
      case "ata": return [lemma];
      case "uta": return [lemma];
      case "contracted": return [entry.present + A(lemma)];
      case "long_vowel": return [entry.stem + "ta"];
      case "consonant": return [lemma];
      case "eta": return [lemma];
      case "aatela": return ["aattela"];
      case "tarvita": return ["tarvita"];
      case "tarttea": return ["tartteta"];
      default: return [];
    }
  }

  function maBases(entry, lemma) {
    switch (entry.class_id) {
      case "a_vowel": case "a_vowel_odd": return [strongStem(lemma)];
      case "ata": return [entry.present];
      case "uta": return [entry.base + A(lemma)];
      case "contracted": case "contracted_kay": return [entry.present];
      case "long_vowel": return [entry.stem];
      case "tehda": return [entry.finite];
      case "consonant": return [entry.present];
      case "eta": return entry.present_roots;
      case "aatela": return ["aattele"];
      case "tarvita": return ["tarvitte"];
      case "tarttea": return ["tartte"];
      case "olla": return ["ole"];
      default: return [];
    }
  }

  function activePerfectParticiple(entry, lemma) {
    switch (entry.class_id) {
      case "a_vowel": return [strongStem(lemma) + (front(lemma) ? "ny" : "nu")];
      case "a_vowel_odd": return [strongStem(lemma) + (front(lemma) ? "nny" : "nnu")];
      case "ata": return [entry.base + (front(lemma) ? "ny" : "nu")];
      case "uta": return [entry.base + (front(lemma) ? "ny" : "nu")];
      case "contracted": case "contracted_kay": return [entry.present + (front(lemma) ? "ny" : "nu")];
      case "long_vowel": return [entry.stem + "nu"];
      case "tehda": return [lemma === "tehä" ? "tehny" : "nähny"];
      case "consonant": {
        const core = entry.inf_bare.endsWith("st") ? entry.inf_bare.slice(0, -1) : entry.core;
        return [core + core.slice(-1) + U(lemma)];
      }
      case "eta": return [entry.base + (front(lemma) ? "ny" : "nu")];
      case "aatela": return ["aattelu"];
      case "tarvita": return ["tarvinu"];
      case "tarttea": return ["tarttenu"];
      case "olla": return ["ollu"];
      default: return [];
    }
  }

  function activePerfectParticiplePlural(entry, lemma) {
    let values = [];
    switch (entry.class_id) {
      case "a_vowel": case "a_vowel_odd": { const stem = strongStem(lemma); values = [stem + "hneet", stem + "nheet"]; break; }
      case "ata": case "uta": values = [entry.base + "hneet", entry.base + "nheet"]; break;
      case "contracted": case "contracted_kay": values = [entry.present + "hneet", entry.present + "nheet"]; break;
      case "long_vowel": values = [entry.stem + "hneet", entry.stem + "nheet"]; break;
      case "tehda": values = [lemma === "tehä" ? "tehneet" : "nähneet"]; break;
      case "consonant": {
        const core = entry.inf_bare.endsWith("st") ? entry.inf_bare.slice(0, -1) : entry.core;
        values = [core + "heet"];
        break;
      }
      case "eta": values = [entry.base + "hneet", entry.base + "nheet", ...(entry.plural_prc_extra || [])]; break;
      case "aatela": values = ["aattehleet", "aattelheet"]; break;
      case "tarvita": values = ["tarvihneet", "tarvinheet"]; break;
      case "tarttea": values = ["tarttehneet", "tarttenheet"]; break;
      case "olla": values = ["olheet"]; break;
    }
    if (lemma === "paeta") values = ["paehnheet", "paenheet", "pakehneet"];
    return G.unique(values);
  }

  function passivePerfectParticiple(entry, lemma) {
    let values = [];
    switch (entry.class_id) {
      case "a_vowel": case "a_vowel_odd": values = [replaceFinalA(entry.weak, "e") + (front(lemma) ? "tty" : "ttu")]; break;
      case "ata": values = [entry.base + (front(lemma) ? "tty" : "ttu")]; break;
      case "uta": values = [entry.base + (front(lemma) ? "tty" : "ttu")]; break;
      case "contracted": case "contracted_kay": values = [entry.present + "t" + U(lemma)]; break;
      case "long_vowel": values = [entry.stem + "tt" + U(lemma)]; break;
      case "tehda": values = [lemma === "tehä" ? "tehty" : "nähty"]; break;
      case "consonant": values = [entry.passive_past + U(lemma)]; break;
      case "eta": values = [entry.base + "tt" + U(lemma), ...(entry.passive_prf_extra || [])]; break;
      case "aatela": values = ["aatteltu"]; break;
      case "tarvita": values = ["tarvittu"]; break;
      case "tarttea": values = ["tarttettu"]; break;
      case "olla": values = ["oltu"]; break;
    }
    return G.unique(values);
  }

  function passivePresentParticiple(entry, lemma) {
    switch (entry.class_id) {
      case "a_vowel": case "a_vowel_odd": return [replaceFinalA(entry.weak, "e") + (front(lemma) ? "ttävä" : "ttava")];
      case "ata": return [entry.base + (front(lemma) ? "ttävä" : "ttava")];
      case "uta": return [entry.base + (front(lemma) ? "ttävä" : "ttava")];
      case "contracted": case "contracted_kay": return [entry.present + "t" + A(lemma) + VA(lemma)];
      case "long_vowel": return [entry.stem + "ttava"];
      case "tehda": return [lemma === "tehä" ? "tehtävä" : "nähtävä"];
      case "consonant": return [entry.passive_past + A(lemma) + VA(lemma)];
      case "eta": return [entry.base + "tt" + A(lemma) + VA(lemma)];
      case "aatela": return ["aatteltava"];
      case "tarvita": return ["tarvittava"];
      case "tarttea": return ["tarttettava"];
      case "olla": return ["oltava"];
      default: return [];
    }
  }

  function activeInfE(entry, lemma, mode) {
    if (entry.inf_e_ine && mode === "inessive") return entry.inf_e_ine;
    if (entry.inf_e_ins && mode === "instructive") return entry.inf_e_ins;
    let stem = "";
    switch (entry.class_id) {
      case "a_vowel": case "a_vowel_odd": stem = strongStem(lemma) + "e"; break;
      case "ata": case "uta": stem = lemma.slice(0, -1) + "e"; break;
      case "long_vowel": stem = entry.stem + "e"; break;
      case "consonant": stem = entry.inf_bare + "e"; break;
      case "eta": stem = lemma + "e"; break;
      case "aatela": stem = "aattele"; break;
      case "tarvita": stem = "tarvite"; break;
      case "tarttea": stem = "tarttie"; break;
      case "olla": stem = "olle"; break;
      default: return [];
    }
    return [stem + (mode === "inessive" ? SSA(lemma) : "n")];
  }

  function passiveInfE(entry, lemma) {
    if (entry.passive_inf_e) return entry.passive_inf_e;
    switch (entry.class_id) {
      case "a_vowel": case "a_vowel_odd": return activeInfE(entry, lemma, "inessive");
      case "ata": return [entry.finite + "tt" + A(lemma) + (front(lemma) ? "essä" : "essa")];
      case "uta": return [entry.base + "tt" + A(lemma) + (front(lemma) ? "essä" : "essa")];
      case "long_vowel": return [entry.stem + "essa"];
      case "consonant": return [entry.passive_past + A(lemma) + (front(lemma) ? "essä" : "essa")];
      case "eta": return [lemma + (front(lemma) ? "essä" : "essa")];
      case "aatela": return ["aatteltaessa"];
      case "tarvita": return ["tarvittaessa"];
      case "tarttea": return ["tarttiessa"];
      case "olla": return ["ollessa"];
      default: return [];
    }
  }

  function thirdIllative(entry, lemma) {
    const bases = maBases(entry, lemma);
    const values = [];
    for (const base of bases) {
      const hm = front(lemma) ? "hmään" : "hmaan";
      const mh = front(lemma) ? "mhään" : "mhaan";
      if (["a_vowel", "a_vowel_odd"].includes(entry.class_id)) {
        const firstBase = entry.illative_first || (entry.class_id === "a_vowel_odd" ? stripFinalA(entry.weak) : stripFinalA(base));
        values.push(firstBase + Haan(lemma), base + (front(lemma) ? "hmään" : "hmaan"), base + (front(lemma) ? "mhään" : "mhaan"));
      } else if (entry.class_id === "consonant" || entry.class_id === "tehda") {
        values.push(base + hm, base + mh, base.replace(/e$/, front(base) ? "heen" : "heen"));
      } else {
        values.push(base + hm, base + mh);
      }
    }
    if (entry.class_id === "long_vowel") return ["juhuun", "juumhaan"];
    if (entry.class_id === "tarttea") return ["tartheen", "tarttehmaan", "tarttemhaan"];
    if (entry.class_id === "olla") return ["olemhaan", "olehmaan"];
    if (lemma === "nähä") return G.unique(values).filter(value => value !== "näkheen");
    return G.unique(values);
  }

  function nonfiniteSurfaces(entry, lemma, form, voice) {
    if (voice === "passive") {
      if (form === "2nd infinitive inessive") return passiveInfE(entry, lemma);
      if (form === "Present participle") return passivePresentParticiple(entry, lemma);
      if (form === "Past participle") return passivePerfectParticiple(entry, lemma);
      return [];
    }
    if (form === "1st infinitive") return entry.inf || [lemma];
    if (form === "2nd infinitive inessive") return activeInfE(entry, lemma, "inessive");
    if (form === "2nd infinitive instructive") return activeInfE(entry, lemma, "instructive");
    const bases = maBases(entry, lemma);
    if (form === "3rd infinitive inessive") return bases.map(base => base + MA(lemma) + SSA(lemma));
    if (form === "3rd infinitive elative") return bases.map(base => base + MA(lemma) + STA(lemma));
    if (form === "3rd infinitive illative") return thirdIllative(entry, lemma);
    if (form === "3rd infinitive adessive") {
      const singleL = ["a_vowel_odd", "contracted", "contracted_kay", "aatela", "tarvita"].includes(entry.class_id);
      return bases.map(base => base + MA(lemma) + (singleL ? (front(lemma) ? "lä" : "la") : LLA(lemma)));
    }
    if (form === "3rd infinitive abessive") return bases.map(base => base + MA(lemma) + TTA(lemma));
    if (form === "4th infinitive nominative") return bases.map(base => base + "minen");
    if (form === "4th infinitive partitive") return bases.map(base => base + (front(lemma) ? "mistä" : "mista"));
    if (form === "Present participle") return activePresentParticiple(entry, lemma);
    if (form === "Past participle") return activePerfectParticiple(entry, lemma);
    if (form === "Agent participle") {
      if (entry.class_id === "aatela") return ["aattelemma"];
      return bases.map(base => base + MA(lemma));
    }
    return [];
  }

  function baseResult(resolution, surfaces, ruleId, requestedStatus) {
    if (!surfaces.length) return G.unsupported(ruleId, "No current strict Meanbot generation path for this lemma/cell.");
    let status = requestedStatus || (surfaces.length > 1 ? S.SUPPORTED_VARIANT : S.VERIFIED);
    let note = resolution.note || "";
    if (resolution.kind === "ambiguous_known") status = S.AMBIGUOUS;
    else if (resolution.normalized_from && status === S.VERIFIED) status = S.SUPPORTED_VARIANT;
    return G.result(surfaces, status, ruleId, "meanbot-derived-rule", note);
  }

  function knownFinite(resolution, section, slot) {
    const { entry, lemma } = resolution;
    let values = [];
    let rule = "";
    if (section === "Present tense") { values = presentParadigm(entry, lemma)[slot]; rule = "finite.present"; }
    else if (section === "Past tense") { values = pastParadigm(entry, lemma)[slot]; rule = "finite.past"; }
    else if (section === "Conditional mood") { values = conditionalParadigm(entry, lemma)[slot]; rule = "finite.conditional"; }
    else if (section === "Imperative mood") { values = imperativeParadigm(entry, lemma)[slot]; rule = "finite.imperative"; }
    else if (section === "Potential tense" || section === "Potential negative tense" || section === "Potential perfect tense" || section === "Potential perfect negative tense") {
      return G.unsupported("gap.potential", "Meanbot has no strict +Pot feature path.");
    } else if (section === "Present negative tense") {
      if (slot === "passive") values = product([["ei"], passiveConnegative(entry, lemma, "present")]);
      else values = product([[G.NEGATIVE_AUXILIARY[G.PRONOUNS.findIndex(p => p.slot === slot)]], connegativePresent(entry, lemma)]);
      rule = slot === "passive" ? "composition.negative.passive-present" : "composition.negative.active-present";
      return baseResult(resolution, values, rule, slot === "passive" ? S.PARTIAL : undefined);
    } else if (section === "Past negative tense") {
      if (slot === "passive") values = product([["ei"], passiveConnegative(entry, lemma, "past")]);
      else {
        const index = G.PRONOUNS.findIndex(p => p.slot === slot);
        const participles = index >= 3 ? activePerfectParticiplePlural(entry, lemma) : activePerfectParticiple(entry, lemma);
        values = product([[G.NEGATIVE_AUXILIARY[index]], participles]);
      }
      rule = "composition.negative.past";
      return baseResult(resolution, values, rule, S.PARTIAL);
    } else if (section === "Conditional negative tense") {
      const activeConnegative = {
        "antaa": "antaisi", "alkaa": "alkaisi", "käsittää": "käsittäisi",
        "ymmärtää": "ymmärtäisi", "ostaa": "ostaisi", "kirjottaa": "kirjottaisi",
        "juua": "juuisi", "tarvita": "tarviaisi", "tarttea": "tarttiisi"
      };
      const passiveSupported = new Set(["antaa", "alkaa", "ostaa", "juua", "tarttea"]);
      if (slot === "passive" && passiveSupported.has(lemma)) values = product([["ei"], passiveConditional(entry, lemma)]);
      else if (slot !== "passive" && activeConnegative[lemma]) {
        const index = G.PRONOUNS.findIndex(person => person.slot === slot);
        values = product([[G.NEGATIVE_AUXILIARY[index]], [activeConnegative[lemma]]]);
      }
      return baseResult(resolution, values, "composition.negative.conditional", S.PARTIAL);
    } else if (section === "Imperative negative mood") {
      if (!(["sie", "tet"].includes(slot)) || entry.class_id === "olla" || entry.class_id === "eta") {
        return G.unsupported("gap.negative-imperative", "No complete strict negative-imperative component path for this lemma/person.");
      }
      if (slot === "sie") {
        const main = entry.class_id === "ata" ? [entry.present] : imperativeParadigm(entry, lemma).sie;
        values = product([["älä"], main]);
      }
      else {
        let main = [];
        switch (entry.class_id) {
          case "a_vowel": case "a_vowel_odd": main = [strongStem(lemma) + (front(lemma) ? "kö" : "ko")]; break;
          case "ata": main = [entry.present + (front(lemma) ? "kö" : "ko")]; break;
          case "uta": main = [entry.base + (front(lemma) ? "kkö" : "kko")]; break;
          case "contracted": case "contracted_kay": main = [entry.present + (front(lemma) ? "kö" : "ko")]; break;
          case "long_vowel": main = [entry.stem + "ko"]; break;
          case "tehda": main = [(lemma === "tehä" ? "teh" : "näh") + "kö"]; break;
          case "consonant": main = [entry.imperative + (front(lemma) ? "kö" : "ko")]; break;
          case "aatela": main = ["aattelko"]; break;
          case "tarvita": main = ["tarvikko"]; break;
          case "tarttea": main = ["tartteko"]; break;
        }
        values = product([["älkää"], main]);
      }
      return baseResult(resolution, values, "composition.negative.imperative", S.PARTIAL);
    } else if (section === "Conditional perfect negative tense") {
      return G.unsupported("gap.olla-conditional-connegative", "Required olla+V+Act+Cond+ConNeg does not generate.");
    } else {
      return compoundFinite(resolution, section, slot);
    }
    return baseResult(resolution, values || [], rule);
  }

  function compoundFinite(resolution, section, slot) {
    const { entry, lemma } = resolution;
    const index = slot === "passive" ? 2 : G.PRONOUNS.findIndex(p => p.slot === slot);
    const number = slot === "passive" || index < 3 ? "sg" : "pl";
    const participles = slot === "passive"
      ? passivePerfectParticiple(entry, lemma)
      : (number === "pl" ? activePerfectParticiplePlural(entry, lemma) : activePerfectParticiple(entry, lemma));
    let aux = [];
    if (section === "Present perfect tense") aux = presentParadigm(L.entries.olla, "olla")[G.PRONOUNS[index].slot];
    else if (section === "Past perfect / pluskvamperfektum") aux = pastParadigm(L.entries.olla, "olla")[G.PRONOUNS[index].slot];
    else if (section === "Conditional perfect tense") aux = conditionalParadigm(L.entries.olla, "olla")[G.PRONOUNS[index].slot];
    else if (section === "Present perfect negative tense") aux = [G.NEGATIVE_AUXILIARY[index] + " ole"];
    else if (section === "Past perfect negative tense" && slot !== "passive") aux = [G.NEGATIVE_AUXILIARY[index] + (number === "sg" ? " ollu" : " olheet")];
    else if (section === "Imperative perfect tense") {
      if (slot === "mie" || slot === "sie") return G.unsupported("gap.imperative-perfect", "Required olla imperative component is absent.");
      aux = imperativeParadigm(L.entries.olla, "olla")[slot === "passive" ? "se/hään" : slot];
    }
    if (!aux.length || !participles.length) return G.unsupported("gap.compound-component", "A required strict component is missing.");
    return baseResult(resolution, product([aux, participles]), "composition.periphrastic", S.PARTIAL);
  }

  function unknownCell(resolution, key) {
    if (key === G.nonfiniteKey("1st infinitive", "active")) {
      return G.result([resolution.lemma], S.DERIVED, "unknown.infinitive-identity", "meanbot-derived-rule", resolution.note);
    }
    const capability = V.capabilityStatus(key);
    if (capability === "UNSUPPORTED") return G.unsupported("gap.phase1-unsupported", "This UI cell has no Phase 1 strict path.");
    if (!resolution.candidates.length) return G.unsupported("unknown.no-class", resolution.note);
    if (resolution.candidates.length > 1) return G.result([], S.AMBIGUOUS, "unknown.multiple-classes", "meanbot-derived-rule", "Compatible surface classes diverge; no single form is selected.");
    const candidate = resolution.candidates[0];
    const values = [];
    if (candidate.class_id === "unknown_a") {
      const stem = candidate.stem;
      if (key.startsWith("finite|Present tense|")) {
        const slot = key.split("|")[2];
        if (slot === "mie") values.push(stem + "n");
        else if (slot === "sie") values.push(stem + "t");
        else if (slot === "se/hään" || slot === "net/het") values.push(resolution.lemma);
        else if (slot === "met") values.push(stem + MA(resolution.lemma));
        else if (slot === "tet") values.push(stem + TTA(resolution.lemma));
      } else if (key === G.nonfiniteKey("Present participle", "active")) values.push(stem + VA(resolution.lemma));
      else if (key === G.nonfiniteKey("Agent participle", "active")) values.push(stem + MA(resolution.lemma));
      else if (key === G.nonfiniteKey("4th infinitive nominative", "active")) values.push(stem + "minen");
    }
    return G.result(values, S.HEURISTIC, "unknown.unverified-class", "meanbot-derived-rule", "A surface class is plausible, but lexical stem/gradation metadata is unavailable; candidates are unverified.");
  }

  function generateCell(resolutionOrInput, key) {
    const resolution = typeof resolutionOrInput === "string" ? resolveInput(resolutionOrInput) : resolutionOrInput;
    if (!resolution || resolution.kind === "empty") return G.unsupported("input.empty", "Enter an infinitive.");
    if (resolution.kind === "rejected_alias") return G.unsupported("input.voia-not-infinitive", resolution.note);
    if (!resolution.entry) {
      return global.MeanKieliPastExamples?.generateCell(resolution, key, generateCell) || unknownCell(resolution, key);
    }
    const updated = global.MeanKieliUpdates?.generateCell(resolution, key);
    if (updated) return updated;
    if (key.startsWith("finite|")) {
      const [, section, slot] = key.split("|");
      const result = knownFinite(resolution, section, slot);
      return global.MeanKieliPastExamples?.annotateKnown(resolution, key, result) || result;
    }
    const [, form, voice] = key.split("|");
    if (form === "1st long infinitive" && voice === "active") {
      if (resolution.entry && ["juosta", "olla"].includes(resolution.lemma)) {
        return G.unsupported("gap.inf1-long-lemma", "This lemma has no current strict long-infinitive generation path.");
      }
      return G.result([], S.AMBIGUOUS, "nonfinite.inf1-long-possessive", "meanbot", "Meanbot requires a possessive-person feature; the UI does not specify one.");
    }
    const capability = V.capabilityStatus(key);
    if (capability === "UNSUPPORTED") return G.unsupported("gap.nonfinite", "No current strict Meanbot path for this nonfinite cell.");
    const surfaces = nonfiniteSurfaces(resolution.entry, resolution.lemma, form, voice);
    const result = baseResult(resolution, surfaces, `nonfinite.${form.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.${voice}`);
    return global.MeanKieliPastExamples?.annotateKnown(resolution, key, result) || result;
  }

  function buildFiniteRows(resolutionOrInput) {
    const resolution = typeof resolutionOrInput === "string" ? resolveInput(resolutionOrInput) : resolutionOrInput;
    return G.FINITE_ROWS.map(section => ({
      section,
      forms: G.PRONOUNS.map(person => generateCell(resolution, G.finiteKey(section, person.slot))),
      passive: generateCell(resolution, G.finiteKey(section, "passive"))
    }));
  }

  function buildNonfiniteRows(resolutionOrInput) {
    const resolution = typeof resolutionOrInput === "string" ? resolveInput(resolutionOrInput) : resolutionOrInput;
    return G.NONFINITE_ROWS.map(form => ({
      form,
      active: generateCell(resolution, G.nonfiniteKey(form, "active")),
      passive: generateCell(resolution, G.nonfiniteKey(form, "passive"))
    }));
  }

  function conjugateParadigm(value) {
    const resolution = resolveInput(value);
    return { resolution, finite: buildFiniteRows(resolution), nonfinite: buildNonfiniteRows(resolution) };
  }

  global.MeanKieliMorphology = Object.freeze({
    normalizeInput,
    resolveInput,
    generateCell,
    buildFiniteRows,
    buildNonfiniteRows,
    conjugateParadigm,
    internals: Object.freeze({
      presentParadigm,
      pastParadigm,
      conditionalParadigm,
      imperativeParadigm,
      passivePresent,
      passivePast,
      passiveConditional,
      activePerfectParticiple,
      passivePerfectParticiple,
      thirdIllative
    })
  });
})(window);
