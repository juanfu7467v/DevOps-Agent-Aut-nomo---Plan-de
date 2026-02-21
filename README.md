# DevOps Agent Autónomo

Este proyecto implementa un agente autónomo de DevOps, diseñado para automatizar tareas, gestionar despliegues, monitorear servicios y manejar eventos mediante webhooks. Está construido con Node.js y Express, siguiendo una arquitectura modular y escalable, y está listo para ser desplegado en entornos de producción como Fly.io.

## Características Principales

-   **Backend Robusto**: Desarrollado en Node.js con el framework Express, garantizando un rendimiento eficiente y escalabilidad.
-   **Arquitectura Modular**: Estructura de proyecto organizada en `controllers`, `services`, `routes`, `config`, `middleware`, `utils`, `integrations`, `tasks` y `logs` para facilitar el mantenimiento y la expansión.
-   **Configuración Flexible**: Uso extensivo de variables de entorno (`.env`) para una configuración sencilla y segura.
-   **Automatización de Tareas**: Ejecución automática de tareas DevOps mediante cron jobs, eventos (webhooks) y comandos internos.
-   **Gestión de Despliegues**: Funcionalidades para orquestar y monitorear el ciclo de vida de los despliegues.
-   **Monitoreo Básico**: Endpoint `/health` para verificar el estado del agente y `/stats` para obtener métricas de rendimiento.
-   **Logs Estructurados**: Sistema de logging avanzado que genera logs en formato JSON o texto, facilitando el análisis y la depuración.
-   **Manejo de Errores Robusto**: Gestión centralizada de errores para una mayor estabilidad y resiliencia.
-   **Integraciones Clave**: Conectores pre-construidos para GitHub, APIs HTTP externas, automatización de navegador (Puppeteer) y sistema de archivos.
-   **Seguridad**: Implementación de validación de entradas, rate limiting, CORS configurado y autenticación por API Key.
-   **Panel Básico**: Endpoints para `/health`, `/logs` y ejecución manual de tareas.
-   **Listo para Producción**: Configuración completa para despliegue en Fly.io, incluyendo `Dockerfile`, `fly.toml` y scripts de arranque.

## Estructura del Proyecto

```
. 
├── Dockerfile
├── fly.toml
├── package.json
├── package-lock.json
├── README.md
├── .env.example
├── .gitignore
└── src
    ├── app.js
    ├── server.js
    ├── config
    │   └── config.js
    ├── controllers
    │   ├── deploymentController.js
    │   ├── healthController.js
    │   └── taskController.js
    ├── integrations
    │   ├── browserIntegration.js
    │   ├── fileSystemIntegration.js
    │   ├── githubIntegration.js
    │   └── httpIntegration.js
    ├── logs
    ├── middleware
    │   ├── authMiddleware.js
    │   ├── corsMiddleware.js
    │   ├── errorMiddleware.js
    │   ├── loggingMiddleware.js
    │   ├── rateLimitMiddleware.js
    │   └── validationMiddleware.js
    ├── services
    │   ├── deploymentService.js
    │   ├── errorHandler.js
    │   ├── healthService.js
    │   ├── logger.js
    │   ├── taskService.js
    │   └── webhookService.js
    ├── tasks
    └── utils
```

## Instalación

Para configurar y ejecutar el agente en tu entorno local, sigue estos pasos:

1.  **Clonar el repositorio**:

    ```bash
    git clone https://github.com/juanfu7467v/DevOps-Agent-Aut-nomo---Plan-de.git
    cd DevOps-Agent-Aut-nomo---Plan-de
    ```

2.  **Instalar dependencias**:

    ```bash
    npm install
    ```

3.  **Configurar variables de entorno**:

    Crea un archivo `.env` en la raíz del proyecto, basándote en el archivo `.env.example`:

    ```bash
    cp .env.example .env
    ```

    Edita el archivo `.env` con tus configuraciones. Asegúrate de establecer `GITHUB_TOKEN`, `GITHUB_OWNER`, `GITHUB_REPO`, `API_KEY` y `WEBHOOK_SECRET`.

4.  **Ejecutar en modo desarrollo** (con `nodemon` para recarga automática):

    ```bash
    npm run dev
    ```

5.  **Ejecutar en modo producción**:

    ```bash
    npm start
    ```

El agente estará disponible en `http://localhost:3000` (o el puerto que configures en `.env`).

## Variables de Entorno

El archivo `.env` permite configurar el comportamiento del agente. Aquí están las variables más importantes:

