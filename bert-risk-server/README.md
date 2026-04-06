# Janmasethu BERT Risk Server (Python)

This is the **Clinical AI Brain** that works alongside the **NEST.JS** Control Tower. It uses a Transformer-based Model to detect distress or medical risk from patient chat messages.

### **1. Setup Guide (Requires Python 3.9+)**
Open your terminal in this folder and run:
```bash
pip install fastapi uvicorn transformers torch
```

### **2. Running the AI Server**
Run the server with Uvicorn:
```bash
python main.py
```
By default, the server will start at: `http://localhost:8000`.

### **3. Connecting to the Backend**
Update your `.env/development.env` in the `control-tower-core` folder:
```env
# Point to your local AI server instead of ngrok
BERT_API_URL=http://localhost:8000/predict
```

### **Clinical Logic Notes**
- The current `main.py` is using a **DistilBERT** model for speed and low memory usage.
- If you need higher medical accuracy, consider swapping the model for: **`emilyalsentzer/Bio_ClinicalBERT`**.
- The `predict_risk` endpoint maps complex emotions (Fear/Sadness) to **RED** or **YELLOW** clinical alerts in the dashboard.
