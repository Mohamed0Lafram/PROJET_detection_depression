#!/usr/bin/env python3
"""
Predict mental health state from journal text using trained ML model.
Called by the journal app backend to make predictions.
"""

import json
import sys
from pathlib import Path

import joblib

BASE_DIR = Path(__file__).parent.parent
MODEL_DIR = BASE_DIR / "Model"
sys.path.insert(0, str(MODEL_DIR))

from preprocessing import TextCleaner

import __main__

__main__.TextCleaner = TextCleaner
sys.modules["__main__"].TextCleaner = TextCleaner

PIPELINE_PATH = MODEL_DIR / "pipeline_finale.joblib"
LABEL_ENCODER_PATH = MODEL_DIR / "label_encoder_finale.joblib"


def predict_state(text: str) -> dict:
    """Predict mental health state from text."""
    try:
        # Load models
        pipeline = joblib.load(str(PIPELINE_PATH))
        label_encoder = joblib.load(str(LABEL_ENCODER_PATH))

        # Predict
        prediction_encoded = pipeline.predict([text])[0]
        probabilities = pipeline.predict_proba([text])[0]

        # Get confidence
        confidence = float(max(probabilities))

        # Map back to state ID
        state_label = label_encoder.inverse_transform([prediction_encoded])[0]

        # Map state label to our state IDs (0-6)
        normalized_label = state_label.strip().lower().replace(" ", "_")
        state_mapping = {
            "normal": 0,
            "depression_suicidal": 1,
            "anxiety_stress": 2,
            "bipolar_personality": 3,
        }

        state_id = state_mapping.get(normalized_label, None)
        if state_id is None:
            try:
                state_id = int(prediction_encoded)
            except (TypeError, ValueError):
                state_id = 0

        return {"state": state_id, "label": state_label, "confidence": confidence}

    except Exception as e:
        print(f"Error during prediction: {e}", file=sys.stderr)
        return {"state": 0, "label": "Normal", "confidence": 0}


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"state": 0, "label": "Normal", "confidence": 0}))
        sys.exit(0)

    text = sys.argv[1]
    result = predict_state(text)
    print(json.dumps(result))
