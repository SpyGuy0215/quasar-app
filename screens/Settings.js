import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, Switch } from "react-native";
import { useTheme } from "../ThemeContext";
import { Haptics } from "../helper";
import Dropdown from "../components/Dropdown";
import Constants from "expo-constants";
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SettingsScreen() {
    const { isDarkMode, setTheme } = useTheme();
    const [aiTabEnabled, setAiTabEnabled] = useState(true);

    useEffect(() => {
        AsyncStorage.getItem('quasarAiTabEnabled').then(val => {
            if (val !== null) setAiTabEnabled(val === 'true');
        });
    }, []);

    function handleThemeChange(theme) {
        setTheme(theme);
        Haptics.selection();
    }

    async function handleAiTabToggle(value) {
        setAiTabEnabled(value);
        await AsyncStorage.setItem('quasarAiTabEnabled', value.toString());
        Haptics.selection();
    }

    return (
        <View
            className={`min-h-screen  border-red-500 px-6 pt-2 ${
                isDarkMode ? "bg-[#000]" : "bg-[#f3f4f6]"
            }`}
        >
            <Text
                className={`mt-4 text-[24px] ${
                    isDarkMode ? "text-[#fff]" : "text-[#000]"
                }`}
            >
                Theme
            </Text>
            <View className={"flex flex-row mt-5 justify-between"}>
                <TouchableOpacity
                    className={`w-[27vw] p-4 rounded-lg border ${
                        isDarkMode
                            ? "border-galaxy-darkborder"
                            : "border-galaxy-lightborder"
                    } ${isDarkMode ? "bg-galaxy-darkbg" : "bg-galaxy-lightbg"}`}
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
                    } ${isDarkMode ? "bg-galaxy-darkbg" : "bg-galaxy-lightbg"}`}
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
                    } ${isDarkMode ? "bg-galaxy-darkbg" : "bg-galaxy-lightbg"}`}
                    onPress={() => handleThemeChange("system")}
                >
                    <Text
                        className={`text-center text-xl ${
                            isDarkMode ? "text-[#fff]" : "text-[#000]"
                        }`}
                    >System</Text>
                </TouchableOpacity>
            </View>
            <View className={'mt-8 flex flex-row items-center justify-between'}>
                <Text className={`text-lg ${isDarkMode ? 'text-[#fff]' : 'text-[#000]'}`}>Enable Quasar AI Tab</Text>
                <Switch
                    value={aiTabEnabled}
                    onValueChange={handleAiTabToggle}
                    thumbColor={aiTabEnabled ? '#4f46e5' : '#888'}
                    trackColor={{ false: '#ccc', true: '#6366f1' }}
                />
            </View>
            <Text
                className={`mt-4 text-[24px] ${
                    isDarkMode ? "text-[#fff]" : "text-[#000]"
                }`}
            >
                Functionality
            </Text>
            <Text
                className={`mt-4 text-[18px] ${
                    isDarkMode ? "text-[#fff]" : "text-[#000]"
                }`}
            >
                Home Screen
            </Text>
            <Dropdown
                items={["News", "Images", "Launches", "Exoplanets", "Quasar AI"]}
                selectedItem={"News"}
                onSelect={handleChangeHomeScreen}
            />
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
                    Developed by Shashank Prasanna & Divyang Saran
                </Text>
            </View>
        </View>
    );
}
