# -*- coding: utf-8 -*-
"""Generate docs/RO_HELPER_CARD_MATRIX.csv — full card matrix (regenerate after slug changes)."""
from __future__ import annotations

import csv
from pathlib import Path

DISC = ["handgun", "pcc", "rifle", "mini_rifle", "shotgun"]


def explicit_c26_c76() -> list[tuple[str, str, str, str, str, str]]:
    rows: list[tuple[str, str, str, str, str, str]] = []
    seq = [
        (26, "procedural-fault", "handgun"),
        (27, "procedural-fault", "rifle"),
        (28, "procedural-fault", "pcc"),
        (29, "procedural-fault", "mini_rifle"),
        (30, "procedural-fault", "shotgun"),
        (31, "foot-fault", "handgun"),
        (32, "foot-fault", "rifle"),
        (33, "foot-fault", "pcc"),
        (34, "foot-fault", "mini_rifle"),
        (35, "foot-fault", "shotgun"),
        (36, "failure-to-engage", "handgun"),
        (37, "failure-to-engage", "rifle"),
        (38, "failure-to-engage", "pcc"),
        (39, "failure-to-engage", "mini_rifle"),
        (40, "failure-to-engage", "shotgun"),
        (41, "significant-advantage", "handgun"),
        (42, "significant-advantage", "rifle"),
        (43, "significant-advantage", "pcc"),
        (44, "significant-advantage", "mini_rifle"),
        (45, "significant-advantage", "shotgun"),
        (46, "creeping", "handgun"),
        (47, "creeping", "rifle"),
        (48, "creeping", "pcc"),
        (49, "creeping", "mini_rifle"),
        (50, "creeping", "shotgun"),
        (51, "mandatory-reload", "handgun"),
        (52, "mandatory-reload", "rifle"),
        (53, "mandatory-reload", "pcc"),
        (54, "mandatory-reload", "mini_rifle"),
        (55, "mandatory-reload", "shotgun"),
        (56, "mandatory-position", "handgun"),
        (57, "mandatory-position", "rifle"),
        (58, "mandatory-position", "pcc"),
        (59, "mandatory-position", "mini_rifle"),
        (60, "mandatory-position", "shotgun"),
        (61, "unauthorized-assistance", "handgun"),
        (62, "unauthorized-assistance", "rifle"),
        (63, "unauthorized-assistance", "pcc"),
        (64, "unauthorized-assistance", "mini_rifle"),
        (65, "unauthorized-assistance", "shotgun"),
        (66, "sight-picture-fault", "handgun"),
        (67, "sight-picture-fault", "rifle"),
        (68, "sight-picture-fault", "pcc"),
        (69, "sight-picture-fault", "mini_rifle"),
        (70, "sight-picture-fault", "shotgun"),
        (71, "forbidden-action", "handgun"),
        (72, "forbidden-action", "rifle"),
        (73, "forbidden-action", "pcc"),
        (74, "forbidden-action", "mini_rifle"),
        (75, "forbidden-action", "shotgun"),
        (76, "wrong-ammo-shot", "shotgun"),
    ]
    hints: dict[str, str] = {
        "procedural-fault": "10.1 (HG); verify per PDF",
        "foot-fault": "10.2.1 (+10.2.1.1 HG)",
        "failure-to-engage": "9.5.6; 10.2.7",
        "significant-advantage": "10.2.1.1; 10.2.2",
        "creeping": "10.2.6",
        "mandatory-reload": "10.2.4",
        "mandatory-position": "10.2.2; 10.2.8",
        "unauthorized-assistance": "8.6.2",
        "sight-picture-fault": "8.7.1; 8.7.2",
        "forbidden-action": "10.2.11",
        "wrong-ammo-shot": "10.2.12 SG only",
    }
    labels_en: dict[str, str] = {
        "procedural-fault": "Procedural penalties (general)",
        "foot-fault": "Foot fault / fault line",
        "failure-to-engage": "Failure to engage",
        "significant-advantage": "Significant advantage",
        "creeping": "Creeping before start signal",
        "mandatory-reload": "Mandatory reload violation",
        "mandatory-position": "WSB position / strong-weak hand",
        "unauthorized-assistance": "Unauthorized assistance",
        "sight-picture-fault": "Sight picture / walkthrough violations",
        "forbidden-action": "Forbidden shots (tall barrier)",
        "wrong-ammo-shot": "Wrong ammunition type (shotgun)",
    }
    labels_uk: dict[str, str] = {
        "procedural-fault": "Процедурні штрафи (загальні)",
        "foot-fault": "Заступ / лінія заступу",
        "failure-to-engage": "Необстріляна мішень (FTE)",
        "significant-advantage": "Значна перевага",
        "creeping": "«Підкрадання» до старту",
        "mandatory-reload": "Обов’язкове перезарядження",
        "mandatory-position": "Позиція з WSB / сильна-слабка рука",
        "unauthorized-assistance": "Несанкціонована допомога",
        "sight-picture-fault": "Приціл до сигналу / walkthrough",
        "forbidden-action": "Заборонені постріли (високий бар’єр)",
        "wrong-ammo-shot": "Неправильний тип набою (дробовик)",
    }
    for cid, slug, disc in seq:
        rows.append(
            (
                f"C{cid}",
                slug,
                disc,
                "penalties",
                hints[slug],
                labels_en[slug],
                labels_uk[slug],
            )
        )
    return rows


