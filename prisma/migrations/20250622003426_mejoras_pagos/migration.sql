-- DropIndex
DROP INDEX "MetodoPagoCliente_stripe_payment_method_id_key";

-- AlterTable
ALTER TABLE "MetodoPagoCliente" ALTER COLUMN "stripe_payment_method_id" DROP NOT NULL;
