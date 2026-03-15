import React, { createContext, useContext, useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

const AdminContext = createContext(null);

export function AdminProvider({ children }) {
    const [adminToken, setAdminToken] = useState(() => {
        // Load token from sessionStorage
        return sessionStorage.getItem("admin_token") || null;
    });

    const [sessionExpiry, setSessionExpiry] = useState(() => {
        const expiry = sessionStorage.getItem("admin_expiry");
        return expiry ? parseInt(expiry, 10) : null;
    });

    const loginMutation = useMutation(api.auth.login);
    const logoutMutation = useMutation(api.auth.logout);
    const refreshMutation = useMutation(api.auth.refreshSession);

    // Verify token validity
    const tokenVerification = useQuery(
        api.auth.verifyToken,
        adminToken ? { token: adminToken } : "skip"
    );

    const isAdmin = tokenVerification?.valid || false;

    // Auto-logout on session expiry
    useEffect(() => {
        if (!sessionExpiry || !adminToken) return;

        const checkExpiry = () => {
            if (Date.now() > sessionExpiry) {
                logout();
            }
        };

        // Check immediately
        checkExpiry();

        // Check every minute
        const interval = setInterval(checkExpiry, 60000);
        return () => clearInterval(interval);
    }, [sessionExpiry, adminToken]);

    // Auto-refresh session before expiry (5 minutes before)
    useEffect(() => {
        if (!sessionExpiry || !adminToken || !isAdmin) return;

        const timeUntilExpiry = sessionExpiry - Date.now();
        const refreshTime = timeUntilExpiry - 5 * 60 * 1000; // 5 minutes before expiry

        if (refreshTime <= 0) {
            // Already past refresh time, try to refresh immediately
            refreshSession();
            return;
        }

        const timeout = setTimeout(() => {
            refreshSession();
        }, refreshTime);

        return () => clearTimeout(timeout);
    }, [sessionExpiry, adminToken, isAdmin]);

    const login = async (password) => {
        try {
            const result = await loginMutation({ password });

            if (result && result.token) {
                setAdminToken(result.token);
                setSessionExpiry(result.expiresAt);

                // Persist to sessionStorage
                sessionStorage.setItem("admin_token", result.token);
                sessionStorage.setItem("admin_expiry", result.expiresAt.toString());

                return { success: true };
            }

            return { success: false, error: "Invalid response from server" };
        } catch (error) {
            const errorMessage = error.message || "Login failed";
            return { success: false, error: errorMessage };
        }
    };

    const logout = async () => {
        if (adminToken) {
            try {
                await logoutMutation({ token: adminToken });
            } catch (error) {
                console.error("Logout error:", error);
            }
        }

        setAdminToken(null);
        setSessionExpiry(null);
        sessionStorage.removeItem("admin_token");
        sessionStorage.removeItem("admin_expiry");
    };

    const refreshSession = async () => {
        if (!adminToken) return;

        try {
            const result = await refreshMutation({ token: adminToken });
            if (result && result.expiresAt) {
                setSessionExpiry(result.expiresAt);
                sessionStorage.setItem("admin_expiry", result.expiresAt.toString());
            }
        } catch (error) {
            console.error("Session refresh failed:", error);
            // Session might be expired, logout
            logout();
        }
    };

    return (
        <AdminContext.Provider value={{ isAdmin, adminToken, login, logout, sessionExpiry }}>
            {children}
        </AdminContext.Provider>
    );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAdmin = () => {
    const context = useContext(AdminContext);
    if (!context) {
        throw new Error("useAdmin must be used within an AdminProvider");
    }
    return context;
};
