import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, Switch, Alert } from "react-native";
import { useTheme } from "../ThemeContext";
import { Haptics } from "../helper";
import Dropdown from "../components/Dropdown";
import Constants from "expo-constants";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { reloadAppAsync } from "expo";

export default function SettingsScreen() {
    const { isDarkMode, setTheme } = useTheme();
    const [aiTabEnabled, setAiTabEnabled] = useState(true);
    const [homeScreen, setHomeScreen] = useState("News");
    const [openInBrowserApp, setOpenInBrowserApp] = useState(false);

    useEffect(() => {
        AsyncStorage.getItem("quasarAiTabEnabled").then((val) => {
            if (val !== null) setAiTabEnabled(val === "true");
        });
        AsyncStorage.getItem("HomeScreen").then((val) => {
            if (val !== null) setHomeScreen(val);
            else setHomeScreen("News");
        });
        AsyncStorage.getItem("openInBrowserApp").then((val) => {
            if (val !== null) setOpenInBrowserApp(val === "true");
        });
    }, []);

    function handleThemeChange(theme) {
        setTheme(theme);
        Haptics.selection();
    }

    async function handleAiTabToggle(value) {
        setAiTabEnabled(value);
        await AsyncStorage.setItem("quasarAiTabEnabled", value.toString());
        Haptics.selection();
        Alert.alert(
            "Restart Required",
            "Please restart the app to apply changes to the Quasar AI tab.",
            [
                {
                    text: "Restart Now",
                    onPress: async () => {
                        try{
                        await reloadAppAsync("Changing Quasar AI availability");
                        }
                        catch(e){
                            console.log("[Settings] Error reloading app:", e);
                        }
                    },
                },
                { text: "Later", style: "cancel" },
            ],
            { cancelable: true }
        );
    }

    async function handleOpenNewsInBrowserToggle(value) {
        setOpenInBrowserApp(value);
        await AsyncStorage.setItem("openInBrowserApp", value.toString());
        Haptics.selection();
    }

    async function handleChangeHomeScreen(screen) {
        await AsyncStorage.setItem("HomeScreen", screen);
        setHomeScreen(screen);
        Haptics.selection();
        console.log("[Settings] Home screen changed to:", screen);
    }

    return (
        <View
            className={`min-h-screen  border-red-500 px-6 pt-2 ${
                isDarkMode ? "bg-[#000]" : "bg-[#f3f4f6]"
            }`}
        >
            <View id="Theme" className={"mt-8"}>
                <Text
                    className={`mt-4 text-[24px] ${
                        isDarkMode ? "text-[#fff]" : "text-[#000]"
                    }`}
                >
                    Theme
                </Text>
                <View
                    id="theme-settings-buttons"
                    className={"flex flex-row mt-5 justify-between"}
                >
                    <TouchableOpacity
                        className={`w-[27vw] p-4 rounded-lg border ${
                            isDarkMode
                                ? "border-galaxy-darkborder"
                                : "border-galaxy-lightborder"
                        } ${
                            isDarkMode
                                ? "bg-galaxy-darkbg"
                                : "bg-galaxy-lightbg"
                        }`}
                        onPress={() => handleThemeChange("light")}
                    >
                        <Text
                            className={`text-center text-xl ${
                                isDarkMode ? "text-[#fff]" : "text-[#000]"
                            }`}
                        >
                            Light
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        className={`w-[27vw] py-4 px-2 rounded-lg border ${
                            isDarkMode
                                ? "border-galaxy-darkborder"
                                : "border-galaxy-lightborder"
                        } ${
                            isDarkMode
                                ? "bg-galaxy-darkbg"
                                : "bg-galaxy-lightbg"
                        }`}
                        onPress={() => handleThemeChange("dark")}
                    >
                        <Text
                            className={`text-center text-xl ${
                                isDarkMode ? "text-[#fff]" : "text-[#000]"
                            }`}
                        >
                            Dark
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        className={`w-[27vw] p-4 rounded-lg border ${
                            isDarkMode
                                ? "border-galaxy-darkborder"
                                : "border-galaxy-lightborder"
                        } ${
                            isDarkMode
                                ? "bg-galaxy-darkbg"
                                : "bg-galaxy-lightbg"
                        }`}
                        onPress={() => handleThemeChange("system")}
                    >
                        <Text
                            className={`text-center text-xl ${
                                isDarkMode ? "text-[#fff]" : "text-[#000]"
                            }`}
                        >
                            System
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
            <View id="Functionality" className={"mt-8"}>
                <Text
                    className={`mt-4 text-[24px] ${
                        isDarkMode ? "text-[#fff]" : "text-[#000]"
                    }`}
                >
                    Functionality
                </Text>
                <Text
                    className={`mt-6 text-[18px] ${
                        isDarkMode ? "text-[#fff]" : "text-[#000]"
                    }`}
                >
                    Home Screen
                </Text>
                <Dropdown
                    items={[
                        "News",
                        "Images",
                        "Launches",
                        "Space Wiki",
                        "Quasar AI",
                    ]}
                    selectedItem={homeScreen}
                    onSelect={handleChangeHomeScreen}
                    tailwindStyles="px-0 pr-10 mt-5"
                />
                <View
                    className={
                        "mt-6 flex flex-row items-center justify-between"
                    }
                >
                    <Text
                        className={`text-[18px] ${
                            isDarkMode ? "text-[#fff]" : "text-[#000]"
                        }`}
                    >
                        Enable Quasar AI
                    </Text>
                    <Switch
                        value={aiTabEnabled}
                        onValueChange={handleAiTabToggle}
                    />
                </View>
                <View
                    className={
                        "mt-6 flex flex-row items-center justify-between"
                    }
                >
                    <Text
                        className={`text-[18px] ${
                            isDarkMode ? "text-[#fff]" : "text-[#000]"
                        }`}
                    >
                        Open News Links in Browser
                    </Text>
                    <Switch
                        value={openInBrowserApp}
                        onValueChange={handleOpenNewsInBrowserToggle}
                    />
                </View>
            </View>
            <View id="About" className={"mt-6"}>
                <Text
                    className={`mt-4 text-[24px] ${
                        isDarkMode ? "text-[#fff]" : "text-[#000]"
                    }`}
                >
                    About
                </Text>
                <View
                    className={`mt-5 ${
                        isDarkMode ? "bg-galaxy-darkbg" : "bg-galaxy-lightbg"
                    } p-4 rounded-lg border ${
                        isDarkMode
                            ? "border-galaxy-darkborder"
                            : "border-galaxy-lightborder"
                    }`}
                >
                    <Text
                        className={`text-lg ${
                            isDarkMode ? "text-[#fff]" : "text-[#000]"
                        }`}
                    >
                        Version: {Constants.expoConfig?.version || "N/A"}
                    </Text>
                    <Text
                        className={`text-lg mt-2 ${
                            isDarkMode ? "text-[#fff]" : "text-[#000]"
                        }`}
                    >
                        Developed by: Shashank Prasanna & Divyang Saran
                    </Text>
                </View>
            </View>
        </View>
    );
}
