# backend/main.py
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import random
import time

app = FastAPI()

# --- CONFIGURACIÓN DE SEGURIDAD ---
# Permite que tu Frontend (React) hable con esta API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # En producción, cambia esto por la URL de tu frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def home():
    return {"estado": "API Gateway lista. Esperando conexión con Nodo de IA."}

@app.post("/predict")
async def predict_image(file: UploadFile = File(...)):
    # 1. Validar que sea una imagen
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="El archivo debe ser una imagen")

    print(f"📸 Imagen recibida: {file.filename}")

    # --- ZONA DE CONEXIÓN CON LA OTRA PC (FUTURO) ---
    # Aquí iría el código para enviar la foto a la PC potente.
    # Por ahora, simulamos el análisis para que puedas guardar y avanzar.
    
    # Simulación de tiempo de procesamiento
    time.sleep(1) 
    
    # Simulación de respuesta (Esto lo cambiarás cuando conectemos la otra PC)
    mock_score = random.uniform(0.70, 0.99)
    mock_verdict = "Fake" if mock_score > 0.8 else "Real"
    
    return {
        "veredicto": mock_verdict,
        "confianza": round(mock_score, 2),
        "algoritmo": "Gateway-Simulado (Esperando GPU Externa)"
    }