import React, { useEffect, useState, useRef, useMemo } from "react";
import {
    View,
    Text,
    Pressable,
    TextInput,
    StyleSheet,
    Platform,
    TouchableOpacity,
} from "react-native";
import { BottomSheetModal, BottomSheetView } from "@gorhom/bottom-sheet";
import { FlashList } from "@shopify/flash-list";
import NewsCard from "../components/NewsCard";
import { Ionicons } from "@expo/vector-icons";
import * as WebBrowser from "expo-web-browser";
import { useTheme } from "../ThemeContext";
import { Haptics } from "../helper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Dropdown from "../components/Dropdown";
import "../global.css";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import * as Linking from "expo-linking";
import { useFocusEffect } from "@react-navigation/native";
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
    if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("news", {
            name: "News",
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: "#FF231F7C",
        });
    }
    if (Device.isDevice) {
        const { status: existingStatus } =
            await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== "granted") {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }
        if (finalStatus !== "granted") {
            alert("Failed to get push token for push notification!");
            return;
        }
        try {
            const projectId =
                Constants?.expoConfig?.extra?.eas?.projectId ??
                Constants?.easConfig?.projectId;
            if (!projectId) {
                throw new Error("Project ID not found");
            }
            token = (await Notifications.getExpoPushTokenAsync({ projectId }))
                .data;
            // You can send this token to your backend if needed
        } catch (e) {
            token = `${e}`;
        }
    } else {
        alert("Must use physical device for Push Notifications");
    }
    return token;
}

const API_URL = "https://api.spaceflightnewsapi.net/v4/articles";
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

async function callNewsAPI(offset = 0, topic = "", query = "") {
    try {
        let url = `${API_URL}?offset=${offset}`;
        const filters = [];
        if (topic && topic !== "all")
            filters.push(`title_contains=${encodeURIComponent(topic)}`);
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
            news_site: article.news_site || "Unknown",
        }));
    } catch (error) {
        console.error("Error fetching news:", error);
        return [];
    }
}

