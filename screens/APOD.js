import React, { useEffect, useState } from "react";
import { View, Text, Image, TouchableOpacity, Linking } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import {getAPOD} from "../helper";
import { useColorScheme } from "react-native";
import { useTheme } from "../ThemeContext";
import ImageActionsModal from "../components/ImageActionsModal";
import { Haptics } from "../helper";

export default function APODScreen(){
    const [data, setData] = useState(null);
    const {isDarkMode} = useTheme();
    const [isModalVisible, setIsModalVisible] = useState(false);

    useEffect(() => {
        async function fetchData() {
            const apodData = await getAPOD();
            console.log(apodData);
            setData(apodData);
        }
        fetchData();
    }, []);

    return (
        <View>
            {data ? (
                <ScrollView className="flex flex-col">
                    {data.media_type === "image" && (
                        <>
                            <ImageActionsModal
                                isVisible={isModalVisible}
                                onClose={() => setIsModalVisible(false)}
                                imageUrl={data.hdurl || data.url}
                                authorName={data.copyright || "NASA"}
                                date={data.date || ""}
                                title={data.title || "Image"}
                            />
                            <TouchableOpacity className="w-full h-[90vw] mb-4" onPress={() => {
                                Haptics.soft();
                                setIsModalVisible(true);
                            }}>
                                <Image source={{ uri: data.hdurl || data.url }} className="w-full h-[90vw] object-cover mb-4"/>
                            </TouchableOpacity>
                        </>
                    )}
                    {data.media_type === "video" && (
                        <TouchableOpacity 
                            className="w-full h-[50vw] mb-4 bg-gray-200 dark:bg-gray-800 flex items-center justify-center rounded-lg"
                            onPress={() => {
                                Haptics.soft();
                                Linking.openURL(data.url);
                            }}
                        >
                            <Text className="text-lg text-center px-4" style={{
                                color: isDarkMode ? "#fff" : "#000"
                            }}>
                                🎥 Tap to watch video
                            </Text>
                            <Text className="text-sm text-center px-4 mt-2" style={{
                                color: isDarkMode ? "#aaa" : "#555"
                            }}>
                                Today's APOD is a video
                            </Text>
                        </TouchableOpacity>
                    )}
                    {data.media_type !== "image" && data.media_type !== "video" && (
                        <TouchableOpacity 
                            className="w-full h-[50vw] mb-4 bg-gray-200 dark:bg-gray-800 flex items-center justify-center rounded-lg"
                            onPress={() => {
                                Haptics.soft();
                                Linking.openURL(`https://apod.nasa.gov/apod/ap${data.date.replace(/-/g, '').slice(2)}.html`);
                            }}
                        >
                            <Text className="text-lg text-center px-4" style={{
                                color: isDarkMode ? "#fff" : "#000"
                            }}>
                                🌌 Special Content
                            </Text>
                            <Text className="text-sm text-center px-4 mt-2" style={{
                                color: isDarkMode ? "#aaa" : "#555"
                            }}>
                                Tap to view on NASA APOD website
                            </Text>
                            <Text className="text-xs text-center px-4 mt-1 opacity-75" style={{
                                color: isDarkMode ? "#999" : "#666"
                            }}>
                                Media type: {data.media_type}
                            </Text>
                        </TouchableOpacity>
                    )}
                    <Text className={"text-4xl font-extrabold text-center mt-2 mb-2 mx-2 px-4"} style={{
                        color: isDarkMode ? "#fff" : "#000"
                    }}>{data.title}</Text>
                    <View className="flex flex-row justify-between mx-2 mt-2 mb-2 px-4 font-semibold">
                        <Text className="font-semibold my-auto" style={{
                            color: isDarkMode ? "#aaa" : "#555"
                        }}>{data.copyright}</Text>
                        <Text className="font-semibold my-auto" style={{
                            color: isDarkMode ? "#aaa" : "#555"
                        }}>{new Date(data.date).toLocaleDateString()}</Text>
                    </View>
                    <Text className="text-lg mt-6 mb-20 mx-2 leading-relaxed px-4" style={{
                        color: isDarkMode ? "#fff" : "#000"
                    }}>{data.explanation}</Text>
                </ScrollView>
            ) : (
                <Text className="text-lg text-center mt-10">Loading...</Text>
            )}
        </View>
    )
}