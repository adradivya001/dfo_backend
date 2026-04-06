from fastapi import FastAPI, Query
from transformers import pipeline
import uvicorn

app = FastAPI(title="Janmasethu BERT Risk Engine")

# Load a clinical/medical specialized BERT model
# (Can be swapped for a custom-trained Janmasethu model)
# "bhadresh-savani/bert-base-uncased-emotion" or "emilyalsentzer/Bio_ClinicalBERT"
print("🚀 Loading Clinical BERT Model...")
risk_analyzer = pipeline("text-classification", model="bhadresh-savani/distilbert-base-uncased-emotion")

@app.get("/predict")
async def predict_risk(message: str = Query(..., description="Message from patient")):
    """
    Analyzes the message and returns a risk category.
    """
    result = risk_analyzer(message)[0]
    label = result['label'].lower()
    confidence = result['score']

    # Map Emotions/Sentiments to Clinical Risk Levels
    # Note: For production, use a model specifically fine-tuned on medical urgency.
    high_risk_emotions = ['fear', 'anger', 'sadness']
    moderate_risk_emotions = ['surprise']
    
    risk_level = "GREEN"
    if label in high_risk_emotions and confidence > 0.7:
        risk_level = "RED"
    elif label in moderate_risk_emotions:
        risk_level = "YELLOW"

    return {
        "message": message,
        "risk_level": risk_level,
        "confidence": confidence,
        "model_label": label
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
