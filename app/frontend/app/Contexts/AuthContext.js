import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [userToken, setUserTokenState] = useState(null);
    const [user, setUserState] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    // Load token and user from AsyncStorage on app start
    useEffect(() => {
        const loadAuth = async () => {
            try {
                const token = await AsyncStorage.getItem('userToken');
                const userData = await AsyncStorage.getItem('userData');
                setUserTokenState(token);
                if (userData) {
                    setUserState(JSON.parse(userData));
                }
            } catch (error) {
                console.error('Error loading auth:', error);
            } finally {
                setIsLoading(false);
            }
        };
        loadAuth();
    }, []);

    // Set user token and user data, save to AsyncStorage
    const setUserToken = async (token, userData = null) => {
        try {
            if (token) {
                await AsyncStorage.setItem('userToken', token);
                setUserTokenState(token);
                if (userData) {
                    await AsyncStorage.setItem('userData', JSON.stringify(userData));
                    setUserState(userData);
                }
            } else {
                await AsyncStorage.removeItem('userToken');
                await AsyncStorage.removeItem('userData');
                setUserTokenState(null);
                setUserState(null);
            }
        } catch (error) {
            console.error('Error saving auth:', error);
        }
    };

    // Update user data
    const updateUser = async (userData) => {
        try {
            await AsyncStorage.setItem('userData', JSON.stringify(userData));
            setUserState(userData);
        } catch (error) {
            console.error('Error updating user:', error);
        }
    };

    // Logout function
    const logout = async () => {
        try {
            await AsyncStorage.removeItem('userToken');
            await AsyncStorage.removeItem('userData');
            setUserTokenState(null);
            setUserState(null);
        } catch (error) {
            console.error('Error logging out:', error);
        }
    };

    return (
        <AuthContext.Provider value={{ 
            userToken, 
            user,
            setUserToken,
            updateUser,
            logout,
            isLoading 
        }}>
            {children}
        </AuthContext.Provider>
    );
};

// Default export to satisfy Expo Router
export default AuthContext;

