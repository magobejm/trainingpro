DROP INDEX "uq_session_client_date";

CREATE INDEX "idx_session_client_date" ON "session_instance"("client_id", "session_date");
