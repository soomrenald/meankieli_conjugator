#!/usr/bin/env python3
"""Generate the phase-1 Meanbot morphology fixtures and app comparison.

This tool is development-only.  It reads the current browser app, queries a
disposable lang-fit build, and writes regression artifacts; it is not runtime
code and does not embed a verb lexicon in the web application.
"""

from __future__ import annotations

import csv
import itertools
import json
import os
from pathlib import Path
import subprocess
import sys


ROOT = Path(__file__).resolve().parents[1]
MEANBOT_ROOT = Path(os.environ.get("MEANBOT_ROOT", "/home/wolfhard/meanbot"))
BUILD_ROOT = Path(os.environ.get("MEANKIELI_BUILD_ROOT", "/tmp/meanbot-lang-fit-audit"))
HFST_LOOKUP = Path(os.environ.get("HFST_LOOKUP", "/tmp/meanbot-runtime/hfst/usr/bin/hfst-lookup"))
GENERATOR = BUILD_ROOT / "src/fst/generator-gt-norm.hfstol"
ANALYSER = BUILD_ROOT / "src/fst/analyser-gt-norm.hfstol"
STRICT_LOOKUP = MEANBOT_ROOT / "tools/strict/meanbot-strict-lookup"

INPUTS = [
    "antaa", "alkaa", "käsittää", "ymmärtää", "ostaa", "kirjottaa",
    "huomata", "avata", "tavata", "hypätä", "tarjota", "haluta",
    "hakata", "maata", "saa'a", "saa", "jua", "juua", "syä", "myyä",
    "voia", "tehä", "nähä", "käyä", "nousta", "pestä", "juosta",
    "päästä", "tulla", "mennä", "olla", "aatela", "tarvita", "tarttea",
    "vanheta", "lämmetä", "paeta", "kylmetä", "lyhetä", "vaaleta",
]

# UI spelling/entry variants.  "saa" is genuinely ambiguous between two
# Meanbot lemmas; saa’a is selected only to exercise the shared paradigm.
LEMMA_MAP = {"saa'a": "saa’a", "saa": "saa’a", "voia": None}

PERSONS = [
    ("mie", "1", "sg", "Sg1", 0),
    ("sie", "2", "sg", "Sg2", 1),
    ("se/hään", "3", "sg", "Sg3", 2),
    ("met", "1", "pl", "Pl1", 3),
    ("tet", "2", "pl", "Pl2", 4),
    ("net/het", "3", "pl", "Pl3", 5),
]


def component(lemma: str, *tags: str) -> dict:
    """A component can have class-dependent candidate feature bundles."""
    return {"lemma": lemma, "tags": list(tags)}


def cell(
    key: str,
    ui_form: str,
    *,
    person: str = "",
    number: str = "",
    voice: str = "active",
    mood: str = "",
    tense: str = "",
    polarity: str = "positive",
    infinitive_type: str = "",
    participle_type: str = "",
    nonfinite_case: str = "",
    recipe: str = "direct",
    components: list[dict] | None = None,
    evidence: str = "HFST strict generation and analyzer roundtrip",
    notes: str = "",
) -> dict:
    return {
        "key": key,
        "ui_form": ui_form,
        "person": person,
        "number": number,
        "voice": voice,
        "mood": mood,
        "tense": tense,
        "polarity": polarity,
        "infinitive_type": infinitive_type,
        "participle_type": participle_type,
        "nonfinite_case": nonfinite_case,
        "recipe": recipe,
        "components": components or [],
        "evidence": evidence,
        "notes": notes,
    }


