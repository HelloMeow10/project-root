-- AlterTable
ALTER TABLE "Cliente" ADD COLUMN     "dni" TEXT;

-- AlterTable
ALTER TABLE "Pedido" ADD COLUMN     "id_direccion_facturacion" INTEGER;

-- CreateTable
CREATE TABLE "DireccionFacturacion" (
    "id_direccion" SERIAL NOT NULL,
    "id_cliente" INTEGER NOT NULL,
    "dni" TEXT NOT NULL,
    "calle" TEXT NOT NULL,
    "numero" TEXT,
    "piso" TEXT,
    "departamento" TEXT,
    "ciudad" TEXT NOT NULL,
    "codigo_postal" TEXT NOT NULL,
    "provincia" TEXT NOT NULL,
    "pais" TEXT NOT NULL,
    "es_principal" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "DireccionFacturacion_pkey" PRIMARY KEY ("id_direccion")
);

-- CreateTable
CREATE TABLE "MetodoPagoCliente" (
    "id_metodo_pago" SERIAL NOT NULL,
    "id_cliente" INTEGER NOT NULL,
    "stripe_payment_method_id" TEXT NOT NULL,
    "tipo_tarjeta" TEXT NOT NULL,
    "ultimos_cuatro_digitos" TEXT NOT NULL,
    "fecha_expiracion" TEXT NOT NULL,
    "es_principal" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "MetodoPagoCliente_pkey" PRIMARY KEY ("id_metodo_pago")
);

-- CreateIndex
CREATE UNIQUE INDEX "MetodoPagoCliente_stripe_payment_method_id_key" ON "MetodoPagoCliente"("stripe_payment_method_id");

-- AddForeignKey
ALTER TABLE "DireccionFacturacion" ADD CONSTRAINT "DireccionFacturacion_id_cliente_fkey" FOREIGN KEY ("id_cliente") REFERENCES "Cliente"("id_cliente") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MetodoPagoCliente" ADD CONSTRAINT "MetodoPagoCliente_id_cliente_fkey" FOREIGN KEY ("id_cliente") REFERENCES "Cliente"("id_cliente") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pedido" ADD CONSTRAINT "Pedido_id_direccion_facturacion_fkey" FOREIGN KEY ("id_direccion_facturacion") REFERENCES "DireccionFacturacion"("id_direccion") ON DELETE SET NULL ON UPDATE CASCADE;
