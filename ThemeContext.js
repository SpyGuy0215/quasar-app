import React, { createContext, useContext, useState } from "react";
import { useColorScheme } from "react-native";

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
    const systemScheme = useColorScheme();
    const [isDarkMode, setIsDarkMode] = useState(systemScheme === "dark");

    const toggleTheme = () => setIsDarkMode((prev) => !prev);

    return (
        <ThemeContext.Provider value={{ isDarkMode, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);
