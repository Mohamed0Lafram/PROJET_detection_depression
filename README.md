# NLP Depression Detection

Mental health text classification project. A TF-IDF + Logistic Regression pipeline classifies journal text into four states, exposed through a REST API and a journal web app.

## Project structure

```
nlp_depression_detection/
├── Model/                  # Production model + FastAPI service
│   ├── pipeline_finale.joblib
│   ├── label_encoder_finale.joblib
│   ├── preprocessing.py    # TextCleaner used by the pipeline
│   ├── model.py            # Load model and run inference
│   ├── main.py             # FastAPI app
│   └── requirements.txt
├── journal_app/            # Journal web app (React + TanStack Start)
│   ├── predict_state.py    # Python bridge called by the app
│   ├── package.json
│   └── requirements.txt
├── notebooks_final/        # Final training notebooks and dataset
├── test_methods/           # Preprocessing and pipeline experiments (notebooks)
└── README.md
```

## Model classes

The classifier predicts one of four labels:

| Label | Description |
|-------|-------------|
| `Normal` | No significant distress detected |
| `Depression_Suicidal` | Depression or suicidal indicators |
| `Anxiety_Stress` | Anxiety or stress indicators |
| `Bipolar_Personality` | Bipolar or personality disorder indicators |

---

## Model — setup

```bash
cd Model
python3 -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python -m nltk.downloader wordnet omw-1.4
```

## Model — test

### 1. Direct Python test

Run a quick inference from the command line:

```bash
cd Model
source .venv/bin/activate
python -c "from model import predict; print(predict('I feel hopeless and tired all the time.'))"
```

Expected output shape:

```json
{
  "label": "Depression_Suicidal",
  "class_id": 2,
  "confidence": 0.57,
  "probabilities": { ... }
}
```

### 2. Start the API

```bash
cd Model
source .venv/bin/activate
python main.py
```

The server runs at **http://localhost:8000**. Interactive docs: **http://localhost:8000/docs**.

### 3. Test API endpoints

Health check:

```bash
curl http://localhost:8000/health
```

Model info:

```bash
curl http://localhost:8000/model/info
```

Predict:

```bash
curl -X POST http://localhost:8000/predict \
  -H "Content-Type: application/json" \
  -d '{"text": "I feel hopeless and tired all the time."}'
```

Example response:

```json
{
  "label": "Depression_Suicidal",
  "class_id": 2,
  "confidence": 0.567908,
  "probabilities": {
    "Anxiety_Stress": 0.191893,
    "Bipolar_Personality": 0.114093,
    "Depression_Suicidal": 0.567908,
    "Normal": 0.126105
  }
}
```

---

## Journal app — setup

The app needs **Node.js** (v18+) and **Python 3** with the model dependencies.

### 1. Install Python dependencies

```bash
cd journal_app
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python -m nltk.downloader wordnet omw-1.4
```

> The app calls `predict_state.py`, which loads the model from `Model/`.

### 2. Install Node dependencies

```bash
cd journal_app
npm install
```

## Journal app — test

### 1. Test the prediction script

Before starting the web app, verify the Python bridge works:

```bash
cd journal_app
source .venv/bin/activate
python predict_state.py "I feel hopeless and tired all the time."
```

Expected output:

```json
{"state": 1, "label": "Depression_Suicidal", "confidence": 0.57}
```

State IDs used by the app:

| State ID | Label |
|----------|-------|
| 0 | Normal |
| 1 | Depression_Suicidal |
| 2 | Anxiety_Stress |
| 3 | Bipolar_Personality |

### 2. Run the web app

```bash
cd journal_app
npm run dev
```

Open the URL shown in the terminal (usually **http://localhost:5173**).

### 3. Test in the browser

1. Tap **+** to create a new journal entry.
2. Write a few sentences describing how you feel.
3. Save the entry — the app calls `predict_state.py` in the background and assigns a mental health state to the entry.
4. Check the diary list and **Statistics** page to see the detected state.

---

## test_methods

The `test_methods/` folder contains Jupyter notebooks used during development to experiment with **text preprocessing**, feature extraction, and early pipeline versions. These are research notebooks, not part of the production app.

Key notebook: `test_methods/pipeline_finale.ipynb` — defines the training pipeline saved as `Model/pipeline_finale.joblib`.

---

## notebooks_final

Final project notebooks and the training dataset (`data.csv`):

- `Step01_data_understanding_mental_health.ipynb`
- `Step02_data_cleaning_preprocessing.ipynb`
- `Step03_Solution_B.ipynb`

---

## Requirements summary

| Folder | File | Purpose |
|--------|------|---------|
| `Model/` | `requirements.txt` | FastAPI service + ML inference |
| `journal_app/` | `requirements.txt` | Python prediction script used by the app |
| `journal_app/` | `package.json` | Node.js / React app dependencies |

---

## Notes

- Model artifacts must stay in `Model/` (`pipeline_finale.joblib` and `label_encoder_finale.joblib`).
- Use `scikit-learn==1.7.2` to match the version used when the pipeline was trained.
- On first run, NLTK downloads `wordnet` and `omw-1.4` for lemmatization.
