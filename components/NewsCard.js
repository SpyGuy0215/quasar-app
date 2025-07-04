import React from "react";
import { View, Text, Image } from "react-native";
import { truncateText } from "../helper";
import { useTheme } from "../ThemeContext";

export default function NewsCard({ title, description, imageUrl, publishedAt }) {
    const { isDarkMode } = useTheme();
    description = truncateText(description, 130);

    const cardStyles = {
        backgroundColor: isDarkMode ? "#1a1a1a" : "#fff",
        borderColor: isDarkMode ? "#333" : "#e5e7eb",
        borderWidth: 1,
        borderRadius: 24,
        padding: 16,
        marginHorizontal: 20,
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
        marginBottom: 4,
    };

    return (
        <View style={cardStyles}>
            <Text style={titleStyle}>{title}</Text>
            <Text style={dateStyle}>{publishedAt}</Text>
            <Text style={descriptionStyle}>{description}</Text>
            {imageUrl && (
                <Image
                    source={{ uri: imageUrl }}
                    style={imageStyle}
                    resizeMode="cover"
                />
            )}
        </View>
    );
}
