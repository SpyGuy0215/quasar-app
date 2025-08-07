
import React from "react";
import { Text } from "react-native";
import { useTheme } from "../ThemeContext";

export default function Countdown({ targetDate, now }) {
    const { isDarkMode } = useTheme();

    function calculateTimeLeft(targetDate, now) {
        const difference = targetDate - now;
        if (difference <= 0) {
            return "00:00:00:00"; // Days:Hours:Minutes:Seconds
        }
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);
        return `${String(days).padStart(2, '0')}:${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }

    const timeLeft = calculateTimeLeft(targetDate, now);

    return (
        <Text className={`text-xl ${isDarkMode ? "text-white" : "text-black"}`}>{timeLeft}</Text>
    );
}