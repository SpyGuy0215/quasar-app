import React, { useEffect, useState } from "react";
import { View, Text, Pressable } from "react-native";
import { FlatList } from "react-native-gesture-handler";
import NewsCard from "../components/NewsCard";
import * as WebBrowser from "expo-web-browser";
import "../global.css"; // Tailwind classes, if still used

const API_URL = "https://api.spaceflightnewsapi.net/v4/articles";

async function callNewsAPI(offset = 0) {
    try {
        const response = await fetch(`${API_URL}?offset=${offset}`);
        if (!response.ok) {
            throw new Error("Network response was not ok");
        }
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
    const [newsData, setNewsData] = useState([]);
    const [newsDataOffset, setNewsDataOffset] = useState(0);
    const [newsFeedRefreshing, setNewsFeedRefreshing] = useState(false);

    useEffect(() => {
        fetchNewsData();
    }, []);

    async function fetchNewsData(refresh = true) {
        const data = await callNewsAPI(newsDataOffset);
        if (!refresh && newsData.length > 0) {
            setNewsData((prev) => [...prev, ...data]);
            setNewsDataOffset((prev) => prev + data.length);
        } else {
            setNewsData(data);
            setNewsDataOffset(data.length);
        }
    }

    return newsData.length > 0 ? (
        <FlatList
            className="bg-gray-100"
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
                console.log("End reached, fetching more news...");
                fetchNewsData(false);
            }}
            onEndReachedThreshold={3}
            showsVerticalScrollIndicator={false}
        />
    ) : (
        <View className="flex-1 items-center justify-center bg-white">
            <Text className="text-black text-lg">Loading space news...</Text>
        </View>
    );
}
