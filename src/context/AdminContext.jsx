import React, { createContext, useContext, useState } from "react";

const AdminContext = createContext(null);

export function AdminProvider({ children }) {
    const [isAdmin, setIsAdmin] = useState(() => {
        // Check session storage for existing admin session
        return sessionStorage.getItem("is_admin") === "true";
    });

    const [adminToken, setAdminToken] = useState(() => {
        return sessionStorage.getItem("admin_token");
    });

    const login = (password) => {
        // Basic password check - User can change this later
        const defaultPassword = import.meta.env.VITE_ADMIN_PASSWORD || "daust";
        if (password === defaultPassword) {
            setIsAdmin(true);
            setAdminToken(password);
            sessionStorage.setItem("is_admin", "true");
            sessionStorage.setItem("admin_token", password);
            return true;
        }
        return false;
    };

    const logout = () => {
        setIsAdmin(false);
        setAdminToken(null);
        sessionStorage.removeItem("is_admin");
        sessionStorage.removeItem("admin_token");
    };

    return (
        <AdminContext.Provider value={{ isAdmin, adminToken, login, logout }}>
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