| Variable                      | Descripción                                                                                              | Valor por Defecto         |
| :---------------------------- | :------------------------------------------------------------------------------------------------------- | :------------------------ |
| `NODE_ENV`                    | Entorno de la aplicación (`development`, `production`, `test`)                                           | `development`             |
| `PORT`                        | Puerto en el que el servidor escuchará las solicitudes                                                   | `3000`                    |
| `HOST`                        | Host en el que el servidor escuchará las solicitudes                                                     | `0.0.0.0`                   |
| `LOG_LEVEL`                   | Nivel mínimo de logs a registrar (`error`, `warn`, `info`, `debug`)                                      | `info`                    |
| `LOG_FORMAT`                  | Formato de los logs (`json` o `text`)                                                                    | `json`                    |
| `LOG_DIR`                     | Directorio donde se guardarán los archivos de log                                                        | `./src/logs`              |
| `GITHUB_TOKEN`                | Token de acceso personal de GitHub para autenticación                                                    | `''`                      |
| `GITHUB_OWNER`                | Nombre de usuario o organización de GitHub propietaria del repositorio                                   | `''`                      |
| `GITHUB_REPO`                 | Nombre del repositorio de GitHub a interactuar                                                           | `''`                      |
| `CORS_ORIGINS`                | Orígenes permitidos para solicitudes CORS (separados por comas)                                          | `http://localhost:3000`   |
| `RATE_LIMIT_WINDOW`           | Ventana de tiempo para el rate limiting en minutos                                                       | `15`                      |
| `RATE_LIMIT_MAX`              | Número máximo de solicitudes permitidas por ventana                                                      | `100`                     |
| `API_KEY`                     | Clave API para autenticar solicitudes al agente                                                          | `your_api_key_for_agent_authentication` |
| `WEBHOOK_SECRET`              | Secreto para verificar la firma de los webhooks entrantes                                                | `your_webhook_secret_key` |
| `WEBHOOK_PORT`                | Puerto para escuchar webhooks (si es diferente al puerto principal)                                      | `3001`                    |
| `API_TIMEOUT`                 | Tiempo de espera para solicitudes a APIs externas en milisegundos                                        | `30000`                   |
| `API_RETRIES`                 | Número de reintentos para solicitudes a APIs externas fallidas                                           | `3`                       |
| `CRON_ENABLED`                | Habilita o deshabilita la ejecución de cron jobs (`true` o `false`)                                      | `true`                    |
| `MAX_CONCURRENT_DEPLOYS`      | Número máximo de despliegues concurrentes permitidos                                                     | `3`                       |
| `DEPLOY_TIMEOUT`              | Tiempo de espera para un despliegue en milisegundos                                                      | `300000`                  |

## Endpoints del Agente

### Salud y Monitoreo

-   `GET /health`: Retorna el estado de salud del agente.
-   `GET /stats`: Retorna estadísticas de uso y rendimiento del agente.
-   `GET /logs?type=[info|error|warn|debug]&limit=[number]`: Retorna los logs del agente. `type` y `limit` son opcionales.

### Tareas

-   `GET /api/tasks`: Lista todas las tareas registradas.
-   `GET /api/tasks/:taskId`: Obtiene detalles de una tarea específica.
-   `POST /api/tasks/:taskId/execute`: Ejecuta una tarea manualmente. Requiere un cuerpo JSON con `params` opcionales.
-   `GET /api/tasks/history`: Obtiene el historial de ejecución de tareas.
-   `GET /api/cron-jobs`: Lista todos los cron jobs programados.

### Despliegues

-   `POST /api/deployments`: Crea una nueva configuración de despliegue. Requiere `id` y `config` en el cuerpo JSON.
-   `GET /api/deployments`: Lista todas las configuraciones de despliegue.
-   `GET /api/deployments/:deploymentId`: Obtiene detalles de un despliegue específico.
-   `POST /api/deployments/:deploymentId/execute`: Ejecuta un despliegue. 
-   `GET /api/deployments/:deploymentId/logs`: Obtiene los logs de un despliegue específico.
-   `DELETE /api/deployments/:deploymentId`: Cancela un despliegue en curso.
-   `GET /api/deployments/history`: Obtiene el historial de despliegues.

## Despliegue en Fly.io

Este agente está configurado para un despliegue sencillo en Fly.io. Asegúrate de tener la CLI de Fly.io instalada y autenticada.

1.  **Crear una aplicación Fly.io** (si no tienes una):

    ```bash
    fly launch
    ```

    Sigue las instrucciones. Esto generará un archivo `fly.toml` (ya incluido en este proyecto, pero puedes adaptarlo si es necesario).

2.  **Configurar secretos en Fly.io**:

    Es crucial configurar tus variables de entorno sensibles como secretos en Fly.io. Por ejemplo:

    ```bash
    fly secrets set GITHUB_TOKEN=your_github_token
    fly secrets set API_KEY=your_api_key
    fly secrets set WEBHOOK_SECRET=your_webhook_secret
    # ... y cualquier otra variable sensible de tu .env
    ```

3.  **Desplegar la aplicación**:

    ```bash
    fly deploy
    ```

    Fly.io usará el `Dockerfile` y `fly.toml` provistos para construir y desplegar tu aplicación.

## Scripts NPM

-   `npm start`: Inicia el agente en modo producción.
-   `npm run dev`: Inicia el agente en modo desarrollo con `nodemon` para recarga automática.
-   `npm test`: Ejecuta las pruebas (actualmente no implementadas).
-   `npm run lint`: Ejecuta el linter (actualmente no implementado).

## Contribución

Las contribuciones son bienvenidas. Por favor, abre un *issue* o *pull request* en el repositorio de GitHub.

## Licencia

Este proyecto está bajo la licencia ISC.
