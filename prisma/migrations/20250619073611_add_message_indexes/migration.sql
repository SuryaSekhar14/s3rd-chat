-- CreateIndex
CREATE INDEX "messages_conversation_created_desc_idx" ON "messages"("conversationId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "messages_conversation_created_asc_idx" ON "messages"("conversationId", "createdAt" ASC);
