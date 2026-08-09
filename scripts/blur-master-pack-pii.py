from PIL import Image, ImageFilter
from pathlib import Path

out = Path(r"content/user-help/videos/reel-packs/ecosystem-master-160s")


def blur_regions(src_name: str, dest_name: str, boxes_norm: list[tuple[float, float, float, float]]) -> None:
  im = Image.open(out / src_name).convert("RGBA")
  w, h = im.size
  for x0, y0, x1, y1 in boxes_norm:
    box = (int(x0 * w), int(y0 * h), int(x1 * w), int(y1 * h))
    region = im.crop(box)
    rw, rh = region.size
    small = region.resize((max(1, rw // 28), max(1, rh // 28)), Image.Resampling.BILINEAR)
    pixel = small.resize((rw, rh), Image.Resampling.NEAREST)
    pixel = pixel.filter(ImageFilter.GaussianBlur(radius=8))
    im.paste(pixel, box)
  im.convert("RGB").save(out / dest_name, "PNG", optimize=True)
  print("wrote", dest_name)


# Stronger cover of name, phone, region, avatar
blur_regions(
  "17_shooter_cabinet_raw.png",
  "17_shooter_cabinet.png",
  [
    (0.06, 0.40, 0.50, 0.64),  # personal fields block
    (0.50, 0.40, 0.74, 0.68),  # avatar
  ],
)

blur_regions(
  "15_roster_table_raw.png",
  "15_roster_table.png",
  [
    (0.04, 0.20, 0.42, 0.95),
  ],
)

blur_regions(
  "16_squad_board_raw.png",
  "16_squad_board.png",
  [
    (0.01, 0.26, 0.99, 0.96),
  ],
)
