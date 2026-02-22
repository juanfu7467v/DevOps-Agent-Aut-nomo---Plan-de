# Documentación de Transformación a Plataforma Multiusuario

## Introducción
Este documento detalla los cambios estructurales implementados en el agente DevOps para transformarlo de una herramienta de uso personal a una plataforma multiusuario. El objetivo principal es permitir que múltiples usuarios puedan interactuar con el agente, conectando sus propias cuentas y servicios externos de manera segura y autónoma, similar a plataformas como Manus.

## 1. Autenticación de Usuarios con Firebase

Se ha eliminado la dependencia de una `API_KEY` global para la autenticación. Ahora, el sistema utiliza **Firebase Authentication** para gestionar el acceso de los usuarios, proporcionando un método de autenticación robusto y escalable.

### Funcionamiento del Nuevo Sistema de Autenticación:

1.  **Inicio de Sesión Frontend**: El usuario inicia sesión en la interfaz de usuario (frontend) utilizando Firebase Authentication. Tras un inicio de sesión exitoso, el frontend obtiene un **ID Token** de Firebase.
2.  **Envío del Token al Backend**: Para cada solicitud a la API del backend, el frontend debe incluir este ID Token en el encabezado `Authorization` con el formato `Bearer <idToken>`.
3.  **Validación en el Backend**: Se ha implementado un nuevo middleware (`firebaseAuthMiddleware.js`) en el backend que intercepta las solicitudes. Este middleware realiza las siguientes acciones:
    *   Extrae el ID Token del encabezado `Authorization`.
    *   Utiliza el **Firebase Admin SDK** para verificar la validez y autenticidad del token.
    *   Si el token es válido, decodifica la información del usuario (UID, email, nombre) y la adjunta al objeto `req.user`, haciendo que la información del usuario esté disponible para los controladores subsiguientes.
    *   Si el token es inválido o está ausente, la solicitud es rechazada con un error 401 (Unauthorized).

### Middleware de Autenticación (`src/middleware/firebaseAuthMiddleware.js`):

```javascript
const admin = require(\'../config/firebase\');
const logger = require(\'../services/logger\');

class FirebaseAuthMiddleware {
  static async verifyIdToken(req, res, next) {
    try {
      const authHeader = req.get(\'Authorization\');
      if (!authHeader || !authHeader.startsWith(\'Bearer \')) {
        return res.status(401).json({ success: false, error: \'Missing or invalid Authorization header\' });
      }
      const idToken = authHeader.replace(\'Bearer \', \'\');
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      req.user = { uid: decodedToken.uid, email: decodedToken.email, displayName: decodedToken.name };
      logger.info(\'User authenticated successfully\', { uid: decodedToken.uid });
      next();
    } catch (error) {
      logger.warn(\'Token verification failed\', { error: error.message });
      return res.status(401).json({ success: false, error: \'Invalid or expired token\' });
    }
  }
  // ... (otros métodos como verifyIdTokenOptional)
}
module.exports = FirebaseAuthMiddleware;
```

## 2. Gestión Dinámica de Conectores (incluyendo GitHub OAuth)

Se ha introducido un sistema de **Conectores** que permite a cada usuario vincular sus propios servicios externos, eliminando la necesidad de variables de entorno globales para credenciales como `GITHUB_TOKEN`, `GITHUB_OWNER`, y `GITHUB_REPO`.

### Funcionamiento del Sistema de Conectores:

1.  **Modelo de Datos (`src/models/userConnectors.model.js`)**: Se ha creado un modelo en Firestore para almacenar las credenciales y configuraciones de los conectores de cada usuario. La estructura permite guardar `accessToken`, `refreshToken`, `expiresAt`, y metadatos específicos para cada tipo de conector, asociados al `UID` del usuario.
2.  **Servicio de Conectores (`src/services/connectorService.js`)**: Este servicio gestiona las operaciones CRUD (Crear, Leer, Actualizar, Eliminar) para los conectores de usuario, interactuando con el modelo de Firestore.
3.  **Controlador de Conectores (`src/controllers/connectorController.js`)**: Expone endpoints de API para que el frontend pueda registrar, listar, obtener, activar/desactivar y eliminar conectores para el usuario autenticado.

