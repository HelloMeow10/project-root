# Proyecto Tienda de Viajes

Este proyecto es una aplicación web de comercio electrónico diseñada para la venta de productos y servicios turísticos, como vuelos, hoteles, alquiler de autos y paquetes combinados. Cuenta con un frontend para la interacción del cliente y un backend robusto para la gestión de la lógica de negocio y la persistencia de datos.

## Características Principales

*   **Catálogo de Productos:**
    *   Gestión completa (CRUD) de productos turísticos: vuelos, hoteles, autos y paquetes.
    *   Clasificación detallada y atributos específicos por tipo de producto.
    *   Configuración avanzada para vuelos: modelos de avión, tipos de asiento (clases de servicio), selección de asientos físicos y opciones de equipaje.
*   **Gestión de Clientes:**
    *   Registro y autenticación de clientes.
    *   Verificación de correo electrónico.
    *   Gestión de perfiles y direcciones de facturación.
*   **Carrito de Compras:**
    *   Adición y modificación de productos en el carrito.
    *   Cálculo dinámico de precios según selecciones (ej. clase de vuelo, equipaje).
*   **Proceso de Compra (Pedidos):**
    *   Generación de pedidos a partir del carrito.
    *   Integración con sistema de pagos.
    *   Seguimiento del estado de los pedidos.
*   **Panel de Administración (Usuarios Internos):**
    *   Autenticación basada en roles (Administrador, Jefe de Ventas, Vendedor).
    *   Funcionalidades para la gestión de productos, usuarios, pedidos y visualización de métricas de venta.
*   **Notificaciones:**
    *   Envío de correos electrónicos para eventos clave (bienvenida, confirmación de pedido, etc.).

## Tecnologías Utilizadas

*   **Backend:**
    *   Node.js
    *   Express.js
    *   TypeScript
    *   Prisma (ORM para PostgreSQL)
    *   JSON Web Tokens (JWT) para autenticación
    *   Bcrypt.js para hashing de contraseñas
    *   Nodemailer para envío de correos
*   **Frontend:**
    *   HTML5
    *   CSS3
    *   JavaScript (Vanilla)
*   **Base de Datos:**
    *   PostgreSQL
*   **Herramientas de Desarrollo:**
    *   Git
    *   npm
    *   Docker (soporte disponible a través de `Dockerfile` y `docker-compose.yml`)

## Estructura del Proyecto

project-root/ ├── api/ # (Parece obsoleto, el código principal está en src/) ├── dist/ # Código JavaScript transpilado (para producción) ├── documentacion/ # Diagramas y documentos relacionados ├── frontend/ # Archivos HTML, CSS, JS e imágenes para la interfaz de usuario │ ├── css/ │ ├── html/ │ ├── imagenes/ │ └── js/ ├── node_modules/ # Dependencias del proyecto ├── prisma/ # Configuración de Prisma ORM │ ├── migrations/ # Historial de migraciones de la base de datos │ └── schema.prisma # Definición del esquema de la base de datos ├── src/ # Código fuente del backend (TypeScript) │ ├── config/ # Configuración (ej. conexión a BD) │ ├── controllers/ # Controladores para manejar las rutas de la API │ ├── middlewares/ # Middlewares de Express (autenticación, manejo de errores) │ ├── models/ # (Obsoleto, Prisma maneja los modelos) │ ├── repositories/ # Lógica de acceso a datos (interacción con Prisma) │ ├── routes/ # Definición de las rutas de la API │ ├── services/ # Lógica de negocio │ ├── types/ # Definiciones de tipos TypeScript │ └── server.ts # Punto de entrada principal de la aplicación backend ├── .env # Variables de entorno (local, no versionado) ├── .env.example # Ejemplo de archivo .env ├── Dockerfile # Instrucciones para construir la imagen Docker ├── docker-compose.yml # Definición de servicios para Docker Compose ├── necesidad.txt # Script SQL con datos iniciales para la BD ├── package.json # Metadatos del proyecto y dependencias ├── package-lock.json # Registro exacto de las versiones de las dependencias ├── tsconfig.json # Configuración del compilador de TypeScript └── README.md # Este archivo


## Requisitos Previos

*   Node.js (v16 o superior recomendado)
*   npm (generalmente se instala con Node.js)
*   PostgreSQL (servidor de base de datos)

## Instalación

1.  **Clonar el repositorio:**
    ```bash
    git clone https://github.com/HelloMeow10/project-root.git
    cd project-root
    ```

2.  **Instalar dependencias:**
    ```bash
    npm install
    ```

3.  **Configurar variables de entorno:**
    *   Copiar el archivo de ejemplo:
        ```bash
        cp .env.example .env
        ```
    *   Editar el archivo `.env` con la configuración de tu base de datos PostgreSQL y otros parámetros necesarios (como `DATABASE_URL`, `JWT_SECRET`, `EMAIL_USER`, `EMAIL_PASS`, etc.).
        Ejemplo de `DATABASE_URL`:
        ```
        DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE_NAME?schema=public"
        ```

