export const ROLES = ['super_admin', 'registrar', 'finance', 'staff'];

// Which roles can act on each admin resource group.
export const PERMISSIONS = {
  applications: ['super_admin', 'registrar'],
  messages: ['super_admin', 'registrar', 'staff'],
  content: ['super_admin', 'staff'],        // news, programs, gallery
  departments: ['super_admin', 'registrar'],
  staff_management: ['super_admin'],
  audit_logs: ['super_admin'],
  students: ['super_admin', 'registrar'],
  courses: ['super_admin', 'registrar'],
  enrollments: ['super_admin', 'registrar'],
  attendance: ['super_admin', 'registrar', 'staff'],
  grades: ['super_admin', 'registrar', 'staff'],
  media: ['super_admin', 'registrar', 'staff'],
  settings: ['super_admin'],
};

export function can(user, resource) {
  const allowed = PERMISSIONS[resource];
  if (!allowed) return false;
  return allowed.includes(user.role);
}
