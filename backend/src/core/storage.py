from pathlib import Path

BASE_DIR = Path(__file__).resolve().parents[2]
STORAGE_DIR = BASE_DIR / "storage" / "files"

STORAGE_DIR.mkdir(parents=True, exist_ok=True)