4.  **Configurar la base de datos PostgreSQL:**
    *   Asegúrate de tener un servidor PostgreSQL en ejecución.
    *   Crea la base de datos especificada en tu `DATABASE_URL` si aún no existe. Por ejemplo, si tu base de datos se llama `tienda_viajes`:
        ```sql
        -- Conectado a tu instancia de PostgreSQL como superusuario o un usuario con permisos:
        CREATE DATABASE tienda_viajes;
        ```

5.  **Ejecutar migraciones de Prisma:**
    Esto creará las tablas y la estructura necesarias en tu base de datos según el `schema.prisma`.
    ```bash
    npx prisma migrate dev --name init
    ```
    *Nota: Si encuentras problemas o necesitas reiniciar la base de datos (perderás todos los datos), puedes usar:*
    ```bash
    npx prisma migrate reset --force
    ```
    *(El flag `--force` es necesario si `reset` se usa en un entorno no interactivo o para saltar confirmaciones, úsalo con precaución).*

6.  **Generar el cliente de Prisma:**
    Este comando genera el cliente de Prisma basado en tu esquema para interactuar con la base de datos desde tu código TypeScript.
    ```bash
    npx prisma generate
    ```

## Poblar la Base de Datos (Datos Iniciales)

El archivo `necesidad.txt` contiene sentencias SQL para poblar la base de datos con datos iniciales (tipos de producto, roles, usuarios internos de ejemplo, productos, etc.).

**Importante:** Antes de ejecutar, revisa el archivo `necesidad.txt`:
*   **Hashing de contraseñas:** Las contraseñas para los usuarios internos de ejemplo (`admin@empresa.com`, etc.) están como placeholders (ej. `'$2b$10$adminhash'`). Debes generar hashes bcrypt para las contraseñas que desees y **reemplazarlos directamente en el archivo `necesidad.txt`** antes de ejecutarlo.
    Puedes generar un hash usando un script simple de Node.js:
    ```javascript
    // Ejemplo: generateHash.js
    // Asegúrate de tener bcryptjs instalado: npm install bcryptjs
    const bcrypt = require('bcryptjs'); // o bcrypt si prefieres la versión nativa
    const password = 'tu_contraseña_segura'; // Cambia esto por la contraseña deseada
    const saltRounds = 10;

    bcrypt.hash(password, saltRounds, function(err, hash) {
        if (err) {
            console.error('Error hashing password:', err);
            return;
        }
        console.log(`Password: ${password}`);
        console.log(`Hashed password: ${hash}`);
    });
    ```
    Ejecuta `node generateHash.js` (asegúrate de estar en un directorio donde `bcryptjs` esté disponible o instálalo globalmente/localmente para este script) y copia el hash resultante en el archivo `necesidad.txt` para cada usuario.

*   **Ejecución del script SQL:** La forma más sencilla de ejecutar el contenido de `necesidad.txt` es usando una herramienta de cliente de PostgreSQL como `psql` o una GUI como pgAdmin.
    Con `psql`:
    ```bash
    psql -U TU_USUARIO_POSTGRES -d NOMBRE_DE_TU_BASE_DE_DATOS -a -f necesidad.txt
    ```
    Reemplaza `TU_USUARIO_POSTGRES` y `NOMBRE_DE_TU_BASE_DE_DATOS` con tus credenciales y nombre de base de datos.

## Ejecución

1.  **Para desarrollo (con recarga automática usando ts-node):**
    ```bash
    npm run dev
    ```
    El servidor se iniciará (por defecto en `http://localhost:3000`).

2.  **Para producción:**
    *   Primero, compila el código TypeScript a JavaScript:
        ```bash
        npm run build
        ```
    *   Luego, inicia el servidor desde los archivos compilados en la carpeta `dist/`:
        ```bash
        npm start
        ```
    El servidor se iniciará (por defecto en `http://localhost:3000`).

## Acceso al Frontend

Una vez que el servidor esté en ejecución:

