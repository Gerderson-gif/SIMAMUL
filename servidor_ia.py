from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from transformers import AutoImageProcessor, AutoModelForImageClassification
from PIL import Image
import torch
import io

app = FastAPI()

# Permite la conexión con el frontend de React
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Cargar el modelo entrenado anoche (0.08 loss)
MODEL_PATH = "./modelo_entrenado"
processor = AutoImageProcessor.from_pretrained(MODEL_PATH)
model = AutoModelForImageClassification.from_pretrained(MODEL_PATH)

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    # 1. Leer la imagen enviada desde React
    contents = await file.read()
    image = Image.open(io.BytesIO(contents)).convert("RGB")
    
    # 2. Procesar la imagen para la IA
    inputs = processor(images=image, return_tensors="pt")
    
    # 3. Realizar la predicción
    with torch.no_grad():
        outputs = model(**inputs)
    
    # 4. Calcular probabilidad y etiqueta
    logits = outputs.logits
    probs = torch.nn.functional.softmax(logits, dim=-1)
    confianza, prediction_idx = torch.max(probs, dim=-1)
    
    label = model.config.id2label[prediction_idx.item()]
    
    # 5. Respuesta en el formato exacto que espera aiService.js
    return {
        "veredicto": label, 
        "confianza": float(confianza.item()),
        "algoritmo": "ViT Deepfake Detection (V-Forensics)"
    }