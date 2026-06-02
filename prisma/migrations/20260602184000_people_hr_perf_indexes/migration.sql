-- P0 demo performance indexes for HR staff list and volunteer board
CREATE INDEX IF NOT EXISTS "EmploymentProfile_tenant_updatedAt_idx"
ON "EmploymentProfile"("tenantId", "updatedAt" DESC);

CREATE INDEX IF NOT EXISTS "MemberResponsibility_tenant_entity_status_role_idx"
ON "MemberResponsibility"("tenantId", "entityType", "entityId", "status", "role");

CREATE INDEX IF NOT EXISTS "MemberResponsibility_tenant_status_role_idx"
ON "MemberResponsibility"("tenantId", "status", "role");