### Integración Específica de GitHub OAuth:

*   **Flujo OAuth**: Se ha implementado el flujo de **GitHub OAuth** para que los usuarios puedan conectar sus cuentas de GitHub de forma segura. Esto implica:
    *   Un endpoint (`/api/github/authorize`) que genera la URL de autorización de GitHub, a la que el frontend redirigirá al usuario.
    *   Un endpoint de callback (`/api/github/callback`) que recibe el código de autorización de GitHub, lo intercambia por un `access_token`, obtiene la información del usuario de GitHub y registra este conector en la base de datos del agente.
*   **Acceso a Repositorios**: Una vez conectado, el agente puede acceder a los repositorios del usuario utilizando el `access_token` almacenado, permitiendo operaciones como listar repositorios (`/api/github/repositories`) o realizar acciones en ellos.

### Estructura de un Conector (Firestore):

```json
users/{uid}/connectors/{connectorId}
{
  "type": "github" | "gmail" | "slack" | "stripe" | "custom",
  "name": "Mi GitHub",
  "isActive": true,
  "credentials": {
    "accessToken": "encrypted_token",
    "refreshToken": "encrypted_token" (opcional),
    "expiresAt": "timestamp",
    "metadata": { /* Información adicional del conector */ }
  },
  "createdAt": "timestamp",
  "updatedAt": "timestamp",
  "lastUsed": "timestamp"
}
```

## 3. Agente Autónomo con DeepSeek

El agente ahora integra **DeepSeek** como su modelo principal de inteligencia artificial, lo que le permite realizar tareas complejas de forma autónoma, como generación de código, toma de decisiones y automatización de tareas, utilizando las credenciales del usuario autenticado.

### Funcionamiento de la Integración con DeepSeek:

1.  **Servicio de Integración (`src/integrations/deepseekIntegration.js`)**: Este servicio encapsula la lógica para interactuar con la API de DeepSeek. Incluye un `SYSTEM_PROMPT` detallado que define el rol y las capacidades del agente autónomo (generación de código, gestión de repositorios, automatización de proyectos, toma de decisiones).
2.  **Controlador de IA (`src/controllers/aiController.js`)**: Expone varios endpoints de API (`/api/ai/chat`, `/api/ai/generate-code`, `/api/ai/analyze`, etc.) que permiten al frontend solicitar al agente que realice diversas operaciones impulsadas por IA.
3.  **Contexto de Usuario**: El agente está diseñado para operar dentro del contexto del usuario autenticado. Esto significa que cuando el agente necesita interactuar con servicios externos (como GitHub), utilizará las credenciales del conector de GitHub que el usuario ha vinculado a su cuenta.

### System Prompt del Agente Autónomo:

El `SYSTEM_PROMPT` ha sido diseñado para guiar el comportamiento del agente, enfatizando la autonomía, la calidad del código, la seguridad y el uso de las credenciales del usuario:

```text
You are an autonomous DevOps agent with the following capabilities:

1. **Code Generation**: Generate high-quality code for various tasks...
2. **Repository Management**: Create and modify repositories, make commits and deploys...
3. **Project Automation**: Create project structures, set up CI/CD pipelines...
4. **Decision Making**: Analyze requirements, optimize code, identify and fix issues...
5. **User Context**: Always work with the authenticated user\'s credentials, respect user preferences, maintain security and privacy, log all actions for audit purposes.

Guidelines:
- Always ask for clarification if requirements are ambiguous
- Provide detailed explanations for your decisions
- Suggest best practices and improvements
- Handle errors gracefully and provide solutions
- Maintain code quality and security standards
- Use the user\'s connected services (GitHub, etc.) for operations

Your goal is to automate DevOps tasks efficiently while maintaining quality and security.
```

## 4. Refactorización de Servicios y Variables de Entorno

