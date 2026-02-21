import React, { createContext, useContext, useState } from "react";

const AdminContext = createContext(null);

export function AdminProvider({ children }) {
    const [isAdmin, setIsAdmin] = useState(() => {
        // Check session storage for existing admin session
        return sessionStorage.getItem("is_admin") === "true";
    });

    const login = (password) => {
        // Basic password check - User can change this later
        // Defaulting to "daust_admin_2024" for now
        if (password === "daust_admin_2024") {
            setIsAdmin(true);
            sessionStorage.setItem("is_admin", "true");
            return true;
        }
        return false;
    };

    const logout = () => {
        setIsAdmin(false);
        sessionStorage.removeItem("is_admin");
    };

    return (
        <AdminContext.Provider value={{ isAdmin, login, logout }}>
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
