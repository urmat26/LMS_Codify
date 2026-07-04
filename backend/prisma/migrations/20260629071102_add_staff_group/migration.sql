-- CreateTable
CREATE TABLE "StaffGroup" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    CONSTRAINT "StaffGroup_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "StaffGroup_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "StaffGroup_userId_idx" ON "StaffGroup"("userId");

-- CreateIndex
CREATE INDEX "StaffGroup_groupId_idx" ON "StaffGroup"("groupId");

-- CreateIndex
CREATE UNIQUE INDEX "StaffGroup_userId_groupId_key" ON "StaffGroup"("userId", "groupId");