Se han refactorizado los servicios existentes para que utilicen las credenciales y configuraciones específicas del usuario, obtenidas a través del sistema de conectores, en lugar de depender de variables de entorno globales.

### Variables de Entorno Actualizadas (`.env.example`):

Las siguientes variables de entorno son cruciales para el funcionamiento de la plataforma multiusuario y deben configurarse en Fly.io (o en tu entorno local para desarrollo):

| Variable | Descripción | Ejemplo de Valor |
| :--- | :--- | :--- |
| `FIREBASE_PROJECT_ID` | ID de tu proyecto Firebase. | `your-firebase-project-id` |
| `FIREBASE_PRIVATE_KEY` | Clave privada de tu cuenta de servicio Firebase (incluye `\n` escapados). | `-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n` |
| `FIREBASE_CLIENT_EMAIL` | Email de tu cuenta de servicio Firebase. | `firebase-adminsdk-xyz@your-project.iam.gserviceaccount.com` |
| `DEEPSEEK_API_KEY` | Tu clave API para acceder a DeepSeek. | `sk-your-deepseek-api-key` |
| `GITHUB_OAUTH_CLIENT_ID` | ID de cliente de tu aplicación GitHub OAuth. | `Iv1.xxxxxxxxxxxxxxxx` |
| `GITHUB_OAUTH_CLIENT_SECRET` | Secreto de cliente de tu aplicación GitHub OAuth. | `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` |
| `NODE_ENV` | Entorno de ejecución de la aplicación. | `production` |
| `PORT` | Puerto en el que la aplicación escuchará. | `3000` |
| `HOST` | Host en el que la aplicación escuchará. | `0.0.0.0` |
| `LOG_LEVEL` | Nivel de detalle de los logs. | `info` |
| `CORS_ORIGINS` | Orígenes permitidos para solicitudes CORS (separados por comas). | `http://localhost:3000,https://your-frontend-domain.com` |
| `WEBHOOK_SECRET` | (Opcional) Secreto para validar webhooks genéricos. | `your-webhook-secret` |

**Nota Importante sobre `FIREBASE_PRIVATE_KEY`**: Asegúrate de que la clave privada se configure como una sola línea en tu entorno de Fly.io, reemplazando los saltos de línea reales por `\n` escapados. El código del agente ya maneja esta conversión.

## 5. Endpoints de la API Actualizados

La estructura de endpoints ha sido actualizada para reflejar la nueva arquitectura multiusuario y las integraciones. Todos los endpoints bajo `/api` ahora requieren autenticación Firebase, excepto el de autorización de GitHub.

### Endpoints Públicos (sin autenticación):

| Endpoint | Método | Descripción | Parámetros |
| :--- | :--- | :--- | :--- |
| `/health` | `GET` | Verifica si la API está en línea. | Ninguno |
| `/stats` | `GET` | Obtiene estadísticas básicas del sistema. | Ninguno |
| `/github/authorize` | `GET` | Genera la URL para iniciar el flujo de GitHub OAuth. | `redirectUri` (query) |

### Endpoints Protegidos (requieren `Authorization: Bearer <Firebase_ID_Token>`):

#### **Gestión de Tareas (Tasks)**
| Endpoint | Método | Descripción | Parámetros / Body |
| :--- | :--- | :--- | :--- |
| `/api/tasks` | `GET` | Lista todas las tareas registradas. | Ninguno |
| `/api/tasks/:taskId` | `GET` | Obtiene detalles de una tarea específica. | `taskId` (URL) |
| `/api/tasks/:taskId/execute` | `POST` | Ejecuta una tarea manualmente. | `{"params": { ... }}` (body, opcional) |
| `/api/tasks/history` | `GET` | Ver el historial de ejecuciones. | `taskId` (query, opcional), `limit` (query) |
| `/api/cron-jobs` | `GET` | Lista todas las tareas cron configuradas. | Ninguno |