export default function NewsScreen() {
    const { isDarkMode } = useTheme();
    const [newsData, setNewsData] = useState([]);
    const [newsDataOffset, setNewsDataOffset] = useState(0);
    const [selectedTopic, setSelectedTopic] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [openInBrowserApp, setOpenInBrowserApp] = useState(false);
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
    const [debouncedQuery, setDebouncedQuery] = useState("");
    const prevNewsTitlesRef = useRef([]);
    
    // Bottom sheet configuration
    const bottomSheetRef = useRef(null);
    const snapPoints = useMemo(() => ["50%", "60%"], []);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedQuery(searchQuery);
        }, 500);
        return () => clearTimeout(handler);
    }, [searchQuery]);

    useEffect(() => {
        fetchNewsData(true, selectedTopic, debouncedQuery);
    }, [selectedTopic, debouncedQuery]);

    // useEffect(() => {
    //     // Register for notifications on mount
    //     registerForPushNotificationsAsync();
    // }, []);

    useFocusEffect(
        React.useCallback(() => {
            AsyncStorage.getItem("openInBrowserApp").then((val) => {
                console.log("Fetched openInBrowserApp:", val);
                if (val !== null) setOpenInBrowserApp(val === "true");
            });
        }, [])
    );

    async function openWebBrowser(url) {
    try {
        if(openInBrowserApp){
            const supported = await Linking.canOpenURL(url);
            if (supported) {
                await Linking.openURL(url);
                return;
            } else {
                console.warn("Don't know how to open URI: " + url);
            }
        }
        else{
            await WebBrowser.openBrowserAsync(url);
        }
    } catch (error) {
        console.error("Error opening web browser:", error);
    }
}

    async function fetchNewsData(
        refresh = true,
        topic = selectedTopic,
        query = debouncedQuery
    ) {
        const data = await callNewsAPI(
            refresh ? 0 : newsDataOffset,
            topic,
            query
        );
        if (!refresh && newsData.length > 0) {
            setNewsData((prev) => [...prev, ...data]);
            setNewsDataOffset((prev) => prev + data.length);
        } else {
            setNewsData(data);
            setNewsDataOffset(data.length);
        }

        // Notification logic: compare previous titles to new data
        const prevTitles = prevNewsTitlesRef.current;
        const newTitles = data.map((article) => article.title);
        // Find new articles by title
        const newArticles = data.filter(
            (article) => !prevTitles.includes(article.title)
        );
        if (newArticles.length > 0 && prevTitles.length > 0) {
            // Only notify if not initial load
            for (const article of newArticles) {
                // await Notifications.scheduleNotificationAsync({
                //     content: {
                //         title: "New Space News Article!",
                //         body: article.title,
                //         data: { url: article.url },
                //         sound: Platform.OS === 'android' ? undefined : undefined,
                //     },
                //     trigger: null,
                // });
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
        marginVertical: 12,
        borderRadius: 12,
        fontSize: 16,
        borderWidth: 1,
    };

    return (
        <View style={{ flex: 1, backgroundColor }}>
            <View className="flex flex-row justify-between mx-4 bg-transparent">
                <TextInput
                    style={inputStyle}
                    className={
                        "w-[82%]" +
                        (isDarkMode
                            ? " border-galaxy-darkborder"
                            : " border-galaxy-lightborder")
                    }
                    placeholder="Search space news..."
                    placeholderTextColor={isDarkMode ? "#888" : "#666"}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
                <TouchableOpacity
                    className={
                        "w-[15%] my-3 rounded-xl justify-center items-center border" +
                        (isDarkMode
                            ? " border-galaxy-darkborder bg-galaxy-darkbg"
                            : " border-galaxy-lightborder bg-galaxy-lightbg")
                    }
                    onPress={() => {
                        Haptics.light();
                        setIsFilterModalOpen(true);
                        bottomSheetRef.current?.present();
                    }}
                >
                    <Ionicons
                        name="filter"
                        size={24}
                        color={isDarkMode ? "#fff" : "#000"}
                    />
                </TouchableOpacity>
            </View>
            
            <BottomSheetModal
                ref={bottomSheetRef}
                index={0}
                snapPoints={snapPoints}
                enablePanDownToClose
                backgroundStyle={{
                    backgroundColor: isDarkMode ? "#111" : "#fafafa",
                }}
                handleIndicatorStyle={{
                    backgroundColor: isDarkMode ? "#444" : "#999",
                }}
                onDismiss={() => setIsFilterModalOpen(false)}
            >
                <BottomSheetView style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 24 }}>
                    <View style={{ alignItems: "center", marginBottom: 4, justifyContent: "center" }}>
                        <Text style={{ fontSize: 18, fontWeight: "600", color: isDarkMode ? "#fff" : "#000" }}>
                            Topic
                        </Text>
                        <TouchableOpacity
                            onPress={() => bottomSheetRef.current?.close()}
                            style={{ position: "absolute", right: 0, padding: 4 }}
                        >
                            <Ionicons name="close" size={22} color={isDarkMode ? "#fff" : "#000"} />
                        </TouchableOpacity>
                    </View>
                    <View style={{ height: 8 }} />
                    <Dropdown
                        items={TOPICS}
                        selectedItem={selectedTopic}
                        onSelect={(item) => setSelectedTopic(item)}
                        tailwindStyles="mt-3 mb-24"
                    />
                </BottomSheetView>
            </BottomSheetModal>
            {newsData.length > 0 ? (
                <FlashList
                    style={{ backgroundColor, flex: 1 }}
                    contentContainerStyle={{ paddingBottom: 24 }}
                    data={newsData}
                    keyExtractor={(item) => item.url}
                    renderItem={({ item }) => (
                        <Pressable
                            onPress={() => {
                                Haptics.light();
                                openWebBrowser(item.url);
                            }}
                        >
                            <NewsCard
                                title={item.title}
                                description={item.summary}
                                imageUrl={item.image_url}
                                url={item.url}
                                publishedAt={new Date(
                                    item.published_at
                                ).toLocaleDateString()}
                                publisher={item.news_site}
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
                <View
                    style={{
                        flex: 1,
                        justifyContent: "center",
                        alignItems: "center",
                        backgroundColor,
                    }}
                >
                    <Text style={{ color: textColor, fontSize: 18 }}>
                        Loading space news...
                    </Text>
                </View>
            )}
        </View>
    );
}
