import React, { useState } from "react";
import { useWindowDimensions, View, Text } from "react-native";
import { SceneMap, TabView, TabBar } from "react-native-tab-view";
import APODScreen from "./APOD";
import WallpapersScreen from "./Wallpapers";
import * as Haptics from "expo-haptics";
import { useTheme } from "../ThemeContext";

const renderScene = SceneMap({
    APOD: () => <APODScreen />,
    NASAIVL: () => (
       <WallpapersScreen />
    ),
});

const routes = [
    { key: "APOD", title: "Picture of the Day" },
    { key: "NASAIVL", title: "NASA Wallpapers" },
];

export default function ImagesScreen() {
    const layout = useWindowDimensions();
    const [index, setIndex] = useState(0);
    const { isDarkMode } = useTheme();

    const renderTabBar = (props) => (
        <TabBar
            {...props}
            indicatorStyle={{
                backgroundColor: isDarkMode ? "white" : "black",
                height: 3,
            }}
            style={{ backgroundColor: isDarkMode ? "#000" : "#fff" }}
            labelStyle={{
                color: isDarkMode ? "white" : "black",
                fontWeight: "bold",
                textTransform: "none",
            }}
            activeColor={isDarkMode ? "#fff" : "#000"}
            inactiveColor={isDarkMode ? "#ccc" : "#666"}
            pressColor="transparent"
        />
    );

    return (
        <View style={{ flex: 1, backgroundColor: isDarkMode ? "#000" : "#fff" }}>
            <TabView
                navigationState={{ index, routes }}
                renderScene={renderScene}
                onIndexChange={setIndex}
                initialLayout={{ width: layout.width }}
                renderTabBar={renderTabBar}
            />
        </View>
    );
}
