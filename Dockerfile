# Stage 1: construcción
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY tsconfig.json ./
COPY src ./src
COPY prisma ./prisma
COPY necesidad.txt ./
COPY frontend ./frontend
COPY robots.txt ./
COPY sitemap.xml ./
RUN npm run build   # transpila TypeScript a JavaScript en /dist

# Stage 2: producción
FROM node:18-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --only=production
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/necesidad.txt ./necesidad.txt
COPY --from=build /app/frontend ./frontend
COPY --from=build /app/robots.txt ./robots.txt
COPY --from=build /app/sitemap.xml ./sitemap.xml
# Ejecutar migraciones, generar cliente y seed al iniciar el contenedor
CMD sh -c "node -e \"console.log('Starting...')\" && npx prisma migrate deploy && npx prisma generate && npx prisma db seed && node dist/server.js"
