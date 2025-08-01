import React, { createContext, useState, useContext, useEffect } from "react";
import { useColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
    const [userPreference, setUserPreference] = useState('system');
    const systemScheme = useColorScheme();

    useEffect(() => {
        // Load user preference from AsyncStorage on mount
        const loadPreference = async () => {
            try {
                const storedPreference = await AsyncStorage.getItem("theme_preference");
                if (storedPreference) {
                    setUserPreference(storedPreference);
                }
                console.log("[ThemeContext] Loaded user preference:", storedPreference);
            } catch (error) {
                console.error("[ThemeContext] Error loading theme preference:", error);
            }
        };
        loadPreference();
    }, []);


    // Robust isDarkMode logic: if userPreference is null, follow system; else use userPreference
    let isDarkMode;
    if (userPreference === 'system') {
        isDarkMode = systemScheme === 'dark';
    } else {
        isDarkMode = userPreference === 'dark';
    }

    // Cycles: system -> dark -> light -> system ...
    const toggleTheme = () => {
        setUserPreference((prev) => {
            let newPreference;
            if (prev === 'system') {
                newPreference = 'dark';
            } else if (prev === 'dark') {
                newPreference = 'light';
            } else if (prev === 'light') {
                newPreference = 'system'; // back to system
            }
            console.log("[ThemeContext] Toggling theme to:", newPreference);
            
            // Store the new preference in AsyncStorage
            AsyncStorage.setItem("theme_preference", newPreference);
            return newPreference;
        });
    };

    const setTheme = (theme) => {
        if (theme !== 'dark' && theme !== 'light' && theme !== 'system') {
            console.error("[ThemeContext] Invalid theme value:", theme);
            return;
        }
        console.log("[ThemeContext] Setting theme to:", theme);
        setUserPreference(theme);
        AsyncStorage.setItem("theme_preference", theme);
    };

    return (
        <ThemeContext.Provider value={{ isDarkMode, toggleTheme, setTheme, userPreference, systemScheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    return useContext(ThemeContext);
}
