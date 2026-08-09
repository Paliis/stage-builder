"""Normalize master-pack screenshots and narration metadata.

Creates stable canvases for both deliverables:
- 1600×900 (16:9)
- 900×1600 (9:16)

The full screenshot is always preserved. A softly blurred background fills unused
space, so the video assembler must not crop, stretch, or resize the frame.
"""

from __future__ import annotations

import json
import shutil
from pathlib import Path

from PIL import Image, ImageEnhance, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
PACK_DIR = ROOT / "content/user-help/videos/reel-packs/ecosystem-master-160s"
PACK_PATH = PACK_DIR / "pack.json"

CANVASES = {
    "16x9": (1600, 900),
    "9x16": (900, 1600),
}

DURATION_SEC = {
    "frame_01": 13,
    "frame_02": 7,
    "frame_03b": 11,
    "frame_04": 9,
    "frame_05": 6,
    "frame_06": 9,
    "frame_07": 6,
    "frame_08": 7,
    "frame_08b": 3,
    "frame_09": 4,
    "frame_10": 5,
    "frame_11": 4,
    "frame_11b": 9,
    "frame_12": 9,
    "frame_15": 7,
    "frame_16": 5,
    "frame_17": 14,
    "frame_18": 10,
    "frame_19": 7,
}

SECTION_ENDS = {
    "frame_01",
    "frame_03b",
    "frame_05",
    "frame_07",
    "frame_10",
    "frame_11b",
    "frame_12",
    "frame_16",
    "frame_17",
    "frame_18",
    "frame_19",
}

REMOVED_FRAMES = {"frame_03", "frame_13", "frame_14", "frame_18b"}

APPROVED_VOICEOVER = {
    "frame_01": (
        "Підготовка матчу завжди складається з багатьох частин: вправ, брифінгів, "
        "заявок, скводів, оплати та підготовки файлу для PractiScore. Портал Shooters "
        "Tools допомагає зібрати все це в одному місці та зручно керувати кожним етапом."
    ),
    "frame_02": (
        "Наш 3D-редактор Stage Builder допоможе швидко й зручно перетворити ваш задум "
        "на точний план із реальними розмірами."
    ),
    "frame_03b": (
        "Розставте мішені, декорації та стартові позиції. Потім відкрийте 3D і перевірте, "
        "як усе виглядає, чи правильно розташовані мішені та що побачить стрілець "
        "зі стартової позиції."
    ),
    "frame_04": (
        "Коли план готовий, дані вправи автоматично переходять у брифінг. Заповніть або "
        "відкоригуйте стартову позицію, процедуру, кути безпеки та необхідні пояснення."
    ),
    "frame_05": (
        "Після цього завантажте готовий PDF зі схемою, логотипами федерацій, QR-кодом "
        "і всіма умовами вправи."
    ),
    "frame_06": (
        "Зберігайте вправи у своєму акаунті, щоб повернутися до них пізніше, продовжити "
        "роботу на іншому пристрої або додати готові вправи до програми матчу."
    ),
    "frame_07": (
        "Вправу також можна експортувати у файл, імпортувати на іншому пристрої "
        "або опублікувати за посиланням."
    ),
    "frame_08": (
        "Подайте заявку на роль організатора матчів на порталі. Після підтвердження "
        "ви зможете створювати події у власному кабінеті."
    ),
    "frame_08b": "А також налаштувати платіжні реквізити.",
    "frame_09": "Зазначте дату, місце, дисципліну та рівень матчу.",
    "frame_10": (
        "Налаштуйте основні й прематч-скводи, кількість місць, стартові внески "
        "та видимість списку учасників."
    ),
    "frame_11": "Додайте до програми готові вправи зі Stage Builder.",
    "frame_11b": (
        "Якщо вправи підготовлені в іншому редакторі, можна завантажити один PDF-брифінг "
        "усієї програми. Організатор також визначає, коли вправи та брифінги стануть "
        "доступними стрільцям."
    ),
    "frame_12": (
        "На сторінці матчу учасник бачить дату, місце, дисципліну та доступні місця. "
        "Тут можна обрати доступний сквод і сплатити внесок."
    ),
    "frame_15": (
        "Усі заявки надходять до кабінету організатора. Тут видно статус участі, оплату, "
        "дивізіон, категорію та обраний сквод."
    ),
    "frame_16": (
        "Стрільців можна швидко розподіляти між скводами за допомогою зручної дошки."
    ),
    "frame_17": (
        "Стрілець один раз заповнює свій профіль. Ім’я для PractiScore, клас зброї, "
        "дивізіон і категорії автоматично підставляються в наступні заявки та потрапляють "
        "у файл матчу. У кабінеті також зберігаються всі реєстрації та їхні актуальні статуси."
    ),
    "frame_18": (
        "Коли параметри матчу, скводи та список учасників готові, організатор завантажує "
        "сформований файл для PractiScore. Не потрібно повторно переносити учасників, "
        "скводи й параметри матчу вручну."
    ),
    "frame_19": (
        "Shooters Tools — це екосистема, у якій можна пройти весь шлях: "
        "від задуму вправи до готового матчу."
    ),
}


