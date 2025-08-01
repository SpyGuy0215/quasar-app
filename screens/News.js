import React, { useEffect, useState } from "react";
import { View, Text, Pressable, Modal, StyleSheet, TouchableOpacity } from "react-native";
import { FlashList } from "@shopify/flash-list";
import NewsCard from "../components/NewsCard";
import Dropdown from "../components/Dropdown";
import * as WebBrowser from "expo-web-browser";
import { useTheme } from "../ThemeContext";
import { Haptics } from "../helper";
import "../global.css";

const API_URL = "https://api.spaceflightnewsapi.net/v4/articles";

// Hardcoded topics
const TOPICS = [
    "all",
    "NASA",
    "Exoplanets",
    "Planets",
    "Asteroids",
    "Moons",
    "SpaceX",
    "Black Holes",
    "Galaxies",
    "Comets",
];

async function callNewsAPI(offset = 0, topic = "") {
    try {
        let url = `${API_URL}?offset=${offset}`;
        if (topic && topic !== "all") {
            url += `&title_contains=${encodeURIComponent(topic)}`;
        }
        const response = await fetch(url);
        if (!response.ok) throw new Error("Network response was not ok");
        const data = await response.json();
        return data.results.map((article) => ({
            title: article.title,
            summary: article.summary,
            image_url: article.image_url || "https://via.placeholder.com/150",
            url: article.url,
            published_at: article.published_at,
        }));
    } catch (error) {
        console.error("Error fetching news:", error);
        return [];
    }
}

async function openWebBrowser(url) {
    try {
        await WebBrowser.openBrowserAsync(url);
    } catch (error) {
        console.error("Error opening web browser:", error);
    }
}

export default function NewsScreen() {
    const { isDarkMode } = useTheme();
    const [newsData, setNewsData] = useState([]);
    const [newsDataOffset, setNewsDataOffset] = useState(0);
    const [selectedTopic, setSelectedTopic] = useState("all");

    useEffect(() => {
        fetchNewsData(true, selectedTopic);
    }, [selectedTopic]);

    async function fetchNewsData(refresh = true, topic = selectedTopic) {
        const data = await callNewsAPI(refresh ? 0 : newsDataOffset, topic);
        if (!refresh && newsData.length > 0) {
            setNewsData((prev) => [...prev, ...data]);
            setNewsDataOffset((prev) => prev + data.length);
        } else {
            setNewsData(data);
            setNewsDataOffset(data.length);
        }
    }

    const backgroundColor = isDarkMode ? "#000" : "#f3f4f6";
    const textColor = isDarkMode ? "#fff" : "#000";

    return (
        <View style={{ flex: 1, backgroundColor }}>
            <Dropdown
                items={TOPICS}
                selectedItem={selectedTopic}
                onSelect={(item) => {
                    setSelectedTopic(item);
                }}
                tailwindStyles="my-3"
            />
            {newsData.length > 0 ? (
                <FlashList
                    style={{ backgroundColor, flex: 1 }}
                    contentContainerStyle={{ paddingBottom: 24 }}
                    data={newsData}
                    keyExtractor={(item, index) => index.toString()}
                    renderItem={({ item }) => (
                        <Pressable onPress={() => {
                            Haptics.light();
                            openWebBrowser(item.url);
                        }}>
                            <NewsCard
                                title={item.title}
                                description={item.summary}
                                imageUrl={item.image_url}
                                url={item.url}
                                publishedAt={new Date(item.published_at).toLocaleDateString()}
                            />
                        </Pressable>
                    )}
                    onEndReached={() => {
                        fetchNewsData(false, selectedTopic);
                    }}
                    onEndReachedThreshold={3}
                    showsVerticalScrollIndicator={false}
                />
            ) : (
                <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor }}>
                    <Text style={{ color: textColor, fontSize: 18 }}>Loading space news...</Text>
                </View>
            )}
        </View>
    );
}