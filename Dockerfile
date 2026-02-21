FROM node:22-alpine

# Crear directorio de trabajo
WORKDIR /app

# Instalar dependencias del sistema necesarias
RUN apk add --no-cache libc6-compat

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias correctamente
RUN npm ci --omit=dev

# Copiar todo el proyecto (no solo src)
COPY . .

# Crear carpeta de logs si no existe
RUN mkdir -p ./src/logs

# Puerto de la app
EXPOSE 3000

# Healthcheck seguro (no rompe si falla)
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

# Usar usuario seguro
RUN addgroup -S app && adduser -S app -G app
USER app

# Ejecutar la app
CMD ["node", "src/server.js"]
