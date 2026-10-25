-- Fotos de productos: una columna para saber si tiene foto y una tabla aparte con la imagen.
ALTER TABLE "Product" ADD COLUMN "imageUpdatedAt" TIMESTAMP(3);

CREATE TABLE "ProductImage" (
    "productId" TEXT NOT NULL,
    "data" BYTEA NOT NULL,
    "mimeType" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductImage_pkey" PRIMARY KEY ("productId")
);

-- Si se borra el producto (o toda su tienda), su foto se borra con él.
ALTER TABLE "ProductImage" ADD CONSTRAINT "ProductImage_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
