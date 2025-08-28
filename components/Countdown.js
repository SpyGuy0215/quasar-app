
import React, { useState, useEffect } from "react";
import { Text } from "react-native";
import { useTheme } from "../ThemeContext";

export default function Countdown({ targetDate }) {
    const { isDarkMode } = useTheme();
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    function calculateTimeLeft(targetDate, now) {
        const target = new Date(targetDate);
        const difference = target - now;
        
        if (difference <= 0) {
            return "LAUNCHED";
        }
        
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);
        return `${String(days).padStart(2, '0')}:${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }

    const timeLeft = calculateTimeLeft(targetDate, currentTime);

    return (
        <Text className={`text-xl ${isDarkMode ? "text-white" : "text-black"}`}>{timeLeft}</Text>
    );
}