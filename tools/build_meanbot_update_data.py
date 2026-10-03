#!/usr/bin/env python3
"""Export bounded factual morphology components; never corpus text or code."""
import argparse
import csv
import hashlib
import json
from pathlib import Path

FAMILIES = {
    'active_conditional_connegative': ('conditional', 'Act+Cond+ConNeg'),
    'passive_present_connegative': ('passive_present', 'Pass+Ind+Prs+ConNeg'),
    'passive_past_connegative': ('passive_past', 'Pass+Ind+Prt+ConNeg'),
}


def build(source):
    records = {}
    potential = None
    with source.open(encoding='utf-8', newline='') as handle:
        reader = csv.DictReader(handle, delimiter='\t')
        for row in reader:
            if row['item_kind'] != 'morphology':
                continue
            family = FAMILIES.get(row['cell'])
            is_potential = row['lemma'] == 'olla' and row['cell'] == 'potential_present_sg3'
            if family is None and not is_potential:
                continue
            generated = row['surfaces'].split(' | ') if row['surfaces'] else []
            verified = row['roundtrip_surfaces'].split(' | ') if row['roundtrip_surfaces'] else []
            if row['generation_supported'] != 'yes' or not verified or not set(verified) <= set(generated):
                raise ValueError(f"Missing individual roundtrip evidence: {row['lemma']} {row['cell']}")
            if is_potential:
                if row['requested'] != 'olla+V+Act+Pot+Prs+Sg3' or verified != ['lienee']:
                    raise ValueError('Potential export must remain exactly olla Sg3 lienee')
                potential = [reader.line_num, verified]
                continue
            field, tags = family
            if row['requested'] != f"{row['lemma']}+V+{tags}":
                raise ValueError('Unexpected feature request')
            entry = records.setdefault(row['lemma'], {})
            if field in entry:
                raise ValueError('Duplicate source component')
            entry[field] = [reader.line_num, verified]
    if len(records) != 39 or any(set(entry) != {'conditional', 'passive_present', 'passive_past'} for entry in records.values()):
        raise ValueError('Expected three bounded component families for exactly 39 lemmas')
    if potential is None:
        raise ValueError('Missing exact potential evidence')
    data = {
        'source_file': 'phase21f/VERB_RUNTIME_RESULTS.tsv',
        'source_sha256': hashlib.sha256(source.read_bytes()).hexdigest(),
        'records': records,
        'potential': potential,
    }
    return '''(function (global) {
  "use strict";
  // Factual forms and source locators only. Each surface independently appears
  // in the saved audit's roundtrip_surfaces field; row status is never imported.
  const data = ''' + json.dumps(data, ensure_ascii=False, indent=2) + ''';
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
'''


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source', type=Path, required=True)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    args.output.write_text(build(args.source), encoding='utf-8')
    print('Exported 117 factual connegative components and the exact lienee cell.')


if __name__ == '__main__':
    main()
