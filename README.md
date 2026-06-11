# Meänkieli Verb Conjugator

Standalone static web app. Open `index.html` in a browser or serve the folder with any static server.

## What it does

- Accepts a Meänkieli/Finnish-like verb infinitive.
- Looks up the word in the included Meänkieli–Swedish dictionary extract (`dictionary.js`).
- Shows Swedish definitions if found.
- Generates finite forms, negatives, perfect forms, infinitives, participles, and passive forms from morphology rules.
- Does not use the dictionary to choose conjugation forms.

## Main files

- `index.html` — app shell
- `styles.css` — responsive scrollable UI
- `app.js` — morphology/conjugation engine
- `dictionary.js` — extracted headwords, POS tags, Swedish translation tags, and variants from the uploaded XML dictionary

## Rule sources used

- General Finnish verb morphology: Uusi kielemme pages on verb types, stems, negatives, passives, conditionals, imperatives, infinitives, and participles.
- Meänkieli-specific modifications: uploaded grammar PDF, especially the verb chapter covering five verb groups, Meänkieli personal endings, passive forms, conditionals, imperatives, infinitives, and participles.
- Dictionary check: uploaded Meänkieli–Swedish XML dictionary.

## Known limitations

This is a rule engine, not a validated grammatical authority. Meänkieli has dialectal variation. Potential mood is marked as rare/low confidence because the uploaded grammar states it is almost unknown in Meänkieli. Some rare consonant gradation and irregular verb cases will need additional explicit morphology rules.
