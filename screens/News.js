import React, { useEffect, useState, useRef } from "react";
import { View, Text, Pressable, TextInput, StyleSheet, Platform } from "react-native";
import { FlashList } from "@shopify/flash-list";
import NewsCard from "../components/NewsCard";
import Dropdown from "../components/Dropdown";
import * as WebBrowser from "expo-web-browser";
import { useTheme } from "../ThemeContext";
import { Haptics } from "../helper";
import "../global.css";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
// Set notification handler to show banner and list
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});
// Register for push notification permissions
async function registerForPushNotificationsAsync() {
  let token;
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('news', {
      name: 'News',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }
  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      alert('Failed to get push token for push notification!');
      return;
    }
    try {
      const projectId =
        Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
      if (!projectId) {
        throw new Error('Project ID not found');
      }
      token = (
        await Notifications.getExpoPushTokenAsync({ projectId })
      ).data;
      // You can send this token to your backend if needed
    } catch (e) {
      token = `${e}`;
    }
  } else {
    alert('Must use physical device for Push Notifications');
  }
  return token;
}

const API_URL = "https://api.spaceflightnewsapi.net/v4/articles";
const TOPICS = ["all", "NASA", "Exoplanets", "Planets", "Asteroids", "Moons", "SpaceX", "Black Holes", "Galaxies", "Comets"];

async function callNewsAPI(offset = 0, topic = "", query = "") {
    try {
        let url = `${API_URL}?offset=${offset}`;
        const filters = [];
        if (topic && topic !== "all") filters.push(`title_contains=${encodeURIComponent(topic)}`);
        if (query) filters.push(`title_contains=${encodeURIComponent(query)}`);
        if (filters.length) url += `&${filters.join("&")}`;
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
    const [searchQuery, setSearchQuery] = useState("");
    const [debouncedQuery, setDebouncedQuery] = useState("");
    const prevNewsTitlesRef = useRef([]);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedQuery(searchQuery);
        }, 500);
        return () => clearTimeout(handler);
    }, [searchQuery]);

    useEffect(() => {
        fetchNewsData(true, selectedTopic, debouncedQuery);
    }, [selectedTopic, debouncedQuery]);

    // Register for notifications on mount
    useEffect(() => {
        registerForPushNotificationsAsync();
    }, []);

    async function fetchNewsData(refresh = true, topic = selectedTopic, query = debouncedQuery) {
        const data = await callNewsAPI(refresh ? 0 : newsDataOffset, topic, query);
        if (!refresh && newsData.length > 0) {
            setNewsData((prev) => [...prev, ...data]);
            setNewsDataOffset((prev) => prev + data.length);
        } else {
            setNewsData(data);
            setNewsDataOffset(data.length);
        }

        // Notification logic: compare previous titles to new data
        const prevTitles = prevNewsTitlesRef.current;
        const newTitles = data.map(article => article.title);
        // Find new articles by title
        const newArticles = data.filter(article => !prevTitles.includes(article.title));
        if (newArticles.length > 0 && prevTitles.length > 0) {
            // Only notify if not initial load
            for (const article of newArticles) {
                await Notifications.scheduleNotificationAsync({
                    content: {
                        title: "New Space News Article!",
                        body: article.title,
                        data: { url: article.url },
                        sound: Platform.OS === 'android' ? undefined : undefined,
                    },
                    trigger: null,
                });
            }
        }
        prevNewsTitlesRef.current = newTitles;
    }

    const backgroundColor = isDarkMode ? "#000" : "#f3f4f6";
    const textColor = isDarkMode ? "#fff" : "#000";
    const inputStyle = {
        backgroundColor: isDarkMode ? "#1a1a1a" : "#fff",
        color: textColor,
        padding: 10,
        margin: 12,
        borderRadius: 10,
        fontSize: 16,
        borderWidth: 1,
        borderColor: isDarkMode ? "#333" : "#ccc",
    };

    return (
        <View style={{ flex: 1, backgroundColor }}>
            <TextInput
                style={inputStyle}
                placeholder="Search space news..."
                placeholderTextColor={isDarkMode ? "#888" : "#666"}
                value={searchQuery}
                onChangeText={setSearchQuery}
            />
            <Dropdown
                items={TOPICS}
                selectedItem={selectedTopic}
                onSelect={(item) => setSelectedTopic(item)}
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
                        fetchNewsData(false, selectedTopic, debouncedQuery);
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
