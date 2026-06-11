/*
  Meänkieli verb conjugator
  Static, dictionary-agnostic morphology engine + dictionary check.
  The dictionary is used only for definitions/part-of-speech feedback.
*/

const PRONOUNS = ["mie", "sie", "se/hään", "met", "tet", "net/het"];
const NEG = ["en", "et", "ei", "emmä", "että", "ei"];
const AUX_PRESENT = ["olen", "olet", "oon", "olema", "oletta", "oon"];
const AUX_PAST = ["olin", "olit", "oli", "olima", "olitta", "olit"];
const AUX_COND = ["olisin", "olisit", "olis", "olisimma", "olisitta", "olisit"];
const AUX_COND_NEG_MAIN = "olis";
const AUX_POT = ["lienen", "lienet", "lienee", "lienemä", "lienettä", "lienevä"];
const AUX_POT_NEG_MAIN = "liene";

const TYPE_LABELS = {
  1: "Type 1 antaa/sanoa: -a/-ä, add endings to vowel stem",
  2: "Type 2 saa/jua/syä or Finnish -da/-dä: short vowel stem",
  3: "Type 3 tulla/nousta/mennä: consonant stem + -e-",
  4: "Type 4 huomata/hypätä: -ta/-tä drops before inflection stem",
  5: "Type 5 tarvita/häiritä/tarttea: -tse/-tte- type stem",
  6: "Type 6 vanheta/lämmetä: change/become verbs with -ne- stem",
  "unknown": "Unknown/estimated verb type"
};

