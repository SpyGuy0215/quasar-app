// App.js
import { GestureHandlerRootView } from "react-native-gesture-handler"; // must be at the top
import { StatusBar } from "expo-status-bar";
import React, { useEffect } from "react";
import { TouchableOpacity } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createDrawerNavigator } from "@react-navigation/drawer";
import Ionicons from "@expo/vector-icons/Ionicons";
import NewsScreen from "./screens/News";
import ImagesScreen from "./screens/NewImages";
import ExoplanetsScreen from "./screens/Exoplanets";
import AIScreen from "./screens/AI";
import LaunchesScreen from "./screens/Launches";
import "./global.css";
import { ThemeProvider, useTheme } from "./ThemeContext";
import {Haptics} from "./helper";

const Drawer = createDrawerNavigator();

function AppContent() {
    const { isDarkMode, toggleTheme, userPreference, systemScheme } = useTheme();

    // Pick icon based on theme mode
    let iconName;
    if (userPreference === null) {
        iconName = "contrast-outline"; // system
    } else if (userPreference === "dark") {
        iconName = "moon-outline";
    } else if (userPreference === "light") {
        iconName = "sunny-outline";
    } else {
        iconName = "contrast-outline";
    }

    const drawerStyles = {
        drawerStyle: {
            backgroundColor: isDarkMode ? "#000" : "#fff",
        },
        drawerActiveTintColor: isDarkMode ? "#fff" : "#000",
        drawerInactiveTintColor: isDarkMode ? "#aaa" : "#555",
        drawerLabelStyle: {
            fontSize: 20,
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
            <TouchableOpacity onPress={() => {
                Haptics.soft();
                toggleTheme();
            }} style={{ marginRight: 16 }}>
                <Ionicons name={iconName} size={24} color={isDarkMode ? "#fff" : "#000"} />
            </TouchableOpacity>
        ),
    };

    return (
        <GestureHandlerRootView style={{ flex: 1, backgroundColor: isDarkMode ? "#000" : "#fff" }} className={isDarkMode ? "dark" : ""}>
            <StatusBar style={isDarkMode ? "light" : "dark"}/>
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
                        listeners={{
                            focus: () => {
                                Haptics.medium();
                            }
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
                        listeners={{
                            focus: () => {
                                Haptics.medium();
                            }
                        }}
                    />
                    <Drawer.Screen
                        name="Launches"
                        component={LaunchesScreen}
                        options={{
                            drawerIcon: ({ color, size }) => (
                                <Ionicons name="rocket-outline" size={size} color={color} />
                            ),
                        }}
                        listeners={{
                            focus: () => {
                                Haptics.medium();
                            }
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
                        listeners={{
                            focus: () => {
                                Haptics.medium();
                            }
                        }}
                    />
                    <Drawer.Screen
                        name="Quasar AI"
                        component={AIScreen}
                        options={{
                            drawerIcon: ({ color, size }) => (
                                <Ionicons name="hardware-chip-outline" size={size} color={color} />
                            ),
                        }}
                        listeners={{
                            focus: () => {
                                Haptics.medium();
                            }
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
