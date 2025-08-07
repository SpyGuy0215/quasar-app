import React from "react";
import { View, Text } from "react-native";
import SafeImage from "./SafeImage";
import { truncateText } from "../helper";
import { useTheme } from "../ThemeContext";

export default function NewsCard({
    title,
    description,
    imageUrl,
    publishedAt,
    publisher,
}) {
    const { isDarkMode } = useTheme();
    description = truncateText(description, 130);

    const cardStyles = {
        backgroundColor: isDarkMode ? "#1a1a1a" : "#fff",
        borderColor: isDarkMode ? "#333" : "#e5e7eb",
        borderWidth: 1,
        borderRadius: 24,
        padding: 16,
        marginHorizontal: 12,
        marginVertical: 8,
    };

    const titleStyle = {
        color: isDarkMode ? "#fff" : "#000",
        fontSize: 22,
        fontWeight: "bold",
        marginBottom: 8,
    };

    const dateStyle = {
        color: isDarkMode ? "#aaa" : "#4b5563",
        fontSize: 13,
        marginBottom: 4,
    };

    const descriptionStyle = {
        color: isDarkMode ? "#ddd" : "#000",
        marginBottom: 12,
    };

    const imageStyle = {
        width: "100%",
        height: 170,
        borderRadius: 16,
        marginBottom: 2,
    };

    return (
        <View style={cardStyles}>
            <Text style={titleStyle}>{title}</Text>
            <View className="flex flex-row w-full justify-between">
                <Text style={dateStyle}>{publisher}</Text>
                <Text style={dateStyle}>{publishedAt}</Text>
            </View>
            <Text style={descriptionStyle}>{description}</Text>
            {imageUrl && (
                <SafeImage
                    defaultURL={imageUrl}
                    backupURL={imageUrl}
                    style={imageStyle}
                    resizeMode="cover"
                />
            )}
        </View>
    );
}