def prepare_user_only_sources() -> None:
    """Replace old hero-derived files with crops/copies of user-provided states."""
    match_edit = Image.open(PACK_DIR / "09_match_edit_basics.png").convert("RGB")
    w, h = match_edit.size
    # Keep event context and the right-side PractiScore action in one readable crop.
    practiscore = match_edit.crop((0, 0, w, round(h * 0.48)))
    practiscore.save(PACK_DIR / "18_practiscore_export.png", "PNG", optimize=True)

    shutil.copyfile(PACK_DIR / "01_portal_events.png", PACK_DIR / "19_cta.png")

    for obsolete in (
        "03_shooter_3d.png",
        "03c_shooter_view_port.png",
        "13_match_card_programme.png",
        "14_match_card_participants.png",
        "18b_practiscore_button.png",
    ):
        path = PACK_DIR / obsolete
        if path.exists():
            path.unlink()

    normalized = PACK_DIR / "normalized"
    if normalized.exists():
        shutil.rmtree(normalized)


def fit_size(source: tuple[int, int], bounds: tuple[int, int], upscale_limit: float = 1.65) -> tuple[int, int]:
    sw, sh = source
    bw, bh = bounds
    scale = min(bw / sw, bh / sh, upscale_limit)
    return max(1, round(sw * scale)), max(1, round(sh * scale))


def cover_size(source: tuple[int, int], target: tuple[int, int]) -> tuple[int, int]:
    sw, sh = source
    tw, th = target
    scale = max(tw / sw, th / sh)
    return max(1, round(sw * scale)), max(1, round(sh * scale))


def normalize(source_path: Path, destination: Path, target: tuple[int, int]) -> None:
    source = Image.open(source_path).convert("RGB")
    tw, th = target

    background_size = cover_size(source.size, target)
    background = source.resize(background_size, Image.Resampling.LANCZOS)
    left = (background.width - tw) // 2
    top = (background.height - th) // 2
    background = background.crop((left, top, left + tw, top + th))
    background = background.filter(ImageFilter.GaussianBlur(radius=34))
    background = ImageEnhance.Brightness(background).enhance(0.78)

    margin_x = round(tw * 0.045)
    margin_y = round(th * 0.045)
    foreground_size = fit_size(source.size, (tw - margin_x * 2, th - margin_y * 2))
    foreground = source.resize(foreground_size, Image.Resampling.LANCZOS)

    x = (tw - foreground.width) // 2
    y = (th - foreground.height) // 2
    background.paste(foreground, (x, y))

    destination.parent.mkdir(parents=True, exist_ok=True)
    background.save(destination, "JPEG", quality=92, optimize=True, progressive=True)


