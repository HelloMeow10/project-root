/*
  Warnings:

  - Made the column `id_tipo_asiento` on table `Pasaje` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Pasaje" DROP CONSTRAINT "Pasaje_id_tipo_asiento_fkey";

-- AlterTable
ALTER TABLE "Pasaje" ALTER COLUMN "asientos_disponibles" DROP NOT NULL,
ALTER COLUMN "asientos_disponibles" DROP DEFAULT,
ALTER COLUMN "aerolinea" SET DATA TYPE TEXT,
ALTER COLUMN "id_tipo_asiento" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "Pasaje" ADD CONSTRAINT "Pasaje_id_tipo_asiento_fkey" FOREIGN KEY ("id_tipo_asiento") REFERENCES "TipoAsiento"("id_tipo_asiento") ON DELETE RESTRICT ON UPDATE CASCADE;
