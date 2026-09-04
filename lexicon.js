(function (global) {
  "use strict";

  // Development-time Meanbot evidence is represented as compact class/stem
  // metadata.  These are not stored paradigms: shared rules in morphology.js
  // turn each tuple into feature-level forms.
  const entries = {
    "antaa": { class_id: "a_vowel", weak: "anna", past: "annoi", past3: ["anto", "antoi"] },
    "alkaa": { class_id: "a_vowel", weak: "ala", past: "aloi", past3: ["alko", "alkoi"] },
    "käsittää": { class_id: "a_vowel_odd", weak: "käsitä", past: "käsiti", past3: ["käsitti"], prc_vva: true },
    "ymmärtää": { class_id: "a_vowel_odd", weak: "ymmärä", past: "ymmärsi", past3: ["ymmärsi"], prc_vva: true, illative_first: "ymmärt" },
    "ostaa": { class_id: "a_vowel", weak: "osta", past: "osti", past3: ["osti"] },
    "kirjottaa": { class_id: "a_vowel_odd", weak: "kirjota", past: "kirjoti", past3: ["kirjotti"], prc_vva: true },

    "huomata": { class_id: "ata", base: "huoma", finite: "huoma", present: "huomaa" },
    "avata": { class_id: "ata", base: "ava", finite: "ava", present: "avvaa" },
    "tavata": { class_id: "ata", base: "tava", finite: "tapa", present: "tappaa" },
    "hypätä": { class_id: "ata", base: "hypä", finite: "hyppä", present: "hyppää" },
    "hakata": { class_id: "ata", base: "haka", finite: "hakka", present: "hakkaa" },
    "maata": { class_id: "ata", base: "maa", finite: "maka", present: "makkaa" },
    "tarjota": { class_id: "uta", base: "tarjo" },
    "haluta": { class_id: "uta", base: "halu" },

    "saa’a": { class_id: "contracted", present: "saa", past: "sai", cond: "sai", inf: ["saa", "saaha", "saaja", "saa’a"], inf_e_ine: ["saaessa", "saajessa", "saa’essa"], inf_e_ins: ["saaen", "saajen", "saa’en"], passive_inf_e: ["saa’essa"] },
    "jua": { class_id: "contracted", present: "juo", past: "joi", cond: "joi", inf: ["jua", "juoa", "juoja"], inf_e_ine: ["juessa", "juoessa"], inf_e_ins: ["juoen"], passive_inf_e: ["juessa"] },
    "syä": { class_id: "contracted", present: "syö", past: "söi", cond: "söi", inf: ["syä"], inf_e_ine: ["syessä", "syöessä"], inf_e_ins: ["syöen"], passive_inf_e: ["syöessä"] },
    "myyä": { class_id: "contracted", present: "myy", past: "myi", cond: "myi", inf: ["myyjä", "myy’ä"], inf_e_ine: ["myyjessä", "myy’essä"], inf_e_ins: ["myyen", "myyjen", "myy’en"], passive_inf_e: ["myy’essä"] },
    "käyä": { class_id: "contracted_kay", present: "käy", past: "kävi", cond: "kävi", inf: ["käyä"], inf_e_ine: ["käyessä"], inf_e_ins: ["käyen"], passive_inf_e: ["käyessä"] },
    "juua": { class_id: "long_vowel", stem: "juu", past: "juui", past3: ["jui", "juui"] },

    "tehä": { class_id: "tehda", weak: "tehe", finite: "teke", past: "tehi", past3: ["teki"], inf: ["tehhä", "tehjä", "tehä"], inf_e_ine: ["tehessä"], passive_inf_e: ["tehessä"], inf_e_ins: ["tehen"] },
    "nähä": { class_id: "tehda", weak: "näe", finite: "näke", past: "näi", past3: ["näki"], inf: ["nähhä", "nähjä", "nähä"], inf_e_ine: ["nähhessä"], passive_inf_e: ["nähhessä"], inf_e_ins: ["nähen", "nähhen"] },

    "nousta": { class_id: "consonant", core: "nous", present: "nouse", third: "nousee", inf_bare: "noust", passive_roots: ["nous", "noust"], passive_past: "noust", imperative: "nous" },
    "pestä": { class_id: "consonant", core: "pes", present: "pese", third: "pessee", inf_bare: "pest", passive_roots: ["pes", "pest"], passive_past: "pest", imperative: "pes" },
    "juosta": { class_id: "consonant", core: "juoks", present: "juokse", third: "juoksee", inf_bare: "juost", passive_roots: ["juost"], passive_past: "juost", imperative: "juos", no_imp_3: true },
    "päästä": { class_id: "consonant", core: "pääs", present: "pääse", third: "pääsee", inf_bare: "pääst", passive_roots: ["pääs", "pääst"], passive_past: "pääst", imperative: "pääs" },
    "tulla": { class_id: "consonant", core: "tul", present: "tule", third: "tullee", inf_bare: "tull", passive_roots: ["tul", "tult"], passive_past: "tult", imperative: "tul" },
    "mennä": { class_id: "consonant", core: "men", present: "mene", third: "mennee", inf_bare: "menn", passive_roots: ["men", "ment"], passive_past: "ment", imperative: "men" },

    "olla": { class_id: "olla" },
    "aatela": { class_id: "aatela" },
    "tarvita": { class_id: "tarvita" },
    "tarttea": { class_id: "tarttea" },

    "vanheta": { class_id: "eta", base: "vanhe", present_roots: ["vanhene"] },
    "lämmetä": { class_id: "eta", base: "lämme", present_roots: ["lämpene"], passive_prf_extra: ["lämpetty"], plural_prc_extra: ["lämpehneet"] },
    "paeta": { class_id: "eta", base: "pae", present_roots: ["paene", "pakene"], passive_prf_extra: ["pakettu"] },
    "kylmetä": { class_id: "eta", base: "kylme", present_roots: ["kylmene"] },
    "lyhetä": { class_id: "eta", base: "lyhe", present_roots: ["lyhene"] },
    "vaaleta": { class_id: "eta", base: "vaale", present_roots: ["vaalene"] },

    // `voija` is the strict lemma.  `voia` intentionally is not an alias.
    "voija": { class_id: "contracted", present: "voi", past: "voi", cond: "voi", inf: ["voija", "voi’a"] }
  };

  const labels = Object.freeze({
    a_vowel: "A-vowel class",
    a_vowel_odd: "A-vowel odd-syllable class",
    ata: "-ata/-ätä class",
    uta: "-uta/-ytä class",
    contracted: "contracted short-vowel class",
    contracted_kay: "käyä contracted class",
    long_vowel: "long-vowel A-class",
    tehda: "tehä/nähä contracted class",
    consonant: "consonant-stem class",
    olla: "lexical copula",
    aatela: "aatela class",
    tarvita: "tarvita class",
    tarttea: "tarttea class",
    eta: "change/become -eta/-etä class"
  });

  global.MeanKieliLexicon = Object.freeze({
    entries: Object.freeze(entries),
    labels
  });
})(window);
