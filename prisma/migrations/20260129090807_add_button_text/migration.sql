-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_AppSettings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "themeColor" TEXT NOT NULL DEFAULT '#00a8e8',
    "buttonColor" TEXT NOT NULL DEFAULT '#667eea',
    "buttonText" TEXT NOT NULL DEFAULT 'Customize Your Phone Case',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_AppSettings" ("buttonColor", "createdAt", "id", "shop", "themeColor", "updatedAt") SELECT "buttonColor", "createdAt", "id", "shop", "themeColor", "updatedAt" FROM "AppSettings";
DROP TABLE "AppSettings";
ALTER TABLE "new_AppSettings" RENAME TO "AppSettings";
CREATE UNIQUE INDEX "AppSettings_shop_key" ON "AppSettings"("shop");
CREATE INDEX "AppSettings_shop_idx" ON "AppSettings"("shop");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
