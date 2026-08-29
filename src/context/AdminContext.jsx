import React, { createContext, useContext, useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

const AdminContext = createContext(null);

export function AdminProvider({ children }) {
    const [adminToken, setAdminToken] = useState(() => {
        return sessionStorage.getItem("admin_token") || null;
    });

    const [sessionExpiry, setSessionExpiry] = useState(() => {
        const expiry = sessionStorage.getItem("admin_expiry");
        return expiry ? parseInt(expiry, 10) : null;
    });

    const [adminRole, setAdminRole] = useState(() => {
        return sessionStorage.getItem("admin_role") || null;
    });

    const [permissions, setPermissions] = useState(() => {
        try {
            return JSON.parse(sessionStorage.getItem("admin_permissions") || "null");
        } catch { return null; }
    });

    const [userName, setUserName] = useState(() => {
        return sessionStorage.getItem("admin_user_name") || null;
    });

    const loginMutation = useMutation(api.auth.login);
    const logoutMutation = useMutation(api.auth.logout);
    const refreshMutation = useMutation(api.auth.refreshSession);

    const tokenVerification = useQuery(
        api.auth.verifyToken,
        adminToken ? { token: adminToken } : "skip"
    );

    const isAdmin = tokenVerification?.valid || false;
    const verifiedRole = tokenVerification?.role ?? adminRole;
    const verifiedPermissions = tokenVerification?.permissions ?? permissions;

    useEffect(() => {
        if (!sessionExpiry || !adminToken) return;
        const checkExpiry = () => {
            if (Date.now() > sessionExpiry) logout();
        };
        checkExpiry();
        const interval = setInterval(checkExpiry, 60000);
        return () => clearInterval(interval);
    }, [sessionExpiry, adminToken]);

    useEffect(() => {
        if (!sessionExpiry || !adminToken || !isAdmin) return;
        const timeUntilExpiry = sessionExpiry - Date.now();
        const refreshTime = timeUntilExpiry - 5 * 60 * 1000;
        if (refreshTime <= 0) {
            refreshSession();
            return;
        }
        const timeout = setTimeout(() => refreshSession(), refreshTime);
        return () => clearTimeout(timeout);
    }, [sessionExpiry, adminToken, isAdmin]);

    const login = async (password, email) => {
        try {
            const args = { password };
            if (email) args.email = email;
            const result = await loginMutation(args);

            if (result && result.token) {
                setAdminToken(result.token);
                setSessionExpiry(result.expiresAt);
                setAdminRole(result.role);
                setPermissions(result.permissions || null);
                setUserName(result.userName || null);

                sessionStorage.setItem("admin_token", result.token);
                sessionStorage.setItem("admin_expiry", result.expiresAt.toString());
                sessionStorage.setItem("admin_role", result.role);
                if (result.permissions) sessionStorage.setItem("admin_permissions", JSON.stringify(result.permissions));
                if (result.userName) sessionStorage.setItem("admin_user_name", result.userName);

                return { success: true };
            }

            return { success: false, error: "Invalid response from server" };
        } catch (error) {
            return { success: false, error: error.message || "Login failed" };
        }
    };

    const logout = async () => {
        if (adminToken) {
            try { await logoutMutation({ token: adminToken }); } catch { /* ignore */ }
        }
        setAdminToken(null);
        setSessionExpiry(null);
        setAdminRole(null);
        setPermissions(null);
        setUserName(null);
        sessionStorage.removeItem("admin_token");
        sessionStorage.removeItem("admin_expiry");
        sessionStorage.removeItem("admin_role");
        sessionStorage.removeItem("admin_permissions");
        sessionStorage.removeItem("admin_user_name");
    };

    const refreshSession = async () => {
        if (!adminToken) return;
        try {
            const result = await refreshMutation({ token: adminToken });
            if (result && result.expiresAt) {
                setSessionExpiry(result.expiresAt);
                sessionStorage.setItem("admin_expiry", result.expiresAt.toString());
            }
        } catch {
            logout();
        }
    };

    const hasPermission = (perm) => {
        if (verifiedRole === "manager") return true;
        return verifiedPermissions?.includes(perm) ?? false;
    };

    return (
        <AdminContext.Provider value={{
            isAdmin, adminToken, adminRole: verifiedRole,
            permissions: verifiedPermissions, userName,
            login, logout, sessionExpiry, hasPermission,
        }}>
            {children}
        </AdminContext.Provider>
    );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAdmin = () => {
    const context = useContext(AdminContext);
    if (!context) throw new Error("useAdmin must be used within an AdminProvider");
    return context;
};
