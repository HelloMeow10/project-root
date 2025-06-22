# project-root

## Instalación y ejecución

1. Clona el repositorio:
   ```sh
   git clone https://github.com/HelloMeow10/project-root.git
   cd project-root
   ```

2. Instala las dependencias:
   ```sh
   npm install
   ```

3. Copia y configura el archivo `.env`:
   ```sh
   cp .env.example .env
   ```
   Edita `.env` con tus datos de PostgreSQL.

4. Crea la base de datos (si no existe):
   ```sh
   psql -U postgres -c "CREATE DATABASE tienda_viajes;"
   ```

5. Ejecuta las migraciones de Prisma:
   ```sh
   npx prisma migrate dev --name init
   npx prisma migrate reset
   ```

6. Genera el cliente de Prisma:
   ```sh
   npx prisma generate
   ```

7. Inicia el servidor:
   ```sh
   npm run build
   npm start
   ```

8. Accede a [http://localhost:3000](http://localhost:3000)