def build_cells() -> list[dict]:
    cells: list[dict] = []

    def finite_key(section: str, slot: str) -> str:
        return f"finite|{section}|{slot}"

    def add_finite_direct(section: str, mood: str, tense: str, tag_mid: str) -> None:
        for label, person, number, ptag, _idx in PERSONS:
            cells.append(cell(
                finite_key(section, label), section, person=person, number=number,
                mood=mood, tense=tense,
                components=[component("MAIN", f"+V+Act+{tag_mid}+{ptag}")],
                evidence="HFST strict roundtrip; finite morphology",
            ))
        cells.append(cell(
            finite_key(section, "passive"), section, voice="passive", mood=mood,
            tense=tense, components=[component("MAIN", f"+V+Pass+{tag_mid}")],
            evidence="HFST strict roundtrip; passive morphology",
        ))

    add_finite_direct("Present tense", "indicative", "present", "Ind+Prs")
    add_finite_direct("Past tense", "indicative", "past", "Ind+Prt")
    add_finite_direct("Conditional mood", "conditional", "present", "Cond")

    # Imperative person inventory follows the real UI.  The general third-
    # singular tag is +Sg in the current transducer; olla uniquely uses +Sg3.
    section = "Imperative mood"
    for label, person, number, ptag, _idx in PERSONS:
        if label == "mie":
            cells.append(cell(finite_key(section, label), section, person=person,
                              number=number, mood="imperative", recipe="unsupported",
                              evidence="UI intentionally displays em dash",
                              notes="No first-person singular imperative UI form."))
        elif label == "se/hään":
            cells.append(cell(
                finite_key(section, label), section, person=person, number=number,
                mood="imperative", components=[component(
                    "MAIN", "+V+Act+Imprt+Sg3", "+V+Act+Imprt+Sg")],
                evidence="HFST strict roundtrip; class-dependent Sg3/Sg tag",
            ))
        else:
            cells.append(cell(
                finite_key(section, label), section, person=person, number=number,
                mood="imperative", components=[component("MAIN", f"+V+Act+Imprt+{ptag}")],
                evidence="HFST strict roundtrip where the lexical class exposes the cell",
            ))
    cells.append(cell(
        finite_key(section, "passive"), section, voice="passive", mood="imperative",
        recipe="unsupported", evidence="No +V+Pass+Imprt path in current Meanbot HFST",
    ))

    # Potential has no feature path in the current Meanbot/lang-fit tagset.
    for section, polarity in (("Potential tense", "positive"),
                              ("Potential negative tense", "negative")):
        for label, person, number, _ptag, _idx in PERSONS:
            cells.append(cell(
                finite_key(section, label), section, person=person, number=number,
                mood="potential", polarity=polarity, recipe="unsupported",
                evidence="No +Pot tag/path in current Meanbot HFST",
            ))
        cells.append(cell(
            finite_key(section, "passive"), section, voice="passive", mood="potential",
            polarity=polarity, recipe="unsupported",
            evidence="No +Pot tag/path in current Meanbot HFST",
        ))

    # Present negative is the one broadly active negative construction in the
    # Meanbot sentence layer.  Passive composition remains grammar-partial.
    section = "Present negative tense"
    for label, person, number, ptag, _idx in PERSONS:
        cells.append(cell(
            finite_key(section, label), section, person=person, number=number,
            mood="indicative", tense="present", polarity="negative",
            recipe="licensed_composition",
            components=[component("ei", f"+V+Neg+Act+Prs+{ptag}"),
                        component("MAIN", "+V+Act+Ind+Prs+ConNeg")],
            evidence="HFST component roundtrip; Meanbot S2-NEG-001 active",
        ))
    cells.append(cell(
        finite_key(section, "passive"), section, voice="passive", mood="indicative",
        tense="present", polarity="negative", recipe="composition",
        components=[component("ei", "+V+Neg+Act+Prs+Sg3"),
                    component("MAIN", "+V+Pass+Ind+Prs+ConNeg")],
        evidence="HFST components exist; Meanbot negative passive grammar deferred",
    ))

    section = "Past negative tense"
    for label, person, number, ptag, _idx in PERSONS:
        prc_tag = "+V+Act+PrfPrc+Sg+Nom" if number == "sg" else "+V+Act+PrfPrc+Pl+Nom"
        cells.append(cell(
            finite_key(section, label), section, person=person, number=number,
            mood="indicative", tense="past", polarity="negative", recipe="composition",
            components=[component("ei", f"+V+Neg+Act+Prs+{ptag}"),
                        component("MAIN", prc_tag)],
            evidence="HFST auxiliary/participle components; generic past-negative grammar not active",
        ))
    cells.append(cell(
        finite_key(section, "passive"), section, voice="passive", mood="indicative",
        tense="past", polarity="negative", recipe="composition",
        components=[component("ei", "+V+Neg+Act+Prs+Sg3"),
                    component("MAIN", "+V+Pass+Ind+Prt+ConNeg")],
        evidence="HFST components exist; Meanbot negative passive grammar deferred",
        notes="Past passive connegative is distinct from passive perfect participle.",
    ))

    section = "Conditional negative tense"
    for label, person, number, ptag, _idx in PERSONS:
        cells.append(cell(
            finite_key(section, label), section, person=person, number=number,
            mood="conditional", tense="present", polarity="negative", recipe="composition",
            components=[component("ei", f"+V+Neg+Act+Prs+{ptag}"),
                        component("MAIN", "+V+Act+Cond+ConNeg")],
            evidence="HFST components; only a narrow negative-conditional Meanbot schema is active",
        ))
    cells.append(cell(
        finite_key(section, "passive"), section, voice="passive", mood="conditional",
        tense="present", polarity="negative", recipe="composition",
        components=[component("ei", "+V+Neg+Act+Prs+Sg3"),
                    component("MAIN", "+V+Pass+Cond+ConNeg")],
        evidence="HFST components where exposed; passive negative grammar deferred",
    ))

    section = "Imperative negative mood"
    for label, person, number, ptag, _idx in PERSONS:
        if label in ("sie", "tet"):
            cells.append(cell(
                finite_key(section, label), section, person=person, number=number,
                mood="imperative", polarity="negative", recipe="composition",
                components=[component("ei", f"+V+Neg+Act+Imprt+{ptag}"),
                            component("MAIN", f"+V+Neg+Act+Imprt+ConNeg+{ptag}")],
                evidence="HFST components; Meanbot negative imperative grammar deferred",
            ))
        else:
            cells.append(cell(
                finite_key(section, label), section, person=person, number=number,
                mood="imperative", polarity="negative", recipe="unsupported",
                evidence="No complete strict negative-imperative component path for this UI person",
            ))
    cells.append(cell(
        finite_key(section, "passive"), section, voice="passive", mood="imperative",
        polarity="negative", recipe="unsupported",
        evidence="UI displays em dash; no passive imperative path",
    ))

    def add_perfect(section: str, aux_mid: str, mood: str, tense: str,
                    polarity: str = "positive") -> None:
        for label, person, number, ptag, _idx in PERSONS:
            prc_tag = "+V+Act+PrfPrc+Sg+Nom" if number == "sg" else "+V+Act+PrfPrc+Pl+Nom"
            cells.append(cell(
                finite_key(section, label), section, person=person, number=number,
                mood=mood, tense=tense, polarity=polarity, recipe="composition",
                components=[component("olla", f"+V+Act+{aux_mid}+{ptag}"),
                            component("MAIN", prc_tag)],
                evidence="HFST auxiliary and participle components; no generic Meanbot compound-tense rule",
            ))
        cells.append(cell(
            finite_key(section, "passive"), section, voice="passive", mood=mood,
            tense=tense, polarity=polarity, recipe="composition",
            components=[component("olla", f"+V+Act+{aux_mid}+Sg3"),
                        component("MAIN", "+V+Pass+PrfPrc+Sg+Nom")],
            evidence="HFST auxiliary and participle components; no generic Meanbot passive compound rule",
        ))

    add_perfect("Present perfect tense", "Ind+Prs", "indicative", "perfect")
    add_perfect("Past perfect / pluskvamperfektum", "Ind+Prt", "indicative", "pluperfect")
    add_perfect("Conditional perfect tense", "Cond", "conditional", "perfect")

    section = "Imperative perfect tense"
    for label, person, number, ptag, _idx in PERSONS:
        if label == "mie":
            cells.append(cell(finite_key(section, label), section, person=person,
                              number=number, mood="imperative", tense="perfect",
                              recipe="unsupported", evidence="UI displays em dash"))
            continue
        aux_tags = ("+V+Act+Imprt+Sg3", "+V+Act+Imprt+Sg") if label == "se/hään" else (f"+V+Act+Imprt+{ptag}",)
        prc_tag = "+V+Act+PrfPrc+Sg+Nom" if number == "sg" else "+V+Act+PrfPrc+Pl+Nom"
        cells.append(cell(
            finite_key(section, label), section, person=person, number=number,
            mood="imperative", tense="perfect", recipe="composition",
            components=[component("olla", *aux_tags), component("MAIN", prc_tag)],
            evidence="HFST components; no generic Meanbot imperative-perfect rule",
        ))
    cells.append(cell(
        finite_key(section, "passive"), section, voice="passive", mood="imperative",
        tense="perfect", recipe="composition",
        components=[component("olla", "+V+Act+Imprt+Sg3", "+V+Act+Imprt+Sg"),
                    component("MAIN", "+V+Pass+PrfPrc+Sg+Nom")],
        evidence="HFST components; no generic Meanbot passive imperative-perfect rule",
    ))

    for section, polarity in (("Potential perfect tense", "positive"),
                              ("Potential perfect negative tense", "negative")):
        for label, person, number, _ptag, _idx in PERSONS:
            cells.append(cell(
                finite_key(section, label), section, person=person, number=number,
                mood="potential", tense="perfect", polarity=polarity,
                recipe="unsupported", evidence="No +Pot tag/path in current Meanbot HFST",
            ))
        cells.append(cell(
            finite_key(section, "passive"), section, voice="passive", mood="potential",
            tense="perfect", polarity=polarity, recipe="unsupported",
            evidence="No +Pot tag/path in current Meanbot HFST",
        ))

    section = "Present perfect negative tense"
    for label, person, number, ptag, _idx in PERSONS:
        prc_tag = "+V+Act+PrfPrc+Sg+Nom" if number == "sg" else "+V+Act+PrfPrc+Pl+Nom"
        cells.append(cell(
            finite_key(section, label), section, person=person, number=number,
            mood="indicative", tense="perfect", polarity="negative", recipe="composition",
            components=[component("ei", f"+V+Neg+Act+Prs+{ptag}"),
                        component("olla", "+V+Act+Ind+Prs+ConNeg"), component("MAIN", prc_tag)],
            evidence="HFST components; no generic Meanbot negative-perfect rule",
        ))
    cells.append(cell(
        finite_key(section, "passive"), section, voice="passive", mood="indicative",
        tense="perfect", polarity="negative", recipe="composition",
        components=[component("ei", "+V+Neg+Act+Prs+Sg3"),
                    component("olla", "+V+Act+Ind+Prs+ConNeg"),
                    component("MAIN", "+V+Pass+PrfPrc+Sg+Nom")],
        evidence="HFST components; no generic Meanbot negative passive perfect rule",
    ))

    section = "Past perfect negative tense"
    for label, person, number, ptag, _idx in PERSONS:
        olla_conneg = "+V+Act+Ind+Prt+ConNeg+Sg" if number == "sg" else "+V+Act+Ind+Prt+ConNeg+Pl"
        prc_tag = "+V+Act+PrfPrc+Sg+Nom" if number == "sg" else "+V+Act+PrfPrc+Pl+Nom"
        cells.append(cell(
            finite_key(section, label), section, person=person, number=number,
            mood="indicative", tense="pluperfect", polarity="negative", recipe="composition",
            components=[component("ei", f"+V+Neg+Act+Prs+{ptag}"),
                        component("olla", olla_conneg), component("MAIN", prc_tag)],
            evidence="HFST components; no generic Meanbot negative pluperfect rule",
        ))
    cells.append(cell(
        finite_key(section, "passive"), section, voice="passive", mood="indicative",
        tense="pluperfect", polarity="negative", recipe="composition",
        components=[component("ei", "+V+Neg+Act+Prs+Sg3"),
                    component("olla", "+V+Pass+Ind+Prt+ConNeg"),
                    component("MAIN", "+V+Pass+PrfPrc+Sg+Nom")],
        evidence="HFST components only; passive negative pluperfect not licensed",
    ))

    section = "Conditional perfect negative tense"
    for label, person, number, ptag, _idx in PERSONS:
        prc_tag = "+V+Act+PrfPrc+Sg+Nom" if number == "sg" else "+V+Act+PrfPrc+Pl+Nom"
        cells.append(cell(
            finite_key(section, label), section, person=person, number=number,
            mood="conditional", tense="perfect", polarity="negative", recipe="composition",
            components=[component("ei", f"+V+Neg+Act+Prs+{ptag}"),
                        component("olla", "+V+Act+Cond+ConNeg"), component("MAIN", prc_tag)],
            evidence="HFST components only; negative conditional-perfect composition unlicensed",
        ))
    cells.append(cell(
        finite_key(section, "passive"), section, voice="passive", mood="conditional",
        tense="perfect", polarity="negative", recipe="composition",
        components=[component("ei", "+V+Neg+Act+Prs+Sg3"),
                    component("olla", "+V+Act+Cond+ConNeg"),
                    component("MAIN", "+V+Pass+PrfPrc+Sg+Nom")],
        evidence="HFST components only; passive negative conditional-perfect unlicensed",
    ))

    def nonfinite_key(form: str, voice: str) -> str:
        return f"nonfinite|{form}|{voice}"

    nonfinite_specs = [
        ("1st infinitive", "active", "I", "", "direct", [component("MAIN", "+V+Inf")], ""),
        ("1st infinitive", "passive", "I", "", "unsupported", [], "UI displays em dash"),
        ("1st long infinitive", "active", "I-long", "translative", "ambiguous_family",
         [component("MAIN", *[f"+V+Inf+Tra+Px{x}" for x in ("Sg1", "Sg2", "Sg3", "Pl1", "Pl2", "Pl3")])],
         "Possessive person is not specified by the single UI cell."),
        ("1st long infinitive", "passive", "I-long", "translative", "unsupported", [], "UI displays em dash"),
        ("2nd infinitive inessive", "active", "II", "inessive", "direct", [component("MAIN", "+V+InfE+Ine")], ""),
        ("2nd infinitive inessive", "passive", "II", "inessive", "direct", [component("MAIN", "+V+Pass+InfE+Ine")], "Source lexc marks many class paths CHECK; treat evidence cautiously."),
        ("2nd infinitive instructive", "active", "II", "instructive", "direct", [component("MAIN", "+V+InfE+Ins")], ""),
        ("2nd infinitive instructive", "passive", "II", "instructive", "unsupported", [], "UI displays em dash"),
        ("3rd infinitive inessive", "active", "III", "inessive", "direct", [component("MAIN", "+V+InfMa+Ine")], ""),
        ("3rd infinitive inessive", "passive", "III", "inessive", "unsupported", [], "UI displays em dash"),
        ("3rd infinitive elative", "active", "III", "elative", "direct", [component("MAIN", "+V+InfMa+Ela")], ""),
        ("3rd infinitive elative", "passive", "III", "elative", "unsupported", [], "UI displays em dash"),
        ("3rd infinitive illative", "active", "III", "illative", "direct", [component("MAIN", "+V+InfMa+Ill")], "Multiple h-position/metathesis outputs are common."),
        ("3rd infinitive illative", "passive", "III", "illative", "unsupported", [], "UI displays em dash"),
        ("3rd infinitive adessive", "active", "III", "adessive", "direct", [component("MAIN", "+V+InfMa+Ade")], ""),
        ("3rd infinitive adessive", "passive", "III", "adessive", "unsupported", [], "UI displays em dash"),
        ("3rd infinitive abessive", "active", "III", "abessive", "direct", [component("MAIN", "+V+InfMa+Abe")], ""),
        ("3rd infinitive abessive", "passive", "III", "abessive", "unsupported", [], "UI displays em dash"),
        ("3rd infinitive instructive", "active", "III", "instructive", "unsupported", [], "No +V+InfMa+Ins path; app form is not analyzed."),
        ("3rd infinitive instructive", "passive", "III", "instructive", "unsupported", [], "No passive III instructive path."),
        ("4th infinitive nominative", "active", "IV", "nominative", "direct", [component("MAIN", "+V+Der/minen+N+Sg+Nom")], "HFST models this as a derived -minen noun."),
        ("4th infinitive nominative", "passive", "IV", "nominative", "unsupported", [], "UI displays em dash"),
        ("4th infinitive partitive", "active", "IV", "partitive", "direct", [component("MAIN", "+V+Der/minen+N+Sg+Par")], "HFST models this as a derived -minen noun."),
        ("4th infinitive partitive", "passive", "IV", "partitive", "unsupported", [], "UI displays em dash"),
        ("5th infinitive", "active", "V", "", "unsupported", [], "No fifth-infinitive feature path in current Meanbot HFST."),
        ("5th infinitive", "passive", "V", "", "unsupported", [], "UI displays em dash"),
        ("Present participle", "active", "", "nominative", "direct", [component("MAIN", "+V+Act+PrsPrc+Sg+Nom")], ""),
        ("Present participle", "passive", "", "nominative", "direct", [component("MAIN", "+V+Pass+PrsPrc+Sg+Nom")], ""),
        ("Past participle", "active", "", "nominative", "direct", [component("MAIN", "+V+Act+PrfPrc+Sg+Nom")], ""),
        ("Past participle", "passive", "", "nominative", "direct", [component("MAIN", "+V+Pass+PrfPrc+Sg+Nom")], ""),
        ("Agent participle", "active", "", "nominative", "direct", [component("MAIN", "+V+AgPrc")], "HFST exposes a bare agent-participle cell."),
        ("Agent participle", "passive", "", "nominative", "unsupported", [], "UI displays em dash"),
    ]
    for form, voice, inf_type, case, recipe, components, notes in nonfinite_specs:
        part_type = ""
        if form == "Present participle":
            part_type = "present"
        elif form == "Past participle":
            part_type = "perfect"
        elif form == "Agent participle":
            part_type = "agent"
        evidence = "HFST strict roundtrip; nonfinite morphology"
        if recipe == "unsupported":
            evidence = notes
        elif recipe == "ambiguous_family":
            evidence = "HFST family exists, but UI omits required possessive-person feature"
        cells.append(cell(
            nonfinite_key(form, voice), form, voice=voice, infinitive_type=inf_type,
            participle_type=part_type, nonfinite_case=case, recipe=recipe,
            components=components, evidence=evidence, notes=notes,
        ))

    finite_order = [
        "Present tense", "Past tense", "Conditional mood", "Imperative mood",
        "Potential tense", "Present negative tense", "Past negative tense",
        "Conditional negative tense", "Imperative negative mood",
        "Potential negative tense", "Present perfect tense",
        "Past perfect / pluskvamperfektum", "Conditional perfect tense",
        "Imperative perfect tense", "Potential perfect tense",
        "Present perfect negative tense", "Past perfect negative tense",
        "Conditional perfect negative tense", "Potential perfect negative tense",
    ]
    nonfinite_order = [
        "1st infinitive", "1st long infinitive", "2nd infinitive inessive",
        "2nd infinitive instructive", "3rd infinitive inessive",
        "3rd infinitive elative", "3rd infinitive illative",
        "3rd infinitive adessive", "3rd infinitive abessive",
        "3rd infinitive instructive", "4th infinitive nominative",
        "4th infinitive partitive", "5th infinitive", "Present participle",
        "Past participle", "Agent participle",
    ]
    slot_order = [label for label, *_rest in PERSONS] + ["passive"]
    f_rank = {name: index for index, name in enumerate(finite_order)}
    nf_rank = {name: index for index, name in enumerate(nonfinite_order)}
    slot_rank = {name: index for index, name in enumerate(slot_order)}
    cells.sort(key=lambda item: (
        0 if item["key"].startswith("finite|") else 1,
        f_rank.get(item["ui_form"], nf_rank.get(item["ui_form"], 999)),
        slot_rank.get(item["key"].rsplit("|", 1)[1],
                      0 if item["voice"] == "active" else 1),
    ))

    assert len(cells) == 165, len(cells)
    assert len({item["key"] for item in cells}) == len(cells)
    return cells


