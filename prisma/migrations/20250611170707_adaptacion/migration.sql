/*
  Warnings:

  - The primary key for the `Pedido` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `cantidad` on the `Pedido` table. All the data in the column will be lost.
  - You are about to drop the column `fecha` on the `Pedido` table. All the data in the column will be lost.
  - You are about to drop the column `id` on the `Pedido` table. All the data in the column will be lost.
  - You are about to drop the column `productoId` on the `Pedido` table. All the data in the column will be lost.
  - You are about to drop the column `usuarioId` on the `Pedido` table. All the data in the column will be lost.
  - You are about to alter the column `total` on the `Pedido` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(65,30)`.
  - The primary key for the `Producto` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `Producto` table. All the data in the column will be lost.
  - You are about to alter the column `precio` on the `Producto` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(65,30)`.
  - You are about to drop the `Email` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Usuario` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `estado` to the `Pedido` table without a default value. This is not possible if the table is not empty.
  - Added the required column `id_cliente` to the `Pedido` table without a default value. This is not possible if the table is not empty.
  - Added the required column `id_tipo` to the `Producto` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Email" DROP CONSTRAINT "Email_pedidoId_fkey";

-- DropForeignKey
ALTER TABLE "Pedido" DROP CONSTRAINT "Pedido_productoId_fkey";

-- DropForeignKey
ALTER TABLE "Pedido" DROP CONSTRAINT "Pedido_usuarioId_fkey";

-- AlterTable
ALTER TABLE "Pedido" DROP CONSTRAINT "Pedido_pkey",
DROP COLUMN "cantidad",
DROP COLUMN "fecha",
DROP COLUMN "id",
DROP COLUMN "productoId",
DROP COLUMN "usuarioId",
ADD COLUMN     "estado" TEXT NOT NULL,
ADD COLUMN     "fecha_pedido" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "id_cliente" INTEGER NOT NULL,
ADD COLUMN     "id_pedido" SERIAL NOT NULL,
ALTER COLUMN "total" SET DATA TYPE DECIMAL(65,30),
ADD CONSTRAINT "Pedido_pkey" PRIMARY KEY ("id_pedido");

-- AlterTable
ALTER TABLE "Producto" DROP CONSTRAINT "Producto_pkey",
DROP COLUMN "id",
ADD COLUMN     "activo" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "id_producto" SERIAL NOT NULL,
ADD COLUMN     "id_tipo" INTEGER NOT NULL,
ALTER COLUMN "descripcion" DROP NOT NULL,
ALTER COLUMN "precio" SET DATA TYPE DECIMAL(65,30),
ALTER COLUMN "stock" SET DEFAULT 0,
ADD CONSTRAINT "Producto_pkey" PRIMARY KEY ("id_producto");

-- DropTable
DROP TABLE "Email";

-- DropTable
DROP TABLE "Usuario";

-- CreateTable
CREATE TABLE "Cliente" (
    "id_cliente" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT,
    "email" TEXT NOT NULL,
    "contrasena" TEXT NOT NULL,
    "telefono" TEXT,
    "direccion" TEXT,
    "fecha_registro" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Cliente_pkey" PRIMARY KEY ("id_cliente")
);

-- CreateTable
CREATE TABLE "Rol" (
    "id_rol" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,

    CONSTRAINT "Rol_pkey" PRIMARY KEY ("id_rol")
);

-- CreateTable
CREATE TABLE "UsuarioInterno" (
    "id_usuario" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT,
    "email" TEXT NOT NULL,
    "contrasena" TEXT NOT NULL,
    "telefono" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "id_rol" INTEGER NOT NULL,

    CONSTRAINT "UsuarioInterno_pkey" PRIMARY KEY ("id_usuario")
);

-- CreateTable
CREATE TABLE "TipoProducto" (
    "id_tipo" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,

    CONSTRAINT "TipoProducto_pkey" PRIMARY KEY ("id_tipo")
);

-- CreateTable
CREATE TABLE "Hospedaje" (
    "id_hospedaje" SERIAL NOT NULL,
    "id_producto" INTEGER NOT NULL,
    "ubicacion" TEXT,
    "fecha_inicio" TIMESTAMP(3),
    "fecha_fin" TIMESTAMP(3),
    "capacidad" INTEGER,

    CONSTRAINT "Hospedaje_pkey" PRIMARY KEY ("id_hospedaje")
);

-- CreateTable
CREATE TABLE "Pasaje" (
    "id_pasaje" SERIAL NOT NULL,
    "id_producto" INTEGER NOT NULL,
    "origen" TEXT,
    "destino" TEXT,
    "fecha_salida" TIMESTAMP(3),
    "fecha_regreso" TIMESTAMP(3),
    "clase" TEXT,
    "asientos_disponibles" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Pasaje_pkey" PRIMARY KEY ("id_pasaje")
);

-- CreateTable
CREATE TABLE "Alquiler" (
    "id_alquiler" SERIAL NOT NULL,
    "id_producto" INTEGER NOT NULL,
    "tipo_vehiculo" TEXT,
    "ubicacion" TEXT,
    "fecha_inicio" TIMESTAMP(3),
    "fecha_fin" TIMESTAMP(3),
    "cantidad" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Alquiler_pkey" PRIMARY KEY ("id_alquiler")
);

-- CreateTable
CREATE TABLE "PaqueteDetalle" (
    "id_detalle" SERIAL NOT NULL,
    "id_paquete" INTEGER NOT NULL,
    "id_producto" INTEGER NOT NULL,
    "cantidad" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "PaqueteDetalle_pkey" PRIMARY KEY ("id_detalle")
);

-- CreateTable
CREATE TABLE "Carrito" (
    "id_carrito" SERIAL NOT NULL,
    "id_cliente" INTEGER NOT NULL,
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Carrito_pkey" PRIMARY KEY ("id_carrito")
);

-- CreateTable
CREATE TABLE "CarritoItem" (
    "id_item" SERIAL NOT NULL,
    "id_carrito" INTEGER NOT NULL,
    "id_producto" INTEGER NOT NULL,
    "cantidad" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "CarritoItem_pkey" PRIMARY KEY ("id_item")
);

-- CreateTable
CREATE TABLE "PedidoItem" (
    "id_detalle" SERIAL NOT NULL,
    "id_pedido" INTEGER NOT NULL,
    "id_producto" INTEGER NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "precio" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "PedidoItem_pkey" PRIMARY KEY ("id_detalle")
);

-- CreateTable
CREATE TABLE "Pago" (
    "id_pago" SERIAL NOT NULL,
    "id_pedido" INTEGER NOT NULL,
    "fecha_pago" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "monto" DECIMAL(65,30) NOT NULL,
    "metodo" TEXT,
    "estado" TEXT NOT NULL,

    CONSTRAINT "Pago_pkey" PRIMARY KEY ("id_pago")
);

-- CreateTable
CREATE TABLE "ContactoInterno" (
    "id_contacto" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telefono" TEXT,
    "cargo" TEXT,

    CONSTRAINT "ContactoInterno_pkey" PRIMARY KEY ("id_contacto")
);

-- CreateIndex
CREATE UNIQUE INDEX "Cliente_email_key" ON "Cliente"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Rol_nombre_key" ON "Rol"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "UsuarioInterno_email_key" ON "UsuarioInterno"("email");

-- CreateIndex
CREATE UNIQUE INDEX "TipoProducto_nombre_key" ON "TipoProducto"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "Hospedaje_id_producto_key" ON "Hospedaje"("id_producto");

-- CreateIndex
CREATE UNIQUE INDEX "Pasaje_id_producto_key" ON "Pasaje"("id_producto");

-- CreateIndex
CREATE UNIQUE INDEX "Alquiler_id_producto_key" ON "Alquiler"("id_producto");

-- AddForeignKey
ALTER TABLE "UsuarioInterno" ADD CONSTRAINT "UsuarioInterno_id_rol_fkey" FOREIGN KEY ("id_rol") REFERENCES "Rol"("id_rol") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Producto" ADD CONSTRAINT "Producto_id_tipo_fkey" FOREIGN KEY ("id_tipo") REFERENCES "TipoProducto"("id_tipo") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Hospedaje" ADD CONSTRAINT "Hospedaje_id_producto_fkey" FOREIGN KEY ("id_producto") REFERENCES "Producto"("id_producto") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pasaje" ADD CONSTRAINT "Pasaje_id_producto_fkey" FOREIGN KEY ("id_producto") REFERENCES "Producto"("id_producto") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alquiler" ADD CONSTRAINT "Alquiler_id_producto_fkey" FOREIGN KEY ("id_producto") REFERENCES "Producto"("id_producto") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaqueteDetalle" ADD CONSTRAINT "PaqueteDetalle_id_paquete_fkey" FOREIGN KEY ("id_paquete") REFERENCES "Producto"("id_producto") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaqueteDetalle" ADD CONSTRAINT "PaqueteDetalle_id_producto_fkey" FOREIGN KEY ("id_producto") REFERENCES "Producto"("id_producto") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Carrito" ADD CONSTRAINT "Carrito_id_cliente_fkey" FOREIGN KEY ("id_cliente") REFERENCES "Cliente"("id_cliente") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CarritoItem" ADD CONSTRAINT "CarritoItem_id_carrito_fkey" FOREIGN KEY ("id_carrito") REFERENCES "Carrito"("id_carrito") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CarritoItem" ADD CONSTRAINT "CarritoItem_id_producto_fkey" FOREIGN KEY ("id_producto") REFERENCES "Producto"("id_producto") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pedido" ADD CONSTRAINT "Pedido_id_cliente_fkey" FOREIGN KEY ("id_cliente") REFERENCES "Cliente"("id_cliente") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PedidoItem" ADD CONSTRAINT "PedidoItem_id_pedido_fkey" FOREIGN KEY ("id_pedido") REFERENCES "Pedido"("id_pedido") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PedidoItem" ADD CONSTRAINT "PedidoItem_id_producto_fkey" FOREIGN KEY ("id_producto") REFERENCES "Producto"("id_producto") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pago" ADD CONSTRAINT "Pago_id_pedido_fkey" FOREIGN KEY ("id_pedido") REFERENCES "Pedido"("id_pedido") ON DELETE RESTRICT ON UPDATE CASCADE;
