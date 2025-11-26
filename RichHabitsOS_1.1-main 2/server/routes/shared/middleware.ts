// Re-export middleware from permissions module
export {
  loadUserData,
  requirePermission,
  requirePermissionOr,
  filterDataByRole,
  type AuthenticatedRequest,
  type UserRole
} from "../../permissions";

// Re-export from replitAuth
export { isAuthenticated } from "../../replitAuth";
