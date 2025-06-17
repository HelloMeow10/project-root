-- AlterTable
ALTER TABLE "Cliente" ADD COLUMN     "email_verificado" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "token_verificacion_email" TEXT;