#### **Despliegues (Deployments)**
| Endpoint | Método | Descripción | Parámetros / Body |
| :--- | :--- | :--- | :--- |
| `/api/deployments` | `POST` | Crea una nueva configuración de despliegue. | `{"id": "nombre", "config": { ... }}` (body) |
| `/api/deployments` | `GET` | Lista todos los despliegues configurados. | Ninguno |
| `/api/deployments/:deploymentId` | `GET` | Obtiene detalles de un despliegue específico. | `deploymentId` (URL) |
| `/api/deployments/:deploymentId/execute` | `POST` | Inicia el proceso de despliegue. | `deploymentId` (URL) |
| `/api/deployments/:deploymentId/logs` | `GET` | Obtiene los logs de un despliegue. | `deploymentId` (URL) |
| `/api/deployments/:deploymentId` | `DELETE` | Cancela o elimina un despliegue. | `deploymentId` (URL) |
| `/api/deployments/history` | `GET` | Ver el historial de despliegues. | `limit` (query) |

#### **Gestión de Conectores**
| Endpoint | Método | Descripción | Parámetros / Body |
| :--- | :--- | :--- | :--- |
| `/api/connectors` | `POST` | Registra un nuevo conector para el usuario. | `{"type": "github", "name": "Mi GitHub", "accessToken": "...", ...}` (body) |
| `/api/connectors` | `GET` | Lista todos los conectores del usuario. | Ninguno |
| `/api/connectors/:connectorId` | `GET` | Obtiene un conector específico. | `connectorId` (URL) |
| `/api/connectors/type/:type` | `GET` | Obtiene conectores de un tipo específico. | `type` (URL) |
| `/api/connectors/:connectorId/activate` | `PATCH` | Activa un conector. | `connectorId` (URL) |
| `/api/connectors/:connectorId/deactivate` | `PATCH` | Desactiva un conector. | `connectorId` (URL) |
| `/api/connectors/:connectorId` | `DELETE` | Elimina un conector. | `connectorId` (URL) |

#### **Integración GitHub OAuth**
| Endpoint | Método | Descripción | Parámetros / Body |
| :--- | :--- | :--- | :--- |
| `/api/github/callback` | `POST` | Maneja el callback de GitHub OAuth. | `{"code": "...", "state": "...", "redirectUri": "..."}` (body) |
| `/api/github/repositories` | `GET` | Lista los repositorios del usuario conectado. | Ninguno |
| `/api/github/user-info` | `GET` | Obtiene información del usuario de GitHub. | Ninguno |

#### **Agente IA (DeepSeek)**
| Endpoint | Método | Descripción | Parámetros / Body |
| :--- | :--- | :--- | :--- |
| `/api/ai/chat` | `POST` | Envía un mensaje al agente IA y obtiene una respuesta. | `{"message": "...", "conversationHistory": [...]}` (body) |
| `/api/ai/generate-code` | `POST` | Genera código basado en una descripción. | `{"description": "...", "language": "javascript"}` (body) |
| `/api/ai/analyze` | `POST` | Analiza un problema y sugiere soluciones. | `{"problem": "...", "context": {}}` (body) |
| `/api/ai/action-plan` | `POST` | Genera un plan de acción para una tarea. | `{"task": "...", "constraints": {}}` (body) |
| `/api/ai/review-code` | `POST` | Revisa código y sugiere mejoras. | `{"code": "...", "language": "javascript"}` (body) |
| `/api/ai/generate-docs` | `POST` | Genera documentación para código. | `{"code": "...", "language": "javascript"}` (body) |

#### **Logs del Sistema**
| Endpoint | Método | Descripción | Parámetros |
| :--- | :--- | :--- | :--- |
| `/api/logs` | `GET` | Consulta los logs del servidor. | `type` (query, `info`/`error`), `limit` (query, número) |

## Conclusión

La transformación del agente a una plataforma multiusuario con autenticación Firebase, un sistema de conectores dinámicos y la integración con DeepSeek sienta las bases para un sistema robusto y escalable. Cada usuario puede ahora gestionar sus propias integraciones y aprovechar las capacidades de IA del agente de forma personalizada y segura. Es fundamental configurar correctamente todas las variables de entorno mencionadas para asegurar el funcionamiento óptimo de la plataforma.