def run_lookup(mode: str, fst: Path, inputs: list[str]) -> dict[str, list[tuple[str, str]]]:
    if not inputs:
        return {}
    env = os.environ.copy()
    lib = "/tmp/meanbot-runtime/hfst/usr/lib/x86_64-linux-gnu"
    env["LD_LIBRARY_PATH"] = lib + ((":" + env["LD_LIBRARY_PATH"]) if env.get("LD_LIBRARY_PATH") else "")
    env["HFST_LOOKUP"] = str(HFST_LOOKUP)
    env["LANGFIT_ROOT"] = str(BUILD_ROOT)
    env["MEANKIELI_BUILD_ROOT"] = str(BUILD_ROOT)
    proc = subprocess.run(
        [str(STRICT_LOOKUP), "--mode", mode, "--fst", str(fst),
         "--root", str(MEANBOT_ROOT)], input="\n".join(inputs) + "\n",
        text=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, env=env, check=True,
    )
    result: dict[str, list[tuple[str, str]]] = {value: [] for value in inputs}
    for line in proc.stdout.splitlines():
        fields = line.split("\t")
        if len(fields) < 3:
            continue
        source, output, weight = fields[:3]
        if weight == "inf" or output.endswith("+?"):
            continue
        pair = (output, weight)
        if pair not in result.setdefault(source, []):
            result[source].append(pair)
    return result


