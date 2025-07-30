import React, { useEffect } from "react";
import { View, Text } from "react-native"; 
import { useTheme } from "../ThemeContext";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function Countdown({ targetDate }) {
    const [timeLeft, setTimeLeft] = React.useState(calculateTimeLeft(targetDate));
    const { isDarkMode } = useTheme();

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft(calculateTimeLeft(targetDate));
        }, 1000);
        return () => clearInterval(timer);
    }, [targetDate]);

    function calculateTimeLeft(targetDate) {
        const now = new Date();
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

    return(
        <Text className={`text-xl ${isDarkMode ? "text-white" : "text-black"}`}>{timeLeft}</Text>
    )
}