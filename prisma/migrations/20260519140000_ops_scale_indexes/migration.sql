-- Post go-live: operational query performance at scale
CREATE INDEX IF NOT EXISTS "Event_tenantId_campusId_date_idx" ON "Event"("tenantId", "campusId", "date");
CREATE INDEX IF NOT EXISTS "AttendanceSession_tenantId_campusId_date_idx" ON "AttendanceSession"("tenantId", "campusId", "date");
CREATE INDEX IF NOT EXISTS "AttendanceSession_eventId_idx" ON "AttendanceSession"("eventId");
CREATE INDEX IF NOT EXISTS "Attendance_sessionId_checkInTime_idx" ON "Attendance"("sessionId", "checkInTime");
CREATE INDEX IF NOT EXISTS "Attendance_tenantId_memberId_checkInTime_idx" ON "Attendance"("tenantId", "memberId", "checkInTime");
CREATE INDEX IF NOT EXISTS "EventLog_tenantId_eventName_idx" ON "EventLog"("tenantId", "eventName");
CREATE INDEX IF NOT EXISTS "EventLog_tenantId_entityType_entityId_idx" ON "EventLog"("tenantId", "entityType", "entityId");
CREATE INDEX IF NOT EXISTS "Notification_tenantId_createdAt_idx" ON "Notification"("tenantId", "createdAt");