def analyses_for_component(comp: dict, main_lemma: str) -> list[str]:
    lemma = main_lemma if comp["lemma"] == "MAIN" else comp["lemma"]
    return [lemma + tag for tag in comp["tags"]]


def bundle_template(item: dict) -> str:
    if not item["components"]:
        return ""
    rendered = []
    for comp in item["components"]:
        lemma = "<lemma>" if comp["lemma"] == "MAIN" else comp["lemma"]
        rendered.append(" | ".join(lemma + tag for tag in comp["tags"]))
    return " + ".join(rendered)


def dump_current_app() -> dict:
    node_tool = ROOT / "tools/dump_current_conjugator.mjs"
    proc = subprocess.run(["node", str(node_tool), *INPUTS], text=True,
                          stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=True)
    return json.loads(proc.stdout)


def current_cells(app_dump: dict) -> dict[tuple[str, str], str]:
    flat: dict[tuple[str, str], str] = {}
    for lemma, payload in app_dump.items():
        for row in payload["finite"]:
            for _label, _person, _number, _ptag, idx in PERSONS:
                flat[(lemma, f"finite|{row['section']}|{PERSONS[idx][0]}")] = row["forms"][idx]
            flat[(lemma, f"finite|{row['section']}|passive")] = row.get("passive", "—")
        for row in payload["nonfinite"]:
            flat[(lemma, f"nonfinite|{row['form']}|active")] = row.get("active", "—")
            flat[(lemma, f"nonfinite|{row['form']}|passive")] = row.get("passive", "—")
    return flat


