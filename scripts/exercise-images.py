"""Optimize generated exercise images and emit the SQL that links them.

  python scripts/exercise-images.py optimize <source_dir>   # <id>.jpg|png -> apps/storage/exercises/<id>.webp
  python scripts/exercise-images.py sql <migration.sql>     # UPDATE exercises for every .webp present
"""

import re
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
OUT_DIR = ROOT / "apps" / "storage" / "exercises"
MAX_WIDTH = 800
QUALITY = 68
URL_PREFIX = "/assets/exercises/"
UUID_STEM = re.compile(r"^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$")


def optimize(source_dir: Path) -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for src in sorted(source_dir.iterdir()):
        if src.suffix.lower() not in {".jpg", ".jpeg", ".png", ".webp"} or not UUID_STEM.match(src.stem):
            continue
        target = OUT_DIR / f"{src.stem}.webp"
        if target.exists() and target.stat().st_mtime >= src.stat().st_mtime:
            continue
        with Image.open(src) as img:
            img = img.convert("RGB")
            if img.width > MAX_WIDTH:
                height = round(img.height * MAX_WIDTH / img.width)
                img = img.resize((MAX_WIDTH, height), Image.LANCZOS)
            img.save(target, "WEBP", quality=QUALITY, method=6)
        print(f"{target.name}\t{target.stat().st_size // 1024} KB")


def emit_sql(migration_path: Path) -> None:
    ids = sorted(p.stem for p in OUT_DIR.glob("*.webp"))
    values = ",\n".join(f"  ('{i}', '{URL_PREFIX}{i}.webp')" for i in ids)
    sql = (
        "-- Link bundled strength exercise images. Only fills empty media so coach uploads are kept.\n"
        "UPDATE \"exercise\" AS e\n"
        "SET \"media_url\" = v.url, \"media_type\" = 'image'\n"
        "FROM (VALUES\n"
        f"{values}\n"
        ") AS v(id, url)\n"
        "WHERE e.\"id\" = v.id::uuid\n"
        "  AND (e.\"media_url\" IS NULL OR e.\"media_url\" = '');\n"
    )
    migration_path.parent.mkdir(parents=True, exist_ok=True)
    migration_path.write_text(sql, encoding="utf-8")
    print(f"{len(ids)} exercises -> {migration_path}")


if __name__ == "__main__":
    command, arg = sys.argv[1], Path(sys.argv[2])
    {"optimize": optimize, "sql": emit_sql}[command](arg)
