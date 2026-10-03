(function (global) {
  "use strict";
  // Factual forms and source locators only. Each surface independently appears
  // in the saved audit's roundtrip_surfaces field; row status is never imported.
  const data = {
  "source_file": "phase21f/VERB_RUNTIME_RESULTS.tsv",
  "source_sha256": "1837f6e71340b02a8ede6c75e2002c375012b98195925fb43157dfbc24a0eb29",
  "records": {
    "antaa": {
      "conditional": [
        23,
        [
          "antais"
        ]
      ],
      "passive_present": [
        34,
        [
          "antaa"
        ]
      ],
      "passive_past": [
        35,
        [
          "annettu"
        ]
      ]
    },
    "alkaa": {
      "conditional": [
        83,
        [
          "alkais"
        ]
      ],
      "passive_present": [
        94,
        [
          "alkaa"
        ]
      ],
      "passive_past": [
        95,
        [
          "alettu"
        ]
      ]
    },
    "käsittää": {
      "conditional": [
        143,
        [
          "käsittäis"
        ]
      ],
      "passive_present": [
        154,
        [
          "käsittää"
        ]
      ],
      "passive_past": [
        155,
        [
          "käsitetty"
        ]
      ]
    },
    "ymmärtää": {
      "conditional": [
        203,
        [
          "ymmärtäis"
        ]
      ],
      "passive_present": [
        214,
        [
          "ymmärtää"
        ]
      ],
      "passive_past": [
        215,
        [
          "ymmäretty"
        ]
      ]
    },
    "ostaa": {
      "conditional": [
        263,
        [
          "ostais"
        ]
      ],
      "passive_present": [
        274,
        [
          "ostaa"
        ]
      ],
      "passive_past": [
        275,
        [
          "ostettu"
        ]
      ]
    },
    "kirjottaa": {
      "conditional": [
        323,
        [
          "kirjottais"
        ]
      ],
      "passive_present": [
        334,
        [
          "kirjottaa"
        ]
      ],
      "passive_past": [
        335,
        [
          "kirjotettu"
        ]
      ]
    },
    "huomata": {
      "conditional": [
        383,
        [
          "huomais"
        ]
      ],
      "passive_present": [
        394,
        [
          "huomata"
        ]
      ],
      "passive_past": [
        395,
        [
          "huomattu"
        ]
      ]
    },
    "avata": {
      "conditional": [
        443,
        [
          "avais"
        ]
      ],
      "passive_present": [
        454,
        [
          "avata"
        ]
      ],
      "passive_past": [
        455,
        [
          "avattu"
        ]
      ]
    },
    "tavata": {
      "conditional": [
        503,
        [
          "tapais"
        ]
      ],
      "passive_present": [
        514,
        [
          "tavata"
        ]
      ],
      "passive_past": [
        515,
        [
          "tavattu"
        ]
      ]
    },
    "hypätä": {
      "conditional": [
        563,
        [
          "hyppäis"
        ]
      ],
      "passive_present": [
        574,
        [
          "hypätä"
        ]
      ],
      "passive_past": [
        575,
        [
          "hypätty"
        ]
      ]
    },
    "tarjota": {
      "conditional": [
        623,
        [
          "tarjoais"
        ]
      ],
      "passive_present": [
        634,
        [
          "tarjota"
        ]
      ],
      "passive_past": [
        635,
        [
          "tarjottu"
        ]
      ]
    },
    "haluta": {
      "conditional": [
        683,
        [
          "haluais"
        ]
      ],
      "passive_present": [
        694,
        [
          "haluta"
        ]
      ],
      "passive_past": [
        695,
        [
          "haluttu"
        ]
      ]
    },
    "hakata": {
      "conditional": [
        743,
        [
          "hakkais"
        ]
      ],
      "passive_present": [
        754,
        [
          "hakata"
        ]
      ],
      "passive_past": [
        755,
        [
          "hakattu"
        ]
      ]
    },
    "maata": {
      "conditional": [
        803,
        [
          "makais"
        ]
      ],
      "passive_present": [
        814,
        [
          "maata"
        ]
      ],
      "passive_past": [
        815,
        [
          "maattu"
        ]
      ]
    },
    "saa’a": {
      "conditional": [
        863,
        [
          "sais"
        ]
      ],
      "passive_present": [
        874,
        [
          "saa",
          "saaha",
          "saaja",
          "saa’a"
        ]
      ],
      "passive_past": [
        875,
        [
          "saatu"
        ]
      ]
    },
    "jua": {
      "conditional": [
        923,
        [
          "jois"
        ]
      ],
      "passive_present": [
        934,
        [
          "jua",
          "juoa",
          "juoja"
        ]
      ],
      "passive_past": [
        935,
        [
          "juotu"
        ]
      ]
    },
    "juua": {
      "conditional": [
        983,
        [
          "juis"
        ]
      ],
      "passive_present": [
        994,
        [
          "juua"
        ]
      ],
      "passive_past": [
        995,
        [
          "juuttu"
        ]
      ]
    },
    "syä": {
      "conditional": [
        1043,
        [
          "söis"
        ]
      ],
      "passive_present": [
        1054,
        [
          "syä"
        ]
      ],
      "passive_past": [
        1055,
        [
          "syöty"
        ]
      ]
    },
    "myyä": {
      "conditional": [
        1103,
        [
          "myis"
        ]
      ],
      "passive_present": [
        1114,
        [
          "myyjä",
          "myy’ä"
        ]
      ],
      "passive_past": [
        1115,
        [
          "myyty"
        ]
      ]
    },
    "voija": {
      "conditional": [
        1163,
        [
          "vois"
        ]
      ],
      "passive_present": [
        1174,
        [
          "voija",
          "voi’a"
        ]
      ],
      "passive_past": [
        1175,
        [
          "voitu"
        ]
      ]
    },
    "tehä": {
      "conditional": [
        1223,
        [
          "tekis"
        ]
      ],
      "passive_present": [
        1234,
        [
          "tehhä",
          "tehjä",
          "tehä"
        ]
      ],
      "passive_past": [
        1235,
        [
          "tehty"
        ]
      ]
    },
    "nähä": {
      "conditional": [
        1283,
        [
          "näkis"
        ]
      ],
      "passive_present": [
        1294,
        [
          "nähhä",
          "nähjä",
          "nähä"
        ]
      ],
      "passive_past": [
        1295,
        [
          "nähty"
        ]
      ]
    },
    "käyä": {
      "conditional": [
        1343,
        [
          "kävis"
        ]
      ],
      "passive_present": [
        1354,
        [
          "käyä"
        ]
      ],
      "passive_past": [
        1355,
        [
          "käyty"
        ]
      ]
    },
    "nousta": {
      "conditional": [
        1403,
        [
          "nousis"
        ]
      ],
      "passive_present": [
        1414,
        [
          "nousta"
        ]
      ],
      "passive_past": [
        1415,
        [
          "noustu"
        ]
      ]
    },
    "pestä": {
      "conditional": [
        1463,
        [
          "pesis"
        ]
      ],
      "passive_present": [
        1474,
        [
          "pestä"
        ]
      ],
      "passive_past": [
        1475,
        [
          "pesty"
        ]
      ]
    },
    "juosta": {
      "conditional": [
        1523,
        [
          "juoksis"
        ]
      ],
      "passive_present": [
        1534,
        [
          "juosta"
        ]
      ],
      "passive_past": [
        1535,
        [
          "juostu"
        ]
      ]
    },
    "päästä": {
      "conditional": [
        1583,
        [
          "pääsis"
        ]
      ],
      "passive_present": [
        1594,
        [
          "päästä"
        ]
      ],
      "passive_past": [
        1595,
        [
          "päästy"
        ]
      ]
    },
    "tulla": {
      "conditional": [
        1643,
        [
          "tulis"
        ]
      ],
      "passive_present": [
        1654,
        [
          "tulla"
        ]
      ],
      "passive_past": [
        1655,
        [
          "tultu"
        ]
      ]
    },
    "mennä": {
      "conditional": [
        1703,
        [
          "menis"
        ]
      ],
      "passive_present": [
        1714,
        [
          "mennä"
        ]
      ],
      "passive_past": [
        1715,
        [
          "menty"
        ]
      ]
    },
    "olla": {
      "conditional": [
        1763,
        [
          "olis"
        ]
      ],
      "passive_present": [
        1774,
        [
          "olla"
        ]
      ],
      "passive_past": [
        1775,
        [
          "oltu"
        ]
      ]
    },
    "aatela": {
      "conditional": [
        1823,
        [
          "aattelis"
        ]
      ],
      "passive_present": [
        1834,
        [
          "aatela"
        ]
      ],
      "passive_past": [
        1835,
        [
          "aatteltu"
        ]
      ]
    },
    "tarvita": {
      "conditional": [
        1883,
        [
          "tarvittis"
        ]
      ],
      "passive_present": [
        1894,
        [
          "tarvita"
        ]
      ],
      "passive_past": [
        1895,
        [
          "tarvittu"
        ]
      ]
    },
    "tarttea": {
      "conditional": [
        1943,
        [
          "tarttis"
        ]
      ],
      "passive_present": [
        1954,
        [
          "tarttea"
        ]
      ],
      "passive_past": [
        1955,
        [
          "tarttettu"
        ]
      ]
    },
    "vanheta": {
      "conditional": [
        2003,
        [
          "vanhenis"
        ]
      ],
      "passive_present": [
        2014,
        [
          "vanheta"
        ]
      ],
      "passive_past": [
        2015,
        [
          "vanhettu"
        ]
      ]
    },
    "lämmetä": {
      "conditional": [
        2063,
        [
          "lämpenis"
        ]
      ],
      "passive_present": [
        2074,
        [
          "lämmetä"
        ]
      ],
      "passive_past": [
        2075,
        [
          "lämmetty",
          "lämpetty"
        ]
      ]
    },
    "paeta": {
      "conditional": [
        2123,
        [
          "paenis",
          "pakenis"
        ]
      ],
      "passive_present": [
        2134,
        [
          "paeta"
        ]
      ],
      "passive_past": [
        2135,
        [
          "paettu",
          "pakettu"
        ]
      ]
    },
    "kylmetä": {
      "conditional": [
        2183,
        [
          "kylmenis"
        ]
      ],
      "passive_present": [
        2194,
        [
          "kylmetä"
        ]
      ],
      "passive_past": [
        2195,
        [
          "kylmetty"
        ]
      ]
    },
    "lyhetä": {
      "conditional": [
        2243,
        [
          "lyhenis"
        ]
      ],
      "passive_present": [
        2254,
        [
          "lyhetä"
        ]
      ],
      "passive_past": [
        2255,
        [
          "lyhetty"
        ]
      ]
    },
    "vaaleta": {
      "conditional": [
        2303,
        [
          "vaalenis"
        ]
      ],
      "passive_present": [
        2314,
        [
          "vaaleta"
        ]
      ],
      "passive_past": [
        2315,
        [
          "vaalettu"
        ]
      ]
    }
  },
  "potential": [
    1778,
    [
      "lienee"
    ]
  ]
};
  for (const entry of Object.values(data.records)) {
    for (const component of Object.values(entry)) {
      Object.freeze(component[1]);
      Object.freeze(component);
    }
    Object.freeze(entry);
  }
  Object.freeze(data.records);
  Object.freeze(data.potential[1]);
  Object.freeze(data.potential);
  global.MeanKieliUpdateData = Object.freeze(data);
})(window);