def choose_components(item: dict, main_lemma: str, generated: dict[str, list[tuple[str, str]]]):
    chosen: list[tuple[str, list[str]]] = []
    for comp in item["components"]:
        found = None
        for analysis in analyses_for_component(comp, main_lemma):
            surfaces = [surface for surface, _weight in generated.get(analysis, [])]
            if surfaces:
                found = (analysis, surfaces)
                break
        if found is None:
            return []
        chosen.append(found)
    return chosen


def write_tsv(path: Path, fieldnames: list[str], rows: list[dict]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames, delimiter="\t",
                                lineterminator="\n", extrasaction="ignore")
        writer.writeheader()
        writer.writerows(rows)


def main() -> int:
    for needed in (HFST_LOOKUP, GENERATOR, ANALYSER, STRICT_LOOKUP):
        if not needed.exists():
            print(f"missing required audit input: {needed}", file=sys.stderr)
            return 2

    cells = build_cells()
    app = current_cells(dump_current_app())

    mapped = {entry: LEMMA_MAP.get(entry, entry) for entry in INPUTS}
    generation_queries: set[str] = set()
    for input_lemma, meanbot_lemma in mapped.items():
        if not meanbot_lemma:
            continue
        for item in cells:
            for comp in item["components"]:
                generation_queries.update(analyses_for_component(comp, meanbot_lemma))
    generated = run_lookup("generate", GENERATOR, sorted(generation_queries))

    # Analyze each generated component surface once.  Exact bundle recovery is
    # stricter than merely accepting the spelling under some unrelated parse.
    surfaces = sorted({surface for rows in generated.values() for surface, _weight in rows})
    analyzed = run_lookup("analyze", ANALYSER, surfaces)

    fixture_rows: list[dict] = []
    diff_rows: list[dict] = []
    per_key_results: dict[str, list[dict]] = {item["key"]: [] for item in cells}

    for input_lemma in INPUTS:
        main_lemma = mapped[input_lemma]
        alias_note = ""
        if input_lemma == "saa'a":
            alias_note = "ASCII apostrophe is a browser-input alias for strict lemma saa’a."
        elif input_lemma == "saa":
            alias_note = "Surface saa is lexically ambiguous between strict lemmas saa’a and saaja."
        elif input_lemma == "voia":
            alias_note = "Strict analyzer sees voia only as voija passive present connegative, not an infinitive lemma."

        for item in cells:
            expected: list[str] = []
            used_analyses: list[str] = []
            roundtrip = "NOT_APPLICABLE"
            status = "UNSUPPORTED"
            chosen = [] if main_lemma is None else choose_components(item, main_lemma, generated)

            if item["recipe"] == "unsupported":
                status = "UNSUPPORTED"
            elif main_lemma is None:
                status = "UNSUPPORTED"
                roundtrip = "FAIL_LEMMA"
            elif chosen:
                used_analyses = [analysis for analysis, _forms in chosen]
                expected = [" ".join(parts) for parts in itertools.product(
                    *[forms for _analysis, forms in chosen])]
                # Keep output bounded but report the full variant count in notes.
                component_pass = all(
                    any(analysis == recovered for recovered, _weight in analyzed.get(surface, []))
                    for analysis, forms in chosen for surface in forms
                )
                roundtrip = "PASS" if component_pass else "FAIL"
                if item["recipe"] == "ambiguous_family":
                    status = "AMBIGUOUS"
                elif item["recipe"] == "composition":
                    status = "PARTIAL"
                    roundtrip = "PASS_COMPONENTS" if component_pass else "FAIL"
                elif item["recipe"] == "licensed_composition":
                    status = "SUPPORTED_VARIANT" if len(expected) > 1 else "STRICT_VERIFIED"
                elif not component_pass:
                    status = "PARTIAL"
                elif len(expected) > 1:
                    status = "SUPPORTED_VARIANT"
                else:
                    status = "STRICT_VERIFIED"
            else:
                roundtrip = "FAIL_GENERATION"

            # Input aliases affect admission confidence even when the selected
            # underlying paradigm is strict.
            if input_lemma == "saa'a" and status in ("STRICT_VERIFIED", "SUPPORTED_VARIANT"):
                status = "SUPPORTED_VARIANT"
            if input_lemma == "saa" and status != "UNSUPPORTED":
                status = "AMBIGUOUS"

            expected = list(dict.fromkeys(expected))
            notes = "; ".join(value for value in (item["notes"], alias_note) if value)
            if len(expected) > 50:
                notes = "; ".join(value for value in (notes, f"variant product truncated from {len(expected)}") if value)
                expected = expected[:50]

            fixture = {
                "lemma": input_lemma,
                "meanbot_lemma": main_lemma or "",
                "ui_form": item["ui_form"],
                "person": item["person"],
                "number": item["number"],
                "voice": item["voice"],
                "mood": item["mood"],
                "tense": item["tense"],
                "polarity": item["polarity"],
                "infinitive_type": item["infinitive_type"],
                "participle_type": item["participle_type"],
                "nonfinite_case": item["nonfinite_case"],
                "feature_bundle": " + ".join(used_analyses) if used_analyses else bundle_template(item),
                "expected_surface": expected[0] if expected else "",
                "alternate_surface": " | ".join(expected[1:]),
                "status": status,
                "evidence": item["evidence"],
                "analyzer_roundtrip": roundtrip,
                "notes": notes,
                "ui_cell_key": item["key"],
            }
            fixture_rows.append(fixture)
            if main_lemma and input_lemma not in ("saa'a", "saa"):
                per_key_results[item["key"]].append(fixture)
            elif input_lemma == "saa'a":
                # Include one copy of the saa’a paradigm in aggregate coverage.
                per_key_results[item["key"]].append(fixture)

            current = app[(input_lemma, item["key"])]
            current_variants = [value.strip() for value in current.split(" / ")]
            overlap = [value for value in current_variants if value in expected]
            if status == "UNSUPPORTED":
                classification = "MEANBOT_UNSUPPORTED" if current in ("", "—") else "CURRENT_APP_HEURISTIC"
            elif status == "AMBIGUOUS":
                classification = "MULTIPLE_VALID_VARIANTS" if overlap else "NEEDS_EVIDENCE"
            elif status == "PARTIAL":
                classification = "NEEDS_EVIDENCE" if overlap else "CURRENT_APP_WRONG"
            elif overlap:
                classification = "MATCH" if current_variants[0] == expected[0] and len(expected) == 1 else "MULTIPLE_VALID_VARIANTS"
            else:
                classification = "CURRENT_APP_WRONG"
            diff_rows.append({
                "lemma": input_lemma,
                "meanbot_lemma": main_lemma or "",
                "ui_form": item["ui_form"],
                "person": item["person"],
                "number": item["number"],
                "voice": item["voice"],
                "mood": item["mood"],
                "tense": item["tense"],
                "polarity": item["polarity"],
                "feature_bundle": fixture["feature_bundle"],
                "current_surface": current,
                "meanbot_surface": fixture["expected_surface"],
                "meanbot_alternates": fixture["alternate_surface"],
                "meanbot_status": status,
                "classification": classification,
                "analyzer_roundtrip": roundtrip,
                "notes": notes,
                "ui_cell_key": item["key"],
            })

    capability_rows: list[dict] = []
    for item in cells:
        results = per_key_results[item["key"]]
        strict = sum(row["status"] == "STRICT_VERIFIED" for row in results)
        variant = sum(row["status"] == "SUPPORTED_VARIANT" for row in results)
        partial = sum(row["status"] == "PARTIAL" for row in results)
        generated_count = sum(bool(row["expected_surface"]) for row in results)
        supported = strict + variant + partial
        roundtrips = sum(row["analyzer_roundtrip"] in ("PASS", "PASS_COMPONENTS") for row in results)
        total = len(results)
        if item["recipe"] == "ambiguous_family" and generated_count:
            status = "AMBIGUOUS"
        elif item["recipe"] == "unsupported" or generated_count == 0:
            status = "UNSUPPORTED"
        elif item["recipe"] == "composition":
            status = "PARTIAL"
        elif supported < total or partial:
            status = "PARTIAL"
        elif variant:
            status = "SUPPORTED_VARIANT"
        else:
            status = "STRICT_VERIFIED"
        capability_rows.append({
            "ui_form": item["ui_form"],
            "person": item["person"],
            "number": item["number"],
            "voice": item["voice"],
            "mood": item["mood"],
            "tense": item["tense"],
            "polarity": item["polarity"],
            "infinitive_type": item["infinitive_type"],
            "participle_type": item["participle_type"],
            "nonfinite_case": item["nonfinite_case"],
            "meanbot_feature_bundle": bundle_template(item),
            "generation_supported": f"{generated_count}/{total}",
            "analyzer_roundtrip": f"{roundtrips}/{total}",
            "evidence_status": item["evidence"],
            "status": status,
            "notes": item["notes"],
            "ui_cell_key": item["key"],
        })

    fixture_fields = [
        "lemma", "meanbot_lemma", "ui_form", "person", "number", "voice", "mood",
        "tense", "polarity", "infinitive_type", "participle_type", "nonfinite_case",
        "feature_bundle", "expected_surface", "alternate_surface", "status", "evidence",
        "analyzer_roundtrip", "notes", "ui_cell_key",
    ]
    diff_fields = [
        "lemma", "meanbot_lemma", "ui_form", "person", "number", "voice", "mood",
        "tense", "polarity", "feature_bundle", "current_surface", "meanbot_surface",
        "meanbot_alternates", "meanbot_status", "classification", "analyzer_roundtrip",
        "notes", "ui_cell_key",
    ]
    capability_fields = [
        "ui_form", "person", "number", "voice", "mood", "tense", "polarity",
        "infinitive_type", "participle_type", "nonfinite_case", "meanbot_feature_bundle",
        "generation_supported", "analyzer_roundtrip", "evidence_status", "status", "notes",
        "ui_cell_key",
    ]
    write_tsv(ROOT / "tests/meanbot_expected_verbs.tsv", fixture_fields, fixture_rows)
    write_tsv(ROOT / "current_conjugator_vs_meanbot.tsv", diff_fields, diff_rows)
    write_tsv(ROOT / "docs/meanbot_ui_capability_matrix.tsv", capability_fields, capability_rows)

    summary = {
        "ui_cells": len(cells),
        "representative_inputs": len(INPUTS),
        "fixture_rows": len(fixture_rows),
        "capability_status": {},
        "fixture_status": {},
        "diff_classification": {},
    }
    for row in capability_rows:
        summary["capability_status"][row["status"]] = summary["capability_status"].get(row["status"], 0) + 1
    for row in fixture_rows:
        summary["fixture_status"][row["status"]] = summary["fixture_status"].get(row["status"], 0) + 1
    for row in diff_rows:
        value = row["classification"]
        summary["diff_classification"][value] = summary["diff_classification"].get(value, 0) + 1
    (ROOT / "docs").mkdir(exist_ok=True)
    (ROOT / "docs/meanbot_audit_summary.json").write_text(
        json.dumps(summary, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(summary, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