def main() -> None:
    prepare_user_only_sources()
    pack = json.loads(PACK_PATH.read_text(encoding="utf-8"))
    frames = [frame for frame in pack["frames"] if frame["id"] not in REMOVED_FRAMES]
    pack["frames"] = frames

    shooter_view = next(frame for frame in frames if frame["id"] == "frame_03b")
    shooter_view["action"] = "Наданий користувачем 3D-кадр вправи очима стрільця."
    shooter_view["subtitle"] = "3D очима стрільця"
    shooter_view["base_duration_sec"] = 6

    practiscore = next(frame for frame in frames if frame["id"] == "frame_18")
    practiscore["action"] = (
        "Кнопка експорту .psc у наданому користувачем стані редагування матчу."
    )
    practiscore["subtitle"] = "Готовий файл для PractiScore"
    practiscore["source_file"] = "18_practiscore_export.png"
    practiscore["base_duration_sec"] = 8

    end_card = next(frame for frame in frames if frame["id"] == "frame_19")
    end_card["action"] = "Надана користувачем головна Shooters Tools як фінальний CTA."
    end_card["source_file"] = "19_cta.png"

    match_page = next(frame for frame in frames if frame["id"] == "frame_12")
    match_page["action"] = "Один кадр сторінки матчу: основні дані, вибір скводу й оплата."
    match_page["subtitle"] = "Сторінка матчу"

    for frame in frames:
        frame["voiceover"] = APPROVED_VOICEOVER[frame["id"]]
        current_file = frame["file"]
        source_file = frame.get("source_file", current_file)
        source_path = PACK_DIR / source_file
        if not source_path.exists():
            raise FileNotFoundError(f"Missing source screenshot: {source_path}")

        stem = Path(source_file).stem
        output_16x9 = Path("normalized/16x9") / f"{stem}.jpg"
        output_9x16 = Path("normalized/9x16") / f"{stem}.jpg"

        normalize(source_path, PACK_DIR / output_16x9, CANVASES["16x9"])
        normalize(source_path, PACK_DIR / output_9x16, CANVASES["9x16"])

        frame["source_file"] = source_file
        frame["file"] = output_16x9.as_posix()
        frame["file_9x16"] = output_9x16.as_posix()
        frame["canvas"] = {
            "16:9": "1600x900",
            "9:16": "900x1600",
            "fit": "contain",
            "crop": "none",
            "stretch": False,
        }
        frame["pause_after_sec"] = 0.6 if frame["id"] in SECTION_ENDS else 0.2
        frame["base_duration_sec"] = DURATION_SEC[frame["id"]]
        frame["duration_sec"] = DURATION_SEC[frame["id"]]
        frame.pop("voiceover_continues", None)

    intro = next(frame for frame in frames if frame["id"] == "frame_01")
    intro["voiceover_segments"] = [
        {
            "text": (
                "Підготовка матчу завжди складається з багатьох частин: вправ, "
                "брифінгів, заявок, скводів, оплати та підготовки файлу для PractiScore."
            ),
            "pause_after_sec": 0.4,
        },
        {
            "text": (
                "Портал Shooters Tools допомагає зібрати все це в одному місці "
                "та зручно керувати кожним етапом."
            ),
            "pause_after_sec": 0.7,
        },
    ]

    pack["version"] = 3
    pack["target_duration_sec"] = sum(frame["duration_sec"] for frame in frames)
    pack["pace"] = {
        "vo_wpm": "160-175",
        "sentence_pause_sec": "0.25-0.4",
        "section_pause_sec": "0.55-0.7",
        "note": (
            "Не склеювати речення. Начитку кожного нового розділу починати "
            "після логічної паузи; VO не переносити через cut без паузи."
        ),
    }
    pack["image_normalization"] = {
        "16:9": "normalized/16x9/*.jpg — 1600x900",
        "9:16": "normalized/9x16/*.jpg — 900x1600",
        "fit": "contain",
        "crop": "forbidden",
        "stretch": "forbidden",
        "source_pngs": "kept beside pack for recrop if needed",
    }
    pack["notes_for_video_agent"] = (
        "Використовуй лише нормалізовані file/file_9x16: усі полотна мають "
        "стабільний розмір. Не crop, не stretch, не змінюй масштаб полотна між кадрами. "
        "У voiceover_segments паузи обов’язкові; після кожного розділу витримуй "
        "pause_after_sec. VO 160–175 wpm, без злипання речень. Багатокадрові "
        "розділи — короткі cuts. Без блюру. PractiScore = готовий файл. "
        "Без «Незабаром»."
    )

    PACK_PATH.write_text(json.dumps(pack, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(
        f"normalized {len(frames)} frames; "
        f"duration={pack['target_duration_sec']}s; "
        f"outputs={len(frames) * len(CANVASES)}"
    )


if __name__ == "__main__":
    main()
