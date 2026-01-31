-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_AppSettings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "themeColor" TEXT NOT NULL DEFAULT '#00a8e8',
    "buttonColor" TEXT NOT NULL DEFAULT '#667eea',
    "buttonText" TEXT NOT NULL DEFAULT 'Customize Your Phone Case',
    "buttonLogoUrl" TEXT,
    "textColors" TEXT NOT NULL DEFAULT '#FFFFFF,#C0C0C0,#808080,#000000,#FF0000,#800000,#FFFF00,#808000,#00FF00,#008000,#00FFFF,#008080,#0000FF,#000080,#FF00FF,#800080',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_AppSettings" ("buttonColor", "buttonLogoUrl", "buttonText", "createdAt", "id", "shop", "themeColor", "updatedAt") SELECT "buttonColor", "buttonLogoUrl", "buttonText", "createdAt", "id", "shop", "themeColor", "updatedAt" FROM "AppSettings";
DROP TABLE "AppSettings";
ALTER TABLE "new_AppSettings" RENAME TO "AppSettings";
CREATE UNIQUE INDEX "AppSettings_shop_key" ON "AppSettings"("shop");
CREATE INDEX "AppSettings_shop_idx" ON "AppSettings"("shop");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
