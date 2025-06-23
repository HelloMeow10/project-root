-- AlterTable
ALTER TABLE "Pasaje" ADD COLUMN     "id_tipo_asiento" INTEGER;

-- CreateTable
CREATE TABLE "TipoAsiento" (
    "id_tipo_asiento" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,

    CONSTRAINT "TipoAsiento_pkey" PRIMARY KEY ("id_tipo_asiento")
);

-- CreateIndex
CREATE UNIQUE INDEX "TipoAsiento_nombre_key" ON "TipoAsiento"("nombre");

-- AddForeignKey
ALTER TABLE "Pasaje" ADD CONSTRAINT "Pasaje_id_tipo_asiento_fkey" FOREIGN KEY ("id_tipo_asiento") REFERENCES "TipoAsiento"("id_tipo_asiento") ON DELETE SET NULL ON UPDATE CASCADE;
