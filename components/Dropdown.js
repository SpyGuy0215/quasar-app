import React, { useState } from "react";
import {
    View,
    Text,
    Pressable,
    Modal,
    TouchableOpacity,
} from "react-native";
import { useTheme } from "../ThemeContext";
import { Haptics } from "../helper";
import Ionicons from "react-native-vector-icons/Ionicons";

export default function Dropdown({ items, selectedItem, onSelect, tailwindStyles="" }) {
    const [dropdownVisible, setDropdownVisible] = useState(false);
    const { isDarkMode } = useTheme();
    const textColor = isDarkMode ? "text-white" : "text-black";
    const buttonColor = isDarkMode ? "bg-galaxy-darkbg" : "bg-galaxy-lightbg";
    const borderColor = isDarkMode ? "border-galaxy-darkborder" : "border-galaxy-lightborder";
    const checkmarkColor = "#007AFF"; // blue
    const dropdownIconColor = isDarkMode ? "#fff" : "#000";

    return (
        <View className={`w-full px-6 ${tailwindStyles}`}>
            <Pressable
                className={`flex-row items-center justify-between py-3 px-4 rounded-lg border w-full self-stretch ${buttonColor} ${borderColor}`}
                onPress={() => setDropdownVisible(true)}
            >
                <Text className={`font-bold ${textColor}`}>
                    {selectedItem === "all" ? "All Topics" : selectedItem}
                </Text>
                <Ionicons name="caret-down" size={18} color={dropdownIconColor} />
            </Pressable>
            <Modal
                visible={dropdownVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setDropdownVisible(false)}
            >
                <TouchableOpacity
                    className="flex-1 bg-black/20 justify-start items-center pt-20"
                    activeOpacity={1}
                    onPressOut={() => setDropdownVisible(false)}
                >
                    <View
                        className={`w-11/12 max-w-md rounded-lg border py-2 shadow-lg ${buttonColor} ${borderColor}`}
                    >
                        {items.map((topic) => (
                            <Pressable
                                key={topic}
                                className="py-3 px-4"
                                onPress={() => {
                                    Haptics.selection();
                                    console.log("Selected topic:", topic);
                                    onSelect(topic);
                                    setDropdownVisible(false);
                                }}
                            >
                                <View className="flex-row items-center">
                                    <Text
                                        className={`flex-1 text-lg ${textColor}`}
                                    >
                                        {topic === "all" ? "All Topics" : topic}
                                    </Text>
                                    {selectedItem === topic && (
                                        <Ionicons name="checkmark" size={24} className={`ml-2`} color={checkmarkColor} />
                                    )}
                                </View>
                            </Pressable>
                        ))}
                    </View>
                </TouchableOpacity>
            </Modal>
        </View>
    );
}
