import io
import sys
from pathlib import Path
from unittest.mock import patch

from fastapi.testclient import TestClient
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from backend_ai import app as backend

client = TestClient(backend.app)
image = Image.new("RGB", (128, 128), "white")
buffer = io.BytesIO()
image.save(buffer, format="PNG")
png = buffer.getvalue()

for failure in (TypeError("model incompatible"), RuntimeError("inference failed")):
    with patch.object(backend, "load_model", side_effect=failure):
        response = client.post("/api/predict", files={"file": ("card.png", png, "image/png")})
    assert response.status_code == 503, response.text
    assert isinstance(response.json()["detail"], str)
print("PASS: model TypeError and RuntimeError return JSON 503")

response = client.post("/api/predict", files={"file": ("broken.png", b"broken", "image/png")})
assert response.status_code == 400, response.text
print("PASS: invalid image returns JSON 400")

for path in sys.argv[1:]:
    path = Path(path)
    with path.open("rb") as file:
        response = client.post("/api/predict", files={"file": (path.name, file, "image/png")})
    assert response.status_code == 200, response.text
    result = response.json()
    assert result["item_id"] in (1, 2, 3)
    assert 0 <= result["score"] <= 1
    if path.name.startswith("ramuan_"):
        assert result["label"] == "Ramuan", result
    print(f"PASS: {path.name} -> {result}")
