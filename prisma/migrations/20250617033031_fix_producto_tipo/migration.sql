/*
  Warnings:

  - You are about to alter the column `precio` on the `Producto` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `DoublePrecision`.

*/
-- DropForeignKey
ALTER TABLE "Producto" DROP CONSTRAINT "Producto_id_tipo_fkey";

-- AlterTable
ALTER TABLE "Producto" ADD COLUMN     "tipo" TEXT,
ALTER COLUMN "precio" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "stock" DROP NOT NULL,
ALTER COLUMN "stock" DROP DEFAULT,
ALTER COLUMN "id_tipo" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Producto" ADD CONSTRAINT "Producto_id_tipo_fkey" FOREIGN KEY ("id_tipo") REFERENCES "TipoProducto"("id_tipo") ON DELETE SET NULL ON UPDATE CASCADE;
