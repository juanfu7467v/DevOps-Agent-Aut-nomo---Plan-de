const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const config = require('./config/config');
const AuthMiddleware = require('./middleware/authMiddleware');

const app = express();

// 🟢 CONFIGURACIÓN DE CORS MEJORADA
app.use(cors({
  origin: '*', // Permitir cualquier origen para las pruebas
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'x-api-key']
}));

app.use(helmet({
  contentSecurityPolicy: false, // Desactivar para facilitar pruebas de interfaz externa
}));
app.use(morgan('dev'));
app.use(express.json());

// Endpoint de salud (Público)
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'up', service: 'devops-agent' });
});

// Endpoint para obtener conectores (Inspirado en tus capturas)
app.get('/api/connectors', AuthMiddleware.verifyApiKey, (req, res) => {
  res.json({ 
    success: true, 
    connectors: {
      github: { status: 'connected' },
      vercel: { status: 'active' },
      slack: { status: 'pending' },
      supabase: { status: 'active' }
    } 
  });
});

// Ejecutar instrucción
app.post('/api/v1/execute', AuthMiddleware.verifyApiKey, async (req, res) => {
  const { instruction } = req.body;
  console.log(`[AGENT] Recibida instrucción: ${instruction}`);
  
  // Simulación de respuesta mientras conectas DeepSeek
  res.json({ 
    success: true, 
    data: {
      action: "analysis",
      response: `Analizando solicitud: "${instruction}". Agente listo para ejecutar en el contexto de ${req.user.id}.`
    } 
  });
});

module.exports = app;
