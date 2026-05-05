import { createContext, useState, useEffect, useContext } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [isAuth, setIsAuth] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check local storage for auth token/user ID on app load
        const userId = localStorage.getItem('userId');
        if (userId) {
            setIsAuth(true);
        }
        setLoading(false);
    }, []);

    const login = (userId) => {
        localStorage.setItem('userId', userId);
        setIsAuth(true);
    };

    const logout = () => {
        localStorage.removeItem('userId');
        setIsAuth(false);
    };

    return (
        <AuthContext.Provider value={{ isAuth, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    return useContext(AuthContext);
};