*   La página de inicio generalmente se sirve en la raíz: [http://localhost:3000/](http://localhost:3000/) o [http://localhost:3000/inicio.html](http://localhost:3000/inicio.html)
*   Otras páginas HTML se encuentran en `frontend/html/` y son accesibles a través de sus respectivos nombres, por ejemplo, `http://localhost:3000/login.html`.

## API Endpoints Principales

El backend expone una API REST para interactuar con la aplicación. Algunos de los puntos de acceso principales incluyen:

*   `POST /api/auth/register`: Registro de nuevos clientes.
*   `POST /api/auth/login`: Inicio de sesión para clientes.
*   `POST /api/auth/login-empleado`: Inicio de sesión para empleados.
*   `GET /api/products`: Obtener listado de productos (con filtros).
*   `GET /api/products/:id`: Obtener detalles de un producto específico.
*   `POST /api/products`: (Rol Admin/Jefe_Ventas) Crear un nuevo producto.
*   `PUT /api/products/:id`: (Rol Admin/Jefe_Ventas) Actualizar un producto.
*   `DELETE /api/products/:id`: (Rol Admin/Jefe_Ventas) Eliminar un producto.
*   `GET /api/cart`: Obtener el carrito del cliente actual.
*   `POST /api/cart/add`: Añadir un producto al carrito.
*   `PUT /api/cart/item/:itemId`: Actualizar cantidad de un item en el carrito.
*   `DELETE /api/cart/item/:itemId`: Eliminar un item del carrito.
*   `POST /api/orders`: Crear un nuevo pedido.
*   `GET /api/orders/my-orders`: (Cliente) Obtener historial de pedidos del cliente.
*   `GET /api/orders/:id`: Obtener detalles de un pedido específico.
*   `GET /api/dashboard/stats`: (Roles autorizados) Obtener estadísticas de ventas.
*   `GET /api/users`: (Admin) Obtener listado de clientes.
*   `GET /api/roles`: (Admin) Obtener listado de roles.

Para una lista completa y detallada, revisa el código en `src/routes/`.

## Documentación Adicional

*   Diagramas y otros documentos relevantes se pueden encontrar en la carpeta `documentacion/`.
    *   `Diagrama Entidad Relacion.png`: Muestra el esquema de la base de datos.

## Uso de Docker (Opcional)

El proyecto incluye un `Dockerfile` y un `docker-compose.yml` para facilitar la ejecución en un entorno contenedorizado.

1.  **Configurar `.env`:** Asegúrate de que tu archivo `.env` esté configurado correctamente, especialmente `DATABASE_URL` para que apunte al servicio de base de datos de Docker si lo usas (ej. `postgresql://USER:PASSWORD@db:5432/DATABASE_NAME?schema=public`, donde `db` es el nombre del servicio de PostgreSQL en `docker-compose.yml`).
2.  **Construir e iniciar los contenedores:**
    ```bash
    docker-compose up --build -d
    ```
    El `-d` es para ejecutar en modo detached (segundo plano).
3.  **Migraciones y datos semilla con Docker:**
    Una vez que los contenedores estén en ejecución, necesitarás ejecutar las migraciones y el script de datos semilla dentro del contenedor de la aplicación.
    *   Identifica el nombre o ID de tu contenedor de aplicación (ej. `project-root_app_1`) con `docker ps`.
    *   Abrir una terminal en el contenedor de la aplicación:
        ```bash
        docker exec -it <nombre_o_id_del_contenedor_app> bash
        ```
    *   Dentro del contenedor, ejecuta los comandos de Prisma:
        ```bash
        npx prisma migrate dev --name init
        npx prisma generate
        ```
    *   Para poblar la base de datos con `necesidad.txt`:
        *   Asegúrate que el archivo `necesidad.txt` (con las contraseñas hasheadas correctamente) esté accesible para el contenedor. Puedes copiarlo al contenedor usando `docker cp necesidad.txt <nombre_o_id_del_contenedor_app>:/usr/src/app/necesidad.txt` antes de entrar al bash, o si está en el volumen montado, ya debería estar allí.
        *   Si `psql` no está en el contenedor de la aplicación, puedes ejecutarlo desde el host apuntando al puerto de la BD expuesto por Docker, o ejecutarlo desde el contenedor de la BD si tiene `psql` y acceso al archivo.
        *   Si `psql` está disponible en el contenedor de la app (podrías necesitar añadirlo al Dockerfile):
            ```bash
            # Dentro del contenedor de la app:
            psql -U USER -d DATABASE_NAME -h db -a -f /usr/src/app/necesidad.txt 
            ```
            Reemplaza `USER`, `DATABASE_NAME` y `db` (host del servicio de BD) según tu `docker-compose.yml` y `.env`.

## Posibles Mejoras / Trabajo Futuro

*   Implementación completa de pruebas unitarias e integración.
*   Mejorar la interfaz de usuario y la experiencia del usuario (UX).
*   Refactorizar y optimizar el código del frontend.
*   Documentación de API más detallada (ej. Swagger/OpenAPI).
*   Implementación de funcionalidades de búsqueda avanzada y filtros más complejos.
*   Internacionalización (i18n) y localización (l10n).
*   Optimización del rendimiento y escalabilidad.

## Contribuciones

Las contribuciones son bienvenidas. Por favor, abre un issue para discutir cambios importantes o envía un Pull Request.

## Licencia

Este proyecto se distribuye bajo la Licencia MIT. (Actualmente no existe un archivo `LICENSE` en el repositorio. Se recomienda añadir uno si se desea especificar formalmente la licencia).
