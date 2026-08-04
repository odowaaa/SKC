import { run } from './db.js';

export async function logAudit(db, staffUser, action, entityType, entityId, details) {
  await run(
    db,
    `INSERT INTO audit_logs (staff_id, staff_name, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?, ?)`,
    staffUser.id, staffUser.full_name, action, entityType, entityId != null ? String(entityId) : null,
    details ? JSON.stringify(details) : null
  );
}
