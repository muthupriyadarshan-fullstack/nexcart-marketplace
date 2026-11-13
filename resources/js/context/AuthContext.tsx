import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiClient } from '../api/client';
import { User, Role } from '../types';

interface AuthContextType {
    user: User | null;
    token: string | null;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<User>;
    register: (data: any) => Promise<User>;
    vendorRegister: (data: any) => Promise<User>;
    logout: () => Promise<void>;
    quickSwitchRole: (role: Role) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(() => {
        const saved = localStorage.getItem('nexcart_user');
        return saved ? JSON.parse(saved) : null;
    });
    const [token, setToken] = useState<string | null>(() => localStorage.getItem('nexcart_token'));
    const [isLoading, setIsLoading] = useState<boolean>(true);

    useEffect(() => {
        if (token) {
            apiClient.get('/auth/me')
                .then((res) => {
                    setUser(res.data.data);
                    localStorage.setItem('nexcart_user', JSON.stringify(res.data.data));
                })
                .catch(() => {
                    setUser(null);
                    setToken(null);
                    localStorage.removeItem('nexcart_token');
                    localStorage.removeItem('nexcart_user');
                })
                .finally(() => setIsLoading(false));
        } else {
            setIsLoading(false);
        }
    }, [token]);

    const login = async (email: string, password: string): Promise<User> => {
        const res = await apiClient.post('/auth/login', { email, password });
        const { user: loggedInUser, token: authToken } = res.data.data;
        setUser(loggedInUser);
        setToken(authToken);
        localStorage.setItem('nexcart_token', authToken);
        localStorage.setItem('nexcart_user', JSON.stringify(loggedInUser));
        return loggedInUser;
    };

    const register = async (data: any): Promise<User> => {
        const res = await apiClient.post('/auth/register', data);
        const { user: registeredUser, token: authToken } = res.data.data;
        setUser(registeredUser);
        setToken(authToken);
        localStorage.setItem('nexcart_token', authToken);
        localStorage.setItem('nexcart_user', JSON.stringify(registeredUser));
        return registeredUser;
    };

    const vendorRegister = async (data: any): Promise<User> => {
        const res = await apiClient.post('/auth/vendor-register', data);
        const { user: registeredUser, token: authToken } = res.data.data;
        setUser(registeredUser);
        setToken(authToken);
        localStorage.setItem('nexcart_token', authToken);
        localStorage.setItem('nexcart_user', JSON.stringify(registeredUser));
        return registeredUser;
    };

    const logout = async (): Promise<void> => {
        try {
            await apiClient.post('/auth/logout');
        } catch (e) {
            // ignore
        } finally {
            setUser(null);
            setToken(null);
            localStorage.removeItem('nexcart_token');
            localStorage.removeItem('nexcart_user');
        }
    };

    const quickSwitchRole = async (role: Role): Promise<void> => {
        let email = 'customer@nexcart.in';
        if (role === 'Super Admin') email = 'admin@nexcart.in';
        if (role === 'Vendor') email = 'apex@nexcart.in';
        if (role === 'Support Staff') email = 'support@nexcart.in';

        await login(email, 'password');
    };

    return (
        <AuthContext.Provider value={{ user, token, isLoading, login, register, vendorRegister, logout, quickSwitchRole }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

