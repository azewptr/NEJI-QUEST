import csv
import hashlib
import json
import zipfile
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
groups = defaultdict(set)
counts = Counter()
with (ROOT / "data/manifest_neji_split_v2.csv").open(encoding="utf-8-sig") as file:
    rows = list(csv.DictReader(file))
assert len(rows) == 120, "Manifest harus memuat 120 kartu."
assert len({row['file'] for row in rows}) == 120, "File ganda pada manifest."
for row in rows:
    filename = Path(row["file"]).name
    assert (ROOT / "data/dataset" / row["kelas"].lower() / filename).is_file(), filename
    counts[(row["kelas"], row["pembagian"]) ] += 1
    groups[(row["kelas"], row["grup_desain"])].add(row["pembagian"])
assert all(len(parts) == 1 for parts in groups.values()), "Grup tersebar ke beberapa pembagian."
for category in ("Ramuan", "Senjata", "Perisai"):
    assert [counts[category, part] for part in ("train", "val", "test")] == [20, 10, 10]
model = ROOT / "backend_ai/models/neji_cnn_v2.keras"
with zipfile.ZipFile(model) as archive:
    config = json.loads(archive.read("config.json"))
    assert config["config"]["layers"][-1]["config"]["units"] == 3
print("Lulus: 120 gambar, pembagian 20/10/10 per kelas, setiap grup utuh, model 3 kelas.")
print("SHA-256 model:", hashlib.sha256(model.read_bytes()).hexdigest())
