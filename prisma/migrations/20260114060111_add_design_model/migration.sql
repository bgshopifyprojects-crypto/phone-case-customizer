-- CreateTable
CREATE TABLE "Design" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "designData" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "orderId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "Design_shop_idx" ON "Design"("shop");

-- CreateIndex
CREATE INDEX "Design_orderId_idx" ON "Design"("orderId");

-- CreateIndex
CREATE INDEX "Design_createdAt_idx" ON "Design"("createdAt");