def cartesian(
    slugs: list[tuple[str, str, str, str]],
    category: str,
    start_id: int,
) -> tuple[list[tuple[str, str, str, str, str, str, str]], int]:
    rows: list[tuple[str, str, str, str, str, str, str]] = []
    n = start_id
    for slug, ref, label_en, label_uk in slugs:
        for d in DISC:
            rows.append((f"C{n}", slug, d, category, ref, label_en, label_uk))
            n += 1
    return rows, n


def partial_rows(
    slug: str,
    ref: str,
    label_en: str,
    label_uk: str,
    discs: list[str],
    category: str,
    start_id: int,
) -> tuple[list[tuple[str, str, str, str, str, str, str]], int]:
    rows: list[tuple[str, str, str, str, str, str, str]] = []
    n = start_id
    for d in discs:
        rows.append((f"C{n}", slug, d, category, ref, label_en, label_uk))
        n += 1
    return rows, n


def fpsu_hint(category: str) -> str:
    if category == "penalties":
        return "XI (штрафи/DQ); перетин IX–X"
    if category == "scoring":
        return "X; додатки мішеней (VI)"
    if category == "equipment":
        return "VII; VI; додатки"
    if category == "match-admin":
        return "II, VIII, XII; IV–V (контекст)"
    return "II п.7; IV; XI; IX"


