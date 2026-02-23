const admin = require('firebase-admin');
const config = require('../config/config');
const logger = require('../services/logger');

// Inicializar Firebase Admin una sola vez
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: config.firebase.projectId,
      clientEmail: config.firebase.clientEmail,
      privateKey: config.firebase.privateKey,
    })
  });
}

const db = admin.firestore();

class AuthMiddleware {
  static async verifyApiKey(req, res, next) {
    const apiKey = req.get('x-api-key');

    if (!apiKey) {
      logger.warn('Intento de acceso sin API Key');
      return res.status(401).json({ success: false, error: 'x-api-key requerida' });
    }

    try {
      // Buscar el usuario que tiene esta API Key en Firestore
      const userQuery = await db.collection('users').where('apiKey', '==', apiKey).limit(1).get();

      if (userQuery.empty) {
        logger.warn(`API Key inválida: ${apiKey.substring(0, 5)}...`);
        return res.status(401).json({ success: false, error: 'API Key inválida o inexistente' });
      }

      // Adjuntar los datos del usuario (ID y conectores) al request
      const userDoc = userQuery.docs[0];
      req.user = {
        id: userDoc.id,
        ...userDoc.data()
      };

      next();
    } catch (error) {
      logger.error('Error validando API Key en Firestore:', error);
      res.status(500).json({ success: false, error: 'Error interno de autenticación' });
    }
  }
}

module.exports = AuthMiddleware;
