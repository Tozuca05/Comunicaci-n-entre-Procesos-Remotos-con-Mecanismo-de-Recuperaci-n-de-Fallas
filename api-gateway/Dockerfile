# Dockerfile
FROM node:18

# Crear carpeta dentro del contenedor
WORKDIR /app

# Copiar archivos
COPY . .

# Instalar dependencias
RUN npm install

# Exponer el puerto (se tomará del docker-compose)
EXPOSE 3000

# Comando por defecto
CMD ["node", "index.js"]
