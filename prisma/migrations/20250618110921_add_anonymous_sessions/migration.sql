-- CreateTable
CREATE TABLE "anonymous_sessions" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "messageCount" INTEGER NOT NULL DEFAULT 0,
    "lastUsed" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "anonymous_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "anonymous_sessions_sessionId_key" ON "anonymous_sessions"("sessionId");

-- CreateIndex
CREATE INDEX "anonymous_sessions_sessionId_idx" ON "anonymous_sessions"("sessionId");

-- CreateIndex
CREATE INDEX "anonymous_sessions_lastUsed_idx" ON "anonymous_sessions"("lastUsed");
