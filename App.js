import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
import { View, useColorScheme, TouchableOpacity } from "react-native";
import "./global.css";
import { NavigationContainer } from "@react-navigation/native";
import { createDrawerNavigator } from "@react-navigation/drawer";
import Ionicons from "@expo/vector-icons/Ionicons";
import NewsScreen from "./screens/News";
import ImagesScreen from "./screens/Images";
import ExoplanetsScreen from "./screens/Exoplanets";
import AIScreen from "./screens/AI";
import { GestureHandlerRootView } from "react-native-gesture-handler";

const Drawer = createDrawerNavigator();

export default function App() {
    const systemColorScheme = useColorScheme();
    const [isDarkMode, setIsDarkMode] = useState(systemColorScheme === "dark");

    const toggleTheme = () => setIsDarkMode(!isDarkMode);

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
