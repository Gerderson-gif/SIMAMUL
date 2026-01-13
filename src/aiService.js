// Apuntamos al proxy que definimos en vite.config.js
// Esto redirigirá internamente a http://127.0.0.1:8000/predict
const API_URL = "/api-local/predict"; 

export async function analyzeImageWithAI(file) {
  try {
    console.log("📡 Enviando imagen al servidor Python local...");
    
    // Preparamos el archivo para enviarlo como formulario
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(API_URL, {
      method: "POST",
      body: formData, // No hace falta headers, el navegador los pone solos
    });

    if (!response.ok) {
        throw new Error(`Error del servidor: ${response.statusText}`);
    }

    const result = await response.json();
    console.log("✅ Respuesta recibida de Python:", result);

    // Adaptamos la respuesta de Python para que tu web la entienda
    // (Python devuelve: "veredicto", "confianza", "algoritmo")
    
    const isAi = result.veredicto.toLowerCase() === "fake";
    const percentage = Math.round(result.confianza * 100);

    return {
      is_ai_generated: isAi,
      confidence_score: percentage,
      verdict_label: isAi ? "IA Detectada" : "Contenido Real",
      reasoning_summary: `Análisis del Servidor: ${percentage}% de probabilidad. (${result.algoritmo})`
    };

  } catch (error) {
    console.error("❌ Error conectando con Python:", error);
    // Devolvemos un error amigable para que la web no explote
    return {
      is_ai_generated: false,
      confidence_score: 0,
      verdict_label: "Error de Conexión",
      reasoning_summary: "No se pudo conectar con el servidor local. Asegúrate de que uvicorn esté corriendo."
    };
  }
}