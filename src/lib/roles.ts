export type StaffRole = "admin" | "manager" | "caller";

/** Admin-panel pages a manager may open. Everything else is admin-only for managers. */
export const MANAGER_PATHS = [
  "/admin",
  "/admin/vics",
  "/admin/anweisung",
  "/admin/caller",
  "/admin/livechat",
  "/admin/termine",
  "/admin/telefonstatistik",
  "/admin/verifikationen",
  "/admin/ueberpruefung",
  "/admin/dokumente",
] as const;

/** Admins and managers both use the "full" admin views; RLS scopes what managers see. */
export function isAdminLike(role: string | null | undefined): boolean {
  return role === "admin" || role === "manager";
}

export function isStaff(role: string | null | undefined): boolean {
  return role === "admin" || role === "manager" || role === "caller";
}

/** Whether a manager may open the given admin path (detail pages follow their list). */
export function managerCanOpen(pathname: string): boolean {
  if (/^\/admin\/vics\/[^/]+$/.test(pathname)) return true;
  return (MANAGER_PATHS as readonly string[]).includes(pathname);
}

/** Mirrors SQL manager_can_see_vic: Vic assigned to the manager, or to one of the manager's callers. */
export function managerCanSeeVic(
  managerId: string,
  managerCallerIds: string[],
  vic: { assigned_manager_id: string | null; assigned_caller_id: string | null },
): boolean {
  if (vic.assigned_manager_id === managerId) return true;
  return !!vic.assigned_caller_id && managerCallerIds.includes(vic.assigned_caller_id);
}
