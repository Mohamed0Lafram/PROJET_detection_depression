import os
import json
import joblib
from sklearn.pipeline import Pipeline

MODEL_PATH = "model_rl.joblib"
METADATA_PATH = "model_metadata.json"

# ── Global metadata ───────────────────────────────────────────────────────────
_metadata = None
LABEL_MAP = None


def _load_metadata() -> dict:
    """Load model metadata from JSON file."""
    global _metadata
    if _metadata is None:
        if not os.path.exists(METADATA_PATH):
            raise FileNotFoundError(f"Metadata file not found: {METADATA_PATH}")
        with open(METADATA_PATH, "r") as f:
            _metadata = json.load(f)
        print(f"[model] Loaded metadata from {METADATA_PATH}")
    return _metadata


def _init_label_map() -> dict:
    """Initialize label map from metadata."""
    global LABEL_MAP
    if LABEL_MAP is None:
        metadata = _load_metadata()
        LABEL_MAP = {int(k): v for k, v in metadata.get("classes", {}).items()}
    return LABEL_MAP


def load_model() -> Pipeline:
    """Load the pre-trained model from disk."""
    if not os.path.exists(MODEL_PATH):
        raise FileNotFoundError(f"Model file not found: {MODEL_PATH}")
    print(f"[model] Loading from {MODEL_PATH}")
    return joblib.load(MODEL_PATH)


def get_metadata() -> dict:
    """Return the model metadata."""
    return _load_metadata()


def predict(text: str) -> dict:
    """Run inference on input text and return label plus confidence."""
    if not isinstance(text, str) or not text.strip():
        raise ValueError("text must be a non-empty string")

    model = _get_model()
    label_map = _init_label_map()
    
    proba = model.predict_proba([text])[0]
    class_id = int(model.predict([text])[0])
    confidence = float(proba[class_id])

    return {
        "label": label_map.get(class_id, str(class_id)),
        "confidence": round(confidence, 6),
    }


# ── Singleton cache ───────────────────────────────────────────────────────────
_model_instance: Pipeline | None = None


def _get_model() -> Pipeline:
    global _model_instance
    if _model_instance is None:
        _model_instance = load_model()
    return _model_instance
