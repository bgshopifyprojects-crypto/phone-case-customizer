-- CreateTable
CREATE TABLE "ProductFrameCache" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "hasTransparentFrame" BOOLEAN NOT NULL DEFAULT false,
    "frameImageUrl" TEXT,
    "transparencyPercent" REAL,
    "generatedFrameUrl" TEXT,
    "processingStatus" TEXT NOT NULL DEFAULT 'pending',
    "errorMessage" TEXT,
    "productImageUrls" TEXT NOT NULL,
    "frameDetectedAt" DATETIME,
    "frameGeneratedAt" DATETIME,
    "lastCheckedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_AppSettings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "themeColor" TEXT NOT NULL DEFAULT '#00a8e8',
    "buttonColor" TEXT NOT NULL DEFAULT '#667eea',
    "buttonText" TEXT NOT NULL DEFAULT 'Kendin Tasarla',
    "buttonLogoUrl" TEXT,
    "textColors" TEXT NOT NULL DEFAULT '#FFFFFF,#C0C0C0,#808080,#000000,#FF0000,#800000,#FFFF00,#808000,#00FF00,#008000,#00FFFF,#008080,#0000FF,#000080,#FF00FF,#800080',
    "scriptTagId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_AppSettings" ("buttonColor", "buttonLogoUrl", "buttonText", "createdAt", "id", "scriptTagId", "shop", "textColors", "themeColor", "updatedAt") SELECT "buttonColor", "buttonLogoUrl", "buttonText", "createdAt", "id", "scriptTagId", "shop", "textColors", "themeColor", "updatedAt" FROM "AppSettings";
DROP TABLE "AppSettings";
ALTER TABLE "new_AppSettings" RENAME TO "AppSettings";
CREATE UNIQUE INDEX "AppSettings_shop_key" ON "AppSettings"("shop");
CREATE INDEX "AppSettings_shop_idx" ON "AppSettings"("shop");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "ProductFrameCache_productId_key" ON "ProductFrameCache"("productId");

-- CreateIndex
CREATE INDEX "ProductFrameCache_productId_idx" ON "ProductFrameCache"("productId");

-- CreateIndex
CREATE INDEX "ProductFrameCache_shop_idx" ON "ProductFrameCache"("shop");

-- CreateIndex
CREATE INDEX "ProductFrameCache_hasTransparentFrame_idx" ON "ProductFrameCache"("hasTransparentFrame");

-- CreateIndex
CREATE INDEX "ProductFrameCache_processingStatus_idx" ON "ProductFrameCache"("processingStatus");