def main() -> None:
    all_rows: list[tuple[str, str, str, str, str, str, str]] = []
    all_rows.extend(explicit_c26_c76())
    next_id = 77

    extra_pen = [
        ("procedural-cap", "10.2.3", "Procedural penalty cap", "Стеля процедурних штрафів"),
        ("cooper-tunnel", "10.2.5", "Cooper tunnel overhead", "Cooper Tunnel / накриття"),
        ("penalty-in-lieu", "10.2.10", "Penalty in lieu (RM)", "Штраф замість елемента COF (RM)"),
        ("re-engage-same-location", "10.2.9", "Re-engage same location", "Повторне стрільбище з тієї ж позиції"),
        ("walkthrough-interference", "8.7.2;8.7.3", "Walkthrough violations", "Порушення під час інспекції COF"),
    ]
    r, next_id = cartesian(extra_pen, "penalties", next_id)
    all_rows.extend(r)

    r, next_id = partial_rows(
        "burst-or-automatic-fire",
        "10.2.12",
        "Burst or fully automatic fire",
        "Черговий / повністю автоматичний вогонь",
        ["pcc", "rifle", "mini_rifle"],
        "penalties",
        next_id,
    )
    all_rows.extend(r)

    safety_slugs = [
        ("break-180", "10.5.2", "Muzzle safe angles / 180", "Безпечний сектор / 180°"),
        ("accidental-discharge", "10.4", "Accidental discharge (DQ)", "Випадковий постріл (DQ)"),
        ("trigger-finger", "10.5.8-11", "Finger in trigger guard", "Палець у скобі"),
        ("dropped-gun", "10.5.3", "Dropped firearm (DQ)", "Впущена зброя (DQ)"),
        ("unsafe-gun-handling", "10.5.1", "Unsafe gun handling", "Небезпечне поводження"),
        ("dq-general", "10.3", "DQ — general", "Дискваліфікація — загальні"),
        ("prohibited-substances", "10.7", "Prohibited substances", "Заборонені речовини"),
        ("unsportsmanlike-conduct", "10.6", "Unsportsmanlike conduct", "Неспортивна поведінка"),
        ("range-safety-zones", "Ch.2", "Range safety / zones", "Зони безпеки / майданчик"),
        ("movement-and-trigger-safety", "8.5", "Movement & trigger safety", "Рух і палець під час COF"),
    ]
    r, next_id = cartesian(safety_slugs, "safety", next_id)
    all_rows.extend(r)

    scoring_slugs = [
        ("approaching-touching-targets", "9.1", "Approaching / touching targets", "Підхід / дотик до мішеней"),
        ("scoring-methods", "9.2", "Scoring methods", "Методи підрахунку"),
        ("scoring-ties", "9.3", "Scoring ties", "Нічиї"),
        ("hits-misses-noshoot-values", "9.4", "Hits, misses, no-shoot values", "Влучання, miss, no-shoot"),
        ("paper-scoring-policy", "9.5", "Paper scoring policy", "Політика паперових мішеней"),
        ("paper-zones-major-minor", "9.5;tables", "Paper zones Major/Minor", "Зони A/C/D Major/Minor"),
        ("radial-tears-enlarged-holes", "9.5.4", "Radial tears / enlarged holes", "Радіальні розриви / розширені отвори"),
        ("fte-scoring-side", "9.5.6", "FTE (scoring side)", "FTE (скорингова частина)"),
        ("score-verification-challenge", "9.6", "Score verification & challenges", "Перевірка та оскарження"),
        ("score-sheets-corrections", "9.7", "Score sheets & corrections", "Залікові листи / виправлення"),
        ("provisional-results-stats-appeal", "9.8", "Provisional results / stats", "Попередні результати / статистика"),
        ("disappearing-targets-scoring", "9.9", "Disappearing targets", "Зникаючі мішені"),
        ("official-time", "9.10", "Official time", "Офіційний час"),
        ("scoring-programs", "9.11", "Scoring programs", "Програми підрахунку"),
    ]
    r, next_id = cartesian(scoring_slugs, "scoring", next_id)
    all_rows.extend(r)

    equip_slugs = [
        ("division-overview", "5;Appendix", "Divisions overview", "Дивізіони та класи"),
        ("ready-conditions", "8.1-8.3", "Ready conditions / commands", "Стани готовності / команди"),
        ("holster-or-carry-long-gun", "5;Appendix", "Holster / sling / carry", "Кобура / ремінь / носіння"),
        ("firearms-and-ammunition-rules", "5.1-5.8", "Firearm & ammunition", "Зброя та набої"),
        ("chronograph-and-power-factor", "5.6-5.7", "Chrono & power factor", "Хронограф і PF"),
        ("magazines-and-loading-devices", "5", "Magazines & loading", "Магазини та заряджання"),
        ("eye-and-ear-protection", "5.4", "Eye & ear protection", "Захист очей і вух"),
        ("athlete-clothing", "5.3", "Competitor clothing", "Одяг спортсмена"),
        ("equipment-malfunction", "5.7", "Equipment malfunction", "Несправність спорядження"),
    ]
    r, next_id = cartesian(equip_slugs, "equipment", next_id)
    all_rows.extend(r)

    admin_slugs = [
        ("written-stage-briefing", "3.2", "Written stage briefing", "Письмовий брифінг"),
        ("local-regional-rules", "3.3", "Local / regional rules", "Локальні / регіональні правила"),
        ("match-structure-and-categories", "6", "Match structure", "Структура змагань"),
        ("md-ro-roles", "7", "MD / RM roles", "Ролі MD / RM"),
        ("protests-arbitration", "11", "Protests & arbitration", "Протести та арбітраж"),
        ("miscellaneous-matters", "12", "Miscellaneous", "Інше (розділ 12)"),
        ("reshoots", "4.7", "Reshoots / equipment failure", "Перестріл / несправність обладнання"),
        ("course-design-safety-balance", "1.1", "Course design principles", "Принципи дизайну вправ"),
    ]
    r, next_id = cartesian(admin_slugs, "match-admin", next_id)
    all_rows.extend(r)

    out = Path("docs/RO_HELPER_CARD_MATRIX.csv")
    with out.open("w", newline="", encoding="utf-8-sig") as f:
        w = csv.writer(f)
        w.writerow(
            [
                "card_id",
                "slug",
                "discipline",
                "category",
                "label_en",
                "label_uk",
                "ipsc_anchor_hint",
                "fpsu_section_hint",
                "status_uk",
                "status_en",
                "notes",
            ]
        )
        for card_id, slug, disc, cat, ref, en, uk in all_rows:
            note = ""
            if slug == "wrong-ammo-shot":
                note = "shotgun only"
            if slug == "burst-or-automatic-fire":
                note = "pcc/rifle/mini_rifle only; 10.2.12"
            w.writerow(
                [
                    card_id,
                    slug,
                    disc,
                    cat,
                    en,
                    uk,
                    ref,
                    fpsu_hint(cat),
                    "todo",
                    "todo",
                    note,
                ]
            )

    print("rows", len(all_rows), "last_id", all_rows[-1][0], "->", out)


if __name__ == "__main__":
    main()
