import React, { useEffect, useState } from "react";
import { View, Text, Pressable, Modal, StyleSheet, TouchableOpacity } from "react-native";
import { FlatList } from "react-native-gesture-handler";
import NewsCard from "../components/NewsCard";
import * as WebBrowser from "expo-web-browser";
import { useTheme } from "../ThemeContext";
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
    const [dropdownVisible, setDropdownVisible] = useState(false);

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
    const buttonColor = isDarkMode ? "#222" : "#fff";
    const borderColor = isDarkMode ? "#444" : "#ccc";
    const checkmarkColor = "#2196F3"; // blue

    return (
        <View style={{ flex: 1, backgroundColor }}>
            {/* Dropdown Button */}
            <View style={{ padding: 16, backgroundColor }}>
                <Pressable
                    style={[
                        styles.dropdownButton,
                        { backgroundColor: buttonColor, borderColor: borderColor },
                    ]}
                    onPress={() => setDropdownVisible(true)}
                >
                    <Text style={{ color: textColor, fontWeight: "bold" }}>
                        {selectedTopic === "all" ? "All Topics" : selectedTopic}
                    </Text>
                    <Text style={{ color: textColor, marginLeft: 8 }}>▼</Text>
                </Pressable>
            </View>
            {/* Dropdown Modal */}
            <Modal
                visible={dropdownVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setDropdownVisible(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPressOut={() => setDropdownVisible(false)}
                >
                    <View style={[
                        styles.dropdownMenu,
                        { backgroundColor: buttonColor, borderColor: borderColor }
                    ]}>
                        {TOPICS.map((topic) => (
                            <Pressable
                                key={topic}
                                style={styles.dropdownItem}
                                onPress={() => {
                                    setSelectedTopic(topic);
                                    setDropdownVisible(false);
                                }}
                            >
                                <View style={{ flexDirection: "row", alignItems: "center" }}>
                                    <Text style={{ color: textColor, fontSize: 16, flex: 1 }}>
                                        {topic === "all" ? "All Topics" : topic}
                                    </Text>
                                    {selectedTopic === topic && (
                                        <Text style={{ color: checkmarkColor, fontSize: 18, marginLeft: 8 }}>
                                            {"\u2713"}
                                        </Text>
                                    )}
                                </View>
                            </Pressable>
                        ))}
                    </View>
                </TouchableOpacity>
            </Modal>
            {/* News List */}
            {newsData.length > 0 ? (
                <FlatList
                    style={{ backgroundColor, flex: 1 }}
                    contentContainerStyle={{ paddingBottom: 24 }}
                    data={newsData}
                    keyExtractor={(item, index) => index.toString()}
                    renderItem={({ item }) => (
                        <Pressable onPress={() => openWebBrowser(item.url)}>
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

const styles = StyleSheet.create({
    dropdownButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        borderWidth: 1,
        width: "100%",
        alignSelf: "stretch",
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.2)",
        justifyContent: "flex-start",
        alignItems: "center",
        paddingTop: 80,
    },
    dropdownMenu: {
        width: "90%",
        maxWidth: 400,
        borderRadius: 8,
        borderWidth: 1,
        paddingVertical: 8,
        elevation: 5,
    },
    dropdownItem: {
        paddingVertical: 12,
        paddingHorizontal: 16,
    },
});