function normalizeWord(value) {
  return (value || "")
    .trim()
    .toLowerCase()
    .replace(/[’`´]/g, "'")
    .replace(/\s+/g, " ");
}

function displayWord(value) {
  return (value || "").trim();
}

function hasFront(word) { return /[äöy]/i.test(word); }
function hasBack(word) { return /[aou]/i.test(word); }
function frontHarmony(word) { return hasFront(word) && !hasBack(word); }
function A(word) { return frontHarmony(word) ? "ä" : "a"; }
function O(word) { return frontHarmony(word) ? "ö" : "o"; }
function U(word) { return frontHarmony(word) ? "y" : "u"; }
function VA(word) { return frontHarmony(word) ? "vä" : "va"; }
function MA(word) { return frontHarmony(word) ? "mä" : "ma"; }
function SSA(word) { return frontHarmony(word) ? "ssä" : "ssa"; }
function STA(word) { return frontHarmony(word) ? "stä" : "sta"; }
function LLA(word) { return frontHarmony(word) ? "llä" : "lla"; }
function TTA(word) { return frontHarmony(word) ? "ttä" : "tta"; }
function KHOON(word) { return frontHarmony(word) ? "khöön" : "khoon"; }
function KHOOT(word) { return frontHarmony(word) ? "khööt" : "khoot"; }
function KAA(word) { return frontHarmony(word) ? "kää" : "kaa"; }
function KO(word) { return frontHarmony(word) ? "kö" : "ko"; }
function THAAN(word) { return frontHarmony(word) ? "thään" : "thaan"; }
function THIIN(word) { return frontHarmony(word) ? "thiin" : "thiin"; }

function stripFinalA(word) {
  return word.replace(/[aä]$/, "");
}

function lastVowel(word) {
  const m = word.match(/[aeiouyäö]$/i);
  return m ? m[0] : "";
}

function lengthenFinalVowel(stem) {
  const v = lastVowel(stem);
  return v ? stem + v : stem;
}

function isVowel(ch) {
  return /[aeiouyäö]/i.test(ch || "");
}

function gradeBeforeFinalVowelDetailed(stem, patterns) {
  if (!/[aeiouyäö]$/i.test(stem)) return { stem, applied: false };
  const last = stem.slice(-1);
  const base = stem.slice(0, -1);
  for (const pattern of patterns) {
    const [from, to, label, opts = {}] = pattern;
    if (!base.endsWith(from)) continue;
    const prefix = base.slice(0, -from.length);
    if (opts.requirePrevVowel && !isVowel(prefix.slice(-1))) continue;
    const changed = prefix + to + last;
    return { stem: changed, applied: true, from, to, label: label || `${from} → ${to}` };
  }
  return { stem, applied: false };
}

function gradeBeforeFinalVowel(stem, patterns) {
  return gradeBeforeFinalVowelDetailed(stem, patterns).stem;
}

function strongToWeakDetail(stem) {
  // Conservative KPT: only the explicit clusters below or single k/p/t between vowels.
  // This prevents false forms such as rakastaa → *rakasdan and laskea → *lasen.
  return gradeBeforeFinalVowelDetailed(stem, [
    ["kk", "k"], ["pp", "p"], ["tt", "t"],
    ["nk", "ng"], ["mp", "mm"], ["nt", "nn"], ["lt", "ll"], ["rt", "rr"],
    ["ht", "hd"],
    ["k", "", "k → ∅", { requirePrevVowel: true }],
    ["p", "v", "p → v", { requirePrevVowel: true }],
    ["t", "d", "t → d", { requirePrevVowel: true }]
  ]);
}

function strongToWeak(stem) {
  return strongToWeakDetail(stem).stem;
}

function weakToStrongUnsafe(stem) {
  return gradeBeforeFinalVowel(stem, [
    ["ng", "nk"], ["mm", "mp"], ["nn", "nt"], ["ll", "lt"], ["rr", "rt"],
    ["hd", "ht"], ["lj", "lk"], ["rj", "rk"],
    ["v", "p", "v → p", { requirePrevVowel: true }],
    ["d", "t", "d → t", { requirePrevVowel: true }],
    ["p", "pp", "p → pp", { requirePrevVowel: true }],
    ["t", "tt", "t → tt", { requirePrevVowel: true }],
    ["k", "kk", "k → kk", { requirePrevVowel: true }]
  ]);
}

function weakToStrongSafeDetail(stem) {
  // Reverse gradation is not always recoverable from the infinitive.
  // Safe pairs are applied; ambiguous weak consonants such as v/d are reported but not applied.
  const safe = gradeBeforeFinalVowelDetailed(stem, [
    ["ng", "nk"], ["mm", "mp"], ["nn", "nt"], ["ll", "lt"], ["rr", "rt"],
    ["hd", "ht"], ["lj", "lk"], ["rj", "rk"],
    ["p", "pp", "p → pp", { requirePrevVowel: true }],
    ["t", "tt", "t → tt", { requirePrevVowel: true }],
    ["k", "kk", "k → kk", { requirePrevVowel: true }]
  ]);
  if (safe.applied) return { ...safe, status: "applied" };

  const ambiguous = gradeBeforeFinalVowelDetailed(stem, [
    ["v", "p", "v → p", { requirePrevVowel: true }],
    ["d", "t", "d → t", { requirePrevVowel: true }]
  ]);
  if (ambiguous.applied) return { ...ambiguous, status: "possible", candidate: ambiguous.stem };

  return { stem, status: "none", applied: false };
}

function weakToStrong(stem) {
  return weakToStrongUnsafe(stem);
}

function removeEnding(word, ending) {
  return word.slice(0, word.length - ending.length);
}

function dictionaryCandidates(word) {
  const w = normalizeWord(word);
  const c = new Set([w, w.replace(/'/g, "")]);
  if (w.endsWith("'a") || w.endsWith("'ä")) c.add(w.slice(0, -2));
  if (w.endsWith("a") || w.endsWith("ä")) c.add(stripFinalA(w));
  if (w.endsWith("da")) c.add(w.slice(0, -2) + "a");
  if (w.endsWith("dä")) c.add(w.slice(0, -2) + "ä");
  return [...c].filter(Boolean);
}

function lookupDictionary(word) {
  const dict = window.MEANKIELI_DICTIONARY || {};
  const aliases = window.MEANKIELI_DICTIONARY_ALIASES || {};
  for (const c of dictionaryCandidates(word)) {
    if (dict[c]) return { found: true, key: c, entry: dict[c], via: "exact" };
  }
  for (const c of dictionaryCandidates(word)) {
    const alias = aliases[c];
    if (alias && dict[alias]) return { found: true, key: alias, entry: dict[alias], via: `variant of ${alias}` };
  }
  return { found: false };
}

function classifyVerb(word) {
  const w = normalizeWord(word);
  const specials2 = ["saa", "saada", "saa'a", "jua", "juoa", "syä", "syyä", "myyä", "myydä", "tuua", "tuoda", "viää", "viedä", "voia", "voida", "käyä", "käydä", "uia", "uida", "tehä", "tehdä", "nähä", "nähdä"];
  if (["olla"].includes(w)) return { type: 3, sub: "olla" };
  if (["tulla"].includes(w)) return { type: 3, sub: "tulla" };
  if (["mennä"].includes(w)) return { type: 3, sub: "mennä" };
  if (specials2.includes(w) || /d[äa]$/.test(w)) return { type: 2, sub: "short-vowel" };
  if (/i[dt][aä]$/.test(w) || /[aä]rit[äa]$/.test(w) || /tarttea$/.test(w)) return { type: 5, sub: "tarvita" };
  if (/e[t][aä]$/.test(w)) return { type: 6, sub: "-eta" };
  if (/[aäoöuüy]t[aä]$/.test(w) && !/[s]t[aä]$/.test(w)) return { type: 4, sub: "-ta" };
  if (/(ll|nn|rr)[aä]$/.test(w) || /st[aä]$/.test(w) || /[lrn][aä]$/.test(w)) return { type: 3, sub: "consonant" };
  if (/[aä]$/.test(w)) return { type: 1, sub: "vowel" };
  return { type: "unknown", sub: "estimated" };
}

function derive(word) {
  const w = normalizeWord(word);
  const c = classifyVerb(w);
  const type = c.type;
  let infStem = "", weakStem = "", strongStem = "", presentStem = "", thirdStem = "", consonantStem = "", imperativeStem = "";
  let notes = [];

  const special = {
    "saa": { stem: "saa", past: "sai", part: "saanu", third: "saapi" },
    "saa'a": { stem: "saa", past: "sai", part: "saanu", third: "saapi" },
    "saada": { stem: "saa", past: "sai", part: "saanu", third: "saapi" },
    "jua": { stem: "juo", past: "joi", part: "juonu", third: "juopi" },
    "juoa": { stem: "juo", past: "joi", part: "juonu", third: "juopi" },
    "juoda": { stem: "juo", past: "joi", part: "juonu", third: "juopi" },
    "syä": { stem: "syö", past: "söi", part: "syöny", third: "syöpi" },
    "syyä": { stem: "syö", past: "söi", part: "syöny", third: "syöpi" },
    "syödä": { stem: "syö", past: "söi", part: "syöny", third: "syöpi" },
    "myyä": { stem: "myy", past: "myi", part: "myyny", third: "myypi" },
    "myydä": { stem: "myy", past: "myi", part: "myyny", third: "myypi" },
    "voia": { stem: "voi", past: "voi", part: "voinu", third: "voipi" },
    "voida": { stem: "voi", past: "voi", part: "voinu", third: "voipi" },
    "käyä": { stem: "käy", past: "kävi", part: "käyny", third: "käypii" },
    "käydä": { stem: "käy", past: "kävi", part: "käyny", third: "käypii" },
    "tuua": { stem: "tuo", past: "toi", part: "tuonu", third: "tuopi" },
    "tuoda": { stem: "tuo", past: "toi", part: "tuonu", third: "tuopi" },
    "viää": { stem: "vie", past: "vei", part: "vieny", third: "viepi" },
    "viedä": { stem: "vie", past: "vei", part: "vieny", third: "viepi" },
    "uia": { stem: "ui", past: "ui", part: "uinu", third: "uipi" },
    "uida": { stem: "ui", past: "ui", part: "uinu", third: "uipi" }
  };

  if (w === "tehä" || w === "tehdä") {
    return {
      word: w, type: 2, sub: "irregular tehdä/tehä", infStem: "teh", weakStem: "tehe", strongStem: "teke", presentStem: "tehe", thirdStem: "teke", consonantStem: "teh", imperativeStem: "teh",
      special: { present: ["tehen", "tehet", "tekkee", "tehemä", "tehettä", "tekevä"], pastBase: "teki", partSg: "tehny", partPl: "tehneet", passivePresent: "tehthään", passivePast: "tehthiin", passivePart: "tehty" },
      notes: ["Irregular Meänkieli/Finnish type-2 verb: tehä/tehdä."]
    };
  }
  if (w === "nähä" || w === "nähdä") {
    return {
      word: w, type: 2, sub: "irregular nähdä/nähä", infStem: "näh", weakStem: "näe", strongStem: "näke", presentStem: "näe", thirdStem: "näke", consonantStem: "näh", imperativeStem: "näh",
      special: { present: ["näen", "näet", "näkkee", "näemä", "näettä", "näkevä"], pastBase: "näki", partSg: "nähny", partPl: "nähneet", passivePresent: "nähthään", passivePast: "nähthiin", passivePart: "nähty" },
      notes: ["Irregular Meänkieli/Finnish type-2 verb: nähä/nähdä."]
    };
  }

  if (special[w]) {
    const s = special[w];
    return {
      word: w, type: 2, sub: "short-vowel Meänkieli type 2", infStem: s.stem, weakStem: s.stem, strongStem: s.stem, presentStem: s.stem, thirdStem: s.stem, consonantStem: s.stem, imperativeStem: s.stem,
      special: { third: s.third, pastBase: s.past, partSg: s.part, partPl: pluralParticipleFromSg(s.part, w) },
      notes: ["Short-vowel Meänkieli type-2 pattern; 3rd singular commonly uses -pi/-pii."]
    };
  }

  if (type === 1) {
    infStem = stripFinalA(w);
    strongStem = infStem;
    weakStem = strongToWeak(infStem);
    presentStem = weakStem;
    thirdStem = strongStem;
    consonantStem = infStem;
    imperativeStem = infStem;
    if (weakStem !== strongStem) notes.push(`Consonant gradation estimated: ${strongStem} → ${weakStem}.`);
  } else if (type === 2) {
    if (/d[äa]$/.test(w)) infStem = removeEnding(w, w.endsWith("dä") ? "dä" : "da");
    else infStem = stripFinalA(w);
    strongStem = weakStem = presentStem = thirdStem = consonantStem = imperativeStem = infStem;
    notes.push("Finnish -da/-dä type handled with Meänkieli-like -pi 3sg by default.");
  } else if (type === 3) {
    if (w === "olla") {
      infStem = "ol"; presentStem = weakStem = strongStem = thirdStem = "ole"; consonantStem = imperativeStem = "ol";
      notes.push("Irregular olla: 3rd singular/plural uses oon in this app's Meänkieli table.");
    } else if (w === "tulla") {
      infStem = "tul"; presentStem = weakStem = strongStem = thirdStem = "tule"; consonantStem = imperativeStem = "tul";
    } else if (w === "mennä") {
      infStem = "men"; presentStem = weakStem = strongStem = thirdStem = "mene"; consonantStem = imperativeStem = "men";
    } else if (/st[aä]$/.test(w)) {
      consonantStem = removeEnding(w, w.endsWith("stä") ? "tä" : "ta");
      presentStem = consonantStem + "e";
      infStem = consonantStem;
      weakStem = strongStem = thirdStem = presentStem;
      imperativeStem = consonantStem;
    } else if (/(ll|nn|rr)[aä]$/.test(w)) {
      const end = w.endsWith("ä") ? "ä" : "a";
      consonantStem = removeEnding(w, end).slice(0, -1); // tulla -> tul, mennä -> men
      presentStem = consonantStem + "e";
      infStem = consonantStem;
      weakStem = strongStem = thirdStem = presentStem;
      imperativeStem = consonantStem;
    } else if (/[lrn][aä]$/.test(w)) {
      consonantStem = stripFinalA(w);
      // aatela-type often has -tele- in the stem; estimate conservatively.
      presentStem = consonantStem + "e";
      infStem = consonantStem;
      weakStem = strongStem = thirdStem = presentStem;
      imperativeStem = consonantStem;
    }
  } else if (type === 4) {
    const root = removeEnding(w, w.endsWith("tä") ? "tä" : "ta");
    const g = weakToStrongSafeDetail(root);
    const strongRoot = g.status === "applied" ? g.stem : root;
    const a = A(w);
    infStem = root + "t";
    strongStem = strongRoot + a;
    weakStem = presentStem = thirdStem = strongStem;
    consonantStem = infStem;
    imperativeStem = infStem;
    if (g.status === "applied") {
      notes.push(`Consonant gradation applied for type 4: ${g.label} (${root} → ${g.stem}).`);
    } else if (g.status === "possible") {
      notes.push(`Possible consonant gradation not applied automatically: ${g.label} (${root} → ${g.candidate}; present stem would be ${g.candidate + a}). Infinitive morphology alone cannot distinguish lexical ${g.from} from weak-grade ${g.to}.`);
    }
  } else if (type === 5) {
    let root;
    if (/tarttea$/.test(w)) root = "tart";
    else root = removeEnding(w, w.endsWith("tä") ? "tä" : "ta");
    infStem = root + "t";
    presentStem = root + "tte";
    weakStem = strongStem = thirdStem = presentStem;
    consonantStem = infStem;
    imperativeStem = infStem;
  } else if (type === 6) {
    let root = removeEnding(w, w.endsWith("tä") ? "tä" : "ta");
    const originalRoot = root;
    const g = weakToStrongSafeDetail(root);
    if (g.status === "applied") {
      root = g.stem;
      notes.push(`Consonant gradation applied for type 6: ${g.label} (${originalRoot} → ${g.stem}).`);
    } else if (g.status === "possible") {
      notes.push(`Possible consonant gradation not applied automatically: ${g.label} (${originalRoot} → ${g.candidate}; stem candidate would be ${g.candidate}ne). Infinitive morphology alone cannot distinguish lexical ${g.from} from weak-grade ${g.to}.`);
    }
    if (/[aä]e$/.test(root)) root = root.slice(0, -1) + "ke"; // paeta -> pakene
    infStem = removeEnding(w, w.endsWith("tä") ? "ä" : "a");
    presentStem = root + "ne";
    weakStem = strongStem = thirdStem = presentStem;
    consonantStem = infStem;
    imperativeStem = infStem;
  } else {
    infStem = stripFinalA(w) || w;
    strongStem = weakStem = presentStem = thirdStem = consonantStem = imperativeStem = infStem;
    notes.push("Unknown verb type; output is a low-confidence estimate.");
  }

  return { word: w, type, sub: c.sub, infStem, weakStem, strongStem, presentStem, thirdStem, consonantStem, imperativeStem, notes };
}

function presentForms(d) {
  if (d.word === "olla") return ["olen", "olet", "oon", "olema", "oletta", "oon"];
  if (d.special?.present) return d.special.present;
  const stem = d.presentStem;
  const thirdStem = d.thirdStem || stem;
  let third;
  if (d.type === 2) third = d.special?.third || (stem + "pi");
  else if (d.type === 4) third = thirdStem;
  else third = lengthenFinalVowel(thirdStem);
  return [
    stem + "n",
    stem + "t",
    third,
    stem + MA(stem),
    stem + TTA(stem),
    thirdStem + VA(thirdStem)
  ];
}

function pastBase(d) {
  if (d.special?.pastBase) return d.special.pastBase;
  let s = d.presentStem;
  if (d.type === 1) {
    s = d.weakStem;
    if (/[aä]$/.test(s) && /[aä][aä]$/.test(d.word)) s = s.slice(0, -1) + O(s);
    return s + "i";
  }
  if (d.type === 2) return d.presentStem + "i";
  if (d.type === 3) return (d.presentStem.endsWith("e") ? d.presentStem.slice(0, -1) : d.presentStem) + "i";
  if (d.type === 4) {
    const a = A(d.word);
    return d.presentStem.replace(new RegExp(a + "$"), "") + "si";
  }
  if (d.type === 5) return d.presentStem.replace(/e$/, "i");
  if (d.type === 6) return d.presentStem.replace(/e$/, "i");
  return s + "i";
}

function pastForms(d) {
  if (d.type === 1) {
    let weak = d.weakStem;
    let strong = d.strongStem;
    if (/[aä][aä]$/.test(d.word) && /[aä]$/.test(weak)) {
      weak = weak.slice(0, -1) + O(weak) + "i";
      strong = strong.slice(0, -1) + O(strong);
    } else {
      weak = weak + "i";
      strong = strong + "i";
    }
    return [weak + "n", weak + "t", strong, weak + MA(weak), weak + TTA(weak), weak + "t"];
  }
  const b = pastBase(d);
  return [b + "n", b + "t", b, b + MA(b), b + TTA(b), b + "t"];
}

function conditionalStem(d) {
  let s = d.thirdStem || d.presentStem;
  if (d.type === 2 && d.special?.pastBase) {
    // jua -> joisin, syä -> söisin, saa -> saisin.
    const b = d.special.pastBase;
    return b.endsWith("i") ? b.slice(0, -1) : b;
  }
  if ([3,5,6].includes(d.type) && s.endsWith("e")) s = s.slice(0, -1);
  if (d.type === 4) s = d.presentStem.replace(new RegExp(A(d.word) + "$"), "");
  return s;
}

function conditionalForms(d) {
  const s = conditionalStem(d) + "is";
  return [s + "in", s + "it", s, s + "imma", s + "itta", s + "it"];
}

function potentialStem(d) {
  let s = d.thirdStem || d.presentStem;
  if (d.word === "olla") return "lie";
  if ([3,5,6].includes(d.type) && s.endsWith("e")) s = s.slice(0, -1);
  if (d.type === 4) s = d.presentStem.replace(new RegExp(A(d.word) + "$"), "");
  if (d.type === 2 && d.special?.stem) s = d.special.stem;
  return s + "ne";
}

function potentialForms(d) {
  if (d.word === "olla") return ["lienen", "lienet", "lienee", "lienemä", "lienettä", "lienevä"];
  const s = potentialStem(d);
  return [s + "n", s + "t", s + "e", s + MA(s), s + TTA(s), s + VA(s)];
}

function imperativeForms(d) {
  const pres = presentForms(d);
  const second = pres[0].replace(/n$/, "");
  const impStem = d.imperativeStem || d.consonantStem || d.infStem;
  const maStem = d.presentStem || second;
  return [
    "—",
    second,
    impStem + KHOON(impStem),
    maStem + MA(maStem),
    impStem + KAA(impStem),
    impStem + KHOOT(impStem)
  ];
}

function activePastParticipleSg(d) {
  if (d.special?.partSg) return d.special.partSg;
  const u = U(d.word);
  if (d.type === 1) return d.strongStem + (u === "y" ? "ny" : "nu");
  if (d.type === 2) return d.presentStem + (u === "y" ? "ny" : "nu");
  if (d.type === 3) {
    const root = d.consonantStem || d.infStem;
    const last = root.slice(-1);
    if (["l", "r", "s", "n"].includes(last)) return root + last + u;
    return root + (u === "y" ? "ny" : "nu");
  }
  if (d.type === 4) {
    // Type 4 past negative/perfect participle is built from the weak infinitive root,
    // not from the possibly gradated present stem: avata → avannu, hypätä → hypänny.
    const root = removeEnding(d.word, d.word.endsWith("tä") ? "tä" : "ta");
    return root + (frontHarmony(root) ? "nny" : "nnu");
  }
  if (d.type === 5) {
    const base = /tarttea$/.test(d.word) ? "tartte" : removeEnding(d.word, d.word.endsWith("tä") ? "tä" : "ta");
    if (base.endsWith("vi")) return base.slice(0, -2) + "vinnu";
    return base + (frontHarmony(base) ? "nny" : "nnu");
  }
  if (d.type === 6) return d.presentStem.replace(/e$/, "u");
  return d.presentStem + (u === "y" ? "ny" : "nu");
}

function pluralParticipleFromSg(sg, word) {
  if (/ny$/.test(sg)) return sg.slice(0, -2) + "hneet";
  if (/nu$/.test(sg)) return sg.slice(0, -2) + "nheet";
  if (/(llu|rru|ssu|nny|nnu)$/.test(sg)) return sg.replace(/(llu|rru|ssu|nny|nnu)$/, (m) => m[0] + "heet");
  if (/[uy]$/.test(sg)) return sg.slice(0, -1) + "heet";
  return sg + "heet";
}

function activePastParticiplePl(d) {
  if (d.special?.partPl) return d.special.partPl;
  return pluralParticipleFromSg(activePastParticipleSg(d), d.word);
}

function passivePieces(d) {
  if (d.special?.passivePresent) {
    return { present: d.special.passivePresent, past: d.special.passivePast, participle: d.special.passivePart };
  }
  const front = frontHarmony(d.word);
  let stem, present, past, part;
  if (d.type === 1) {
    stem = d.weakStem;
    if (/[aä][aä]$/.test(d.word) && /[aä]$/.test(stem)) stem = stem.slice(0, -1) + "e";
    present = stem + THAAN(stem);
    past = stem + THIIN(stem);
    part = stem + (front ? "tty" : "ttu");
  } else if (d.type === 2) {
    stem = d.presentStem;
    present = stem + (front ? "hään" : "haan");
    past = stem + "thiin";
    part = stem + (front ? "ty" : "tu");
  } else if (d.type === 3) {
    stem = d.consonantStem || d.infStem;
    if (stem.endsWith("n")) present = stem + "hään"; else present = stem + THAAN(stem);
    past = stem + "thiin";
    part = stem + (front ? "ty" : "tu");
  } else if (d.type === 4) {
    stem = removeEnding(d.word, d.word.endsWith("tä") ? "tä" : "ta"); // huomata -> huoma
    present = stem + THAAN(stem);
    past = stem + THIIN(stem);
    part = stem + (front ? "tty" : "ttu");
  } else if (d.type === 5) {
    stem = /tarttea$/.test(d.word) ? "tartte" : removeEnding(d.word, d.word.endsWith("tä") ? "tä" : "ta");
    present = stem + THAAN(stem);
    past = stem + THIIN(stem);
    part = stem + (front ? "tty" : "ttu");
  } else if (d.type === 6) {
    stem = removeEnding(d.word, d.word.endsWith("tä") ? "tä" : "ta");
    present = stem + THAAN(stem);
    past = stem + THIIN(stem);
    part = stem + (front ? "tty" : "ttu");
  } else {
    stem = d.presentStem || d.word;
    present = stem + THAAN(stem);
    past = stem + THIIN(stem);
    part = stem + (front ? "tty" : "ttu");
  }
  return { present, past, participle: part };
}

function passivePresentParticiple(d) {
  const pp = passivePieces(d).participle;
  if (pp.endsWith("tty")) return pp.slice(0, -3) + "ttävä";
  if (pp.endsWith("ttu")) return pp.slice(0, -3) + "ttava";
  if (pp.endsWith("ty")) return pp.slice(0, -2) + "tävä";
  if (pp.endsWith("tu")) return pp.slice(0, -2) + "tava";
  return pp + VA(pp);
}

function passiveConditional(d) {
  const pp = passivePieces(d).participle;
  if (pp.endsWith("tty")) return pp.slice(0, -3) + "ttäisiin / " + pp.slice(0, -3) + "ttäis";
  if (pp.endsWith("ttu")) return pp.slice(0, -3) + "ttaisiin / " + pp.slice(0, -3) + "ttais";
  if (pp.endsWith("ty")) return pp.slice(0, -2) + "täisiin / " + pp.slice(0, -2) + "täis";
  if (pp.endsWith("tu")) return pp.slice(0, -2) + "taisiin / " + pp.slice(0, -2) + "tais";
  return pp + "aisiin";
}

function passiveImperative(d) {
  const ppp = passivePresentParticiple(d);
  const stem = ppp.replace(/[v][aä]$/, "");
  return stem + KHOON(stem);
}

function passivePotential(d) {
  const pp = passivePieces(d).participle;
  const base = pp.replace(/[uy]$/, "a");
  return base + "neen";
}

function negativeForms(mainSg, mainPl = mainSg) {
  return NEG.map((n, i) => `${n} ${i >= 3 ? mainPl : mainSg}`);
}

function formRows(d) {
  const present = presentForms(d);
  const past = pastForms(d);
  const cond = conditionalForms(d);
  const imper = imperativeForms(d);
  const pot = potentialForms(d);
  const pass = passivePieces(d);
  const sgPart = activePastParticipleSg(d);
  const plPart = activePastParticiplePl(d);
  const condNegMain = conditionalStem(d) + "is";
  const potNegMain = potentialStem(d);
  const impNegMain = (imper[2].replace(new RegExp(KHOON(d.imperativeStem || d.word) + "$"), "") || d.imperativeStem || d.infStem) + KO(d.word);

  return [
    { section: "Present tense", forms: present, passive: pass.present },
    { section: "Past tense", forms: past, passive: pass.past },
    { section: "Conditional mood", forms: cond, passive: passiveConditional(d) },
    { section: "Imperative mood", forms: imper, passive: passiveImperative(d) },
    { section: "Potential tense", forms: pot, passive: passivePotential(d), note: "Potential is rare/almost unknown in Meänkieli; Finnish-style estimate." },
    { section: "Present negative tense", forms: negativeForms(present[0].replace(/n$/, "")), passive: `ei ${passiveNegativePresent(d, pass.present)}` },
    { section: "Past negative tense", forms: negativeForms(sgPart, plPart), passive: `ei ${pass.participle}` },
    { section: "Conditional negative tense", forms: negativeForms(condNegMain), passive: `ei ${passiveConditional(d).split(" / ")[1] || passiveConditional(d)}` },
    { section: "Imperative negative mood", forms: ["—", `älä ${imper[1]}`, `älkhöön ${impNegMain}`, `emmä ${impNegMain}`, `älkää ${impNegMain}`, `älkhööt ${impNegMain}`], passive: "—" },
    { section: "Potential negative tense", forms: negativeForms(potNegMain), passive: "—", note: "Rare/almost unknown in Meänkieli." },
    { section: "Present perfect tense", forms: AUX_PRESENT.map((a, i) => `${a} ${i >= 3 ? plPart : sgPart}`), passive: `oon ${pass.participle}` },
    { section: "Past perfect / pluskvamperfektum", forms: AUX_PAST.map((a, i) => `${a} ${i >= 3 ? plPart : sgPart}`), passive: `oli ${pass.participle}` },
    { section: "Conditional perfect tense", forms: AUX_COND.map((a, i) => `${a} ${i >= 3 ? plPart : sgPart}`), passive: `olis ${pass.participle}` },
    { section: "Imperative perfect tense", forms: ["—", `ole ${sgPart}`, `olkhoon ${sgPart}`, `olkhooma ${plPart}`, `olkaa ${plPart}`, `olkhoot ${plPart}`], passive: `olkhoon ${pass.participle}` },
    { section: "Potential perfect tense", forms: AUX_POT.map((a, i) => `${a} ${i >= 3 ? plPart : sgPart}`), passive: `lienee ${pass.participle}`, note: "Rare/almost unknown in Meänkieli." },
    { section: "Present perfect negative tense", forms: NEG.map((n, i) => `${n} ole ${i >= 3 ? plPart : sgPart}`), passive: `ei ole ${pass.participle}` },
    { section: "Past perfect negative tense", forms: ["en ollu " + sgPart, "et ollu " + sgPart, "ei ollu " + sgPart, "emmä olheet " + plPart, "että olheet " + plPart, "ei olheet " + plPart], passive: `ei oltu ${pass.participle}` },
    { section: "Conditional perfect negative tense", forms: NEG.map((n, i) => `${n} ${AUX_COND_NEG_MAIN} ${i >= 3 ? plPart : sgPart}`), passive: `ei olis ${pass.participle}` },
    { section: "Potential perfect negative tense", forms: NEG.map((n, i) => `${n} ${AUX_POT_NEG_MAIN} ${i >= 3 ? plPart : sgPart}`), passive: "—", note: "Rare/almost unknown in Meänkieli." }
  ];
}

function passiveNegativePresent(d, passivePresent) {
  // Meänkieli grammar gives ei + infinitive-like form for non-type-1 verbs
  // (ei huomata, ei nousta, ei mennä, ei saa). Type 1 keeps the weak passive stem.
  if (d.type !== 1) return d.word;
  if (/thään$/.test(passivePresent)) return passivePresent.replace(/thään$/, "tä");
  if (/thaan$/.test(passivePresent)) return passivePresent.replace(/thaan$/, "ta");
  if (/hään$/.test(passivePresent)) return passivePresent.replace(/hään$/, "ä");
  if (/haan$/.test(passivePresent)) return passivePresent.replace(/haan$/, "a");
  return passivePresent;
}

function passiveSecondInessive(d) {
  const pp = passivePieces(d).participle;
  if (pp.endsWith("y")) return pp.slice(0, -1) + "äessä";
  if (pp.endsWith("u")) return pp.slice(0, -1) + "aessa";
  return pp + "essa";
}

function infinitiveRows(d) {
  const stem = d.presentStem || d.strongStem || d.infStem;
  const eStem = secondInfStem(d);
  const ma = stem + MA(stem);
  const pass = passivePieces(d);
  const ppp = passivePresentParticiple(d);
  const sgPart = activePastParticipleSg(d);
  return [
    { form: "1st infinitive", active: d.word, passive: "—", note: "Dictionary/basic form" },
    { form: "1st long infinitive", active: d.word + "kse(en)", passive: "—", note: "Meänkieli grammar gives -kse + possessive suffix; uncommon." },
    { form: "2nd infinitive inessive", active: eStem + SSA(eStem), passive: passiveSecondInessive(d) },
    { form: "2nd infinitive instructive", active: eStem + "n", passive: "—" },
    { form: "3rd infinitive inessive", active: ma + SSA(ma), passive: "—" },
    { form: "3rd infinitive elative", active: ma + STA(ma), passive: "—" },
    { form: "3rd infinitive illative", active: stem + (frontHarmony(stem) ? "hmään" : "hmaan"), passive: "—", note: "Meänkieli-style h in illative, e.g. tekemhään/kuuntelemhaan." },
    { form: "3rd infinitive adessive", active: ma + LLA(ma), passive: "—" },
    { form: "3rd infinitive abessive", active: ma + TTA(ma), passive: "—" },
    { form: "3rd infinitive instructive", active: ma + "n", passive: pass.participle.replace(/[uy]$/, "a") + "man" },
    { form: "4th infinitive nominative", active: stem + "minen", passive: "—" },
    { form: "4th infinitive partitive", active: stem + (frontHarmony(stem) ? "mistä" : "mista"), passive: "—" },
    { form: "5th infinitive", active: ma + "isillaan", passive: "—" },
    { form: "Present participle", active: stem + VA(stem), passive: ppp },
    { form: "Past participle", active: sgPart, passive: pass.participle },
    { form: "Agent participle", active: ma, passive: "—" }
  ];
}

function secondInfStem(d) {
  if (d.word === "tehä") return "tehe";
  if (d.word === "nähä") return "nähe";
  if (d.type === 1) {
    let s = d.strongStem;
    if (s.endsWith("e")) s = s.slice(0, -1) + "i";
    return s + "e";
  }
  if (d.type === 2) return d.infStem + "e";
  if (d.type === 3) return d.consonantStem + "e";
  if (d.type === 4 || d.type === 5 || d.type === 6) return d.infStem + "e";
  return d.presentStem + "e";
}

function confidenceFor(d, dictHit) {
  let score = 70;
  if (dictHit.found && dictHit.entry.pos?.includes("v")) score += 10;
  if (d.type === "unknown") score -= 30;
  if (d.notes.some(n => /estimated|Potential|Unknown/i.test(n))) score -= 5;
  if (d.notes.some(n => /Possible consonant gradation not applied/i.test(n))) score -= 10;
  if (["tehä", "nähä", "saa", "jua", "syä", "myyä", "käyä", "voia", "olla", "tulla", "mennä"].includes(d.word)) score += 10;
  return Math.max(25, Math.min(90, score));
}

function renderDict(hit) {
  if (!hit.found) {
    return `<div class="status warn"><strong>Dictionary:</strong> no exact dictionary entry found. Conjugation still generated from morphology only.</div>`;
  }
  const e = hit.entry;
  const pos = (e.pos || []).join(", ") || "—";
  const tr = (e.translations || []).join("; ") || "No Swedish translation tag found.";
  const variants = e.variants?.length ? `<br><strong>Variants:</strong> ${escapeHtml(e.variants.join(", "))}` : "";
  const mismatch = e.pos?.includes("v") ? "" : `<div class="status warn"><strong>Warning:</strong> dictionary entry is not marked as a verb.</div>`;
  return `<div class="status ok"><strong>Dictionary:</strong> ${escapeHtml(e.headword)} ${hit.via !== "exact" ? `(${escapeHtml(hit.via)})` : ""}<br><strong>Part of speech:</strong> ${escapeHtml(pos)}<br><strong>Swedish:</strong> ${escapeHtml(tr)}${variants}</div>${mismatch}`;
}

function renderMeta(d, confidence) {
  const notes = [...(d.notes || [])];
  if (d.type === 2) notes.push("Meänkieli has short-vowel type-2 infinitives such as jua/syä/käyä where standard Finnish often has juoda/syödä/käydä.");
  notes.push("The table is generated from morphology; dictionary entries are not used to choose forms.");
  return `<div class="meta-grid">
    <div><span>Verb type</span><strong>${escapeHtml(TYPE_LABELS[d.type] || TYPE_LABELS.unknown)}</strong></div>
    <div><span>Detected stem</span><strong>${escapeHtml(d.presentStem || d.weakStem || d.infStem)}</strong></div>
    <div><span>Infinitive/consonant stem</span><strong>${escapeHtml(d.infStem || "—")} / ${escapeHtml(d.consonantStem || "—")}</strong></div>
    <div><span>Strong → weak</span><strong>${escapeHtml(d.strongStem || "—")} → ${escapeHtml(d.weakStem || "—")}</strong></div>
    <div><span>Rule confidence</span><strong>${confidence}%</strong></div>
  </div>
  <details class="notes" open><summary>Rule notes</summary><ul>${notes.map(n => `<li>${escapeHtml(n)}</li>`).join("")}</ul></details>`;
}

function renderMainTable(rows) {
  const heads = ["Form", ...PRONOUNS, "passive", "note"];
  return `<div class="table-wrap"><table><thead><tr>${heads.map(h => `<th>${escapeHtml(h)}</th>`).join("")}</tr></thead><tbody>${rows.map(r => {
    const cells = [r.section, ...r.forms, r.passive || "—", r.note || ""];
    return `<tr>${cells.map(c => `<td>${escapeHtml(c)}</td>`).join("")}</tr>`;
  }).join("")}</tbody></table></div>`;
}

function renderInfTable(rows) {
  return `<div class="table-wrap small"><table><thead><tr><th>Form</th><th>Active</th><th>Passive</th><th>Note</th></tr></thead><tbody>${rows.map(r => `<tr><td>${escapeHtml(r.form)}</td><td>${escapeHtml(r.active)}</td><td>${escapeHtml(r.passive || "—")}</td><td>${escapeHtml(r.note || "")}</td></tr>`).join("")}</tbody></table></div>`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function conjugate() {
  const input = document.getElementById("verbInput").value;
  const word = normalizeWord(input);
  const output = document.getElementById("output");
  if (!word) {
    output.innerHTML = `<div class="empty">Enter a Meänkieli verb infinitive, e.g. <button class="linklike" data-sample="tapahtua">tapahtua</button>, <button class="linklike" data-sample="jua">jua</button>, <button class="linklike" data-sample="huomata">huomata</button>.</div>`;
    bindSamples();
    return;
  }
  const dictHit = lookupDictionary(word);
  const d = derive(word);
  const confidence = confidenceFor(d, dictHit);
  const mainRows = formRows(d);
  const infRows = infinitiveRows(d);
  output.innerHTML = `
    <section class="card">${renderDict(dictHit)}${renderMeta(d, confidence)}</section>
    <section class="card"><h2>Finite forms</h2>${renderMainTable(mainRows)}</section>
    <section class="card"><h2>Infinitives and participles</h2>${renderInfTable(infRows)}</section>
  `;
}

function bindSamples() {
  document.querySelectorAll("[data-sample]").forEach(btn => {
    btn.addEventListener("click", () => {
      document.getElementById("verbInput").value = btn.dataset.sample;
      conjugate();
    });
  });
}

window.addEventListener("DOMContentLoaded", () => {
  document.getElementById("conjugateBtn").addEventListener("click", conjugate);
  document.getElementById("verbInput").addEventListener("keydown", (e) => {
    if (e.key === "Enter") conjugate();
  });
  document.querySelectorAll("[data-sample]").forEach(btn => {
    btn.addEventListener("click", () => {
      document.getElementById("verbInput").value = btn.dataset.sample;
      conjugate();
    });
  });
  conjugate();
});

// Expose a tiny test hook for local development.
window.__conjugator = { derive, formRows, infinitiveRows, lookupDictionary, presentForms, pastForms, conditionalForms, passivePieces, activePastParticipleSg, activePastParticiplePl };
