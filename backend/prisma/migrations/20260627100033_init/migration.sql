-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'care',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Group" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "course" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Student" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fullName" TEXT NOT NULL,
    "email" TEXT,
    "groupId" TEXT NOT NULL,
    "coinBalance" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Student_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MerchItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "imageUrl" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "CoinTransaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "studentId" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "merchItemId" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "amount" INTEGER NOT NULL,
    "comment" TEXT,
    "isReversed" BOOLEAN NOT NULL DEFAULT false,
    "reversedAt" DATETIME,
    "reversedBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CoinTransaction_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "CoinTransaction_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "CoinTransaction_merchItemId_fkey" FOREIGN KEY ("merchItemId") REFERENCES "MerchItem" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "CoinTransaction_reversedBy_fkey" FOREIGN KEY ("reversedBy") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Student_groupId_idx" ON "Student"("groupId");

-- CreateIndex
CREATE INDEX "Student_fullName_idx" ON "Student"("fullName");

-- CreateIndex
CREATE INDEX "MerchItem_isActive_sortOrder_idx" ON "MerchItem"("isActive", "sortOrder");

-- CreateIndex
CREATE INDEX "CoinTransaction_studentId_createdAt_idx" ON "CoinTransaction"("studentId", "createdAt");

-- CreateIndex
CREATE INDEX "CoinTransaction_staffId_idx" ON "CoinTransaction"("staffId");

-- CreateIndex
CREATE INDEX "CoinTransaction_createdAt_idx" ON "CoinTransaction"("createdAt");
