-- CreateTable
CREATE TABLE "MerchSize" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "merchItemId" TEXT NOT NULL,
    "size" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "MerchSize_merchItemId_fkey" FOREIGN KEY ("merchItemId") REFERENCES "MerchItem" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Purchase" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "studentId" TEXT NOT NULL,
    "merchItemId" TEXT NOT NULL,
    "size" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "totalAmount" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "collectedAt" DATETIME,
    CONSTRAINT "Purchase_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Purchase_merchItemId_fkey" FOREIGN KEY ("merchItemId") REFERENCES "MerchItem" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "metadata" TEXT,
    "ip" TEXT,
    "userAgent" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_MerchItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" INTEGER NOT NULL,
    "category" TEXT,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "imageUrl" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_MerchItem" ("createdAt", "id", "imageUrl", "isActive", "name", "price", "sortOrder", "updatedAt") SELECT "createdAt", "id", "imageUrl", "isActive", "name", "price", "sortOrder", "updatedAt" FROM "MerchItem";
DROP TABLE "MerchItem";
ALTER TABLE "new_MerchItem" RENAME TO "MerchItem";
CREATE INDEX "MerchItem_isActive_sortOrder_idx" ON "MerchItem"("isActive", "sortOrder");
CREATE INDEX "MerchItem_category_idx" ON "MerchItem"("category");
CREATE TABLE "new_Student" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fullName" TEXT NOT NULL,
    "email" TEXT,
    "groupId" TEXT NOT NULL,
    "coinBalance" INTEGER NOT NULL DEFAULT 0,
    "userId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Student_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Student_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Student" ("coinBalance", "createdAt", "email", "fullName", "groupId", "id", "isActive", "updatedAt") SELECT "coinBalance", "createdAt", "email", "fullName", "groupId", "id", "isActive", "updatedAt" FROM "Student";
DROP TABLE "Student";
ALTER TABLE "new_Student" RENAME TO "Student";
CREATE UNIQUE INDEX "Student_userId_key" ON "Student"("userId");
CREATE INDEX "Student_groupId_idx" ON "Student"("groupId");
CREATE INDEX "Student_fullName_idx" ON "Student"("fullName");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "MerchSize_merchItemId_size_key" ON "MerchSize"("merchItemId", "size");

-- CreateIndex
CREATE INDEX "Purchase_studentId_status_idx" ON "Purchase"("studentId", "status");

-- CreateIndex
CREATE INDEX "Purchase_createdAt_idx" ON "Purchase"("createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_userId_createdAt_idx" ON "AuditLog"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_resourceType_resourceId_idx" ON "AuditLog"("resourceType", "resourceId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");
