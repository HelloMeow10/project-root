/*
  Warnings:

  - You are about to drop the column `clase` on the `Pasaje` table. All the data in the column will be lost.
  - You are about to drop the column `id_tipo_asiento` on the `Pasaje` table. All the data in the column will be lost.
  - You are about to drop the column `precio` on the `PedidoItem` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Pasaje" DROP CONSTRAINT "Pasaje_id_tipo_asiento_fkey";

-- AlterTable
ALTER TABLE "Pasaje" DROP COLUMN "clase",
DROP COLUMN "id_tipo_asiento",
ADD COLUMN     "id_avion_config" INTEGER;

-- AlterTable
ALTER TABLE "PedidoItem" DROP COLUMN "precio",
ADD COLUMN     "id_clase_servicio_seleccionada" INTEGER,
ADD COLUMN     "precio_total_item" DECIMAL(65,30) NOT NULL DEFAULT 0,
ADD COLUMN     "precio_unitario_base" DECIMAL(65,30) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "TipoAsiento" ADD COLUMN     "multiplicador_precio" DECIMAL(65,30) DEFAULT 1.0;

-- CreateTable
CREATE TABLE "AvionConfig" (
    "id_avion_config" SERIAL NOT NULL,
    "nombre_config" TEXT NOT NULL,
    "total_filas" INTEGER NOT NULL,
    "columnas_config" TEXT NOT NULL,

    CONSTRAINT "AvionConfig_pkey" PRIMARY KEY ("id_avion_config")
);

-- CreateTable
CREATE TABLE "Asiento" (
    "id_asiento" SERIAL NOT NULL,
    "id_avion_config" INTEGER NOT NULL,
    "fila" INTEGER NOT NULL,
    "columna" TEXT NOT NULL,
    "id_tipo_asiento_base" INTEGER NOT NULL,
    "caracteristicas" TEXT[],
    "precio_adicional_base" DECIMAL(65,30),

    CONSTRAINT "Asiento_pkey" PRIMARY KEY ("id_asiento")
);

-- CreateTable
CREATE TABLE "SeleccionAsientoPasajero" (
    "id_seleccion_asiento" SERIAL NOT NULL,
    "id_pedido_item" INTEGER NOT NULL,
    "id_asiento_fisico" INTEGER NOT NULL,
    "precio_seleccion_asiento" DECIMAL(65,30) NOT NULL,
    "fecha_seleccion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SeleccionAsientoPasajero_pkey" PRIMARY KEY ("id_seleccion_asiento")
);

-- CreateTable
CREATE TABLE "OpcionEquipaje" (
    "id_opcion_equipaje" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "precio_adicional" DECIMAL(65,30) NOT NULL,
    "peso_maximo_kg" INTEGER,
    "dimensiones_maximas" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "OpcionEquipaje_pkey" PRIMARY KEY ("id_opcion_equipaje")
);

-- CreateTable
CREATE TABLE "SeleccionEquipajePasajero" (
    "id_seleccion_equipaje" SERIAL NOT NULL,
    "id_pedido_item" INTEGER NOT NULL,
    "id_opcion_equipaje" INTEGER NOT NULL,
    "cantidad" INTEGER NOT NULL DEFAULT 1,
    "precio_seleccion_equipaje" DECIMAL(65,30) NOT NULL,
    "fecha_seleccion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SeleccionEquipajePasajero_pkey" PRIMARY KEY ("id_seleccion_equipaje")
);

-- CreateIndex
CREATE UNIQUE INDEX "AvionConfig_nombre_config_key" ON "AvionConfig"("nombre_config");

-- CreateIndex
CREATE UNIQUE INDEX "Asiento_id_avion_config_fila_columna_key" ON "Asiento"("id_avion_config", "fila", "columna");

-- CreateIndex
CREATE UNIQUE INDEX "SeleccionAsientoPasajero_id_pedido_item_key" ON "SeleccionAsientoPasajero"("id_pedido_item");

-- CreateIndex
CREATE UNIQUE INDEX "OpcionEquipaje_nombre_key" ON "OpcionEquipaje"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "SeleccionEquipajePasajero_id_pedido_item_id_opcion_equipaje_key" ON "SeleccionEquipajePasajero"("id_pedido_item", "id_opcion_equipaje");

-- AddForeignKey
ALTER TABLE "Pasaje" ADD CONSTRAINT "Pasaje_id_avion_config_fkey" FOREIGN KEY ("id_avion_config") REFERENCES "AvionConfig"("id_avion_config") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PedidoItem" ADD CONSTRAINT "PedidoItem_id_clase_servicio_seleccionada_fkey" FOREIGN KEY ("id_clase_servicio_seleccionada") REFERENCES "TipoAsiento"("id_tipo_asiento") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asiento" ADD CONSTRAINT "Asiento_id_avion_config_fkey" FOREIGN KEY ("id_avion_config") REFERENCES "AvionConfig"("id_avion_config") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asiento" ADD CONSTRAINT "Asiento_id_tipo_asiento_base_fkey" FOREIGN KEY ("id_tipo_asiento_base") REFERENCES "TipoAsiento"("id_tipo_asiento") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeleccionAsientoPasajero" ADD CONSTRAINT "SeleccionAsientoPasajero_id_pedido_item_fkey" FOREIGN KEY ("id_pedido_item") REFERENCES "PedidoItem"("id_detalle") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeleccionAsientoPasajero" ADD CONSTRAINT "SeleccionAsientoPasajero_id_asiento_fisico_fkey" FOREIGN KEY ("id_asiento_fisico") REFERENCES "Asiento"("id_asiento") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeleccionEquipajePasajero" ADD CONSTRAINT "SeleccionEquipajePasajero_id_pedido_item_fkey" FOREIGN KEY ("id_pedido_item") REFERENCES "PedidoItem"("id_detalle") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeleccionEquipajePasajero" ADD CONSTRAINT "SeleccionEquipajePasajero_id_opcion_equipaje_fkey" FOREIGN KEY ("id_opcion_equipaje") REFERENCES "OpcionEquipaje"("id_opcion_equipaje") ON DELETE RESTRICT ON UPDATE CASCADE;
