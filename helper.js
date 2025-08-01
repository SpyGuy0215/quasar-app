import { Platform } from "react-native";
import * as HapticsNative from "expo-haptics";

export function truncateText(text, maxLength = 100) {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + '...';
}

export const Haptics = {
    light : () => {
        return HapticsNative.impactAsync(HapticsNative.ImpactFeedbackStyle.Light);
    }
    , medium : () => {
        return HapticsNative.impactAsync(HapticsNative.ImpactFeedbackStyle.Medium);
    }
    , heavy : () => {
        return HapticsNative.impactAsync(HapticsNative.ImpactFeedbackStyle.Heavy);
    }
    , notificationSuccess : () => {
        return HapticsNative.notificationAsync(HapticsNative.NotificationFeedbackType.Success);
    }
    , notificationError : () => {
        return HapticsNative.notificationAsync(HapticsNative.NotificationFeedbackType.Error);
    }
    , notificationWarning : () => {
        return HapticsNative.notificationAsync(HapticsNative.NotificationFeedbackType.Warning);
    }  
    , soft : () => {
        return HapticsNative.impactAsync(HapticsNative.ImpactFeedbackStyle.Soft);
    }
    , rigid : () => {
        return HapticsNative.impactAsync(HapticsNative.ImpactFeedbackStyle.Rigid);
    }
    , selection : () => {
        return HapticsNative.selectionAsync();
    }
};

const API_KEY = "B1yWxg9mEnZ6PIpWwDiJ8EWUSAkyj4V6re9N3Y6l";

export async function getAPOD() {
    try {
        const response = await fetch(
            `https://api.nasa.gov/planetary/apod?api_key=${API_KEY}`
        );
        if (!response.ok) throw new Error("Network response was not ok");
        return await response.json();
    } catch (error) {
        console.error("Error fetching APOD:", error);
        return null;
    }
}