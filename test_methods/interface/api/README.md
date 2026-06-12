# ML Classification API

A production-ready REST API that wraps any scikit-learn model and exposes
**classification + confidence score** via clean HTTP endpoints.

---

## Quick Start

```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Run the API (auto-trains the model on first launch)
python main.py
# or
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

The server starts at **http://localhost:8000**.  
Interactive docs at **http://localhost:8000/docs**.

---

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Liveness probe |
| `GET` | `/model/info` | Model metadata |
| `POST` | `/predict` | **Classify + confidence** |
| `GET` | `/docs` | Swagger UI |
| `GET` | `/redoc` | ReDoc UI |

---

## Predict — Request & Response

### Request
```http
POST /predict
Content-Type: application/json

{
  "features": [5.1, 3.5, 1.4, 0.2]
}
```

### Response
```json
{
  "label": "Iris-setosa",
  "class_id": 0,
  "confidence": 0.995,
  "probabilities": {
    "Iris-setosa":     0.995,
    "Iris-versicolor": 0.004,
    "Iris-virginica":  0.001
  }
}
```

| Field | Type | Description |
|-------|------|-------------|
| `label` | `string` | Human-readable predicted class |
| `class_id` | `int` | Integer index of the class |
| `confidence` | `float` | Probability of the winner (0 – 1) |
| `probabilities` | `object` | Full distribution over all classes |

---

## cURL Examples

```bash
# Predict
curl -s -X POST http://localhost:8000/predict \
  -H "Content-Type: application/json" \
  -d '{"features": [5.1, 3.5, 1.4, 0.2]}' | python -m json.tool

# Health check
curl http://localhost:8000/health

# Model info
curl http://localhost:8000/model/info
```

---

## Bring Your Own Model

1. Open `model.py`.
2. Replace the `train_and_save()` function with your training logic
   (or load a pre-trained pickle / ONNX / joblib file).
3. Update `LABEL_MAP` with your class names.
4. Update `model_info()` in `main.py` with your feature names.

That's it — the API layer stays the same.

---

## Project Structure

```
ml-api/
├── main.py          # FastAPI app, routes, Pydantic schemas
├── model.py         # ML model — train, save, load, predict
├── requirements.txt
└── README.md
```
