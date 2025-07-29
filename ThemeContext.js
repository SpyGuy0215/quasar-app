import React, { createContext, useState, useContext } from "react";
import { useColorScheme } from "react-native";

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
    // null = follow system, 'light' or 'dark' = user override
    const [userPreference, setUserPreference] = useState(null);
    const systemScheme = useColorScheme(); // 'light' | 'dark' | null


    // Log current theme state for debugging
    console.log('[ThemeContext] systemScheme:', systemScheme, 'userPreference:', userPreference);

    // Robust isDarkMode logic: if userPreference is null, follow system; else use userPreference
    let isDarkMode;
    if (userPreference === null) {
        isDarkMode = systemScheme === 'dark';
    } else {
        isDarkMode = userPreference === 'dark';
    }

    // Cycles: system -> dark -> light -> system ...
    const toggleTheme = () => {
        setUserPreference((prev) => {
            if (prev === null) {
                return 'dark';
            } else if (prev === 'dark') {
                return 'light';
            } else if (prev === 'light') {
                return null; // back to system
            }
            return null;
        });
    };

    return (
        <ThemeContext.Provider value={{ isDarkMode, toggleTheme, userPreference, systemScheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    return useContext(ThemeContext);
}
