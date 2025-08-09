import React, { useEffect } from "react";
import { View, Text, Image, Alert, ActivityIndicator, Platform } from "react-native";
import { useTheme } from "../ThemeContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { FlashList } from "@shopify/flash-list";
import Countdown from "../components/Countdown";
import { Ionicons } from "@expo/vector-icons";
import * as Calendar from "expo-calendar";
import SafeImage from "../components/SafeImage";

const api_base = "https://ll.thespacedevs.com/2.3.0/launches/upcoming/";

export default function LaunchesScreen() {
    const { isDarkMode } = useTheme();
    const [launches, setLaunches] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    // Add global timer state
    const [now, setNow] = React.useState(new Date());
    React.useEffect(() => {
        const interval = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        console.log("Fetching launches");
        fetchLaunches().then((data) => {
            setLaunches(data);
            setLoading(false);
        });
    }, []);

    async function fetchLaunches() {
        // check if data is already cached and is from the last 10 minutes
        try {
            const cachedData = await AsyncStorage.getItem("launches");
            const cachedTime = await AsyncStorage.getItem("launches_time");
            if (cachedData && cachedTime) {
                const now = new Date();
                const cachedDate = new Date(cachedTime);
                const diffInMinutes = (now - cachedDate) / (1000 * 60);
                if (diffInMinutes < 10) {
                    console.log(
                        "Using cached launches data from " +
                            diffInMinutes +
                            " minutes ago"
                    );
                    return JSON.parse(cachedData);
                }
            }
        } catch (error) {
            console.error("Error checking cache:", error);
        }

        // fetch new data
        const url = `${api_base}?limit=30&ordering=net`;
        console.log("Fetching from API:", url);
        try {
            const response = await fetch(url);
            const data = await response.json();
            // cache the data
            await AsyncStorage.setItem("launches", JSON.stringify(data));
            await AsyncStorage.setItem(
                "launches_time",
                new Date().toISOString()
            );
            return data;
        } catch (error) {
            console.error("Error fetching launches:", error);
            return [];
        }
    }

    async function addToCalendar(item) {
        console.log("Adding to calendar:", item.name);
        console.log(Platform.OS)
        const { status } = await Calendar.requestCalendarPermissionsAsync();
        if (status !== "granted") {
            console.error("Calendar permission not granted");
            Alert.alert("Error Adding Event To Calendar", "Calendar permission not granted. Go to settings to enable it.");
            return;
        }
        if(Platform.OS === 'ios'){
            console.log(await Calendar.requestRemindersPermissionsAsync())
            const reminderStatus = (await Calendar.requestRemindersPermissionsAsync()).granted;
            console.log("Reminder status:", reminderStatus);
            if (reminderStatus !== true) {
                console.error("Reminders permission not granted");
                Alert.alert("Error Adding Event To Calendar", "Reminders permission not granted. Go to settings to enable it.");
                return;
            }
        }
        try {
            // create a Launches calendar if it doesn't exist
            const calendars = await Calendar.getCalendarsAsync();
            let calendar = calendars.find(
                (cal) => cal.title === "Launches"
            );
            if (!calendar) {
                calendar = await Calendar.createCalendarAsync({
                    title: "Launches",
                    color: "#1a73e8",
                    entityType: Calendar.EntityTypes.EVENT,
                    sourceId: calendars[0].source.id,
                    source: calendars[0].source,
                    name: "Launches",
                    accessLevel: Calendar.CalendarAccessLevel.OWNER,
                    ownerAccount: "personal",
                });
            }
                
            const event = {
                title: item.name,
                startDate: new Date(item.window_start),
                endDate: new Date(item.window_end || item.window_start),
                timeZone: "UTC",
                notes: item.description || "",
            };
            // check if event already exists
            const existingEvents = await Calendar.getEventsAsync(
                [calendar.id],
                event.startDate,
                event.endDate
            );
            if (existingEvents.length > 0) {
                Alert.alert("Event already exists in calendar");
                return;
            }
            await Calendar.createEventAsync(calendar.id, event);
            Alert.alert("Event added to calendar");
        } catch (error) {
            console.error("Error adding event to calendar:", error);
            Alert.alert("Error Adding Event To Calendar", error.message || "An unknown error occurred.");
        }
    }

    return (
        <View
            className="flex-1"
            style={{ backgroundColor: isDarkMode ? "#000" : "#f3f4f6" }}
        >
            {loading ? (
                <ActivityIndicator
                    size="large"
                    color={isDarkMode ? "#fff" : "#000"}
                    style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
                />
            ) : (
                <FlashList
                    data={launches.results}
                    keyExtractor={(item) => item.id.toString()}
                    disableRecycling={true}
                    renderItem={({ item }) => (
                        <View
                            className={`flex-row m-4 max-h-[30vh] border rounded-2xl overflow-hidden ${
                                isDarkMode ? "border-[#333]" : "border-[#ccc]"
                            }`}
                        >
                            <View
                                className={`flex flex-col w-[60%] pr-4 text-center justify-between p-4 ${
                                    isDarkMode ? "bg-[#1a1a1a]" : "bg-white"
                            }`}
                            >
                                <Text
                                    className={`text-2xl font-semibold ${
                                        isDarkMode ? "text-white" : "text-black"
                                    }`}
                                >
                                    {item.name.split(" | ")[0]}
                                </Text>
                                <Text
                                    className={`text-lg ${
                                        isDarkMode
                                            ? "text-gray-400"
                                            : "text-gray-600"
                                    }`}
                                >
                                    {item.name.split(" | ")[1]}
                                </Text>
                                <Countdown
                                    targetDate={new Date(item.window_start)}
                                    now={now}
                                />
                            </View>
                            <View className="relative w-[41%]">
                                <SafeImage
                                    defaultURL={item.image ? item.image.image_url : null}
                                    backupURL={"https://static.wikia.nocookie.net/starwars/images/2/21/MF_over_Takodana_SWCT.png/revision/latest?cb=20200730064538"}
                                    className="w-full"
                                    style={{ aspectRatio: 1 }}
                                />
                                <Ionicons
                                    name="calendar-outline"
                                    size={24}
                                    color={isDarkMode ? "white" : "black"}
                                    style={{
                                        position: "absolute",
                                        top: 10,
                                        right: 10,
                                        zIndex: 10,
                                        backgroundColor: isDarkMode
                                            ? "#000"
                                            : "#fff",
                                        borderRadius: 12,
                                        padding: 4,
                                    }}
                                    onPress={() => addToCalendar(item)}
                                />
                            </View>
                        </View>
                    )}
                />
            )}
        </View>
    );
}
