import { useState, useRef, useEffect } from 'react';
import { db } from './firebase'; 
import { collection, query, orderBy, limit, getDocs, addDoc, serverTimestamp } from 'firebase/firestore'; 
import { analyzeImageWithAI } from './aiService';
import './App.css';

function App() {
  const [file, setFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);

  const videoRef = useRef(null);

  // Cargar historial inicial (últimos 3)
  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const q = query(collection(db, "reportes"), orderBy("fecha", "desc"), limit(3));
      const querySnapshot = await getDocs(q);
      const docs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setHistory(docs);
    } catch (err) {
      console.error("Error al cargar historial:", err);
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setImagePreview(URL.createObjectURL(selectedFile));
      setResult(null);
      setError(null);
    }
  };

  const captureFrame = () => {
    return new Promise((resolve) => {
      const video = videoRef.current;
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      canvas.toBlob((blob) => {
        const frameFile = new File([blob], "frame.jpg", { type: "image/jpeg" });
        resolve(frameFile);
      }, "image/jpeg");
    });
  };

  const handleAnalyze = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);

    try {
      let finalData;
      if (file.type.startsWith('video/')) {
        const video = videoRef.current;
        const positions = [0.1, 0.3, 0.5, 0.7, 0.9]; 
        let totalConfidence = 0;
        let maxProb = 0;

        for (let pos of positions) {
          video.currentTime = video.duration * pos;
          await new Promise((r) => (video.onseeked = r)); 
          const frame = await captureFrame();
          const data = await analyzeImageWithAI(frame);
          
          if (data) {
            totalConfidence += data.confidence_score;
            if (data.confidence_score > maxProb) maxProb = data.confidence_score;
          }
        }
        
        const avg = Math.round(totalConfidence / positions.length);
        const isAi = avg > 50 || maxProb > 75;

        finalData = {
          is_ai_generated: isAi,
          confidence_score: isAi ? Math.max(avg, maxProb) : avg,
          verdict_label: isAi ? "Video IA Detectado" : "Video Real",
          reasoning_summary: `Análisis multicapa completado. Pico de sospecha: ${maxProb}%.`
        };
      } else {
        finalData = await analyzeImageWithAI(file);
      }

      setResult(finalData);

      // Guardar en Firebase
      await addDoc(collection(db, "reportes"), {
        nombre_archivo: file.name,
        resultado: finalData.verdict_label || finalData.verdicto,
        confianza: finalData.confidence_score,
        fecha: serverTimestamp(),
      });

      fetchHistory(); // Actualizar mini-historial

    } catch (err) {
      setError(err.message || "Error en el escaneo");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="header">
        <h1 className="title">SIMAMUL</h1>
        <p className="subtitle">Detector de Contenido Sintético v1.0</p>
      </div>

      <div className="glass-card">
        <div className="upload-zone" onClick={() => document.getElementById('fileInput').click()}>
          <input type="file" id="fileInput" accept="image/*,video/*" onChange={handleFileChange} hidden />
          
          {imagePreview ? (
            file?.type.startsWith('video/') ? (
              <video ref={videoRef} src={imagePreview} className="preview-img" muted />
            ) : (
              <img src={imagePreview} alt="Preview" className="preview-img" />
            )
          ) : (
            <div className="placeholder">
              <div className="icon-upload">📂</div>
              <p>Arrastra archivo aquí o haz clic</p>
              <small>Imagen o Video soportado</small>
            </div>
          )}
        </div>

        <button className="cyber-btn" onClick={handleAnalyze} disabled={loading || !file}>
          {loading ? "Analizando Red Neuronal..." : "Iniciar Escaneo"}
        </button>

        {error && <div className="error-msg">⚠️ {error}</div>}

        {result && (
          <div className={`result-box ${result.is_ai_generated ? 'result-fake' : 'result-real'}`}>
            <span className="verdict">{result.verdict_label || result.verdicto}</span>
            <div className="prob-bar">
              <span>Confianza: {result.confidence_score}%</span>
              <div className="bar-bg"><div className="bar-fill" style={{width: `${result.confidence_score}%`}}></div></div>
            </div>
            <p className="reason">{result.reasoning_summary}</p>
          </div>
        )}
      </div>

      {/* HISTORIAL CORTO (MÁXIMO 3) */}
      <div className="mini-history">
        <h3>Recientes</h3>
        {history.map(item => (
          <div key={item.id} className="history-item">
            <span>{item.nombre_archivo.substring(0, 15)}...</span>
            <span className={item.resultado.includes('IA') ? 'text-fake' : 'text-real'}>{item.resultado}</span>
            <span>{item.confianza}%</span>
          </div>
        ))}
      </div>

      <footer className="footer">
        SISTEMA DE SEGURIDAD INTEGRAL • PROTECTED BY SIMAMUL
      </footer>
    </div>
  );
}

export default App;