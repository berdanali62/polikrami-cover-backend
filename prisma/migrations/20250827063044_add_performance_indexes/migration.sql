-- CreateIndex
CREATE INDEX "Draft_method_createdAt_idx" ON "Draft"("method", "createdAt");

-- CreateIndex
CREATE INDEX "Draft_step_userId_idx" ON "Draft"("step", "userId");

-- CreateIndex
CREATE INDEX "EmailQueue_status_createdAt_idx" ON "EmailQueue"("status", "createdAt");

-- CreateIndex
CREATE INDEX "EmailQueue_sentAt_idx" ON "EmailQueue"("sentAt");

-- CreateIndex
CREATE INDEX "Order_status_createdAt_idx" ON "Order"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Order_currency_status_idx" ON "Order"("currency", "status");
