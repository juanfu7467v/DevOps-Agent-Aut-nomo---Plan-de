const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const config = require('./config/config');
const AuthMiddleware = require('./middleware/authMiddleware');
const taskService = require('./services/taskService');

const app = express();

// Middlewares globales
app.use(helmet());
app.use(cors({ origin: config.security.corsOrigins }));
app.use(morgan('dev'));
app.use(express.json());

// --- ENDPOINTS PROTEGIDOS ---

// 1. Ejecutar instrucción autónoma (Tipo Manus)
app.post('/api/v1/execute', AuthMiddleware.verifyApiKey, async (req, res) => {
  const { instruction, context } = req.body;
  
  // 'req.user' contiene los tokens de GitHub/Vercel del usuario actual
  try {
    const result = await taskService.runDeepSeekAgent(instruction, context, req.user);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 2. Chat rápido con el agente
app.post('/api/agent/chat', AuthMiddleware.verifyApiKey, async (req, res) => {
  const { message } = req.body;
  res.json({ success: true, response: `Agente DeepSeek procesando: ${message}` });
});

// 3. Obtener conectores del usuario (GitHub, Slack, etc.)
app.get('/api/connectors', AuthMiddleware.verifyApiKey, (req, res) => {
  res.json({ 
    success: true, 
    connectors: req.user.connectors || {} 
  });
});

module.exports = app;
