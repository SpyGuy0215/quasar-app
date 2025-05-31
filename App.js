// App.js
import { StatusBar } from "expo-status-bar";
import React from "react";
import { TouchableOpacity } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createDrawerNavigator } from "@react-navigation/drawer";
import Ionicons from "@expo/vector-icons/Ionicons";
import NewsScreen from "./screens/News";
import ImagesScreen from "./screens/Images";
import ExoplanetsScreen from "./screens/Exoplanets";
import AIScreen from "./screens/AI";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "./global.css";
import { ThemeProvider, useTheme } from "./ThemeContext";

const Drawer = createDrawerNavigator();

function AppContent() {
    const { isDarkMode, toggleTheme } = useTheme();

    const drawerStyles = {
        drawerStyle: {
            backgroundColor: isDarkMode ? "#000" : "#fff",
        },
        drawerActiveTintColor: isDarkMode ? "#fff" : "#000",
        drawerInactiveTintColor: isDarkMode ? "#aaa" : "#555",
        drawerLabelStyle: {
            fontSize: 16,
            fontWeight: "bold",
        },
        headerStyle: {
            backgroundColor: isDarkMode ? "#000" : "#fff",
        },
        headerTintColor: isDarkMode ? "#fff" : "#000",
        drawerContentStyle: {
            backgroundColor: isDarkMode ? "#000" : "#f9f9f9",
        },
        headerRight: () => (
            <TouchableOpacity onPress={toggleTheme} style={{ marginRight: 16 }}>
                <Ionicons name="contrast-outline" size={24} color={isDarkMode ? "#fff" : "#000"} />
            </TouchableOpacity>
        ),
    };

    return (
        <GestureHandlerRootView style={{ flex: 1, backgroundColor: isDarkMode ? "#000" : "#fff" }}>
            <NavigationContainer>
                <Drawer.Navigator initialRouteName="News" screenOptions={drawerStyles}>
                    <Drawer.Screen
                        name="News"
                        component={NewsScreen}
                        options={{
                            drawerIcon: ({ color, size }) => (
                                <Ionicons name="newspaper-outline" size={size} color={color} />
                            ),
                        }}
                    />
                    <Drawer.Screen
                        name="Images"
                        component={ImagesScreen}
                        options={{
                            drawerIcon: ({ color, size }) => (
                                <Ionicons name="images-outline" size={size} color={color} />
                            ),
                        }}
                    />
                    <Drawer.Screen
                        name="Exoplanets"
                        component={ExoplanetsScreen}
                        options={{
                            drawerIcon: ({ color, size }) => (
                                <Ionicons name="planet-outline" size={size} color={color} />
                            ),
                        }}
                    />
                    <Drawer.Screen
                        name="Supernova AI"
                        component={AIScreen}
                        options={{
                            drawerIcon: ({ color, size }) => (
                                <Ionicons name="hardware-chip-outline" size={size} color={color} />
                            ),
                        }}
                    />
                </Drawer.Navigator>
            </NavigationContainer>
        </GestureHandlerRootView>
    );
}

export default function App() {
    return (
        <ThemeProvider>
            <AppContent />
        </ThemeProvider>
    );
}
