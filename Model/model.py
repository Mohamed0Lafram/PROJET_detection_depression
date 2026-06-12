import os
import sys
from typing import Any

import joblib
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import LabelEncoder

from preprocessing import TextCleaner

BASE_DIR = os.path.dirname(__file__)
PIPELINE_PATH = os.path.join(BASE_DIR, "pipeline_finale.joblib")
LABEL_ENCODER_PATH = os.path.join(BASE_DIR, "label_encoder_finale.joblib")

MODEL_NAME = "TF-IDF + Logistic Regression (pipeline_finale)"
OUTPUT_CLASSES = [
    "Anxiety_Stress",
    "Bipolar_Personality",
    "Depression_Suicidal",
    "Normal",
]

_pipeline: Pipeline | None = None
_label_encoder: LabelEncoder | None = None


def _register_text_cleaner() -> None:
    """Expose TextCleaner for joblib unpickling from the notebook __main__ scope."""
    import __main__

    __main__.TextCleaner = TextCleaner
    sys.modules["__main__"].TextCleaner = TextCleaner


def load_pipeline() -> Pipeline:
    global _pipeline
    if _pipeline is None:
        if not os.path.exists(PIPELINE_PATH):
            raise FileNotFoundError(f"Pipeline file not found: {PIPELINE_PATH}")
        _register_text_cleaner()
        _pipeline = joblib.load(PIPELINE_PATH)
    return _pipeline


def load_label_encoder() -> LabelEncoder:
    global _label_encoder
    if _label_encoder is None:
        if not os.path.exists(LABEL_ENCODER_PATH):
            raise FileNotFoundError(
                f"Label encoder file not found: {LABEL_ENCODER_PATH}"
            )
        _label_encoder = joblib.load(LABEL_ENCODER_PATH)
    return _label_encoder


def get_output_classes() -> list[str]:
    return list(load_label_encoder().classes_)


def get_metadata() -> dict[str, Any]:
    return {
        "name": MODEL_NAME,
        "version": "1.0.0",
        "description": (
            "4-class mental health text classifier trained with pipeline_finale. "
            "Classes: Anxiety_Stress, Bipolar_Personality, Depression_Suicidal, Normal."
        ),
        "input_features": ["text"],
        "output_classes": get_output_classes(),
    }


def predict(text: str) -> dict[str, Any]:
    if not isinstance(text, str) or not text.strip():
        raise ValueError("text must be a non-empty string")

    pipeline = load_pipeline()
    label_encoder = load_label_encoder()

    probabilities = pipeline.predict_proba([text])[0]
    class_id = int(pipeline.predict([text])[0])
    label = label_encoder.inverse_transform([class_id])[0]
    confidence = float(probabilities[class_id])

    return {
        "label": label,
        "class_id": class_id,
        "confidence": round(confidence, 6),
        "probabilities": {
            label_encoder.inverse_transform([idx])[0]: round(float(score), 6)
            for idx, score in enumerate(probabilities)
        },
    }
