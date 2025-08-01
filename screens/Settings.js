import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useTheme } from '../ThemeContext';
import { Haptics } from '../helper';

export default function SettingsScreen() {
    const { isDarkMode, setTheme } = useTheme();

    function handleThemeChange(theme) {
        setTheme(theme);
        Haptics.selection();
    }


    return (
        <View className={`min-h-screen  border-red-500 px-6 pt-2 ${isDarkMode ? 'bg-[#000]' : 'bg-[#f3f4f6]'}`}>
            <Text className={`mt-4 text-[24px] ${isDarkMode ? 'text-[#fff]' : 'text-[#000]'}`}>
                Theme
            </Text>
            <View className={'flex flex-row mt-5 justify-between'}>
                <TouchableOpacity className={`w-[27vw] p-4 rounded-lg border ${isDarkMode ? 'border-galaxy-darkborder' : 'border-galaxy-lightborder'} ${isDarkMode ? 'bg-galaxy-darkbg' : 'bg-galaxy-lightbg'}`} onPress={() => handleThemeChange('light')}>
                    <Text className={`text-center text-xl ${isDarkMode ? 'text-[#fff]' : 'text-[#000]'}`}>
                        Light
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity className={`w-[27vw] py-4 px-2 rounded-lg border ${isDarkMode ? 'border-galaxy-darkborder' : 'border-galaxy-lightborder'} ${isDarkMode ? 'bg-galaxy-darkbg' : 'bg-galaxy-lightbg'}`} onPress={() => handleThemeChange('dark')}>
                    <Text className={`text-center text-xl ${isDarkMode ? 'text-[#fff]' : 'text-[#000]'}`}>
                        Dark
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity className={`w-[27vw] p-4 rounded-lg border ${isDarkMode ? 'border-galaxy-darkborder' : 'border-galaxy-lightborder'} ${isDarkMode ? 'bg-galaxy-darkbg' : 'bg-galaxy-lightbg'}`} onPress={() => handleThemeChange('system')}>
                    <Text className={`text-center text-xl ${isDarkMode ? 'text-[#fff]' : 'text-[#000]'}`}>
                        System
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}