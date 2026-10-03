from pathlib import Path
from zipfile import ZipFile
import xml.etree.ElementTree as ET
import json, hashlib

import argparse
parser=argparse.ArgumentParser(description='Build minimal grammatical facts from the supplied Word tables, excluding sentences and translations.')
parser.add_argument('--source',type=Path,required=True)
parser.add_argument('--output',type=Path,required=True)
args=parser.parse_args()
doc=args.source
ns={'w':'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
body=ET.fromstring(ZipFile(doc).read('word/document.xml')).find('w:body',ns)
# These are grammatical facts transcribed and checked against the rendered
# source. Sentences and Swedish translations are not included in the patch.
tables={
2:('participle','antanu alkanu käsittäny ymmärtäny unhouttanu herättäny ostanheet kirjottanu rakastanu auttanu'),
5:('past','anto alko käsitin ymmärsi unhoutti herätti osti kirjotti rakasti autoima'),
9:('participle','huomanu hypänny tarjonnu halunnu pölänny hakannu maanu kaonu'),
12:('past','havati hyppäsi tarjosi halusi pölkäsi määräsi arvasin hakkasi makasi katosi'),
16:('participle','saanu myyny juonu tehny nähny syöny lyöny käyny jääny'),
19:('past','sai myit joi saatto tehin näimä söit löi kävin jäimä'),
23:('participle','noussu pessy laukkonu päässeet purru murehtinu kussu noussu päässy laukonu'),
25:('past','nousi pesi juoksi/laukko pääsi puri murehti kusi nousi pääsi juoksi/laukko'),
28:('participle','tullu menny hunderanu ollu kuollu pannu purru murehtinu ajatellu kuunnellu'),
31:('past','tuli menin aatteli oli kuoli panin puri murehti muistin kuntelima'),
36:('participle','tarttenu häirinny valinnu selitäny tulkinnu tuomittu hoitanu'),
39:('past','tarttin häiritti valiti tulkittin tuomit hoiti'),
44:('participle','vanhaintunu lämpiny kylmeny nuorentunu lyhehneet vaalenu tummistunu heikonu laihtunu'),
47:('past','vanhentu lämpeni kylmisty näytti lyhenty vaalentu heikosi laihtu')}
special_slots={(2,7):'pl',(5,3):'mie',(5,10):'met',(12,7):'mie',
 (19,2):'net/het',(19,5):'mie',(19,6):'met',(19,7):'net/het',(19,9):'mie',(19,10):'met',
 (23,4):'pl',(31,2):'mie',(31,6):'mie',(31,9):'mie',(31,10):'met',
 (36,6):'passive',(39,1):'mie',(39,4):'mie',(39,5):'net/het',(44,5):'pl'}
skips={(19,4):'lexical-substitution',(25,3):'ambiguous-lemma',(25,6):'lexical-substitution',
 (25,10):'ambiguous-lemma',(28,3):'lexical-substitution',(28,8):'lexical-substitution',
 (31,8):'lexical-substitution',(44,2):'ambiguous-lemma',(44,4):'unresolved-stem',
 (44,7):'unresolved-stem',(44,9):'unresolved-stem',(47,4):'lexical-substitution'}
rows=[]
for table,(kind,forms) in tables.items():
 tr=body[table].findall('w:tr',ns)[1:]
 forms=forms.split()
 assert len(tr)==len(forms)
 for number,(row,surface) in enumerate(zip(tr,forms),1):
  cells=[''.join(t.text or '' for t in c.findall('.//w:t',ns)) for c in row.findall('w:tc',ns)]
  assert surface in cells[1],(table,number,surface)
  label=cells[0].split('—')[0].strip()
  lemma=label.split(' ')[0]
  canonical={'tehjä':'tehä','nähjä':'nähä'}.get(lemma,lemma)
  disposition=skips.get((table,number),'direct')
  if lemma in ('tehjä','nähjä'):disposition='visible-variant'
  if label.startswith('tarvita / tarttea'):
   canonical='tarttea';disposition='variant-specific'
  rows.append({'id':f'T{table}.R{number}','table':table,'row':number,'source_lemma':label,
   'lemma':canonical,'kind':kind,'slot':special_slots.get((table,number),'sg' if kind=='participle' else 'se/hään'),
   'surface':surface,'disposition':disposition})
assert len(rows)==127
assert 'aatelin' in ''.join(t.text or '' for t in body[33].findall('.//w:t',ns))
rows.append({'id':'P33','paragraph':33,'source_lemma':'aatela','lemma':'aatela','kind':'past','slot':'mie','surface':'aatelin','disposition':'direct'})
stems={
 'rakastaa':['rakasti','T5.R9','all'],
 'auttaa':['autoi','T5.R10','weak'],
 'pölätä':['pölkäsi','T12.R5','all'],
 'määrätä':['määräsi','T12.R6','all'],
 'arvata':['arvasi','T12.R7','all'],
 'kaota':['katosi','T12.R10','all'],
 'lyä':['löi','T19.R8','all'],
 'jää’ä':['jäi','T19.R10','all'],
 'kusta':['kusi','T25.R7','all'],
 'kuolla':['kuoli','T31.R5','all'],
 'panna':['pani','T31.R6','all'],
 'purra':['puri','T31.R7','all'],
 'muistaa':['muisti','T31.R9','all'],
 'kuunnella':['kunteli','T31.R10','all'],
 'tulkita':['tulkitti','T39.R4','weak']}
data={'source_file':doc.name,'source_sha256':hashlib.sha256(doc.read_bytes()).hexdigest(),
 'source_note':'The document states that its sentences were composed. Direct forms are document examples, not independent corpus attestation or analyzer validation.',
 'rows':rows,'stems':stems,'aliases':{'tehjä':'tehä','nähjä':'nähä'},'blocked_rule_lemmas':['surra']}
def format_data(data):
    prefix = {key:value for key,value in data.items() if key not in ('rows','stems','aliases','blocked_rule_lemmas')}
    text = json.dumps(prefix,ensure_ascii=False,indent=2)[:-2] + ',\n  "rows": [\n'
    text += ',\n'.join('    '+json.dumps(row,ensure_ascii=False,separators=(',',':')) for row in data['rows'])
    text += '\n  ],\n  "stems": '+json.dumps(data['stems'],ensure_ascii=False)+',\n  "aliases": '+json.dumps(data['aliases'],ensure_ascii=False)+',\n  "blocked_rule_lemmas": '+json.dumps(data['blocked_rule_lemmas'])+'\n}'
    return text
args.output.write_text('/* Minimal grammatical facts from the user-supplied document; no source sentences. */\n(function (global) {\n  "use strict";\n  const data = '+format_data(data)+';\n  function freeze(value) { if (value && typeof value === "object") { Object.values(value).forEach(freeze); Object.freeze(value); } return value; }\n  global.MeanKieliPastExampleData = freeze(data);\n})(window);\n',encoding='utf-8')
print('Exported 128 individually classified source facts and 15 bounded lexical past stems.')
