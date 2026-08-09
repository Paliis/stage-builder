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

DURATION_INCREASES = {
    "frame_01": 2,
    "frame_03b": 1,
    "frame_05": 1,
    "frame_07": 1,
    "frame_10": 1,
    "frame_11b": 1,
}

SECTION_ENDS = {
    "frame_01",
    "frame_03b",
    "frame_05",
    "frame_07",
    "frame_10",
    "frame_11b",
    "frame_14",
    "frame_16",
    "frame_17",
    "frame_18",
    "frame_19",
}

REMOVED_OLD_FRAMES = {"frame_03", "frame_18b"}


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
    frames = [frame for frame in pack["frames"] if frame["id"] not in REMOVED_OLD_FRAMES]
    pack["frames"] = frames

    shooter_view = next(frame for frame in frames if frame["id"] == "frame_03b")
    shooter_view["action"] = "Наданий користувачем 3D-кадр вправи очима стрільця."
    shooter_view["voiceover"] = (
        "Розставте мішені й старт. Потім перевірте вправу в 3D — очима стрільця."
    )
    shooter_view["subtitle"] = "3D очима стрільця"
    shooter_view["base_duration_sec"] = 6

    practiscore = next(frame for frame in frames if frame["id"] == "frame_18")
    practiscore["action"] = (
        "Кнопка експорту .psc у наданому користувачем стані редагування матчу."
    )
    practiscore["voiceover"] = (
        "Коли все готово — завантажте файл для PractiScore. "
        "Без ручного перенесення учасників і параметрів."
    )
    practiscore["subtitle"] = "Готовий файл для PractiScore"
    practiscore["source_file"] = "18_practiscore_export.png"
    practiscore["base_duration_sec"] = 8

    end_card = next(frame for frame in frames if frame["id"] == "frame_19")
    end_card["action"] = "Надана користувачем головна Shooters Tools як фінальний CTA."
    end_card["source_file"] = "19_cta.png"

    for frame in frames:
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
        base_duration = frame.get("base_duration_sec", frame["duration_sec"])
        frame["base_duration_sec"] = base_duration
        frame["duration_sec"] = base_duration + DURATION_INCREASES.get(frame["id"], 0)

    intro = next(frame for frame in frames if frame["id"] == "frame_01")
    intro["voiceover"] = (
        "Підготовка матчу — це вправи, брифінги, заявки, скводи й оплата. "
        "А наприкінці — готовий файл для PractiScore. "
        "Shooters Tools збирає все це в одному місці."
    )
    intro["voiceover_segments"] = [
        {
            "text": "Підготовка матчу — це вправи, брифінги, заявки, скводи й оплата.",
            "pause_after_sec": 0.4,
        },
        {
            "text": "А наприкінці — готовий файл для PractiScore.",
            "pause_after_sec": 0.45,
        },
        {
            "text": "Shooters Tools збирає все це в одному місці.",
            "pause_after_sec": 0.7,
        },
    ]

    pack["version"] = 3
    pack["target_duration_sec"] = sum(frame["duration_sec"] for frame in frames)
    pack["pace"] = {
        "vo_wpm": "145-160",
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
        "pause_after_sec. VO 145–160 wpm, без злипання речень. Багатокадрові "
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
