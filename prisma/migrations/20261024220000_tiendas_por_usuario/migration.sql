-- Tiendas por usuario.
-- Los productos, clientes y pedidos que ya existen son los datos de prueba: pasan a la
-- "Tienda de demostración". No se borra nada.

-- CreateTable
CREATE TABLE "Store" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "ownerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Store_pkey" PRIMARY KEY ("id")
);

-- Tienda de demostración (id fijo, sin dueño)
INSERT INTO "Store" ("id", "name", "isDemo") VALUES ('tienda-demo', 'Tienda de demostración', true);

-- AlterTable: se agrega la columna, se asigna la tienda de demostración y luego se vuelve obligatoria
ALTER TABLE "Product" ADD COLUMN "storeId" TEXT;
UPDATE "Product" SET "storeId" = 'tienda-demo';
ALTER TABLE "Product" ALTER COLUMN "storeId" SET NOT NULL;

ALTER TABLE "Customer" ADD COLUMN "storeId" TEXT;
UPDATE "Customer" SET "storeId" = 'tienda-demo';
ALTER TABLE "Customer" ALTER COLUMN "storeId" SET NOT NULL,
ALTER COLUMN "email" DROP NOT NULL;

ALTER TABLE "Order" ADD COLUMN "storeId" TEXT;
UPDATE "Order" SET "storeId" = 'tienda-demo';
ALTER TABLE "Order" ALTER COLUMN "storeId" SET NOT NULL;

-- DropIndex (los únicos globales pasan a ser únicos por tienda)
DROP INDEX "Customer_email_key";
DROP INDEX "Order_createdAt_idx";
DROP INDEX "Order_status_position_idx";
DROP INDEX "Product_category_idx";
DROP INDEX "Product_sku_key";

-- CreateIndex
CREATE UNIQUE INDEX "Store_ownerId_key" ON "Store"("ownerId");
CREATE INDEX "Customer_storeId_name_idx" ON "Customer"("storeId", "name");
CREATE UNIQUE INDEX "Customer_storeId_email_key" ON "Customer"("storeId", "email");
CREATE INDEX "Order_storeId_status_position_idx" ON "Order"("storeId", "status", "position");
CREATE INDEX "Order_storeId_createdAt_idx" ON "Order"("storeId", "createdAt");
CREATE INDEX "Product_storeId_category_idx" ON "Product"("storeId", "category");
CREATE UNIQUE INDEX "Product_storeId_sku_key" ON "Product"("storeId", "sku");

-- AddForeignKey
ALTER TABLE "Store" ADD CONSTRAINT "Store_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Product" ADD CONSTRAINT "Product_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Order" ADD CONSTRAINT "Order_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Pedido → cliente y línea → producto: se revisan al terminar la transacción (DEFERRABLE INITIALLY
-- DEFERRED). Siguen impidiendo borrar un cliente o un producto que está en pedidos, pero permiten
-- borrar una tienda completa de una vez (por ejemplo, si un usuario pide que se borren sus datos):
-- para cuando se revisan, la cascada ya borró los pedidos y sus líneas.
ALTER TABLE "Order" DROP CONSTRAINT "Order_customerId_fkey";
ALTER TABLE "Order" ADD CONSTRAINT "Order_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE NO ACTION ON UPDATE CASCADE DEFERRABLE INITIALLY DEFERRED;
ALTER TABLE "OrderItem" DROP CONSTRAINT "OrderItem_productId_fkey";
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE NO ACTION ON UPDATE CASCADE DEFERRABLE INITIALLY DEFERRED;
