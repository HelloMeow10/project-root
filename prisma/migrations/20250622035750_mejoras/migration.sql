/*
  Warnings:

  - You are about to drop the column `stripe_payment_method_id` on the `MetodoPagoCliente` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "MetodoPagoCliente" DROP COLUMN "stripe_payment_method_id";
