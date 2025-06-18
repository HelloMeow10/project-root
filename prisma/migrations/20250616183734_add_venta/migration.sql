-- AlterTable
ALTER TABLE "Pasaje" ADD COLUMN     "aerolinea" VARCHAR(255);

-- CreateTable
CREATE TABLE "Auto" (
    "id_auto" SERIAL NOT NULL,
    "id_producto" INTEGER NOT NULL,
    "modelo" TEXT,
    "marca" TEXT,
    "capacidad" INTEGER,
    "ubicacion_actual" TEXT,
    "estado" TEXT NOT NULL,

    CONSTRAINT "Auto_pkey" PRIMARY KEY ("id_auto")
);

-- CreateTable
CREATE TABLE "Venta" (
    "id" SERIAL NOT NULL,
    "pedidoId" INTEGER NOT NULL,
    "monto" DOUBLE PRECISION NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Venta_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Auto_id_producto_key" ON "Auto"("id_producto");

-- AddForeignKey
ALTER TABLE "Auto" ADD CONSTRAINT "Auto_id_producto_fkey" FOREIGN KEY ("id_producto") REFERENCES "Producto"("id_producto") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Venta" ADD CONSTRAINT "Venta_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "Pedido"("id_pedido") ON DELETE RESTRICT ON UPDATE CASCADE;
