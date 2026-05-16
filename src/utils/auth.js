
const safeLower = (str) => String(str || "").toLowerCase().trim();

export const isAuthenticated = () => {
  return !!localStorage.getItem("username");
};

export const getUserRole = () => {
  return safeLower(localStorage.getItem("userRole"));
};

export const getUserPermissions = () => {
  try {
    const permissions = localStorage.getItem("userPermissions");
    if (!permissions) return [];
    
    // Self-repair: If it's the old plain string format (no brackets), 
    // it's not valid JSON. We convert it to an array or clear it.
    if (permissions && !permissions.startsWith("[") && permissions !== "null") {
      console.warn("Detected legacy permission format, repairing...");
      const legacyArr = [permissions];
      localStorage.setItem("userPermissions", JSON.stringify(legacyArr));
      return legacyArr;
    }

    const parsed = JSON.parse(permissions);
    if (Array.isArray(parsed)) return parsed;
    if (typeof parsed === 'string') return [parsed];
    return [];
  } catch (error) {
    console.error("Error parsing user permissions from localStorage:", error);
    const raw = localStorage.getItem("userPermissions");
    if (raw && raw !== "null") return [raw];
    return [];
  }
};

export const hasPageAccess = (permissionKey) => {
  if (!permissionKey) return true;

  const role = getUserRole();
  const permissions = getUserPermissions();
  const targetKey = safeLower(permissionKey);

  // Admin has access to everything
  if (role === "admin") return true;

  // Universal access key
  if (permissions.some(p => safeLower(p) === "all")) return true;

  // Check specific permissions
  return permissions.some(p => {
    if (!p) return false;
    return safeLower(p) === targetKey;
  });
};

export const clearAuth = () => {
  localStorage.removeItem("currentUser");
  localStorage.removeItem("userRole");
  localStorage.removeItem("userPermissions");
  localStorage.removeItem("username");
  localStorage.removeItem("technicianContact");
};
