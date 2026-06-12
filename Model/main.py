from typing import Any

import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator

from model import get_metadata, predict

app = FastAPI(
    title="Depression Detection API",
    description="Classify text input and return a mental health label with confidence.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class PredictRequest(BaseModel):
    text: str = Field(
        ...,
        min_length=1,
        description="Text to classify.",
        examples=["I feel hopeless and tired all the time."],
    )

    @field_validator("text")
    @classmethod
    def not_blank(cls, value: str) -> str:
        if not isinstance(value, str) or not value.strip():
            raise ValueError("text must contain at least one non-whitespace character")
        return value


class PredictResponse(BaseModel):
    label: str = Field(..., description="Predicted label.")
    class_id: int = Field(..., description="Encoded class index.")
    confidence: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Confidence score for the predicted label.",
    )
    probabilities: dict[str, float] = Field(
        ...,
        description="Probability distribution over all classes.",
    )


class ModelInfo(BaseModel):
    name: str
    version: str
    description: str
    input_features: list[str]
    output_classes: list[str]


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/model/info", response_model=ModelInfo)
def model_info() -> dict[str, Any]:
    metadata = get_metadata()
    return {
        "name": metadata["name"],
        "version": metadata["version"],
        "description": metadata["description"],
        "input_features": metadata["input_features"],
        "output_classes": metadata["output_classes"],
    }


@app.post("/predict", response_model=PredictResponse)
def predict_endpoint(request: PredictRequest) -> dict[str, Any]:
    try:
        return predict(request.text)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except FileNotFoundError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Inference failed: {exc}") from exc


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
